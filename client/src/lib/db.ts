import type { Photo, InsertPhoto, Settings } from "@shared/schema";
import { defaultSettings } from "@shared/schema";

const DB_NAME = "camera-zeroday";
const DB_VERSION = 1;
const PHOTOS_STORE = "photos";
const SETTINGS_STORE = "settings";

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Photos store with indexes
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const photosStore = db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
        photosStore.createIndex("timestamp", "metadata.timestamp", { unique: false });
        photosStore.createIndex("hasLocation", "metadata.latitude", { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };
  });
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Photo CRUD operations
export async function savePhoto(photo: InsertPhoto): Promise<Photo> {
  const db = await openDB();
  const id = generateId();
  const fullPhoto: Photo = { ...photo, id };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.add(fullPhoto);

    request.onsuccess = () => resolve(fullPhoto);
    request.onerror = () => reject(request.error);
  });
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPhotos(sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const photos: Photo[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        photos.push(cursor.value);
        cursor.continue();
      } else {
        resolve(photos);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getLatestPhoto(): Promise<Photo | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev");

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(undefined);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoIds(sortOrder: "newest" | "oldest" = "newest"): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const ids: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        ids.push(cursor.value.id);
        cursor.continue();
      } else {
        resolve(ids);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo | undefined> {
  const db = await openDB();
  const existing = await getPhoto(id);
  
  if (!existing) return undefined;

  const updated = { ...existing, ...updates };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.put(updated);

    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(id: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFolders(): Promise<string[]> {
  const photos = await getAllPhotos();
  const folders = new Set<string>();
  
  for (const photo of photos) {
    if (photo.folder) {
      folders.add(photo.folder);
    }
  }
  
  return Array.from(folders).sort();
}

export async function getPhotosByFolder(folder: string | null, sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
  const allPhotos = await getAllPhotos(sortOrder);
  
  if (folder === null) {
    return allPhotos.filter(p => !p.folder);
  }
  
  return allPhotos.filter(p => p.folder === folder);
}

export async function getFolderCounts(): Promise<Map<string | null, number>> {
  const photos = await getAllPhotos();
  const counts = new Map<string | null, number>();
  
  for (const photo of photos) {
    const folder = photo.folder || null;
    counts.set(folder, (counts.get(folder) || 0) + 1);
  }
  
  return counts;
}

// Settings operations
export async function getSettings(): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get("settings");

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(defaultSettings);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: "settings", data: settings });

    request.onsuccess = () => resolve(settings);
    request.onerror = () => reject(request.error);
  });
}

// Get count of photos uploaded to cloud
export async function getCloudUploadedCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.openCursor();
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        if (photo.cloud?.url) {
          count++;
        }
        cursor.continue();
      } else {
        resolve(count);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// Get photo counts summary (total and cloud uploaded)
export async function getPhotoCounts(): Promise<{ total: number; cloud: number }> {
  const [total, cloud] = await Promise.all([
    getPhotoCount(),
    getCloudUploadedCount(),
  ]);
  return { total, cloud };
}

// Utility to get storage usage estimate
export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}

// Export photo as clean blob without EXIF
export function createCleanImageBlob(base64Data: string): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob || new Blob());
        }, "image/jpeg", 0.92);
      } else {
        resolve(new Blob());
      }
    };
    img.src = base64Data;
  });
}
