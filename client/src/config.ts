/**
 * Application Configuration
 * Independent disguise mode configuration that works without Replit environment variables
 */

export type GestureType = 'quickTaps' | 'patternUnlock';

export const CONFIG = {
  // === DISGUISE MODE ===
  // Set to true to hide the camera and show only the 2048 game for all users
  // Set to false to allow users to access the camera (disguise mode becomes optional)
  DISGUISE_MODE: true,

  // === UNLOCK CONFIGURATION ===
  // Type of gesture required to unlock the camera when disguise mode is active
  // 'quickTaps': Requires taps in specific corners (WARNING: currently has a security bug - use patternUnlock instead)
  // 'patternUnlock': Requires drawing a specific pattern on the screen (recommended)
  UNLOCK_GESTURE: 'patternUnlock' as GestureType,

  // Secret pattern for 'patternUnlock' mode - sequence of grid positions separated by dashes
  // Grid layout (0-indexed):
  //   0 1 2
  //   3 4 5
  //   6 7 8
  // Example: '0-4-8' means tap top-left → center → bottom-right (diagonal)
  // Only used when UNLOCK_GESTURE is 'patternUnlock'
  UNLOCK_PATTERN: '0-4-8',

  // === AUTO-LOCK CONFIGURATION ===
  // Minutes of inactivity before camera automatically hides when disguise mode is enabled
  // Set to 0 to disable auto-lock
  AUTO_LOCK_MINUTES: 1,

  // === DEBUG MODE ===
  // When true, logs unlock attempts and other debug info to console
  // Only works in development
  DEBUG_MODE: false,
} as const;
