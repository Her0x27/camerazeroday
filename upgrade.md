# Camera ZeroDay - Upgrade Checklist

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## 1. Gallery Icon with Dual Counters
**Description:** Update gallery button on camera screen with two separate counters

- [x] Add camera icon with photo count (top badge)
- [x] Add cloud icon with uploaded count (bottom badge)
- [x] Add function to get cloud-uploaded photos count from IndexedDB
- [x] Style badges for Android/iPhone consistency

---

## 2. Settings Reorganization
**Description:** Split settings into organized card sections

### Cards Structure:
- [x] **General** - Language, theme, sound
- [x] **Watermark** - Metadata display, watermark scale
- [x] **Crosshair** - Reticle settings (enable, size, opacity, color)
- [x] **Capture / Location** - GPS, orientation, accuracy limit
- [x] **Cloud Upload (ImgBB)** - API key, expiration, auto-upload
- [x] **Storage** - Photo count, storage usage, clear data
- [x] **Disguise Mode** - Enable/disable, gesture type, auto-lock
- [x] **PWA** - Installation, offline mode info
- [x] **Reset** - Reset all settings

---

## 3. Disguise Mode (Маскировка)
**Description:** Hide camera behind a fully functional 2048 game

### 3.1 Core Features:
- [x] Create fully functional 2048 game component
- [x] Design for Android and iPhone style
- [x] Implement secret gesture access:
  - [x] 4 quick taps option
  - [x] Pattern unlock option (fully functional with setup UI)
  - [x] Configurable gesture selection
- [x] Auto-lock after inactivity (configurable 1-30 min)
- [x] Dynamic favicon switching (show game icon when disguised)
- [x] Mask button on camera screen for quick hide

### 3.2 Settings:
- [x] Enable/disable disguise mode (default: off)
- [x] Select secret gesture type
- [x] Configure auto-lock timeout
- [ ] Test mode for gesture practice (future enhancement)

### 3.3 Infrastructure:
- [x] DisguiseContext provider for state management
- [x] DisguiseGamePage for game routing
- [x] Game icon SVG for favicon switching
- [x] Activity monitoring for auto-lock
- [x] Inactivity detection and auto-return to game
- [x] App routing with disguise mode redirect

---

## 4. PWA (Progressive Web App)
**Description:** Full PWA support with offline capability

### IMPORTANT: Service Worker and caching ONLY for production!
- In development mode, SW must be unregistered/rejected

### 4.1 Manifest:
- [x] Complete manifest.json with all icon sizes
- [x] Theme colors for Android/iPhone
- [x] Proper display modes

### 4.2 Service Worker (Production Only):
- [x] Cache static assets
- [x] Cache API responses where applicable
- [x] Offline fallback page
- [x] Skip SW registration in development mode
- [x] Add environment check before SW registration

### 4.3 Installation:
- [x] Detect installability (beforeinstallprompt)
- [x] Show install button/prompt in settings
- [x] Handle iOS "Add to Home Screen" guidance
- [x] usePWA hook for install state management

---

## 5. Localization (EN/RU)
**Description:** Full internationalization support

### 5.1 Infrastructure:
- [x] Create i18n context/provider
- [x] Language detection (browser preference)
- [x] Language switcher in settings
- [x] Persist language preference

### 5.2 Translations:
- [x] Camera page strings
- [x] Gallery page strings
- [x] Settings page strings
- [x] Photo detail page strings
- [x] 2048 game strings
- [x] Error messages and toasts
- [x] Metadata labels

---

## 6. Android & iPhone Adaptation
**Description:** Full platform-specific optimization

### 6.1 Common:
- [x] Safe area insets (notch, home indicator)
- [x] Touch-friendly button sizes (w-14 h-14 for main buttons)
- [x] Responsive layouts

### 6.2 Android-specific:
- [x] Status bar color adaptation (via manifest theme-color)
- [ ] Material Design touch ripples (optional enhancement)
- [ ] Back button handling (browser handles it)

### 6.3 iPhone-specific:
- [x] Safe area insets via env(safe-area-inset-*)
- [x] PWA status bar style (black-translucent)
- [ ] Haptic feedback integration (optional enhancement)
- [ ] Swipe gestures (optional enhancement)

---

## Implementation Order

1. **Phase 1: Foundation** ✅ Completed
   - [x] Create upgrade.md checklist
   - [x] Gallery icon dual counters
   - [x] Settings reorganization

2. **Phase 2: Core Features** ✅ Completed
   - [x] Localization system (EN/RU)
   - [x] PWA improvements (production-only SW)

3. **Phase 3: Advanced Features** ✅ Completed
   - [x] Disguise Mode with 2048 game
   - [x] Platform adaptation refinements
   - [x] Mask button on camera
   - [x] Safe area insets

---

## Technical Notes

### Service Worker Strategy
```javascript
// Only register SW in production
if (import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
} else {
  // Unregister any existing SW in development
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
```

### Localization Structure
```
client/src/lib/
├── i18n/
│   ├── context.tsx      # I18n provider
│   ├── translations/
│   │   ├── en.ts        # English strings
│   │   └── ru.ts        # Russian strings
│   └── index.ts         # Exports
```

### Disguise Mode Flow
1. User enables disguise mode in settings
2. App shows 2048 game instead of camera (auto-redirect)
3. Secret gesture (4 quick taps) reveals camera
4. Mask button on camera allows quick return to game
5. Inactivity triggers auto-lock back to game

### Safe Area Implementation
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Applied to:
- Camera page (bottom controls)
- Settings page (header + main)
- Gallery page (header + main)
- Photo detail (bottom header)
- 2048 game (full container)

---

## Future Enhancements (Optional)
- [ ] Haptic feedback for iOS
- [ ] Material ripple effects for Android
- [ ] Test mode for gestures
- [ ] Theme customization (beyond dark mode)
- [ ] Additional reticle types

---

## 7. Pattern Unlock (Completed)
**Description:** Draw pattern gesture for revealing disguise mode

- [x] Create PatternLock component with 3x3 grid
- [x] Gesture recognition (touch tracking)
- [x] Pattern encoding (dot sequence to string)
- [x] Pattern setup UI in settings with confirmation
- [x] Visual feedback (error shake animation)
- [x] Pattern verification in game-2048 disguise mode
- [x] Two unlock methods (4 taps + pattern drawing)
- [x] Settings integration (enable/select unlock method)

---

*Last Updated: November 29, 2025*
