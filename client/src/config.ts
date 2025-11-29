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
  // 'quickTaps': Requires 5 quick taps in specific corners (top-left, bottom-right, etc.)
  // 'patternUnlock': Requires drawing a specific pattern on the screen
  UNLOCK_GESTURE: 'quickTaps' as GestureType,

  // Secret pattern for 'patternUnlock' mode - sequence of grid positions to tap
  // Grid layout: 1 2 3 / 4 5 6 / 7 8 9
  // Example: '1357' means tap top-left → top-right → center → bottom-left
  // Only used when UNLOCK_GESTURE is 'patternUnlock'
  UNLOCK_PATTERN: '1357',

  // === AUTO-LOCK CONFIGURATION ===
  // Minutes of inactivity before camera automatically hides when disguise mode is enabled
  // Set to 0 to disable auto-lock
  AUTO_LOCK_MINUTES: 1,

  // === DEBUG MODE ===
  // When true, logs unlock attempts and other debug info to console
  // Only works in development
  DEBUG_MODE: false,
} as const;
