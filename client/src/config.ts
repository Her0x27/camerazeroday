/**
 * Application Configuration
 * Independent disguise mode configuration that works without Replit environment variables
 */

export const CONFIG = {
  // Set to true to hide the camera and show only the 2048 game for all users
  // Set to false to allow users to access the camera (disguise mode becomes optional)
  DISGUISE_MODE: true,
} as const;
