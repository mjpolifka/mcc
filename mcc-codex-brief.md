# Middle Class Commander – Engineering Brief
### Data Layer, API Integration & Business Logic

This brief is intended for an AI coding agent (Codex or equivalent). It describes everything needed to implement the data and logic layer for Middle Class Commander — a browser-only React app with no backend server. The UI layer already exists as a React/JSX prototype and is not covered here.

---

## 1. Project Overview

Middle Class Commander is a web app that checks whether Magic: The Gathering Commander decks are legal under the "middle class" rule:

> A card is **banned** if it has ever been printed at **rare or mythic rare** rarity in any set that is not in the ignored-sets list.

The app supports four audit modes:
1. **By Card** — check a single card name
2. **By Deck** — fetch an Archidekt deck by ID, check all cards
3. **By Folder** — fetch all decks in an Archidekt folder, check each
4. **By User** — fetch all decks for an Archidekt user, check each

The app runs entirely in the browser. There is no backend. All external data comes from the Scryfall API and the Archidekt API. Caching is handled via IndexedDB using Dexie.js.

---

## 2. Tech Stack

- **React** (Vite project, already scaffolded)
- **Dexie.js** — IndexedDB wrapper for caching
- **Scryfall REST API** — card and printing data
- **Archidekt API** — deck, folder, and user data

Before writing any Archidekt integration code, **read the pyrchidekt library documentation** (https://github.com/Jakkson/pyrchidekt or its PyPI page) to understand the shape of Archidekt's API responses. pyrchidekt is a Python library but its source and docs describe the API endpoints and response structures accurately. Use this to inform how you fetch and parse deck, folder, and user data.

Before writing any Scryfall integration code, **read the Scryfall API documentation** at https://scryfall.com/docs/api to confirm current endpoint shapes, rate limit policies, and any relevant notes on bulk data.

---

## 3. Set List (Banned/Ignored Sets)

A JSON file (`src/data/sets.json`) defines which sets are in scope for the legality rule. Codex should create this file with the following structure:

```json
{
  "version": "1.0.0",
  "sets": [
    { "code": "lea", "name": "Limited Edition Alpha", "category": "banned" },
    { "code": "rep", "name": "Reprints", "category": "ignored" }
  ]
}
```

**Categories:**
- `"banned"` — sets that count toward the legality check. If a card was printed at rare or mythic in any of these sets, it is banned.
- `"ignored"` — sets that are explicitly excluded from the check. Promo sets, Secret Lair, Masterpiece Series, and similar should be ignored.

**Populate this file thoughtfully.** The initial set list should include all standard Magic sets (core sets, expansion sets, Commander precons) as `"banned"`, and exclude: promo sets, Secret Lair drops, Masterpiece/Kaladesh Inventions/Amonkhet Invocations, SDCC promos, holiday promos, and any set where rarity is not a meaningful signal of card power.

The legality algorithm (Section 6) uses this file. The `version` field is stored alongside cached results so that cache entries can be invalidated if the set list changes.

---

## 4. Caching with Dexie (IndexedDB)

Install Dexie: `npm install dexie`

Create `src/lib/db.js`:

```js
import Dexie from 'dexie';

export const db = new Dexie('MiddleClassCommander');

db.version(1).stores({
  cardCache: 'cardName, cachedAt, setListVersion',
  setListMeta: 'key',
});
```

### Card cache schema (per entry):
```js
{
  cardName: String,        // primary key, normalized (lowercase, trimmed)
  result: 'banned' | 'legal',
  printings: Array,        // raw printing data from Scryfall, for debugging
  cachedAt: Date,
  setListVersion: String,  // from sets.json — invalidate if version changes
}
```

### Cache invalidation rules:
1. Entry is older than **30 days** → re-fetch
2. Entry's `setListVersion` does not match the current `sets.json` version → re-fetch
3. User manually clears cache → delete all entries (`db.cardCache.clear()`)

### Set list meta:
Store one record `{ key: 'lastSetCheck', checkedAt: Date }` to track when the app last checked Scryfall for newly released sets. On app load, if this is older than 24 hours, fetch the current Scryfall set list and compare against known sets. If new sets are found that should be categorized, log a console warning (set list maintenance is manual for now).

---

## 5. Scryfall API Integration

Create `src/lib/scryfall.js`.

### Rate limiting
Scryfall's API allows a maximum of **10 requests per second** and explicitly requests that clients avoid bursting. Implement a **queue with a 100ms minimum delay between requests** (10 req/s) and a **maximum of 5 concurrent in-flight requests**.

Use a simple async queue — do not use any external queue library. Implement it as a module-level singleton so all calls share the same queue regardless of where in the app they originate.

```js
// Conceptual shape — implement properly
async function scryfallFetch(url) { ... }
```

All Scryfall requests must include the header:
```
User-Agent: MiddleClassCommander/1.0 (your-contact-or-repo-url)
```

### Card legality lookup

```js
export async function checkCard(cardName) → { result: 'banned' | 'legal', printings: Array }
```

Steps:
1. Normalize `cardName` (lowercase, trim)
2. Check Dexie cache — return cached result if valid (see Section 4)
3. If not cached, fetch from Scryfall: `GET /cards/search?q=!"${cardName}"&unique=prints&order=released`
   - This returns all printings of the card
4. For each printing, check:
   - Is the printing's `set` code in `sets.json` under category `"banned"`?
   - Is the printing's `rarity` equal to `"rare"` or `"mythic"`?
   - If **both** are true → card is **banned**
5. If any printing triggers both conditions → result is `"banned"`, otherwise `"legal"`
6. Write result to Dexie cache
7. Return result

Handle Scryfall errors:
- `404` → card not found, return `{ result: 'failed', reason: 'not_found' }`
- `429` → rate limited, retry after delay (back off exponentially, max 3 retries)
- Network error → retry up to 3 times, then return `{ result: 'failed', reason: 'network' }`
- Unexpected response shape → return `{ result: 'failed', reason: 'api_changed' }` — this is the signal for "App needs update"

---

## 6. Archidekt API Integration

Create `src/lib/archidekt.js`.

**Before implementing this file, read the pyrchidekt source/documentation** to confirm endpoint URLs, response shapes, and any authentication requirements. pyrchidekt is at https://github.com/Jakkson/pyrchidekt — use its source to map Python API calls to raw HTTP requests.

The functions to implement:

```js
export async function getDeck(deckId) → { id, name, cards: [{ name, quantity }] }
export async function getFolder(folderId) → { id, name, decks: [{ id, name }] }
export async function getUserDecks(username) → [{ id, name, updatedAt }]
```

Error handling:
- `404` or equivalent → `throw new ArchidektError('not_found')` — deck is private or doesn't exist
- Network errors → retry up to 2 times, then throw
- Unexpected shape → throw with reason `'api_changed'`

Do not rate-limit Archidekt requests — deck/folder/user fetches happen once per audit, not in bulk loops.

---

## 7. Audit Engine

Create `src/lib/audit.js`. This is the core orchestration layer that the UI calls.

### Card audit
```js
export async function auditCard(cardName, { onResult }) → void
```
- Calls `checkCard(cardName)`
- Calls `onResult({ cardName, status })` when done
- Status values: `'checking'` (immediately on start), then `'banned' | 'legal' | 'failed'`

### Deck audit
```js
export async function auditDeck(deckId, { onDeckInfo, onCardResult, onComplete, onError, signal }) → void
```
- Fetches deck via `getDeck(deckId)`
- Calls `onDeckInfo({ id, name, totalCards })` immediately after fetch
- Checks each card via `checkCard()`, calling `onCardResult({ cardName, status })` as each resolves
- Cards are checked with up to **5 concurrent** Scryfall lookups (respect the queue in `scryfall.js`)
- Respects `signal` (AbortSignal) — stop processing if aborted
- Calls `onComplete({ banned, legal, failed })` when all cards are done
- Calls `onError(error)` on unrecoverable failure (bad deck ID, private deck, etc.)

### Folder audit
```js
export async function auditFolder(folderId, { onFolderInfo, onDeckStart, onDeckCardResult, onDeckComplete, onError, signal }) → void
```
- Fetches folder deck list via `getFolder(folderId)`
- Audits decks **sequentially** (one at a time) to avoid hammering both APIs
- Surfaces per-deck progress via callbacks matching the deck audit shape
- Respects AbortSignal

### User audit
```js
export async function auditUser(username, { ...sameCallbacksAsFolder, signal }) → void
```
- Same as folder audit but fetches via `getUserDecks(username)`

### Cancellation
All audit functions accept a `signal: AbortSignal`. When the signal is aborted, stop queuing new work immediately. Already in-flight Scryfall requests can complete but their results should be discarded.

---

## 8. Cache Management

Create `src/lib/cache.js`:

```js
export async function clearCache() → void       // clears all cardCache entries
export async function getCacheStats() → { count, oldestEntry, newestEntry, sizeEstimate }
export async function getSetListVersion() → String  // from sets.json
```

`getCacheStats()` is used by the UI's cache settings panel to show the user how warm their cache is.

---

## 9. Error Types

Create `src/lib/errors.js` with named error classes:

```js
export class ArchidektError extends Error { constructor(reason) }
export class ScryfallError extends Error { constructor(reason) }
```

Reason codes used across the app:
- `'not_found'` — deck/card doesn't exist or is private
- `'network'` — connectivity failure after retries
- `'rate_limited'` — 429 after retries
- `'api_changed'` — unexpected response shape (app needs update)

The UI maps these reason codes to user-facing messages. Keep them consistent.

---

## 10. Module Summary

| File | Purpose |
|------|---------|
| `src/data/sets.json` | Banned/ignored set list |
| `src/lib/db.js` | Dexie database definition |
| `src/lib/scryfall.js` | Scryfall API + rate-limited queue |
| `src/lib/archidekt.js` | Archidekt API (read pyrchidekt docs first) |
| `src/lib/audit.js` | Orchestration: card / deck / folder / user audits |
| `src/lib/cache.js` | Cache management utilities |
| `src/lib/errors.js` | Shared error types |

---

## 11. What This Brief Does Not Cover

- The React UI layer (already implemented separately)
- Any backend server (there is none — browser only)
- Authentication (Archidekt public API only, no login required)
- Deployment / build configuration

---

## 12. Definition of Done

- All seven files exist and are importable
- `auditDeck(deckId, callbacks)` correctly identifies banned cards for a real Archidekt deck
- `checkCard('Sol Ring')` returns `{ result: 'banned', ... }`
- `checkCard('Command Tower')` returns `{ result: 'legal', ... }`
- Cache is populated after first run; second run returns cached results without hitting Scryfall
- AbortSignal cancellation stops processing mid-audit
- All error reason codes surface correctly on bad input (private deck, nonexistent card, etc.)
