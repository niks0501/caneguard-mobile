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
  type FieldGuideImage,
} from '@/features/field-guide/domain/fieldGuideTypes';

/** Every reading-text field on an entry, for the forbidden-pattern sweep. */
function readingText(entry: FieldGuideEntry): string[] {
  return [
    entry.id,
    entry.displayName,
    entry.shortName,
    entry.conditionLabel,
    ...(entry.scientificName ? [entry.scientificName] : []),
    entry.summary,
    ...entry.signs,
    entry.whereToLook,
    entry.impact,
    ...entry.prevention,
    ...entry.management,
    entry.detail,
    entry.guide.intro,
    ...entry.guide.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
    ...entry.images.map((image) => `${image.caption} ${image.subject}`),
  ];
}

/** The dropped field photos of one entry, identified by their folder path. */
function droppedPhotosFor(entryId: string): readonly FieldGuideImage[] {
  return (findFieldGuideEntry(entryId)?.images ?? []).filter((image) =>
    image.assetKey.includes('/'),
  );
}

/** Every dropped field photo in the launch set, in reading order. */
function droppedPhotos(): readonly FieldGuideImage[] {
  return fieldGuideEntries.flatMap((entry) => droppedPhotosFor(entry.id));
}

/** Every bundled photo key of one entry, in reading order. */
function photoKeysFor(entryId: string): string[] {
  return (findFieldGuideEntry(entryId)?.images ?? []).map((image) => image.assetKey);
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

  it('bundles the captain drop on all five entries, after the model reference photo', () => {
    // Every launch entry now ships at least one bundled photo, so the
    // description-only frame is no longer part of the launch state.
    for (const entry of fieldGuideEntries) {
      expect(entry.images.length).toBeGreaterThan(0);
      for (const image of entry.images) {
        // A bundled asset module is never a string; a string source would be a
        // Phase 2 downloaded file URI.
        expect(typeof image.source).not.toBe('string');
      }
    }

    // The drop is one healthy, one mosaic, one rust, two smut and two RSSI
    // photos, kept in the manifest's reading order.
    expect(droppedPhotos().map((image) => image.assetKey)).toEqual([
      'healthy/01-healthy.jpg',
      'mosaic/01-mosaic.jpg',
      'rust/01-rust.jpg',
      'smut/01-smut.jpg',
      'smut/02-smut.jpg',
      'rssi/01-rssi.jpg',
      'rssi/02-rssi.jpg',
    ]);
    expect(droppedPhotosFor('healthy')).toHaveLength(1);
    expect(droppedPhotosFor('mosaic')).toHaveLength(1);
    expect(droppedPhotosFor('rust')).toHaveLength(1);
    expect(droppedPhotosFor('smut')).toHaveLength(2);
    expect(droppedPhotosFor('rssi')).toHaveLength(2);

    // The three model reference photos stay exactly where Phase 1 wired them,
    // ahead of the drop, so the gallery only ever adds media.
    expect(photoKeysFor('healthy')).toEqual(['reference_healthy.jpg', 'healthy/01-healthy.jpg']);
    expect(photoKeysFor('mosaic')).toEqual(['reference_mosaic.jpg', 'mosaic/01-mosaic.jpg']);
    expect(photoKeysFor('rust')).toEqual(['reference_rust.jpg', 'rust/01-rust.jpg']);
    expect(photoKeysFor('smut')).toEqual(['smut/01-smut.jpg', 'smut/02-smut.jpg']);
    expect(photoKeysFor('rssi')).toEqual(['rssi/01-rssi.jpg', 'rssi/02-rssi.jpg']);
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
  // The interim drop's own vocabulary (see `assets/images/field-guide/README.md`):
  // a dropped file's status or licence wording must never reach reading copy.
  const PROVENANCE_WORDING =
    /\b(pending|licen[cs]e|licensing|provenance|manifest|attribution|watermark)\b/i;

  it('carries no dose, no formulation code, no brand marker, no named active and no provenance wording', () => {
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
        if (PROVENANCE_WORDING.test(text)) {
          violations.push(`${entry.id}: provenance wording in "${text}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('marks every launch entry for expert review in editorial metadata', () => {
    for (const entry of fieldGuideEntries) {
      expect(entry.editorial.validationStatus).toBe('pending-expert-review');
      expect(entry.editorial.reviewedAt).toBeNull();
      expect(entry.editorial.validationNote.length).toBeGreaterThan(0);
    }
  });

  it('gives every bundled photo a credit record that never invents a licence', () => {
    for (const entry of fieldGuideEntries) {
      for (const image of entry.images) {
        const credit = image.credit;
        expect(credit).toBeDefined();
        if (credit.recorded) {
          expect(credit.creator).not.toBeNull();
          expect(credit.licenseName).not.toBeNull();
          expect(credit.sourcePageUrl).not.toBeNull();
        } else {
          expect(credit.licenseName).toBeNull();
          expect(credit.sourcePageUrl).toBeNull();
        }
      }
    }
  });

  it('never emits RSSI as a model class score', () => {
    const serialized = JSON.stringify(fieldGuideEntries);
    expect(serialized).not.toMatch(/class_scores/i);
    expect(serialized).not.toMatch(/classScores/);
    expect(serialized).not.toMatch(/\[RSSI\]/);
  });
});
