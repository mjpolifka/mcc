import setData from '../data/sets.json' with { type: 'json' };

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 30 * DAY_MS;
const SCRYFALL_PROXY_BASE = '/api/scryfall';

const bannedSetCodes = new Set(
  setData.sets
    .filter((entry) => entry.category === 'banned')
    .map((entry) => entry.code.toLowerCase()),
);

const inFlightByCardName = new Map();

const queueState = {
  queue: [],
  active: 0,
  maxConcurrent: 2,
  minDelayMs: 130,
  lastStartAt: 0,
  pumping: false,
};

function createInMemoryDb() {
  const cardCacheStore = new Map();
  const setListMetaStore = new Map();

  return {
    cardCache: {
      async get(key) {
        return cardCacheStore.get(key);
      },
      async put(value) {
        cardCacheStore.set(value.cardName, value);
      },
    },
    setListMeta: {
      async get(key) {
        return setListMetaStore.get(key);
      },
      async put(value) {
        setListMetaStore.set(value.key, value);
      },
    },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const runtime = {
  fetchImpl: (...args) => fetch(...args),
  sleepImpl: sleep,
  now: () => Date.now(),
  dbImpl: createInMemoryDb(),
};

function buildScryfallUrl(path) {
  return `${SCRYFALL_PROXY_BASE}${path}`;
}

function getRetryDelayMs(response, attempt, baseDelayMs) {
  const retryAfterHeader = response?.headers?.get?.('Retry-After');
  const retryAfterSeconds = Number(retryAfterHeader);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  return 2 ** attempt * baseDelayMs;
}

function pumpQueue() {
  if (queueState.pumping) {
    return;
  }

  queueState.pumping = true;

  const tick = async () => {
    while (queueState.active < queueState.maxConcurrent && queueState.queue.length > 0) {
      const now = runtime.now();
      const wait = Math.max(0, queueState.lastStartAt + queueState.minDelayMs - now);
      if (wait > 0) {
        await runtime.sleepImpl(wait);
      }

      const next = queueState.queue.shift();
      if (!next) {
        break;
      }

      queueState.lastStartAt = runtime.now();
      queueState.active += 1;

      next()
        .catch(() => null)
        .finally(() => {
          queueState.active -= 1;
          pumpQueue();
        });
    }

    queueState.pumping = false;
  };

  tick();
}

function enqueueRequest(executor) {
  return new Promise((resolve, reject) => {
    queueState.queue.push(async () => {
      try {
        resolve(await executor());
      } catch (error) {
        reject(error);
      }
    });

    pumpQueue();
  });
}

async function scryfallFetch(path, retries = 4, attempt = 0) {
  try {
    const response = await enqueueRequest(() =>
      runtime.fetchImpl(buildScryfallUrl(path), {
        headers: {
          Accept: 'application/json;q=0.9,*/*;q=0.8',
        },
      }),
    );

    if (response.status === 404) {
      return { failed: 'not_found' };
    }

    if (response.status === 429) {
      if (attempt >= retries) {
        return { failed: 'rate_limited' };
      }

      await runtime.sleepImpl(getRetryDelayMs(response, attempt, 400));
      return scryfallFetch(path, retries, attempt + 1);
    }

    if (!response.ok) {
      return { failed: 'api_changed' };
    }

    return response.json();
  } catch {
    if (attempt >= retries) {
      return { failed: 'network' };
    }

    await runtime.sleepImpl(2 ** attempt * 300);
    return scryfallFetch(path, retries, attempt + 1);
  }
}

function normalizeCardName(cardName) {
  return cardName.trim().toLowerCase();
}

function cacheStillValid(entry) {
  if (!entry) {
    return false;
  }

  const cachedAt = new Date(entry.cachedAt).getTime();
  const notExpired = runtime.now() - cachedAt < CACHE_TTL_MS;
  const versionMatches = entry.setListVersion === setData.version;

  return notExpired && versionMatches;
}

export function setScryfallDb(dbImpl) {
  runtime.dbImpl = dbImpl;
}

export async function checkForSetListUpdatesIfStale() {
  const meta = await runtime.dbImpl.setListMeta.get('lastSetCheck');
  if (meta?.checkedAt && runtime.now() - new Date(meta.checkedAt).getTime() < DAY_MS) {
    return;
  }

  const setListResponse = await scryfallFetch('/sets');
  if (!setListResponse || setListResponse.failed || !Array.isArray(setListResponse.data)) {
    return;
  }

  const localSetCodes = new Set(setData.sets.map((entry) => entry.code));
  const unknownSets = setListResponse.data.filter((entry) => !localSetCodes.has(entry.code));
  if (unknownSets.length > 0) {
    console.warn('New Scryfall sets not in sets.json:', unknownSets.map((entry) => entry.code));
  }

  await runtime.dbImpl.setListMeta.put({ key: 'lastSetCheck', checkedAt: new Date(runtime.now()).toISOString() });
}

async function checkCardUncached(normalized) {
  const path = `/cards/search?q=${encodeURIComponent(`!\"${normalized}\"`)}&unique=prints&order=released`;
  const payload = await scryfallFetch(path);

  if (payload?.failed) {
    return { result: 'failed', reason: payload.failed };
  }

  if (!payload || !Array.isArray(payload.data)) {
    return { result: 'failed', reason: 'api_changed' };
  }

  const printings = payload.data.map((printing) => ({
    name: printing?.name,
    set: printing?.set,
    rarity: printing?.rarity,
    released_at: printing?.released_at,
  }));

  if (printings.some((printing) => !printing.name || !printing.set || !printing.rarity)) {
    return { result: 'failed', reason: 'api_changed' };
  }

  const isBanned = printings.some((printing) => {
    const inBannedSet = bannedSetCodes.has(printing.set.toLowerCase());
    const atRarity = printing.rarity === 'rare' || printing.rarity === 'mythic';
    return inBannedSet && atRarity;
  });

  const result = isBanned ? 'banned' : 'legal';

  await runtime.dbImpl.cardCache.put({
    cardName: normalized,
    result,
    printings,
    cachedAt: new Date(runtime.now()).toISOString(),
    setListVersion: setData.version,
  });

  return { result, printings };
}

export async function checkCard(cardName) {
  const normalized = normalizeCardName(cardName);
  if (!normalized) {
    return { result: 'failed', reason: 'not_found' };
  }

  const cached = await runtime.dbImpl.cardCache.get(normalized);
  if (cacheStillValid(cached)) {
    return { result: cached.result, printings: cached.printings };
  }

  const inFlight = inFlightByCardName.get(normalized);
  if (inFlight) {
    return inFlight;
  }

  const lookupPromise = checkCardUncached(normalized).finally(() => {
    inFlightByCardName.delete(normalized);
  });

  inFlightByCardName.set(normalized, lookupPromise);
  return lookupPromise;
}

export function __setScryfallTestRuntime(overrides = {}) {
  Object.assign(runtime, overrides);
}

export function __resetScryfallTestState() {
  inFlightByCardName.clear();
  queueState.queue = [];
  queueState.active = 0;
  queueState.lastStartAt = 0;
  queueState.pumping = false;
}

export const __scryfallTestConstants = {
  DAY_MS,
  CACHE_TTL_MS,
  queueState,
};
