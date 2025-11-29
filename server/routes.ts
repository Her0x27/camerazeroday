import type { Express } from "express";
import { type Server } from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Camera ZeroDay is a client-only PWA application
  // No API routes are needed - all data is stored in IndexedDB
  // The server only serves static files
  
  return httpServer;
}
