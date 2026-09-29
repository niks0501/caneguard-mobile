import type { Breadcrumb, Event } from '@sentry/react-native';

/**
 * Crash telemetry must never carry field data. This module removes farmer
 * names, GPS fixes, photo URIs, and credentials from a Sentry payload before
 * the SDK sends it.
 *
 * Two rules keep the guarantee auditable:
 * - Keys that hold field data or credentials are deleted outright.
 * - Free text is redacted where it looks like a device file reference, an
 *   image path, a URL query string, or a coordinate pair.
 *
 * Console breadcrumbs are dropped instead of redacted because their content is
 * arbitrary app output that cannot be scrubbed reliably.
 */

/** Marker that replaces any removed or redacted value. */
export const REDACTED = '[redacted]';

/** Breadcrumb categories that carry arbitrary app output. */
const DROPPED_BREADCRUMB_CATEGORIES = new Set(['console']);

/**
 * Field-data and credential keys, matched against the whole key name.
 * `name` is deliberately absent so harmless device and OS context survives.
 */
const SENSITIVE_KEY_PATTERN = new RegExp(
  '^(?:' +
    [
      'farmer',
      'farmer_?name',
      'farmer_?or_?farm_?owner_?name',
      'farm_?owner_?name',
      'grower',
      'grower_?name',
      'submitter_?name',
      'full_?name',
      'first_?name',
      'last_?name',
      'surname',
      'display_?name',
      'gps',
      'gps_?accuracy',
      'position',
      'coordinates?',
      'coords?',
      'latitude',
      'longitude',
      'lat',
      'lng',
      'lon',
      'altitude',
      'accuracy',
      'location',
      'address',
      'phone',
      'phone_?number',
      'email',
      'photo',
      'photo_?uri',
      'image',
      'image_?uri',
      'thumbnail',
      'attachment',
      'attachments',
      'notes?',
      'remarks?',
      'comments?',
      'description',
      'observations?',
      'token',
      'access_?token',
      'refresh_?token',
      'auth_?token',
      'password',
      'otp',
      'pin',
      'secret',
      'api_?key',
      'authorization',
      'cookie',
    ].join('|') +
    ')$',
  'i',
);

/** Any key ending in `uri` names a device resource. */
const RESOURCE_URI_KEY_PATTERN = /uri$/i;

/** Keys whose string values are URLs, so only origin, path, and host survive. */
const URL_VALUE_KEYS = new Set([
  'url',
  'href',
  'to',
  'from',
  'referrer',
  'target',
]);

/** A string that is nothing but a device resource reference. */
const RESOURCE_URI_PATTERN = /^(?:file|content|ph|assets-library|blob|data):/i;

const INLINE_RESOURCE_URI_PATTERN =
  /(?:file|content|assets-library):\/\/\S+|ph:\/\/\S+|blob:[^\s]+/gi;

const INLINE_DATA_URI_PATTERN = /data:[a-z]+\/[\w.+-]*;base64,\S+/gi;

/** Any absolute http(s) URL inside free text, so its query string can be dropped. */
const INLINE_URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

const IMAGE_FILE_PATTERN = /\S+\.(?:jpe?g|png|webp|gif|heic|heif|bmp|tiff?)\b/gi;

const COORDINATE_PAIR_PATTERN = /-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/g;

/** Depth cap so a deep or cyclic payload can never stall the reporter. */
const MAX_SCRUB_DEPTH = 10;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function replaceNonUrlFieldData(value: string): string {
  return value
    .replace(INLINE_RESOURCE_URI_PATTERN, REDACTED)
    .replace(INLINE_DATA_URI_PATTERN, REDACTED)
    .replace(IMAGE_FILE_PATTERN, REDACTED)
    .replace(COORDINATE_PAIR_PATTERN, REDACTED);
}

/**
 * Removes device file references, image paths, coordinate pairs, and URL query
 * strings from free text. A name embedded in a sentence cannot be detected,
 * which is why field-data keys are deleted rather than scrubbed.
 */
export function redactFieldDataText(value: string): string {
  if (!value) {
    return value;
  }
  if (RESOURCE_URI_PATTERN.test(value.trim())) {
    return REDACTED;
  }
  return replaceNonUrlFieldData(value).replace(INLINE_URL_PATTERN, (match) =>
    redactUrlQuery(match),
  );
}

/** Drops query and fragment from a URL so identifiers in a query string cannot leak. */
export function redactUrlQuery(value: string): string {
  const trimmed = value.trim();
  if (RESOURCE_URI_PATTERN.test(trimmed)) {
    return REDACTED;
  }
  try {
    const url = new URL(trimmed);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    // Not an absolute URL: keep the path-like head and scrub the rest as text.
    return replaceNonUrlFieldData(trimmed.split(/[?#]/)[0] ?? trimmed);
  }
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key) || RESOURCE_URI_KEY_PATTERN.test(key);
}

function scrubValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactFieldDataText(value);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_SCRUB_DEPTH || seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1, seen));
  }
  if (!isPlainObject(value)) {
    // A class instance can hide arbitrary state, including field data.
    return REDACTED;
  }

  const scrubbed: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      continue;
    }
    if (typeof nested === 'string' && URL_VALUE_KEYS.has(key.toLowerCase())) {
      scrubbed[key] = redactUrlQuery(nested);
      continue;
    }
    scrubbed[key] = scrubValue(nested, depth + 1, seen);
  }
  return scrubbed;
}

/** Recursively scrubs a plain record so it can be assigned back to a Sentry payload. */
export function scrubSentryData<T>(value: T): T {
  return scrubValue(value, 0, new WeakSet()) as T;
}

/**
 * Scrubs one breadcrumb. Returns `null` when the whole breadcrumb must be
 * dropped, which is how the `beforeBreadcrumb` hook signals removal.
 */
export function scrubSentryBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
  const category = (breadcrumb.category ?? breadcrumb.type ?? '').toLowerCase();
  if (DROPPED_BREADCRUMB_CATEGORIES.has(category)) {
    return null;
  }

  const scrubbed: Breadcrumb = { ...breadcrumb };
  if (typeof scrubbed.message === 'string') {
    scrubbed.message = redactFieldDataText(scrubbed.message);
  }
  if (scrubbed.data) {
    scrubbed.data = scrubSentryData(scrubbed.data);
  }
  return scrubbed;
}

/**
 * Scrubs an event before it is sent. Identity is never attached, and request
 * data is dropped entirely because headers and query strings can carry
 * credentials and photo URIs. The generic keeps the concrete Sentry event type
 * so the function can be passed straight to `beforeSend`.
 */
export function scrubSentryEvent<T extends Event>(event: T): T {
  const target: Event = event;

  delete target.user;
  delete target.request;

  if (target.extra) {
    target.extra = scrubSentryData(target.extra);
  }
  if (target.contexts) {
    target.contexts = scrubSentryData(target.contexts);
  }
  if (target.tags) {
    target.tags = scrubSentryData(target.tags);
  }
  if (target.breadcrumbs) {
    target.breadcrumbs = target.breadcrumbs
      .map((breadcrumb) => scrubSentryBreadcrumb(breadcrumb))
      .filter((breadcrumb): breadcrumb is Breadcrumb => breadcrumb !== null);
  }
  if (typeof target.message === 'string') {
    target.message = redactFieldDataText(target.message);
  }
  if (target.logentry && typeof target.logentry.message === 'string') {
    target.logentry.message = redactFieldDataText(target.logentry.message);
  }
  for (const exception of target.exception?.values ?? []) {
    if (typeof exception.value === 'string') {
      exception.value = redactFieldDataText(exception.value);
    }
  }
  return event;
}
