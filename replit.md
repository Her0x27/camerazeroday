# Camera ZeroDay - Tactical Camera PWA

## Overview

Camera ZeroDay is a Progressive Web App (PWA) designed as a tactical camera application for capturing geotagged photos with precision metadata. The application provides military-grade HUD overlays, customizable reticles, GPS coordinates, device orientation data, and offline-first functionality. It's built as a single-page application with all data stored locally in the browser's IndexedDB, requiring no backend infrastructure beyond static file serving.

The application targets use cases requiring precision photography with environmental metadata—ideal for fieldwork, surveying, outdoor activities, or tactical operations where location and orientation data are critical.

## User Preferences

Preferred communication style: Simple, everyday language.

## Environment Configuration

### Disguise Mode
- **Variable**: `VITE_DISGUISE_MODE`
- **Values**: `'true'` or `'false'`
- **Description**: When set to `'true'`, forces the application to start in disguise mode (2048 game). The camera interface is hidden, and users cannot disable disguise mode from settings.
- **Use Case**: Deploy disguised version on shared devices where you want to hide the camera application by default.
- **Default**: `'false'` (disguise mode is optional and user-controlled)

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for UI components
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query (React Query)** for state management and data fetching patterns
- **Tailwind CSS** with custom tactical dark theme
- **shadcn/ui** component library (Radix UI primitives with custom styling)

**Design Philosophy:**
The application follows a utility-first, tactical UI design inspired by military HUD interfaces and aviation systems. Key principles include:
- High information density with clear visual hierarchy
- Optimized for readability in varied lighting conditions
- Touch-optimized for single-handed operation
- No distracting animations or transitions
- Minimalist, purpose-driven interface

**Component Structure:**
- Custom hooks for camera, geolocation, and device orientation access
- Reusable UI components from shadcn/ui library
- Context-based settings management with React Context API
- Page-based routing with 4 main views: Camera, Gallery, Photo Detail, Settings

### Data Storage

**IndexedDB Implementation:**
All application data is stored client-side using IndexedDB through a custom abstraction layer (`client/src/lib/db.ts`). No server-side database is required.

**Data Models:**
- **Photos Store**: Stores captured photos with base64-encoded image data, thumbnails, and metadata
- **Settings Store**: Persists user preferences including reticle configuration, GPS settings, and camera preferences

**Photo Metadata Schema:**
Each photo captures:
- GPS coordinates (latitude, longitude, altitude, accuracy)
- Device orientation (compass heading, tilt)
- Timestamp
- Optional user notes
- Active reticle type at capture time

**Storage Strategy:**
- Images stored as base64 without EXIF data to maintain privacy
- Separate thumbnail generation for gallery performance
- No cloud sync—fully offline-capable

### PWA Features

**Service Worker:**
- Caches static assets for offline access (production only)
- Network-first strategy for navigation requests
- Falls back to cached resources when offline
- Manifest file for installation as native-like app

**Mobile Optimization:**
- Viewport meta tags prevent unwanted scaling
- Apple-specific meta tags for iOS web app mode
- Touch-friendly UI with appropriate sizing
- Status bar styling for immersive experience

### Device APIs Integration

**Camera API:**
Custom hook (`use-camera.ts`) manages:
- MediaStream API for camera access
- Front/back camera switching
- Canvas-based photo capture
- Automatic cleanup of video streams

**Geolocation API:**
Custom hook (`use-geolocation.ts`) provides:
- Continuous GPS position watching
- High-accuracy positioning requests
- Error handling for denied permissions
- Position data caching

**Device Orientation API:**
Custom hook (`use-orientation.ts`) handles:
- Compass heading (alpha)
- Device tilt (beta)
- Roll orientation (gamma)
- Cross-browser compatibility (including iOS webkit variations)
- Permission requests for iOS 13+ motion sensors

### Reticle System

**Customizable Overlays:**
Six reticle types available:
- None (clean view)
- Crosshair (simple center target)
- Grid (composition guide)
- Rangefinder (distance estimation)
- Tactical (military-style HUD)
- Mil-Dot (precision ranging)

**Configuration:**
- Adjustable opacity (0-100%)
- Customizable color (default: tactical green #22c55e)
- Toggle metadata overlay visibility
- Settings persist in IndexedDB

### State Management

**Settings Context:**
React Context provider (`settings-context.tsx`) manages:
- Global application settings
- Reticle configuration
- GPS and orientation preferences
- Camera facing preference (front/back)
- Audio feedback settings

**Local-First Approach:**
All state changes immediately persist to IndexedDB, ensuring data integrity without server dependency.

## External Dependencies

### UI Component Library
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, switches, sliders, etc.)
- **shadcn/ui**: Pre-styled components built on Radix UI with Tailwind CSS
- **lucide-react**: Icon library for consistent iconography

### Build Tools & Development
- **Vite**: Fast build tool with HMR (Hot Module Replacement)
- **TypeScript**: Type safety across the entire application
- **PostCSS & Autoprefixer**: CSS processing for cross-browser compatibility
- **esbuild**: Fast JavaScript bundler for production builds

### Utilities
- **clsx & tailwind-merge**: Conditional className utilities
- **class-variance-authority**: Component variant management
- **date-fns**: Date formatting and manipulation
- **zod**: Runtime type validation for schemas
- **nanoid**: Unique ID generation for photos

### Fonts
- **Google Fonts**: 
  - Roboto Mono (monospaced for metadata display)
  - Inter (UI labels and controls)

### Development Environment (Replit-specific)
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error display
- **@replit/vite-plugin-cartographer**: Code navigation
- **@replit/vite-plugin-dev-banner**: Development mode indicator

### Server (Minimal)
The Express server exists only to serve static files. Key dependencies:
- **Express**: HTTP server framework
- **Vite middleware**: Development server integration

### Note on Database Dependencies
While the project includes Drizzle ORM and PostgreSQL dependencies in package.json, the current implementation uses IndexedDB exclusively. These dependencies may be artifacts from the initial project template or reserved for potential future server-side features. The application is fully functional as a client-only PWA without any database server.