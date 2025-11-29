type DateFormatStyle = "short" | "long" | "withTime" | "timeOnly" | "relative";

const localeMap: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
};

export function formatDate(
  date: Date | number,
  style: DateFormatStyle = "withTime",
  locale: string = "en"
): string {
  const dateObj = typeof date === "number" ? new Date(date) : date;
  const resolvedLocale = localeMap[locale] || localeMap.en;

  switch (style) {
    case "short":
      return dateObj.toLocaleDateString(resolvedLocale, {
        day: "numeric",
        month: "short",
      });

    case "long":
      return dateObj.toLocaleDateString(resolvedLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    case "withTime":
      return dateObj.toLocaleDateString(resolvedLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    case "timeOnly":
      return dateObj.toLocaleTimeString(resolvedLocale, {
        hour: "2-digit",
        minute: "2-digit",
      });

    case "relative":
      return getRelativeTimeString(dateObj, resolvedLocale);

    default:
      return dateObj.toLocaleDateString(resolvedLocale);
  }
}

function getRelativeTimeString(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDay > 7) {
    return formatDate(date, "short", locale.split("-")[0]);
  } else if (diffDay >= 1) {
    return rtf.format(-diffDay, "day");
  } else if (diffHour >= 1) {
    return rtf.format(-diffHour, "hour");
  } else if (diffMin >= 1) {
    return rtf.format(-diffMin, "minute");
  } else {
    return rtf.format(-diffSec, "second");
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function formatDegrees(degrees: number, precision: number = 1): string {
  return `${degrees.toFixed(precision)}°`;
}

export function formatMeters(meters: number, precision: number = 1): string {
  if (meters < 1000) {
    return `${meters.toFixed(precision)} m`;
  }
  return `${(meters / 1000).toFixed(precision)} km`;
}
