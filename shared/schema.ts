import { z } from "zod";

// Photo metadata captured at the time of photo
export const photoMetadataSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  altitude: z.number().nullable(),
  accuracy: z.number().nullable(),
  heading: z.number().nullable(), // compass heading in degrees
  tilt: z.number().nullable(), // device tilt
  timestamp: z.number(), // unix timestamp
});

export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;

// Main photo object stored in IndexedDB
export const photoSchema = z.object({
  id: z.string(),
  imageData: z.string(), // base64 encoded image without EXIF
  thumbnailData: z.string(), // smaller base64 thumbnail
  metadata: photoMetadataSchema,
  note: z.string().optional(),
  folder: z.string().optional(), // folder name derived from note
});

export type Photo = z.infer<typeof photoSchema>;

// Insert schema for creating new photos
export const insertPhotoSchema = photoSchema.omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

// Reticle configuration (all values are percentages for consistency)
export const reticleConfigSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.number().min(5).max(50).default(20), // size as % of viewport min dimension
  opacity: z.number().min(10).max(100).default(50), // opacity %
  strokeWidth: z.number().min(1).max(10).default(3), // line thickness as % of reticle size
  showMetadata: z.boolean().default(true),
  autoColor: z.boolean().default(true), // auto-adjust color based on background
});

export type ReticleConfig = z.infer<typeof reticleConfigSchema>;

// App settings stored in IndexedDB
export const settingsSchema = z.object({
  reticle: reticleConfigSchema,
  gpsEnabled: z.boolean().default(true),
  orientationEnabled: z.boolean().default(true),
  autoSaveLocation: z.boolean().default(true),
  cameraFacing: z.enum(["user", "environment"]).default("environment"),
  soundEnabled: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
  reticle: {
    enabled: true,
    size: 20,
    opacity: 50,
    strokeWidth: 3,
    showMetadata: true,
    autoColor: true,
  },
  gpsEnabled: true,
  orientationEnabled: true,
  autoSaveLocation: true,
  cameraFacing: "environment",
  soundEnabled: true,
};

// Gallery filter options
export const galleryFilterSchema = z.object({
  sortBy: z.enum(["newest", "oldest"]).default("newest"),
  hasLocation: z.boolean().optional(),
  hasNote: z.boolean().optional(),
  dateFrom: z.number().optional(),
  dateTo: z.number().optional(),
});

export type GalleryFilter = z.infer<typeof galleryFilterSchema>;
