import Dexie from 'dexie';

export const db = new Dexie('MiddleClassCommander');

db.version(1).stores({
  cardCache: 'cardName, cachedAt, setListVersion',
  setListMeta: 'key',
});
