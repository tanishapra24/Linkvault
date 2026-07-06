// db.js - IndexedDB client for LinkVault

const DB_NAME = 'LinkVaultDB';
const DB_VERSION = 1;

let dbInstance = null;

export function initDb() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error: ', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Create categories store
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        catStore.createIndex('name', 'name', { unique: true });
      }

      // 2. Create tags store
      if (!db.objectStoreNames.contains('tags')) {
        const tagStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
        tagStore.createIndex('name', 'name', { unique: true });
      }

      // 3. Create resources store
      if (!db.objectStoreNames.contains('resources')) {
        const resStore = db.createObjectStore('resources', { keyPath: 'id', autoIncrement: true });
        resStore.createIndex('category_id', 'category_id', { unique: false });
        resStore.createIndex('is_favorite', 'is_favorite', { unique: false });
        resStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  }).then((db) => {
    return seedDefaultCategories(db).then(() => db);
  });
}

function seedDefaultCategories(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');

    const defaultCategories = [
      { name: 'Finance', color: '#f5a623', icon: '💰', created_at: new Date() },
      { name: 'Marketing', color: '#ff4757', icon: '📈', created_at: new Date() },
      { name: 'AI Tools', color: '#54a0ff', icon: '🤖', created_at: new Date() },
      { name: 'Design', color: '#1dd1a1', icon: '🎨', created_at: new Date() },
      { name: 'History & Culture', color: '#9b59b6', icon: '🏛️', created_at: new Date() },
    ];

    let completed = 0;
    let failed = 0;

    defaultCategories.forEach((cat) => {
      // Check if already exists by checking the index or just trying to put if name index isn't hit
      // We can use get on name if we check index
      const index = store.index('name');
      const getReq = index.get(cat.name);

      getReq.onsuccess = (e) => {
        if (!e.target.result) {
          const addReq = store.add(cat);
          addReq.onsuccess = () => {
            completed++;
            checkDone();
          };
          addReq.onerror = () => {
            failed++;
            checkDone();
          };
        } else {
          completed++;
          checkDone();
        }
      };

      getReq.onerror = () => {
        failed++;
        checkDone();
      };
    });

    function checkDone() {
      if (completed + failed === defaultCategories.length) {
        resolve();
      }
    }
  });
}

// Helper to run transaction
function getStore(storeName, mode = 'readonly') {
  return initDb().then((db) => {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  });
}

// --- Categories CRUD ---

export function getCategories() {
  return new Promise((resolve, reject) => {
    getStore('categories').then((store) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export function addCategory(category) {
  return new Promise((resolve, reject) => {
    getStore('categories', 'readwrite').then((store) => {
      const req = store.add({
        ...category,
        created_at: new Date()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

// --- Tags CRUD ---

export function getTags() {
  return new Promise((resolve, reject) => {
    getStore('tags').then((store) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export function saveTags(tagsArray) {
  if (!tagsArray || !tagsArray.length) return Promise.resolve([]);
  
  return initDb().then((db) => {
    return new Promise((resolve) => {
      const tx = db.transaction('tags', 'readwrite');
      const store = tx.objectStore('tags');
      const index = store.index('name');

      let processed = 0;
      const results = [];

      tagsArray.forEach((tagName) => {
        const trimmed = tagName.trim().toLowerCase();
        if (!trimmed) {
          processed++;
          if (processed === tagsArray.length) resolve(results);
          return;
        }

        const getReq = index.get(trimmed);
        getReq.onsuccess = (e) => {
          if (!e.target.result) {
            const addReq = store.add({ name: trimmed, created_at: new Date() });
            addReq.onsuccess = (addEv) => {
              results.push({ id: addEv.target.result, name: trimmed });
              processed++;
              if (processed === tagsArray.length) resolve(results);
            };
            addReq.onerror = () => {
              processed++;
              if (processed === tagsArray.length) resolve(results);
            };
          } else {
            results.push(e.target.result);
            processed++;
            if (processed === tagsArray.length) resolve(results);
          }
        };
        getReq.onerror = () => {
          processed++;
          if (processed === tagsArray.length) resolve(results);
        };
      });
    });
  });
}

// --- Resources CRUD ---

export function getResources() {
  return new Promise((resolve, reject) => {
    getStore('resources').then((store) => {
      const req = store.getAll();
      req.onsuccess = () => {
        // Sort by date_saved descending by default
        const list = req.result || [];
        list.sort((a, b) => new Date(b.date_saved) - new Date(a.date_saved));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export function getResource(id) {
  return new Promise((resolve, reject) => {
    getStore('resources').then((store) => {
      const req = store.get(Number(id));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export function addResource(resource) {
  // First save the tags in tags DB to keep autocomplete/list fresh
  const tagsList = resource.tags || [];
  return saveTags(tagsList).then(() => {
    return new Promise((resolve, reject) => {
      getStore('resources', 'readwrite').then((store) => {
        const item = {
          title: resource.title,
          creator_name: resource.creator_name || '',
          creator_handle: resource.creator_handle ? (resource.creator_handle.startsWith('@') ? resource.creator_handle : '@' + resource.creator_handle) : '',
          resource_type: resource.resource_type || 'link',
          url: resource.url || '',
          file_blob: resource.file_blob || null,
          file_name: resource.file_name || '',
          category_id: resource.category_id ? Number(resource.category_id) : null,
          tags: tagsList.map(t => t.trim().toLowerCase()).filter(Boolean),
          notes: resource.notes || '',
          source_post: resource.source_post || '',
          date_saved: resource.date_saved ? new Date(resource.date_saved) : new Date(),
          is_favorite: !!resource.is_favorite,
          visit_count: Number(resource.visit_count) || 0,
          created_at: new Date()
        };

        const req = store.add(item);
        req.onsuccess = (e) => {
          resolve(e.target.result);
        };
        req.onerror = (e) => {
          reject(e.target.error);
        };
      });
    });
  });
}

export function updateResource(resource) {
  const tagsList = resource.tags || [];
  return saveTags(tagsList).then(() => {
    return new Promise((resolve, reject) => {
      getStore('resources', 'readwrite').then((store) => {
        const req = store.put(resource);
        req.onsuccess = () => resolve(resource.id);
        req.onerror = () => reject(req.error);
      });
    });
  });
}

export function deleteResource(id) {
  return new Promise((resolve, reject) => {
    getStore('resources', 'readwrite').then((store) => {
      const req = store.delete(Number(id));
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export function incrementResourceVisit(id) {
  return new Promise((resolve, reject) => {
    getStore('resources', 'readwrite').then((store) => {
      const getReq = store.get(Number(id));
      getReq.onsuccess = () => {
        const resource = getReq.result;
        if (!resource) {
          reject(new Error('Resource not found'));
          return;
        }
        resource.visit_count = (resource.visit_count || 0) + 1;
        const updateReq = store.put(resource);
        updateReq.onsuccess = () => resolve(resource);
        updateReq.onerror = () => reject(updateReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

export function toggleFavoriteResource(id) {
  return new Promise((resolve, reject) => {
    getStore('resources', 'readwrite').then((store) => {
      const getReq = store.get(Number(id));
      getReq.onsuccess = () => {
        const resource = getReq.result;
        if (!resource) {
          reject(new Error('Resource not found'));
          return;
        }
        resource.is_favorite = !resource.is_favorite;
        const updateReq = store.put(resource);
        updateReq.onsuccess = () => resolve(resource);
        updateReq.onerror = () => reject(updateReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}
