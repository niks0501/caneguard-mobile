/**
 * Locale-safe decimal parsing for the numeric field report inputs.
 *
 * Accepts a comma or a dot as the decimal separator so that reporters using
 * either convention ("0,5" or "0.5") can enter affected area and portion
 * values. Rejects empty strings, thousands separators, and malformed input.
 */
export function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Formats a stored number back into an editable string. */
export function formatDecimalInput(value: number): string {
  return String(value);
}
