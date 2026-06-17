import Dexie from 'dexie';

export const db = new Dexie('BuJoD_Database');

db.version(1).stores({
  pages: '++id, type, date, title, createdAt, updatedAt',
  bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt',
  collections: '++id, name, type, icon, createdAt' 
});

db.version(2).stores({
  bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt, date, time'
});

// V2 architecture: optimized querying for global events
db.version(3).stores({
  bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt, date, time, [type+date]'
});
