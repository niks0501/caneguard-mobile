import fs from 'fs';
import path from 'path';

/**
 * Static regression guard for the field guide's open reading surface.
 *
 * A route's protection cannot be seen in the route file itself: in Expo Router
 * `Stack.Protected` gates only the screens declared inside it, and any route
 * left out of the declarations is appended to the navigator unconditionally.
 * So the gallery must be *declared* outside both sign-in groups on purpose, and
 * its screens must not reach for a session.
 */
const appDir = path.resolve(__dirname, '..');
const layout = fs.readFileSync(path.join(appDir, '_layout.tsx'), 'utf8');

const GALLERY_ROUTE_FILES = ['field-guide/index.tsx', 'field-guide/[entryId].tsx'];
const GALLERY_SCREEN_NAMES = ['field-guide/index', 'field-guide/[entryId]'];

/** Every `<Stack.Protected ...>...</Stack.Protected>` span, as character ranges. */
function protectedSpans(source: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  const openTag = /<Stack\.Protected\b/g;
  let match = openTag.exec(source);

  while (match) {
    const start = match.index;
    const closeIndex = source.indexOf('</Stack.Protected>', start);
    if (closeIndex === -1) {
      throw new Error('Unbalanced Stack.Protected block in src/app/_layout.tsx');
    }
    spans.push({ start, end: closeIndex });
    openTag.lastIndex = closeIndex + '</Stack.Protected>'.length;
    match = openTag.exec(source);
  }

  return spans;
}

describe('field guide routing guard', () => {
  it('declares both gallery routes outside every Stack.Protected sign-in group', () => {
    const spans = protectedSpans(layout);
    expect(spans.length).toBeGreaterThanOrEqual(2);

    for (const screenName of GALLERY_SCREEN_NAMES) {
      const declaration = new RegExp(`<Stack\\.Screen name="${screenName.replace(/[[\]]/g, '\\$&')}"`);
      const declarationIndex = layout.search(declaration);
      expect(declarationIndex).toBeGreaterThan(-1);

      const insideProtected = spans.some(
        (span) => declarationIndex > span.start && declarationIndex < span.end,
      );
      expect(insideProtected).toBe(false);
    }
  });

  it('retires the old disease-reference route completely', () => {
    expect(fs.existsSync(path.join(appDir, 'disease-reference.tsx'))).toBe(false);
    expect(layout).not.toMatch(/name="disease-reference"/);
    expect(layout).not.toMatch(/name="field-guide"/);

    const sources = walk(appDir).filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`));
    const offenders = sources.filter((file) =>
      fs.readFileSync(file, 'utf8').includes('/disease-reference'),
    );
    expect(offenders.map((file) => path.relative(appDir, file))).toEqual([]);
  });

  it('keeps the gallery screens free of any session dependency', () => {
    for (const routeFile of GALLERY_ROUTE_FILES) {
      const source = fs.readFileSync(path.join(appDir, routeFile), 'utf8');
      expect(source).not.toMatch(/useAuth/);
      expect(source).not.toMatch(/useSession/);
      expect(source).not.toMatch(/tokenStore/);
      expect(source).not.toMatch(/Authorization/i);
    }
  });
});

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        results.push(...walk(fullPath));
      }
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}
