import setData from '../data/sets.json';
import { db } from './db';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 30 * DAY_MS;
const UA = 'MiddleClassCommander/1.0 (https://github.com/example/mcc)';

const bannedSetCodes = new Set(
  setData.sets
    .filter((entry) => entry.category === 'banned')
    .map((entry) => entry.code.toLowerCase()),
);

const queueState = {
  queue: [],
  active: 0,
  maxConcurrent: 5,
  minDelayMs: 100,
  lastStartAt: 0,
  pumping: false,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pumpQueue() {
  if (queueState.pumping) {
    return;
  }
  queueState.pumping = true;

  const tick = async () => {
    while (queueState.active < queueState.maxConcurrent && queueState.queue.length > 0) {
      const now = Date.now();
      const wait = Math.max(0, queueState.lastStartAt + queueState.minDelayMs - now);
      if (wait > 0) {
        await sleep(wait);
      }

      const next = queueState.queue.shift();
      if (!next) {
        break;
      }

      queueState.lastStartAt = Date.now();
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
        const value = await executor();
        resolve(value);
      } catch (error) {
        reject(error);
      }
    });
    pumpQueue();
  });
}

async function scryfallFetch(url, retries = 3, attempt = 0) {
  try {
    const response = await enqueueRequest(() =>
      fetch(url, {
        headers: {
          'User-Agent': UA,
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
      await sleep(2 ** attempt * 350);
      return scryfallFetch(url, retries, attempt + 1);
    }

    if (!response.ok) {
      return { failed: 'api_changed' };
    }

    return response.json();
  } catch (error) {
    if (attempt >= retries) {
      return { failed: 'network' };
    }
    await sleep(2 ** attempt * 250);
    return scryfallFetch(url, retries, attempt + 1);
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
  const notExpired = Date.now() - cachedAt < CACHE_TTL_MS;
  const versionMatches = entry.setListVersion === setData.version;

  return notExpired && versionMatches;
}

async function checkSetFreshness() {
  const meta = await db.setListMeta.get('lastSetCheck');
  if (meta?.checkedAt && Date.now() - new Date(meta.checkedAt).getTime() < DAY_MS) {
    return;
  }

  const setListResponse = await scryfallFetch('https://api.scryfall.com/sets');
  if (!setListResponse || setListResponse.failed || !Array.isArray(setListResponse.data)) {
    return;
  }

  const localSetCodes = new Set(setData.sets.map((entry) => entry.code));
  const unknownSets = setListResponse.data.filter((entry) => !localSetCodes.has(entry.code));
  if (unknownSets.length > 0) {
    console.warn('New Scryfall sets not in sets.json:', unknownSets.map((entry) => entry.code));
  }

  await db.setListMeta.put({ key: 'lastSetCheck', checkedAt: new Date().toISOString() });
}

export async function checkCard(cardName) {
  await checkSetFreshness();

  const normalized = normalizeCardName(cardName);
  if (!normalized) {
    return { result: 'failed', reason: 'not_found' };
  }

  const cached = await db.cardCache.get(normalized);
  if (cacheStillValid(cached)) {
    return { result: cached.result, printings: cached.printings };
  }

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${normalized}"`)}&unique=prints&order=released`;
  const payload = await scryfallFetch(url);

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

  await db.cardCache.put({
    cardName: normalized,
    result,
    printings,
    cachedAt: new Date().toISOString(),
    setListVersion: setData.version,
  });

  return { result, printings };
}
