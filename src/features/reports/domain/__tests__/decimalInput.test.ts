import { formatDecimalInput, parseDecimalInput } from '@/features/reports/domain/decimalInput';

describe('parseDecimalInput', () => {
  it('parses a plain integer', () => {
    expect(parseDecimalInput('30')).toBe(30);
  });

  it('parses a dot decimal separator', () => {
    expect(parseDecimalInput('0.5')).toBe(0.5);
  });

  it('parses a comma decimal separator', () => {
    expect(parseDecimalInput('0,5')).toBe(0.5);
  });

  it('trims surrounding whitespace', () => {
    expect(parseDecimalInput('  2.5  ')).toBe(2.5);
  });

  it('returns null for an empty value', () => {
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('   ')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('0.5.3')).toBeNull();
    expect(parseDecimalInput('1,234.5')).toBeNull();
    expect(parseDecimalInput('-')).toBeNull();
  });

  it('rejects non-finite input', () => {
    expect(parseDecimalInput('NaN')).toBeNull();
    expect(parseDecimalInput('Infinity')).toBeNull();
  });
});

describe('formatDecimalInput', () => {
  it('round-trips a stored decimal into an editable string', () => {
    expect(formatDecimalInput(0.5)).toBe('0.5');
    expect(formatDecimalInput(30)).toBe('30');
  });
});
