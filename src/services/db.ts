import { DB_NAME, DB_VERSION, STORES } from '../types';

class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tags store
        if (!db.objectStoreNames.contains(STORES.TAGS)) {
          const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
          tagStore.createIndex('category', 'category', { unique: false });
          tagStore.createIndex('name', 'name', { unique: false });
        }

        // Prompts store
        if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
          const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' });
          promptStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Artists store
        if (!db.objectStoreNames.contains(STORES.ARTISTS)) {
          const artistStore = db.createObjectStore(STORES.ARTISTS, { keyPath: 'id' });
          artistStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          artistStore.createIndex('useCount', 'useCount', { unique: false });
        }

        // Artist chains store
        if (!db.objectStoreNames.contains(STORES.ARTIST_CHAINS)) {
          db.createObjectStore(STORES.ARTIST_CHAINS, { keyPath: 'id' });
        }

        // Parsed images store
        if (!db.objectStoreNames.contains(STORES.PARSED_IMAGES)) {
          const parsedStore = db.createObjectStore(STORES.PARSED_IMAGES, { keyPath: 'id' });
          parsedStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // App state store
        if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
          db.createObjectStore(STORES.APP_STATE, { keyPath: 'key' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkPut<T>(storeName: string, values: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = values.length;

      values.forEach((value) => {
        const request = store.put(value);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new DatabaseService();
