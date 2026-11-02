/**
 * Shared display formatters. Every user-visible date or time goes through
 * here so it reads as 12-hour Asia/Manila wall time, regardless of the device
 * locale or timezone. Output has no seconds.
 */
const MANILA_TIME_ZONE = 'Asia/Manila';
const LOCALE = 'en-PH';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: MANILA_TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: MANILA_TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: MANILA_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(text: string): string {
  // Newer ICU puts a narrow no-break space before AM/PM.
  return text.replace(/[  ]/g, ' ');
}

/** "Nov 3, 2026, 3:45 PM" in Manila time, or `fallback` for an invalid value. */
export function formatDateTime(value: string | number | Date, fallback = ''): string {
  const date = toDate(value);
  return date ? normalize(dateTimeFormat.format(date)) : fallback;
}

/** "Nov 3, 2026" in Manila time, or `fallback` for an invalid value. */
export function formatDate(value: string | number | Date, fallback = ''): string {
  const date = toDate(value);
  return date ? normalize(dateFormat.format(date)) : fallback;
}

/** "3:45 PM" in Manila time, or `fallback` for an invalid value. */
export function formatTime(value: string | number | Date, fallback = ''): string {
  const date = toDate(value);
  return date ? normalize(timeFormat.format(date)) : fallback;
}

/** Formats a calendar day key ("2026-11-03") without shifting it across zones. */
export function formatDateKey(dateKey: string): string {
  return formatDate(`${dateKey}T00:00:00+08:00`, dateKey);
}
