import Dexie from 'dexie';
import { db as newDb } from '../db';

export async function migrateToSyncDB() {
  const oldDbExists = await Dexie.exists('BuJoD_Database');
  if (!oldDbExists) {
    return; // Nothing to migrate
  }

  console.log('Starting migration to UUID-based Sync DB...');
  const oldDb = new Dexie('BuJoD_Database');
  
  // Reconstruct old schema to read from it
  oldDb.version(1).stores({
    pages: '++id, type, date, title, createdAt, updatedAt',
    bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt',
    collections: '++id, name, type, icon, createdAt' 
  });
  oldDb.version(2).stores({
    bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt, date, time'
  });
  oldDb.version(3).stores({
    bullets: '++id, pageId, type, status, text, order, createdAt, updatedAt, date, time, [type+date]'
  });
  oldDb.version(4).stores({
    habits: '++id, name, createdAt',
    habitLogs: '[habitId+date], habitId, date'
  });

  try {
    await oldDb.open();
    
    // Read all old data
    const oldPages = await oldDb.table('pages').toArray();
    const oldBullets = await oldDb.table('bullets').toArray();
    const oldCollections = await oldDb.table('collections').toArray();
    const oldHabits = await oldDb.table('habits').toArray();
    const oldHabitLogs = await oldDb.table('habitLogs').toArray();

    // ID mapping
    const pageIdMap = {};
    const collectionIdMap = {};
    const habitIdMap = {};

    // 1. Migrate Collections
    const newCollections = oldCollections.map(c => {
      const newId = crypto.randomUUID();
      collectionIdMap[c.id] = newId;
      return {
        ...c,
        id: newId,
        deleted: 0,
        updatedAt: c.createdAt || new Date()
      };
    });

    // 2. Migrate Pages
    const newPages = oldPages.map(p => {
      const newId = crypto.randomUUID();
      pageIdMap[p.id] = newId;
      return {
        ...p,
        id: newId,
        // If type is a number (old collection reference), map it
        type: typeof p.type === 'number' && collectionIdMap[p.type] ? collectionIdMap[p.type] : p.type,
        deleted: 0,
        updatedAt: p.updatedAt || new Date()
      };
    });

    // 3. Migrate Bullets
    const newBullets = oldBullets.map(b => {
      const newId = crypto.randomUUID();
      return {
        ...b,
        id: newId,
        pageId: typeof b.pageId === 'string' && b.pageId.startsWith('page_') ? b.pageId : pageIdMap[b.pageId] || b.pageId,
        deleted: 0,
        updatedAt: b.updatedAt || new Date()
      };
    });

    // 4. Migrate Habits
    const newHabits = oldHabits.map(h => {
      const newId = crypto.randomUUID();
      habitIdMap[h.id] = newId;
      return {
        ...h,
        id: newId,
        deleted: 0,
        updatedAt: h.createdAt || new Date()
      };
    });

    // 5. Migrate Habit Logs
    const newHabitLogs = oldHabitLogs.map(l => {
      const newHabitId = habitIdMap[l.habitId] || l.habitId;
      return {
        ...l,
        id: crypto.randomUUID(),
        habitId: newHabitId,
        deleted: 0,
        updatedAt: new Date()
      };
    });

    // Write to new DB
    await newDb.transaction('rw', newDb.pages, newDb.bullets, newDb.collections, newDb.habits, newDb.habitLogs, async () => {
      if (newPages.length) await newDb.pages.bulkAdd(newPages);
      if (newBullets.length) await newDb.bullets.bulkAdd(newBullets);
      if (newCollections.length) await newDb.collections.bulkAdd(newCollections);
      if (newHabits.length) await newDb.habits.bulkAdd(newHabits);
      if (newHabitLogs.length) await newDb.habitLogs.bulkAdd(newHabitLogs);
    });

    console.log('Migration complete. Deleting old database...');
    oldDb.close();
    await Dexie.delete('BuJoD_Database');
    console.log('Old database deleted successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
