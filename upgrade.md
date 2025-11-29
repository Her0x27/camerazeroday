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
- [ ] **Disguise Mode** - 2048 game, secret gestures, auto-lock (Phase 3)
- [ ] **PWA** - Installation, offline mode info (Phase 2)

---

## 3. Disguise Mode (Маскировка)
**Description:** Hide camera behind a fully functional 2048 game

### 3.1 Core Features:
- [ ] Create fully functional 2048 game component
- [ ] Design for Android and iPhone style
- [ ] Implement secret gesture access:
  - [ ] 4 quick taps option
  - [ ] Hidden pattern unlock option
  - [ ] Configurable gesture selection
- [ ] Auto-lock after 1 minute of inactivity
- [ ] Dynamic favicon switching (show game icon when disguised)
- [ ] Mask button on camera screen for quick hide

### 3.2 Settings:
- [ ] Enable/disable disguise mode (default: off)
- [ ] Select secret gesture type
- [ ] Configure auto-lock timeout
- [ ] Test mode for gesture practice

---

## 4. PWA (Progressive Web App)
**Description:** Full PWA support with offline capability

### IMPORTANT: Service Worker and caching ONLY for production!
- In development mode, SW must be unregistered/rejected

### 4.1 Manifest:
- [ ] Complete manifest.json with all icon sizes
- [ ] Theme colors for Android/iPhone
- [ ] Proper display modes

### 4.2 Service Worker (Production Only):
- [ ] Cache static assets
- [ ] Cache API responses where applicable
- [ ] Offline fallback page
- [ ] Skip SW registration in development mode
- [ ] Add environment check before SW registration

### 4.3 Installation:
- [ ] Detect installability (beforeinstallprompt)
- [ ] Show install button/prompt in settings
- [ ] Handle iOS "Add to Home Screen" guidance

---

## 5. Localization (EN/RU)
**Description:** Full internationalization support

### 5.1 Infrastructure:
- [ ] Create i18n context/provider
- [ ] Language detection (browser preference)
- [ ] Language switcher in settings
- [ ] Persist language preference

### 5.2 Translations:
- [ ] Camera page strings
- [ ] Gallery page strings
- [ ] Settings page strings
- [ ] Photo detail page strings
- [ ] 2048 game strings
- [ ] Error messages and toasts
- [ ] Metadata labels

---

## 6. Android & iPhone Adaptation
**Description:** Full platform-specific optimization

### 6.1 Common:
- [ ] Safe area insets (notch, home indicator)
- [ ] Touch-friendly button sizes
- [ ] Responsive layouts

### 6.2 Android-specific:
- [ ] Material Design touch ripples
- [ ] Status bar color adaptation
- [ ] Back button handling

### 6.3 iPhone-specific:
- [ ] iOS-style animations
- [ ] Haptic feedback integration
- [ ] Swipe gestures
- [ ] PWA status bar style

---

## Implementation Order

1. **Phase 1: Foundation** (Current)
   - [~] Create upgrade.md checklist
   - [ ] Gallery icon dual counters
   - [ ] Settings reorganization

2. **Phase 2: Core Features**
   - [ ] Localization system (EN/RU)
   - [ ] PWA improvements (production-only SW)

3. **Phase 3: Advanced Features**
   - [ ] Disguise Mode with 2048 game
   - [ ] Platform adaptation refinements

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
2. App shows 2048 game instead of camera
3. Secret gesture reveals camera
4. Inactivity triggers auto-lock back to game
5. Mask button on camera allows quick return to game

---

*Last Updated: November 29, 2025*
