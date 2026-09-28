import fs from 'fs';
import path from 'path';

/**
 * Every `expo-image` render in the app must state its cache policy.
 *
 * The library default is `'disk'`, which re-reads and re-decodes the file on
 * every mount. Scan images are stored at camera resolution, so a list that
 * scrolls a row out and back paid the full decode again. `'memory-disk'` keeps
 * the decoded frame for the session and still falls back to disk.
 *
 * This is a source guard rather than a render assertion because the requirement
 * is "no image render is left on the default", which includes new screens that
 * no current test mounts.
 */
describe('expo-image cache policy guard', () => {
  const sourceRoot = path.resolve(__dirname, '../..');

  function walk(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return entry.name === '__tests__' ? [] : walk(entryPath);
      }
      return entry.name.endsWith('.tsx') ? [entryPath] : [];
    });
  }

  it('sets cachePolicy on every <ExpoImage> element', () => {
    const violations: string[] = [];

    for (const filePath of walk(sourceRoot)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (!line.includes('<ExpoImage')) {
          return;
        }

        // Collect the whole opening element, which may span several lines.
        let element = line;
        let cursor = index;
        while (!element.includes('/>') && !element.includes('>') && cursor < lines.length - 1) {
          cursor += 1;
          element += `\n${lines[cursor]}`;
        }

        if (!element.includes('cachePolicy=')) {
          violations.push(
            `${path.relative(sourceRoot, filePath)}:${index + 1}`,
          );
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
