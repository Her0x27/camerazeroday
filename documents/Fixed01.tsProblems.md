# TypeScript Аудит проекта Camera ZeroDay

## 1. Дублирование и повторы

### 1.1 Дублирование вызовов trim()
**Местоположение:** `client/src/pages/camera.tsx`, строки 111 и 131
```typescript
note: currentNote.trim() ? currentNote.trim() : undefined,
```
**Проблема:** Метод `trim()` вызывается дважды для одной и той же строки.
**Решение:** Сохранить результат в переменную и использовать её.

### 1.2 Дублирование AlertDialog компонентов
**Местоположение:** 
- `client/src/pages/gallery.tsx` (строки 342-384)
- `client/src/pages/photo-detail.tsx` (строки 364-386)
- `client/src/pages/settings.tsx` (строки 334-372)

**Проблема:** Практически идентичный шаблон AlertDialog повторяется в 3 файлах с минимальными отличиями.
**Решение:** Создать переиспользуемый компонент `ConfirmDialog`.

### 1.3 Дублирование логики форматирования даты
**Местоположение:**
- `client/src/pages/gallery.tsx` функция `formatDate` (строки 98-125)
- `client/src/components/metadata-overlay.tsx` форматирование даты (строки 84-89, 123-134)

**Проблема:** Логика форматирования даты/времени повторяется в разных местах.
**Решение:** Создать утилитный модуль `lib/format-utils.ts` с функциями форматирования.

### 1.4 Дублирование интерфейса PhotoMetadata
**Местоположение:** `client/src/hooks/use-camera.ts`, строки 9-18
**Проблема:** Локальный интерфейс `PhotoMetadata` дублирует типы из `shared/schema.ts`.
**Решение:** Использовать типы из схемы напрямую или расширить существующие.

### 1.5 Дублирование formatBytes
**Местоположение:** `client/src/pages/settings.tsx`, строки 66-71
**Проблема:** Функция форматирования байт определена локально, хотя может понадобиться в других местах.
**Решение:** Вынести в `lib/format-utils.ts`.

---

## 2. Архитектура и структура

### 2.1 Встроенная логика воспроизведения звука
**Местоположение:** `client/src/pages/camera.tsx`, строки 139-158
**Проблема:** Логика создания и воспроизведения звука встроена прямо в обработчик захвата фото.
**Решение:** Создать хук `useCaptureSound` или утилиту `playSound`.

### 2.2 Пустые серверные файлы
**Местоположение:** 
- `server/routes.ts`
- `server/storage.ts`

**Проблема:** Файлы содержат минимальный код с комментариями. Для PWA это нормально, но файлы можно упростить.
**Решение:** Оставить как есть (это PWA) или удалить неиспользуемый код.

### 2.3 Отсутствие слоя абстракции для Device API
**Местоположение:** Хуки в `client/src/hooks/`
**Проблема:** Каждый хук напрямую работает с браузерными API без общего слоя абстракции.
**Решение:** Создать абстракцию `DeviceCapabilities` для проверки доступности API.

---

## 3. Производительность

### 3.1 Неэффективная загрузка последнего фото
**Местоположение:** `client/src/pages/camera.tsx`, строки 51-68
```typescript
const photos = await getAllPhotos("newest");
if (photos.length > 0) {
  setLastPhotoThumb(photos[0].thumbnailData);
}
```
**Проблема:** Загружаются ВСЕ фото только для получения первого thumbnail.
**Решение:** Создать функцию `getLatestPhoto()` в `db.ts`.

### 3.2 Загрузка всех фото для навигации
**Местоположение:** `client/src/pages/photo-detail.tsx`, строки 52-55
```typescript
const [loadedPhoto, photos] = await Promise.all([
  getPhoto(photoId),
  getAllPhotos("newest"),
]);
setAllPhotoIds(photos.map((p) => p.id));
```
**Проблема:** Загружаются все фото только для получения массива ID.
**Решение:** Создать функцию `getPhotoIds()` которая возвращает только ID без данных изображений.

### 3.3 Фильтрация в памяти вместо IndexedDB
**Местоположение:** `client/src/pages/gallery.tsx`, строки 44-49
```typescript
if (filter.hasLocation) {
  allPhotos = allPhotos.filter(p => p.metadata.latitude !== null);
}
```
**Проблема:** Фильтрация выполняется на стороне клиента после загрузки всех данных.
**Решение:** Использовать индексы IndexedDB для фильтрации на уровне базы данных.

### 3.4 Отсутствие React.memo для часто обновляемых компонентов
**Местоположение:**
- `client/src/components/metadata-overlay.tsx`
- `client/src/components/reticles.tsx`

**Проблема:** Компоненты MetadataOverlay и Reticle перерисовываются при каждом обновлении родителя.
**Решение:** Обернуть в `React.memo` с соответствующей функцией сравнения.

### 3.5 Отсутствие lazy loading для страниц
**Местоположение:** `client/src/App.tsx`, строки 8-12
```typescript
import CameraPage from "@/pages/camera";
import GalleryPage from "@/pages/gallery";
import PhotoDetailPage from "@/pages/photo-detail";
import SettingsPage from "@/pages/settings";
```
**Проблема:** Все страницы загружаются синхронно при старте приложения.
**Решение:** Использовать `React.lazy()` и `Suspense` для code splitting.

---

## 4. Типизация

### 4.1 Использование any для WebKit API
**Местоположение:** `client/src/pages/camera.tsx`, строка 141
```typescript
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
```
**Проблема:** Использование `any` для webkit префикса.
**Решение:** Создать типы для WebKit API или использовать type assertion.

### 4.2 Использование any для DeviceOrientation API
**Местоположение:** `client/src/hooks/use-orientation.ts`, строки 45-46, 67-68
```typescript
(event as any).webkitCompassHeading
(DeviceOrientationEvent as any).requestPermission
```
**Проблема:** Использование `any` для iOS-специфичных API.
**Решение:** Создать расширенные типы для DeviceOrientationEvent.

### 4.3 Дублирование типа PhotoMetadata
**Местоположение:** `client/src/hooks/use-camera.ts`, строки 9-18
**Проблема:** Локальный интерфейс дублирует `PhotoMetadata` из schema.ts.
**Решение:** Импортировать и использовать тип из схемы.

---

## 5. Обработка данных

### 5.1 Дублирование metadata в объекте photo
**Местоположение:** `client/src/pages/camera.tsx`, строки 104-132
```typescript
const result = await capturePhoto({
  latitude: geoData.latitude,
  // ... все поля metadata
});
// ...
const photo: InsertPhoto = {
  imageData: result.imageData,
  metadata: {
    latitude: geoData.latitude,
    // ... те же поля снова
  },
};
```
**Проблема:** Одни и те же данные передаются и в capturePhoto, и создаются заново в объекте photo.
**Решение:** Создать объект metadata один раз и переиспользовать.

### 5.2 Неоптимальный updatePhoto
**Местоположение:** `client/src/lib/db.ts`, строки 103-118
```typescript
export async function updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo | undefined> {
  const existing = await getPhoto(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  // ...put
}
```
**Проблема:** Два обращения к IndexedDB (get + put) вместо одного.
**Решение:** Использовать cursor для обновления на месте.

---

## 6. Асинхронность

### 6.1 Вызов startCamera без await
**Местоположение:** `client/src/pages/camera.tsx`, строки 71-73
```typescript
useEffect(() => {
  startCamera();
}, []);
```
**Проблема:** Асинхронная функция вызывается без ожидания и без обработки ошибок.
**Решение:** Добавить обработку ошибок или использовать startCamera().catch().

### 6.2 Race condition при смене камеры
**Местоположение:** `client/src/hooks/use-camera.ts`, строки 101-105
```typescript
useEffect(() => {
  if (isReady || isLoading) {
    startCamera();
  }
}, [currentFacing]);
```
**Проблема:** При быстрой смене камеры возможен race condition.
**Решение:** Добавить флаг отмены или использовать AbortController.

### 6.3 Оптимистичное обновление без отката
**Местоположение:** `client/src/lib/settings-context.tsx`, строки 36-44
```typescript
const updateSettings = useCallback(async (updates: Partial<Settings>) => {
  const newSettings = { ...settings, ...updates };
  setSettings(newSettings);
  try {
    await saveSettings(newSettings);
  } catch (error) {
    console.error("Failed to save settings:", error);
    // Откат не выполняется!
  }
}, [settings]);
```
**Проблема:** При ошибке сохранения состояние не откатывается.
**Решение:** Добавить откат к предыдущему состоянию при ошибке.

---

## 7. Импорты и бандл

### 7.1 Отсутствие code splitting
**Местоположение:** `client/src/App.tsx`
**Проблема:** Все страницы импортируются синхронно.
**Решение:** Использовать dynamic imports с React.lazy.

### 7.2 Множественные импорты иконок
**Местоположение:** Все файлы страниц
**Проблема:** Каждый файл импортирует множество иконок из lucide-react.
**Решение:** Tree-shaking работает корректно, но можно создать файл с реэкспортом часто используемых иконок.

---

## 8. Код-смеллы

### 8.1 Магические числа для времени
**Местоположение:** `client/src/pages/gallery.tsx`, строки 104, 112
```typescript
if (diff < 86400000) { // 24 часа
if (diff < 604800000) { // 7 дней
```
**Проблема:** Магические числа затрудняют понимание кода.
**Решение:** Создать константы `ONE_DAY_MS`, `ONE_WEEK_MS`.

### 8.2 Магические числа для звука
**Местоположение:** `client/src/pages/camera.tsx`, строки 148-151
```typescript
oscillator.frequency.value = 800;
gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
```
**Проблема:** Звуковые параметры заданы магическими числами.
**Решение:** Создать константы или конфигурацию звука.

### 8.3 Длинная функция drawMetadata
**Местоположение:** `client/src/hooks/use-camera.ts`, строки 107-201 (~95 строк)
**Проблема:** Функция слишком длинная и выполняет много задач.
**Решение:** Разбить на отдельные функции: drawCrosshair, drawGPSPanel, drawOrientationPanel, drawTimestamp, drawNote.

### 8.4 Устаревший метод substr
**Местоположение:** `client/src/lib/db.ts`, строка 46
```typescript
return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```
**Проблема:** Метод `substr` устарел.
**Решение:** Заменить на `substring`.

---

## Чек-лист задач для решения проблем

### Критические (влияют на производительность)
- [ ] Создать функцию `getLatestPhoto()` в db.ts для получения только последнего фото
- [ ] Создать функцию `getPhotoIds()` для получения только ID без данных изображений
- [ ] Добавить React.memo для MetadataOverlay и Reticle компонентов
- [ ] Реализовать lazy loading для страниц с React.lazy и Suspense

### Высокий приоритет (качество кода)
- [ ] Создать переиспользуемый компонент ConfirmDialog для AlertDialog
- [ ] Создать утилитный модуль `lib/format-utils.ts` с formatDate, formatBytes
- [ ] Исправить дублирование trim() вызовов в camera.tsx
- [ ] Создать хук или утилиту для воспроизведения звука
- [ ] Заменить локальный PhotoMetadata на тип из schema.ts

### Средний приоритет (типизация)
- [ ] Создать типы для WebKit Audio API
- [ ] Создать расширенные типы для DeviceOrientationEvent iOS API
- [ ] Заменить устаревший substr на substring в db.ts

### Низкий приоритет (рефакторинг)
- [ ] Разбить функцию drawMetadata на отдельные функции
- [ ] Создать константы для магических чисел времени (ONE_DAY_MS, ONE_WEEK_MS)
- [ ] Создать константы для параметров звука захвата
- [ ] Добавить откат состояния при ошибке в updateSettings
- [ ] Оптимизировать updatePhoto для использования cursor
- [ ] Создать единый объект metadata в camera.tsx вместо дублирования
- [ ] Добавить обработку ошибок для startCamera в useEffect

### Улучшения архитектуры (опционально)
- [ ] Создать абстракцию DeviceCapabilities для проверки доступности API
- [ ] Использовать индексы IndexedDB для фильтрации в gallery
- [ ] Добавить AbortController для предотвращения race condition при смене камеры
