// Camera ZeroDay is a client-only application
// All data is stored in IndexedDB on the client side
// This file is kept minimal as the server only serves static files

export interface IStorage {
  // No server-side storage needed for this PWA
}

export class MemStorage implements IStorage {
  constructor() {
    // No initialization needed
  }
}

export const storage = new MemStorage();
