# 📷 Camera ZeroDay

> A tactical camera Progressive Web App with stealth mode disguise

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5a0fc4)](https://web.dev/progressive-web-apps)

## 🎯 Overview

Camera ZeroDay is a cutting-edge Progressive Web App designed for precision photography with comprehensive metadata capture. It combines military-grade HUD overlays, GPS geolocation, device orientation tracking, and offline-first functionality into a single-page application that operates entirely within your browser.

### Key Highlights
- **Zero Server Required** — All data stored locally in IndexedDB
- **Disguise Mode** — Hides camera behind a 2048 game with pattern-based unlock
- **Full Offline Support** — Works completely offline, installable as native app
- **Military-Grade HUD** — Tactical overlays with multiple reticle types
- **Precise Metadata** — GPS coordinates, compass heading, device orientation, timestamps
- **Bilingual** — Full English and Russian localization
- **Secure** — Pattern-based security with debouncing protection

---

## ✨ Features

### 📸 Photography Capabilities
- **Multiple Camera Modes** — Switch between front and rear cameras
- **Tactical Overlays** — 6 different reticle types:
  - None (clean view)
  - Crosshair (simple center target)
  - Grid (composition guide)
  - Rangefinder (distance estimation)
  - Tactical (military-style HUD)
  - Mil-Dot (precision ranging)
- **Customizable Reticles** — Adjust opacity (0-100%) and color
- **Metadata Overlay** — Display all captured information on screen

### 🛰️ Precise Positioning
- **GPS Integration** — Real-time latitude, longitude, altitude, and accuracy
- **Compass Heading** — Magnetic orientation (alpha angle)
- **Device Tilt** — Pitch and roll tracking (beta & gamma angles)
- **Timestamp Recording** — Precise capture time for each photo

### 🎮 Disguise Mode
- **2048 Game** — Fully functional puzzle game as cover
- **Pattern-Based Unlock** — Draw 5-tap pattern on 3×3 grid
- **Quick Activation** — Tap pattern within 0.8 seconds
- **Seamless Integration** — Smooth transition between game and camera
- **Security Settings** — Configure unlock pattern in app settings

### 📱 PWA Features
- **Installable** — Add to home screen on Android and iOS
- **Offline-First** — Full functionality without internet
- **Auto-Update** — Background service worker keeps app current
- **Native Feel** — Immersive fullscreen experience
- **Auto-Install Banner** — Smart detection for installation prompts

### 🗂️ Gallery & Management
- **Photo Gallery** — Browse all captured images with thumbnails
- **Detailed View** — Full metadata display for each photo
- **Local Storage** — Base64 image storage with privacy protection
- **Batch Operations** — Export and manage photos locally

### ⚙️ Customization Settings
- **Reticle Configuration** — Type, color, opacity adjustment
- **GPS Settings** — Enable/disable location tracking
- **Camera Preferences** — Default camera selection
- **Audio Feedback** — Optional sound effects
- **Display Options** — Metadata visibility toggle
- **Watermark Settings** — Custom text overlay configuration
- **Disguise Configuration** — Pattern setup and behavior customization

---

## 🚀 Getting Started

### System Requirements
- **Browser Support** — Chrome/Edge 90+, Firefox 88+, Safari 15+
- **APIs Required** — Camera, Geolocation, Device Orientation
- **Storage** — Minimum 50MB available in browser storage

### Installation

#### Option 1: Web App (Recommended)
1. Open [Camera ZeroDay](https://camerazeroday.replit.dev) in your browser
2. Tap the install banner at the bottom of the 2048 game
3. Or use your browser's "Install app" option
4. Grant permission for camera, location, and device orientation

#### Option 2: Local Development
```bash
# Clone the repository
git clone <repository-url>
cd camerazeroday

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Launch
1. **Permissions** — Grant access to camera, GPS, and device motion
2. **Settings** — Configure reticle type and metadata display
3. **Disguise Setup** — Set your pattern unlock code (optional)
4. **Installation** — Install as PWA when prompted

---

## 📖 Usage Guide

### Taking Photos
1. **Launch Camera** — Open app and ensure you're not in disguise mode
2. **Frame Shot** — Position subject within reticle overlay
3. **Capture** — Tap the large capture button or press spacebar
4. **Confirm** — Review photo in preview, then save or retake

### Accessing Disguise Mode
1. **Start Game** — App opens directly to 2048 game
2. **Unlock Camera** — Quickly tap pattern (5 taps on 3×3 grid)
3. **Pattern Format** — Taps numbered 0-8:
   ```
   0 1 2
   3 4 5
   6 7 8
   ```
4. **Time Window** — Complete all 5 taps within 0.8 seconds

### Gallery Management
1. **View Photos** — Navigate to Gallery tab
2. **Open Photo** — Tap thumbnail to view full resolution and metadata
3. **Photo Details** — See GPS, heading, timestamp, and device orientation
4. **Export** — Right-click image for browser save options

### Settings Configuration
All settings are organized in collapsible sections:
- **Reticle Options** — Overlay type and appearance
- **GPS Settings** — Location tracking preferences
- **Camera Preferences** — Default device selection
- **Metadata Display** — Show/hide overlay information
- **Watermark Settings** — Add custom text overlays
- **Storage Management** — View usage and clear data
- **Disguise Configuration** — Unlock pattern setup
- **PWA Options** — Installation and offline settings

---

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework** — React 18 with TypeScript
- **Build Tool** — Vite with HMR support
- **Routing** — Wouter (lightweight client-side router)
- **State Management** — TanStack Query + React Context
- **Styling** — Tailwind CSS + shadcn/ui components
- **Storage** — IndexedDB (browser-native database)
- **Icons** — Lucide React + React Icons
- **Utilities** — date-fns, zod, clsx, tailwind-merge

### Project Structure
```
camerazeroday/
├── client/src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── game-2048.tsx       # Disguise mode game
│   │   ├── pattern-lock.tsx    # Unlock pattern grid
│   │   └── collapsible-card.tsx # Settings sections
│   ├── pages/
│   │   ├── camera/             # Main camera interface
│   │   ├── gallery/            # Photo browser
│   │   ├── settings/           # Settings UI
│   │   └── disguise-game.tsx    # Disguise wrapper
│   ├── lib/
│   │   ├── db.ts               # IndexedDB abstraction
│   │   ├── disguise-context.tsx # Disguise mode state
│   │   ├── i18n/               # Localization (EN/RU)
│   │   └── constants.ts        # App constants
│   ├── hooks/
│   │   ├── use-camera.ts       # Camera API integration
│   │   ├── use-geolocation.ts  # GPS positioning
│   │   ├── use-orientation.ts  # Device orientation
│   │   └── use-pwa.ts          # PWA installation
│   └── App.tsx                 # Main app component
├── server/
│   ├── index.ts                # Express server
│   └── vite.ts                 # Vite middleware
├── public/
│   └── manifest.json           # PWA manifest
└── package.json                # Dependencies
```

### Data Storage
All data persists in **IndexedDB** with the following stores:
- **photos** — Captured images with metadata
- **settings** — User preferences and configuration
- **gallery_cache** — Thumbnail generation cache

No cloud sync or server-side database required.

---

## 🔐 Security & Privacy

### Data Protection
- **Local-Only Storage** — All photos stored in browser's IndexedDB
- **No Cloud Upload** — Complete offline-first architecture
- **EXIF Removal** — Base64 encoding prevents sensitive metadata exposure
- **No Tracking** — Zero analytics or telemetry

### Pattern-Based Security
- **Custom Unlock Code** — User-defined pattern for disguise mode access
- **Time-Window Protection** — Must complete pattern within 0.8 seconds
- **Touch Debouncing** — Prevents accidental activation during gameplay
- **Quick-Tap Mechanism** — 5 consecutive taps required to unlock

---

## 🌍 Localization

Camera ZeroDay supports full bilingual interface:
- **English** — Default language
- **Русский** — Complete Russian translation
- **Auto-Detection** — Respects browser language preference
- **Manual Override** — Switch languages in settings

---

## 📋 Detailed Feature Documentation

### Configuration System
The app uses environment variables for deployment configuration:
- `VITE_DISGUISE_MODE` — Force disguise mode for all users
- `VITE_PATTERN_CODE` — Custom unlock pattern (development)
- `VITE_DEBUG_MODE` — Enhanced logging for troubleshooting

### Device APIs
- **Camera API** — MediaStream for photo capture
- **Geolocation API** — GPS positioning with accuracy metrics
- **Device Orientation API** — Compass and tilt sensors
- **Service Worker** — Offline caching and background sync

### Browser Compatibility
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera  | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| GPS     | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| PWA     | ✅ 90+ | ✅ 88+  | ⚠️ 15+ | ✅ 90+ |
| Service Worker | ✅ 90+ | ✅ 88+ | ✅ 15+ | ✅ 90+ |

---

## 🎮 2048 Game Guide

The disguise mode features a fully functional 2048 puzzle game:
- **Objective** — Combine tiles to reach 2048
- **Controls** — Swipe or use arrow keys
- **Score** — Cumulative points from merged tiles
- **Best Score** — Track your personal high score
- **Mobile Optimized** — Single-handed gameplay support
- **Touch-Friendly** — Large buttons for easy interaction

### Tips for Hiding the Camera
- Play the game normally to avoid suspicion
- Keep the best score visible
- Use landscape mode for immersive experience
- Dismiss PWA installation banner to reduce distractions
- Pattern unlock is safeguarded against accidental triggers

---

## 🛠️ Development

### Setup
```bash
npm install
npm run dev      # Start development server (Vite + Express)
npm run build    # Production build
npm run type-check  # TypeScript validation
```

### Code Style
- **TypeScript** — Strict type checking enabled
- **ESLint** — Code quality rules
- **Prettier** — Automatic code formatting
- **Tailwind CSS** — Utility-first styling

### Adding New Features
1. **Define Types** — Update shared schema if needed
2. **Create Components** — Use shadcn/ui primitives
3. **Add Hooks** — Custom hooks for complex logic
4. **Style with Tailwind** — Follow design system
5. **Test Thoroughly** — Verify on multiple browsers

---

## 📄 Documentation

- **Manual (Russian)** — `documents/manual_settings_disguise_ru.md`
- **Configuration** — `client/src/config.ts`
- **Localization** — `client/src/lib/i18n/`
- **API Hooks** — `client/src/hooks/`

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** — Beautiful component library
- **Tailwind CSS** — Modern utility-first styling
- **Vite** — Next generation build tool
- **React** — UI library foundation
- **Lucide Icons** — Beautiful icon set

---

## 📮 Support

For issues, questions, or suggestions:
- 🐛 **Bug Reports** — Create an issue on GitHub
- 💡 **Feature Requests** — Discuss in issues
- 📧 **Contact** — Check repository for contact info

---

## 🔮 Roadmap

- [ ] Cloud sync backend (optional)
- [ ] Advanced image filters
- [ ] Batch photo operations
- [ ] Custom theme creator
- [ ] Multi-pattern unlock codes
- [ ] Geofencing capabilities
- [ ] Real-time video recording
- [ ] Social sharing integration

---

**Camera ZeroDay** — *Precision photography meets tactical intelligence* 🎯

*Built with ❤️ for photographers, surveyors, and tactical professionals*
