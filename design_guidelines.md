# Camera ZeroDay - Tactical Camera PWA Design Guidelines

## Design Approach

**Selected System:** Custom Tactical UI with Material Design foundations
**Rationale:** Utility-focused camera application requiring precision, readability under varied conditions, and instant access to critical information. Drawing from military HUD interfaces, aviation instruments, and professional camera apps.

**Key Principles:**
- Information density with clear hierarchy
- Instant readability in any lighting condition
- Touch-optimized for single-handed operation
- No distracting animations or transitions
- Minimalist, purpose-driven interface

---

## Typography System

**Font Stack:**
- Primary: 'Roboto Mono' (Google Fonts) - monospaced for data/coordinates
- UI Labels: 'Inter' (Google Fonts) - clean, highly legible

**Type Scale:**
- Metadata overlays: text-xs (10-12px) - GPS coords, timestamps
- Primary data: text-sm (14px) - altitude, orientation values
- UI controls: text-base (16px) - buttons, settings
- Section headers: text-lg (18px) - gallery titles, settings sections
- Photo count/stats: text-2xl (24px) - numerical emphasis

**Weights:** 400 (regular), 500 (medium), 600 (semibold) only

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 3, 4, 6, 8
- Tight spacing: p-1, gap-2 (data clusters, metadata overlays)
- Standard spacing: p-4, gap-4 (controls, settings rows)
- Section spacing: p-6, py-8 (view transitions)

**Grid System:**
- Camera view: Full viewport with overlays (no padding)
- Gallery: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Settings: Single column max-w-2xl

---

## Core Screens & Layouts

### 1. Camera Capture Screen (Primary View)
**Layout:**
- Full-screen camera viewfinder (100vh/100vw)
- Top bar (h-16): Sticky header with app logo, settings icon, batch indicator
- Bottom controls (h-24): Capture button (large, centered), gallery access (bottom-right)
- Metadata overlay (top-left corner): GPS coords, altitude, compass heading in small monospace type
- Reticle overlay: Centered, customizable patterns (crosshair/grid/rangefinder)
- Notes button: Floating action button (bottom-left) to add text annotations

**Control Positioning:**
- Capture button: 80px diameter circle, centered horizontally, 32px from bottom
- Secondary controls: 48px squares in corners with 16px margins
- Metadata: 8px padding from edges, semi-transparent backdrop

### 2. Photo Gallery
**Layout:**
- Grid of thumbnails with metadata badges
- Each thumbnail: aspect-ratio-square with overlay showing GPS icon, timestamp
- Tap to view full photo with metadata sidebar (mobile) or panel (desktop)
- Filter bar (sticky top): Date range, location tags, custom sort

**Grid Spacing:** gap-2 on mobile, gap-3 on tablet/desktop

### 3. Photo Detail View
**Layout:**
- Full photo display (max-h-screen minus controls)
- Metadata panel (bottom or side): 
  - Coordinates (large monospace)
  - Timestamp, orientation, altitude
  - User notes (if added)
  - Delete/export actions
- Navigation arrows for next/previous photo

### 4. Settings Panel
**Layout:**
- Slide-in drawer (mobile) or modal (desktop)
- Sections: Reticle selection, GPS accuracy, storage management
- Toggle switches for features (orientation tracking, auto-save location)
- Reticle preview thumbnails in 3-column grid

---

## Component Library

### Navigation
- **Top Bar:** Fixed header with logo (left), title (center), settings/menu (right)
- **Tab Bar (if needed):** Camera/Gallery/Settings - 3 equal-width buttons

### Buttons & Controls
- **Primary (Capture):** Large circular button, 1px outline, prominent
- **Secondary:** Rounded-lg, px-4 py-2, outline style
- **Icon buttons:** 48px touch targets, 24px icons, transparent background
- **Toggle switches:** Custom switches for settings (iOS-style)

### Data Display
- **Metadata Cards:** Compact cards with label + value pairs
- **Coordinate Display:** Monospace, precise formatting (XX.XXXXXX°)
- **Timestamp:** Relative time + absolute on hover/tap
- **Status Indicators:** Small badges for GPS accuracy, orientation lock

### Overlays
- **Reticle Patterns:** SVG-based, customizable opacity (30-70%)
- **HUD Overlay:** Semi-transparent backdrop (backdrop-blur-sm) for metadata
- **Tooltips:** Minimal, appear on long-press for mobile

### Forms
- **Text Input (Notes):** Minimal border, focus:ring-2
- **Select Menus:** Native dropdowns styled consistently
- **Range Sliders:** For reticle opacity, GPS accuracy threshold

### Modals & Drawers
- **Settings Drawer:** Slide from right (mobile), centered modal (desktop)
- **Confirmation Dialogs:** Centered, max-w-sm, clear action buttons

---

## Interaction Patterns

**Camera Controls:**
- Tap to capture (large button)
- Long-press for rapid burst mode
- Pinch to zoom (if hardware supports)
- Swipe left/right to access gallery from camera

**Gallery Navigation:**
- Tap thumbnail to view full photo
- Swipe photo for next/previous
- Pinch to zoom on photo detail

**Reticle Selection:**
- Visual grid of reticle options
- Tap to select, preview in real-time on camera

---

## Icons

**Library:** Heroicons (outline style via CDN)
**Key Icons Needed:**
- Camera, map-pin (GPS), compass, cog (settings)
- trash, share-2, download (export)
- grid-3x3, crosshair, target (reticles)
- plus, x-mark, chevron-left/right

---

## Accessibility

- Minimum 44px touch targets for all interactive elements
- High contrast ratios for metadata text overlays
- Screen reader labels for icon-only buttons
- Haptic feedback on capture (if supported)
- Keyboard navigation for desktop users

---

## PWA-Specific Elements

**Install Prompt:** 
- Subtle banner at top on first visit
- Dismiss button, persistent "Add to Home Screen" in settings

**Offline Indicator:**
- Small badge in top bar showing connection status
- Toast notification when going offline/online

**App Icon Design:**
- Minimalist camera crosshair symbol
- Suitable for round/square masks

---

## Images

No hero images needed - this is a utility camera app. All visual content is user-generated photos captured through the camera interface.