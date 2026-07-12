import Dexie from 'dexie';

// Create a brand new database for Sync architecture to cleanly switch to UUIDs
export const db = new Dexie('BuJoD_Sync_DB');

db.version(1).stores({
  pages: 'id, type, date, title, createdAt, updatedAt, deleted',
  bullets: 'id, pageId, type, status, text, order, createdAt, updatedAt, date, time, [type+date], deleted',
  collections: 'id, name, type, icon, createdAt, updatedAt, deleted',
  habits: 'id, name, createdAt, updatedAt, deleted',
  habitLogs: 'id, [habitId+date], habitId, date, updatedAt, deleted'
});
