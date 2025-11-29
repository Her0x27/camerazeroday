export const TIMING = {
  TAP_TIMEOUT_MS: 1000,
  PATTERN_TAP_TIMEOUT_MS: 800,
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 300,
  PATTERN_CLEAR_DELAY_MS: 300,
} as const;

export const GESTURE = {
  MIN_PATTERN_LENGTH: 4,
  MIN_SWIPE_DISTANCE_PX: 30,
  QUICK_TAP_COUNT: 4,
  PATTERN_UNLOCK_TAP_COUNT: 5,
} as const;

export const GAME = {
  GRID_SIZE: 4,
  WINNING_TILE: 2048,
  NEW_TILE_PROBABILITY_2: 0.9,
} as const;

export const UPLOAD = {
  CONCURRENT_UPLOADS: 3,
  DEFAULT_EXPIRATION: 0,
} as const;

export const STORAGE_KEYS = {
  SETTINGS: "tactical-camera-settings",
  GAME_BEST_SCORE: "game2048-best",
  DISGUISE_SETTINGS: "tactical-camera-disguise",
  LANGUAGE: "tactical-camera-language",
} as const;

export const PATTERN_LOCK = {
  GRID_SIZE: 3,
  DEFAULT_SIZE: 240,
  DEFAULT_DOT_SIZE: 20,
  HIT_RADIUS_MULTIPLIER: 0.4,
} as const;
