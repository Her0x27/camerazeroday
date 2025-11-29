# TypeScript Project Audit Report

## 1. Duplication and Repetitions

### 1.1 Storage Info Loading Logic Duplication
**Location:** `client/src/pages/gallery.tsx` (lines 80-95), `client/src/pages/settings.tsx` (lines 55-70)
**Problem:** Both components independently load storage info with identical logic and query structure.
**Recommendation:** Extract storage info hook to a shared custom hook.

- [ ] Create `useStorageInfo()` hook in `client/src/hooks/use-storage.ts`
- [ ] Refactor gallery.tsx to use the new hook
- [ ] Refactor settings.tsx to use the new hook
- [ ] Add proper TypeScript return types to the hook

### 1.2 Date Formatting Duplication
**Location:** `client/src/pages/gallery.tsx` (line 638), `client/src/pages/photo-detail.tsx` (lines 267, 424)
**Problem:** Date formatting logic is repeated with hardcoded locale "ru-RU" in multiple places.
**Recommendation:** Create a shared date formatting utility that respects i18n settings.

- [ ] Create `formatDate()` utility in `client/src/lib/date-utils.ts`
- [ ] Support locale-aware formatting based on current language
- [ ] Replace all inline date formatting with the utility
- [ ] Add date format options (short, long, with time, etc.)

### 1.3 GPS Badge Rendering Duplication
**Location:** `client/src/pages/gallery.tsx` (lines 647-656, 700-708)
**Problem:** GPS badge with MapPin icon is rendered identically in list and grid views.
**Recommendation:** Extract to a reusable component.

- [ ] Create `<LocationBadge />` component
- [ ] Create `<NoteBadge />` component
- [ ] Refactor gallery.tsx to use the new components
- [ ] Add consistent sizing variants

### 1.4 Toast Notification Patterns
**Location:** `client/src/pages/camera.tsx`, `client/src/pages/gallery.tsx`, `client/src/pages/photo-detail.tsx`, `client/src/pages/settings.tsx`
**Problem:** Same toast success/error patterns with identical structure repeated across all files.
**Recommendation:** Create typed toast helper functions.

- [ ] Create `showSuccessToast(title, description)` utility
- [ ] Create `showErrorToast(title, description)` utility
- [ ] Create `showWarningToast(title, description)` utility
- [ ] Refactor all components to use the utilities

### 1.5 Photo Deletion Logic Duplication
**Location:** `client/src/pages/gallery.tsx` (lines 160-175), `client/src/pages/photo-detail.tsx` (lines 80-95)
**Problem:** Delete mutation logic is duplicated with same invalidation pattern.
**Recommendation:** Create a shared photo mutation hook.

- [ ] Create `usePhotoMutations()` hook with delete, update operations
- [ ] Include cache invalidation logic in the hook
- [ ] Refactor gallery.tsx to use the hook
- [ ] Refactor photo-detail.tsx to use the hook

### 1.6 Upload Progress Tracking Duplication
**Location:** `client/src/pages/gallery.tsx` (lines 200-250), `client/src/pages/camera.tsx` (lines 180-220)
**Problem:** Upload progress state management and UI rendering duplicated.
**Recommendation:** Create a shared upload progress hook and component.

- [ ] Create `useUploadProgress()` hook
- [ ] Create `<UploadProgressOverlay />` component
- [ ] Refactor gallery.tsx to use the shared components
- [ ] Refactor camera.tsx to use the shared components

---

## 2. Architecture and Structure

### 2.1 Oversized Settings Context
**Location:** `client/src/lib/settings-context.tsx` (246 lines)
**Problem:** Single context manages camera, location, watermark, crosshair, and imgbb settings. Violates Single Responsibility Principle.
**Recommendation:** Split into focused contexts or use a compound settings pattern.

- [ ] Create separate `CameraSettingsContext`
- [ ] Create separate `CrosshairSettingsContext`
- [ ] Create separate `CloudSettingsContext`
- [ ] Create a compound provider that composes all settings
- [ ] Update all consumers to use specific contexts

### 2.2 Camera Page God Component
**Location:** `client/src/pages/camera.tsx` (580+ lines)
**Problem:** Mixes camera logic, UI rendering, metadata handling, upload logic, and note management in one component.
**Recommendation:** Extract into smaller, focused components and hooks.

- [ ] Extract metadata overlay to `<CameraMetadataOverlay />` component
- [ ] Extract controls to `<CameraControls />` component
- [ ] Extract note input to `<PhotoNoteInput />` component
- [ ] Keep camera.tsx as a thin orchestrating container

### 2.3 Game Logic Mixed with UI
**Location:** `client/src/components/game-2048.tsx` (470 lines)
**Problem:** Game state management and rendering logic are tightly coupled.
**Recommendation:** Separate game logic into a custom hook.

- [ ] Create `useGame2048()` hook with pure game logic
- [ ] Export game functions (move, canMove, hasWon, etc.) as pure functions
- [ ] Keep component focused on rendering and event handling
- [ ] Add unit tests for game logic

### 2.4 Direct IndexedDB Access
**Location:** `client/src/lib/db.ts` (200+ lines)
**Problem:** Database operations are directly exposed without abstraction layer.
**Recommendation:** Implement repository pattern.

- [ ] Create `PhotoRepository` class with typed methods
- [ ] Abstract database operations behind interface
- [ ] Add error handling decorator/wrapper
- [ ] Consider adding caching layer

### 2.5 No i18n Dynamic Loading
**Location:** `client/src/lib/i18n/index.ts`, `en.ts`, `ru.ts`
**Problem:** All translations loaded synchronously, increasing bundle size.
**Recommendation:** Implement lazy loading for translations.

- [ ] Configure dynamic import for translation files
- [ ] Load only the active language on initial load
- [ ] Add loading state for language switching
- [ ] Consider using i18next or similar library for better features

---

## 3. Performance

### 3.1 Missing Memoization in Gallery Filtering
**Location:** `client/src/pages/gallery.tsx` (lines 120-145)
**Problem:** `filteredPhotos` array is recalculated on every render, even when dependencies haven't changed.
**Recommendation:** Use `useMemo` for expensive computations.

- [ ] Wrap `filteredPhotos` calculation with `useMemo`
- [ ] Ensure correct dependency array
- [ ] Add memoization for `folders` grouping logic
- [ ] Profile performance improvement

### 3.2 No Virtualization for Photo List
**Location:** `client/src/pages/gallery.tsx`
**Problem:** All photos are rendered at once, causing performance issues with large galleries.
**Recommendation:** Implement virtual scrolling.

- [ ] Install `react-virtual` or `react-window` package
- [ ] Implement virtualized list for list view
- [ ] Implement virtualized grid for grid view
- [ ] Add performance metrics/monitoring

### 3.3 PatternLock Excessive Rerenders
**Location:** `client/src/components/pattern-lock.tsx`
**Problem:** Component rerenders on every mouse/touch move event during drawing.
**Recommendation:** Optimize render cycles.

- [ ] Use `useReducer` instead of multiple `useState` calls
- [ ] Memoize SVG elements with `useMemo`
- [ ] Throttle move event handling
- [ ] Consider using canvas instead of SVG for better performance

### 3.4 Game2048 Grid Cell Rerenders
**Location:** `client/src/components/game-2048.tsx` (lines 365-378)
**Problem:** All 16 grid cells rerender on any state change.
**Recommendation:** Memoize cell components.

- [ ] Extract `<GameTile />` as a memoized component
- [ ] Use `React.memo` with custom comparison
- [ ] Only rerender cells that actually changed
- [ ] Profile before/after improvements

### 3.5 Missing useCallback in Event Handlers
**Location:** Multiple files
**Problem:** Handlers recreated on every render, causing child component rerenders.
**Recommendation:** Wrap handlers with `useCallback`.

- [ ] Audit all inline handlers in gallery.tsx
- [ ] Audit all inline handlers in settings.tsx
- [ ] Wrap stable handlers with `useCallback`
- [ ] Add ESLint rule `react-hooks/exhaustive-deps`

### 3.6 No Code Splitting for Routes
**Location:** `client/src/App.tsx`
**Problem:** All pages loaded synchronously in the main bundle.
**Recommendation:** Implement lazy loading for routes.

- [ ] Use `React.lazy()` for page components
- [ ] Add `<Suspense>` with loading fallback
- [ ] Prioritize above-the-fold content
- [ ] Configure Vite for optimal chunk splitting

---

## 4. Typing Issues

### 4.1 `any` Type Usage
**Location:** `client/src/lib/db.ts` (line 121)
**Problem:** `(IndexedDB as any).databases()` uses `any` to bypass type checking.
**Recommendation:** Create proper type definition.

- [ ] Define `IndexedDBWithDatabases` interface extending `IDBFactory`
- [ ] Add type guard for feature detection
- [ ] Remove `any` cast

### 4.2 Loose `navigator.connection` Typing
**Location:** `client/src/pages/camera.tsx`
**Problem:** Navigator connection API typed loosely without proper interface.
**Recommendation:** Add proper type definitions.

- [ ] Create `NetworkInformation` interface in `types/global.d.ts`
- [ ] Extend `Navigator` interface
- [ ] Add type guards for API availability

### 4.3 Type Assertions Instead of Type Guards
**Location:** Multiple files
**Problem:** Using `as` casts instead of proper type narrowing.
**Recommendation:** Replace with type guards.

- [ ] Create `isImgBBResponse()` type guard for imgbb.ts
- [ ] Create `isImgBBError()` type guard for imgbb.ts
- [ ] Replace type assertions with type guards
- [ ] Add runtime validation

### 4.4 Event Type Generics
**Location:** `client/src/components/pattern-lock.tsx` (line 70)
**Problem:** Event handlers use `React.TouchEvent | React.MouseEvent` without proper element types.
**Recommendation:** Add element type parameters.

- [ ] Change to `React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>`
- [ ] Audit all event handlers for proper typing
- [ ] Add explicit return types to all event handlers

### 4.5 BeforeInstallPromptEvent Custom Definition
**Location:** `client/src/main.tsx` (lines 30-33)
**Problem:** Custom interface defined locally for PWA install prompt.
**Recommendation:** Use proper type package or move to global types.

- [ ] Move interface to `types/pwa.d.ts`
- [ ] Consider using `@pwa/types` package if available
- [ ] Export type for reuse in other files

---

## 5. Data Handling

### 5.1 Mutable Operations in Game Logic
**Location:** `client/src/components/game-2048.tsx`
**Problem:** Some grid operations mutate arrays in place despite creating new arrays.
**Recommendation:** Ensure full immutability.

- [ ] Audit `rotateGrid()` for mutations
- [ ] Audit `moveLeft()` for mutations
- [ ] Use spread operators consistently
- [ ] Consider using Immer for complex state updates

### 5.2 Multiple Photo Data Transformations
**Location:** `client/src/lib/db.ts`, `client/src/pages/gallery.tsx`
**Problem:** Photos are transformed multiple times when loading and displaying.
**Recommendation:** Standardize data transformation pipeline.

- [ ] Define canonical photo shape in schema
- [ ] Transform once at data fetch
- [ ] Cache transformed data
- [ ] Add transformation type safety

### 5.3 Settings Update Granularity
**Location:** `client/src/lib/settings-context.tsx`
**Problem:** Settings updates replace entire settings object for small changes.
**Recommendation:** Implement granular updates.

- [ ] Use Immer's `produce()` for immutable updates
- [ ] Consider using Zustand for better state management
- [ ] Add selectors for specific setting slices
- [ ] Prevent unnecessary saves

### 5.4 Repeated Date Calculations
**Location:** Multiple files
**Problem:** Same date calculations performed multiple times without caching.
**Recommendation:** Memoize date calculations.

- [ ] Create memoized date formatting hook
- [ ] Cache folder grouping calculations
- [ ] Use `useMemo` for date-based computations

---

## 6. Async Issues

### 6.1 Sequential Upload Instead of Parallel
**Location:** `client/src/lib/imgbb.ts` (lines 145-163)
**Problem:** `uploadMultipleToImgBB` uploads images sequentially with `for...of` loop.
**Recommendation:** Implement parallel uploads with concurrency limit.

- [ ] Use `Promise.all()` with chunking for parallel uploads
- [ ] Add configurable concurrency limit (e.g., 3-5 concurrent)
- [ ] Handle partial failures gracefully
- [ ] Add proper progress tracking for parallel operations

### 6.2 Missing Error Handling in Effects
**Location:** `client/src/hooks/use-camera.ts`, `client/src/hooks/use-geolocation.ts`
**Problem:** Some async operations in effects don't handle errors properly.
**Recommendation:** Add comprehensive error handling.

- [ ] Add try/catch to all async effect callbacks
- [ ] Surface errors to UI through state
- [ ] Add error recovery mechanisms
- [ ] Log errors for debugging

### 6.3 No Debounce on Slider Changes
**Location:** `client/src/pages/settings.tsx` (sliders for watermark, crosshair, expiration)
**Problem:** Settings are saved on every slider movement, causing excessive saves.
**Recommendation:** Add debounce to slider change handlers.

- [ ] Create `useDebouncedCallback` hook
- [ ] Apply to all slider `onValueChange` handlers
- [ ] Use 300-500ms debounce delay
- [ ] Show pending state during debounce

### 6.4 Potential Memory Leaks in Event Listeners
**Location:** `client/src/components/game-2048.tsx` (lines 257-274), `client/src/components/pattern-lock.tsx` (lines 136-147)
**Problem:** Event listeners added to window may not be cleaned up properly on unmount.
**Recommendation:** Ensure proper cleanup.

- [ ] Verify cleanup function returns in all useEffect with event listeners
- [ ] Use AbortController for fetch requests
- [ ] Add cleanup for touch/mouse events in pattern-lock
- [ ] Test cleanup with React DevTools

### 6.5 Missing Cleanup in Camera Hook
**Location:** `client/src/hooks/use-camera.ts`
**Problem:** Camera stream may not be properly stopped on component unmount.
**Recommendation:** Add cleanup for media streams.

- [ ] Stop all tracks on cleanup
- [ ] Handle component remount gracefully
- [ ] Add stream status tracking
- [ ] Test with React StrictMode

---

## 7. Imports and Bundle

### 7.1 Full Library Imports
**Location:** Multiple files importing from `lucide-react`
**Problem:** Importing icons may pull in entire library if not properly tree-shaken.
**Recommendation:** Verify tree-shaking is working.

- [ ] Check bundle analyzer for lucide-react size
- [ ] Consider direct imports if needed: `import { Camera } from 'lucide-react/dist/esm/icons/camera'`
- [ ] Add bundle size monitoring to CI

### 7.2 Unused Imports
**Location:** Various files
**Problem:** Some imports are declared but not used.
**Recommendation:** Clean up unused imports.

- [ ] Run ESLint with `no-unused-vars` rule
- [ ] Enable TypeScript `noUnusedLocals` compiler option
- [ ] Add pre-commit hook for import cleanup
- [ ] Use `organize-imports` VSCode extension

### 7.3 No Lazy Loading for Routes
**Location:** `client/src/App.tsx`
**Problem:** All page components are imported at the top level.
**Recommendation:** Implement route-based code splitting.

- [ ] Wrap page imports with `React.lazy()`
- [ ] Add `Suspense` boundaries around `Router`
- [ ] Create shared loading component
- [ ] Test loading behavior

### 7.4 Large Single Files
**Location:** `client/src/pages/settings.tsx` (1090 lines), `client/src/pages/gallery.tsx` (845 lines)
**Problem:** Large files are harder to maintain and cause larger chunk sizes.
**Recommendation:** Break into smaller modules.

- [ ] Extract settings sections to separate components
- [ ] Extract gallery views to separate components
- [ ] Create feature-based folder structure
- [ ] Keep each file under 300-400 lines

---

## 8. Code Smells

### 8.1 Long Functions
**Location:** `GalleryPage` in `gallery.tsx`, `SettingsPage` in `settings.tsx`
**Problem:** Functions exceed 500+ lines, making them hard to understand and maintain.
**Recommendation:** Extract smaller functions and components.

- [ ] Extract `<GalleryHeader />` component
- [ ] Extract `<GalleryFilters />` component
- [ ] Extract `<PhotoGrid />` and `<PhotoList />` components
- [ ] Extract each settings card to separate component
- [ ] Target max 100 lines per function

### 8.2 Magic Numbers
**Location:** Multiple files
**Problem:** Hardcoded numbers without explanation.

| Location | Magic Number | Meaning |
|----------|-------------|---------|
| game-2048.tsx:205 | 1000 | Tap timeout (ms) |
| game-2048.tsx:214 | 800 | Pattern tap timeout (ms) |
| pattern-lock.tsx:131 | 300 | Pattern clear delay (ms) |
| pattern-lock.tsx:127 | 4 | Min pattern length |
| gallery.tsx:296 | 30 | Swipe threshold (px) |

**Recommendation:** Extract to named constants.

- [ ] Create constants file `client/src/lib/constants.ts`
- [ ] Define `TAP_TIMEOUT_MS = 1000`
- [ ] Define `PATTERN_TAP_TIMEOUT_MS = 800`
- [ ] Define `ANIMATION_DURATION_MS = 300`
- [ ] Define `MIN_PATTERN_LENGTH = 4`
- [ ] Define `SWIPE_THRESHOLD_PX = 30`
- [ ] Replace all magic numbers with constants

### 8.3 Deep JSX Nesting
**Location:** `client/src/pages/gallery.tsx` (lines 500-750), `client/src/pages/settings.tsx`
**Problem:** JSX nesting exceeds 5+ levels, reducing readability.
**Recommendation:** Extract nested structures to components.

- [ ] Extract deeply nested conditionals to components
- [ ] Use early returns for conditional rendering
- [ ] Create wrapper components for common patterns
- [ ] Target max 3-4 levels of nesting

### 8.4 Hardcoded Strings Despite i18n
**Location:** Various files
**Problem:** Some UI strings are hardcoded despite having i18n system.

| Location | Hardcoded String |
|----------|-----------------|
| gallery.tsx:596 | "photo" / "photos" |
| settings.tsx:809 | "4 quick taps on game..." |
| settings.tsx:628 | "API key validated" |
| confirm-dialog.tsx:31 | "Confirm" / "Cancel" |

**Recommendation:** Move all strings to i18n.

- [ ] Audit all user-visible strings
- [ ] Add missing translation keys
- [ ] Update both en.ts and ru.ts
- [ ] Add linting rule to detect hardcoded strings

### 8.5 Potentially Dead Code
**Location:** Various files
**Problem:** Some functions and translations may be unused.

- [ ] Run coverage report to find unused code
- [ ] Check for unused translation keys
- [ ] Remove unused CSS classes
- [ ] Remove commented-out code
- [ ] Use `ts-prune` or similar tool for dead exports

### 8.6 Inconsistent Error Handling Patterns
**Location:** Multiple async functions
**Problem:** Some functions use try/catch, others use .catch(), some don't handle errors at all.
**Recommendation:** Standardize error handling.

- [ ] Create `Result<T, E>` type for error handling
- [ ] Standardize on try/catch for async/await
- [ ] Create error boundary component
- [ ] Add global error handler for unhandled rejections

---

## Summary Checklist

### High Priority (Performance & Stability)
- [ ] Add code splitting for routes
- [ ] Implement virtualized list for gallery
- [ ] Fix potential memory leaks in event listeners
- [ ] Add proper error handling to all async operations
- [ ] Implement parallel uploads with concurrency limit

### Medium Priority (Code Quality)
- [ ] Split oversized components into smaller modules
- [ ] Extract duplicated logic into shared hooks
- [ ] Replace magic numbers with named constants
- [ ] Add missing TypeScript types and remove `any`
- [ ] Move hardcoded strings to i18n

### Low Priority (Maintainability)
- [ ] Clean up unused imports and dead code
- [ ] Add memoization where beneficial
- [ ] Standardize error handling patterns
- [ ] Add debounce to settings sliders
- [ ] Improve folder structure organization
