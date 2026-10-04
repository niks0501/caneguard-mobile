import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import {
  FIELD_GUIDE_PEST_ENTRY_ID,
  fieldGuideEntries,
  fieldGuideEntriesForCategory,
  findFieldGuideEntry,
  modelLinkedFieldGuideEntries,
} from '@/features/field-guide/constants/fieldGuideEntries';
import {
  FIELD_GUIDE_LAUNCH_ENTRY_IDS,
  type FieldGuideEntry,
} from '@/features/field-guide/domain/fieldGuideTypes';

/** Every reading-text field on an entry, for the forbidden-pattern sweep. */
function readingText(entry: FieldGuideEntry): string[] {
  return [
    entry.id,
    entry.displayName,
    entry.shortName,
    entry.summary,
    ...entry.signs,
    entry.whereToLook,
    entry.impact,
    ...entry.management,
    entry.detail,
    ...entry.images.map((image) => `${image.caption} ${image.subject}`),
  ];
}

describe('field guide entry data', () => {
  it('defines the launch set exactly: five entries, unique ids, url-safe shape', () => {
    expect(fieldGuideEntries.map((entry) => entry.id)).toEqual([
      ...FIELD_GUIDE_LAUNCH_ENTRY_IDS,
    ]);
    expect(FIELD_GUIDE_LAUNCH_ENTRY_IDS).toHaveLength(5);

    const ids = fieldGuideEntries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('fills every reading field and keeps the model/detectability invariants', () => {
    for (const entry of fieldGuideEntries) {
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.shortName.length).toBeGreaterThan(0);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.whereToLook.length).toBeGreaterThan(0);
      expect(entry.impact.length).toBeGreaterThan(0);
      expect(entry.detail.length).toBeGreaterThan(0);
      expect(entry.signs.length).toBeGreaterThanOrEqual(3);
      expect(entry.management.length).toBeGreaterThanOrEqual(3);

      // Content revision exists from day one so Phase 2 can merge on it.
      expect(entry.contentVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.updatedAt).toBeNull();

      for (const image of entry.images) {
        // Provenance is a manifest key and must never be rendered as copy.
        expect(image.assetKey).not.toMatch(/ /);
        expect(image.caption.length).toBeGreaterThan(0);
      }

      // The app may only claim a condition the model can actually produce.
      if (entry.detectableByApp) {
        expect(entry.modelLabel).not.toBeNull();
      }
      if (entry.modelLabel !== null) {
        expect(MODEL_LABELS).toContain(entry.modelLabel);
      }
      // A pest is never a model label, so it can never be app-detectable.
      if (entry.category === 'pest') {
        expect(entry.detectableByApp).toBe(false);
        expect(entry.modelLabel).toBeNull();
      }
    }
  });

  it('projects one entry per model label so the catalog and the gallery cannot drift', () => {
    const projected = modelLinkedFieldGuideEntries().map((entry) => entry.modelLabel);
    expect(projected).toEqual([...MODEL_LABELS]);
    expect(fieldGuideEntriesForCategory('pest')).toHaveLength(1);
    expect(fieldGuideEntriesForCategory('healthy')).toHaveLength(1);
    expect(fieldGuideEntriesForCategory('disease')).toHaveLength(3);
  });

  it('keeps RSSI out of the model class catalog', () => {
    expect(Object.keys(diseaseCatalog)).toEqual(MODEL_LABELS);
    expect(diseaseCatalog).not.toHaveProperty(FIELD_GUIDE_PEST_ENTRY_ID);
    expect(MODEL_LABELS).not.toContain(FIELD_GUIDE_PEST_ENTRY_ID);
  });

  it('bundles a photo for exactly the classes that already ship one', () => {
    const withPhotos = fieldGuideEntries
      .filter((entry) => entry.images.length > 0)
      .map((entry) => entry.id);
    expect(withPhotos).toEqual(['healthy', 'mosaic', 'rust']);
    // Smut and RSSI render the description-only frame until photos land.
    expect(findFieldGuideEntry('smut')?.images).toEqual([]);
    expect(findFieldGuideEntry('rssi')?.images).toEqual([]);
  });

  it('returns null for an unknown id instead of throwing', () => {
    expect(findFieldGuideEntry('not-a-real-entry')).toBeNull();
    expect(findFieldGuideEntry(undefined)).toBeNull();
    expect(findFieldGuideEntry('rust')?.id).toBe('rust');
  });
});

describe('field guide safety rules over the entry data', () => {
  const DOSAGE_UNIT = /\b\d+(\.\d+)?\s?(kg|g|mL|L|ha)\b/i;
  const FORMULATION_CODE = /\b\d+\s?(EC|WP|SC|WG|SL)\b/;
  const BRAND_MARKER = /[®™]/;
  const NAMED_ACTIVE =
    /\b(imidacloprid|thiamethoxam|chlorantraniliprole|fipronil|lambda-cyhalothrin|deltamethrin|malathion|dimethoate|cartap|buprofezin|dinotefuran|sulfoxaflor|acephate|glyphosate|paraquat|atrazine|chlorpyrifos|profenofos|bifenthrin|cypermethrin|abamectin)\b/i;

  it('carries no dose, no formulation code, no brand marker and no named active', () => {
    const violations: string[] = [];

    for (const entry of fieldGuideEntries) {
      for (const text of readingText(entry)) {
        if (DOSAGE_UNIT.test(text)) {
          violations.push(`${entry.id}: dosage unit in "${text}"`);
        }
        if (FORMULATION_CODE.test(text)) {
          violations.push(`${entry.id}: formulation code in "${text}"`);
        }
        if (BRAND_MARKER.test(text)) {
          violations.push(`${entry.id}: brand marker in "${text}"`);
        }
        if (NAMED_ACTIVE.test(text)) {
          violations.push(`${entry.id}: named active in "${text}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('never emits RSSI as a model class score', () => {
    const serialized = JSON.stringify(fieldGuideEntries);
    expect(serialized).not.toMatch(/class_scores/i);
    expect(serialized).not.toMatch(/classScores/);
    expect(serialized).not.toMatch(/\[RSSI\]/);
  });

  it('refers the treatment decision to the office on the pest entry', () => {
    // R5 = A: the treatment decision belongs with the office, not the page.
    const pest = findFieldGuideEntry('rssi');
    expect(pest).not.toBeNull();
    expect(pest?.management.join(' ')).toMatch(/ask the office before any chemical treatment/i);
  });
});
