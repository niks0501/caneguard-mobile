import { FARMER_COPY } from '@/constants/copy';

function collectStrings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      collectStrings(child, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

const BANNED: Record<'en' | 'tl', RegExp> = {
  en: /\b(validated?|confirm(ed|s)?|resolved?|diagnos(is|es|ed))\b/i,
  tl: /(napatunayan|pinatunayan|nakumpirma|kumpirmado|kinumpirma|nalutas|naresolba|resolbado|diagnosis|diyagnosis|diagnos)/i,
};

describe('FARMER_COPY', () => {
  it('has identical keys in en and tl', () => {
    const keys = (lang: 'en' | 'tl') => collectStrings(FARMER_COPY[lang]).map(([k]) => k).sort();
    expect(keys('tl')).toEqual(keys('en'));
  });

  it('has no empty strings', () => {
    for (const lang of ['en', 'tl'] as const) {
      for (const [path, text] of collectStrings(FARMER_COPY[lang])) {
        expect([lang, path, text.trim().length > 0]).toEqual([lang, path, true]);
      }
    }
  });

  it.each(['en', 'tl'] as const)('contains no banned words in %s', (lang) => {
    for (const [path, text] of collectStrings(FARMER_COPY[lang])) {
      expect([path, BANNED[lang].test(text)]).toEqual([path, false]);
    }
  });
});
