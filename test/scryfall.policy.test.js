import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import setData from '../src/data/sets.json' with { type: 'json' };
import {
  __resetScryfallTestState,
  __setScryfallTestRuntime,
  __scryfallTestConstants,
  checkCard,
} from '../src/lib/scryfall.js';

function createDb() {
  const cardCache = new Map();
  const setListMeta = new Map();

  return {
    cardCache,
    setListMeta,
    impl: {
      cardCache: {
        async get(key) {
          return cardCache.get(key);
        },
        async put(value) {
          cardCache.set(value.cardName, value);
        },
      },
      setListMeta: {
        async get(key) {
          return setListMeta.get(key);
        },
        async put(value) {
          setListMeta.set(value.key, value);
        },
      },
    },
  };
}

function createResponse(status, body, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        return headers[name] ?? null;
      },
    },
    async json() {
      return body;
    },
  };
}

function validCardPayload(name = 'Sol Ring') {
  return {
    data: [
      {
        name,
        set: 'lea',
        rarity: 'common',
        released_at: '1993-08-05',
      },
    ],
  };
}

test.beforeEach(() => {
  __resetScryfallTestState();
});

test('browser request includes Accept header and does not override User-Agent', async () => {
  const db = createDb();
  let fetchOptions;

  __setScryfallTestRuntime({
    dbImpl: db.impl,
    now: () => Date.now(),
    sleepImpl: async () => {},
    fetchImpl: async (_url, options) => {
      fetchOptions = options;
      return createResponse(200, validCardPayload());
    },
  });

  await checkCard('Sol Ring');

  assert.equal(fetchOptions.headers.Accept, 'application/json;q=0.9,*/*;q=0.8');
  assert.equal('User-Agent' in fetchOptions.headers, false);
});

test('vite proxy config sets accurate User-Agent and Accept headers for Scryfall', () => {
  const viteConfigText = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

  assert.match(viteConfigText, /APP_USER_AGENT = `\$\{APP_NAME\}\/\$\{APP_VERSION\}`/);
  assert.match(viteConfigText, /'User-Agent': APP_USER_AGENT/);
  assert.match(viteConfigText, /Accept: DEFAULT_ACCEPT/);
});

test('queue enforces at least 100ms spacing and max concurrency', async () => {
  const db = createDb();
  let fakeNow = 0;
  let inFlight = 0;
  let peakInFlight = 0;
  const startTimes = [];

  __setScryfallTestRuntime({
    dbImpl: db.impl,
    now: () => fakeNow,
    sleepImpl: async (ms) => {
      fakeNow += ms;
    },
    fetchImpl: async () => {
      startTimes.push(fakeNow);
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      fakeNow += 10;
      inFlight -= 1;
      return createResponse(200, validCardPayload());
    },
  });

  await Promise.all([
    checkCard('Alpha'),
    checkCard('Beta'),
    checkCard('Gamma'),
    checkCard('Delta'),
    checkCard('Epsilon'),
  ]);

  assert.ok(peakInFlight <= __scryfallTestConstants.queueState.maxConcurrent);
  for (let i = 1; i < startTimes.length; i += 1) {
    assert.ok(startTimes[i] - startTimes[i - 1] >= 100);
  }
});

test('429 retry respects Retry-After', async () => {
  const db = createDb();
  let fakeNow = 0;
  const startTimes = [];
  let callCount = 0;

  __setScryfallTestRuntime({
    dbImpl: db.impl,
    now: () => fakeNow,
    sleepImpl: async (ms) => {
      fakeNow += ms;
    },
    fetchImpl: async () => {
      startTimes.push(fakeNow);
      callCount += 1;
      if (callCount === 1) {
        return createResponse(429, {}, { 'Retry-After': '2' });
      }

      return createResponse(200, validCardPayload('Retry Card'));
    },
  });

  const result = await checkCard('Retry Card');

  assert.equal(result.result, 'legal');
  assert.equal(startTimes.length, 2);
  assert.ok(startTimes[1] - startTimes[0] >= 2000);
});

test('cache entries under 24 hours skip network fetches', async () => {
  const db = createDb();
  const now = Date.now();
  let fetchCalls = 0;

  db.cardCache.set('cached card', {
    cardName: 'cached card',
    result: 'legal',
    printings: [],
    cachedAt: new Date(now - __scryfallTestConstants.DAY_MS + 1).toISOString(),
    setListVersion: setData.version,
  });

  __setScryfallTestRuntime({
    dbImpl: db.impl,
    now: () => now,
    sleepImpl: async () => {},
    fetchImpl: async () => {
      fetchCalls += 1;
      return createResponse(200, validCardPayload());
    },
  });

  const result = await checkCard('cached card');

  assert.equal(result.result, 'legal');
  assert.equal(fetchCalls, 0);
  assert.ok(__scryfallTestConstants.CACHE_TTL_MS >= __scryfallTestConstants.DAY_MS);
});

test('in-flight requests are deduplicated for the same card name', async () => {
  const db = createDb();
  let fetchCalls = 0;
  let pendingResolve;
  const pending = new Promise((resolve) => {
    pendingResolve = resolve;
  });

  __setScryfallTestRuntime({
    dbImpl: db.impl,
    now: () => Date.now(),
    sleepImpl: async () => {},
    fetchImpl: async () => {
      fetchCalls += 1;
      await pending;
      return createResponse(200, validCardPayload('Shared Name'));
    },
  });

  const first = checkCard('Shared Name');
  const second = checkCard('Shared Name');

  pendingResolve();
  await Promise.all([first, second]);

  assert.equal(fetchCalls, 1);
});
