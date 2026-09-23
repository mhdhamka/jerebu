import { openDB } from 'idb';

const DB_NAME = 'jerebu_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reports';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('status', 'status');
        }
      }
    });
  }
  return dbPromise;
}

export const offlineQueueService = {
  isOnline() {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  },

  async enqueueReport(reportData) {
    const db = await getDB();
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      ...reportData,
      tempId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
    await db.put(STORE_NAME, record);
    return record;
  },

  async getPendingReports() {
    try {
      const db = await getDB();
      return await db.getAll(STORE_NAME);
    } catch (err) {
      console.warn('Failed to read offline queue from IndexedDB:', err);
      return [];
    }
  },

  async removePendingReport(tempId) {
    const db = await getDB();
    await db.delete(STORE_NAME, tempId);
  },

  async updatePendingReport(report) {
    const db = await getDB();
    await db.put(STORE_NAME, report);
  },

  async getPendingCount() {
    try {
      const db = await getDB();
      return await db.count(STORE_NAME);
    } catch {
      return 0;
    }
  },

  setupAutoSync(syncCallback) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
      console.log('📡 Internet connection restored. Processing offline report queue...');
      if (typeof syncCallback === 'function') {
        try {
          await syncCallback();
        } catch (err) {
          console.error('Error during auto-sync of offline reports:', err);
        }
      }
    });
  }
};
