import setData from '../data/sets.json';
import { db } from './db';

export async function clearCache() {
  await db.cardCache.clear();
}

export async function getCacheStats() {
  const rows = await db.cardCache.toArray();
  const count = rows.length;

  if (count === 0) {
    return { count: 0, oldestEntry: null, newestEntry: null, sizeEstimate: 0 };
  }

  const sorted = rows
    .map((row) => ({ ...row, stamp: new Date(row.cachedAt).getTime() }))
    .sort((a, b) => a.stamp - b.stamp);

  const oldestEntry = sorted[0].cachedAt;
  const newestEntry = sorted[sorted.length - 1].cachedAt;
  const sizeEstimate = new Blob([JSON.stringify(rows)]).size;

  return { count, oldestEntry, newestEntry, sizeEstimate };
}

export async function getSetListVersion() {
  return setData.version;
}
