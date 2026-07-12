import axios from 'axios';
import { db } from '../db';
import { useAppStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function syncData(token) {
  const store = useAppStore.getState();
  store.setSyncStatus('syncing');

  try {
    const lastSyncTime = store.lastSyncTime;
    
    // 1. Gather local changes since lastSyncTime
    const collections = ['pages', 'bullets', 'collections', 'habits', 'habitLogs'];
    const localChanges = {};
    let hasLocalChanges = false;
    
    for (const coll of collections) {
      const records = await db[coll].toArray();
      const changedRecords = records.filter(r => {
        if (!lastSyncTime) return true; // First sync, send everything
        return new Date(r.updatedAt).getTime() > lastSyncTime;
      });
      
      if (changedRecords.length > 0) {
        localChanges[coll] = changedRecords;
        hasLocalChanges = true;
      }
    }

    // 2. PUSH local changes to server
    if (hasLocalChanges) {
      await axios.post(`${API_URL}/sync/push`, { changes: localChanges }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // 3. PULL remote changes from server
    const pullRes = await axios.post(`${API_URL}/sync/pull`, { lastSyncTime }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { changes: remoteChanges, timestamp } = pullRes.data;

    // 4. Apply remote changes to local DB
    if (remoteChanges) {
      await db.transaction('rw', db.pages, db.bullets, db.collections, db.habits, db.habitLogs, async () => {
        for (const [coll, records] of Object.entries(remoteChanges)) {
          if (records.length > 0) {
            for (const record of records) {
              const { _id, userId, collectionName, __v, ...dataToSave } = record;
              
              // Last Write Wins (LWW) Resolution
              const existingLocal = await db[coll].get(dataToSave.id);
              const incomingTime = new Date(dataToSave.updatedAt).getTime();
              const localTime = existingLocal ? new Date(existingLocal.updatedAt).getTime() : 0;
              
              if (!existingLocal || incomingTime > localTime) {
                await db[coll].put({
                  ...dataToSave,
                  updatedAt: new Date(dataToSave.updatedAt)
                });
              }
            }
          }
        }
      });
    }

    // Update last sync time
    store.setLastSyncTime(timestamp);
    store.setSyncStatus('idle');

  } catch (error) {
    console.error('Sync error:', error);
    store.setSyncStatus('error');
    // Clear error after 3 seconds
    setTimeout(() => {
      if (useAppStore.getState().syncStatus === 'error') {
        useAppStore.getState().setSyncStatus('idle');
      }
    }, 3000);
  }
}
