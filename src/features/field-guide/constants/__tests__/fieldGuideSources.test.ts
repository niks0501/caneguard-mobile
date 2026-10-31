import {
  fieldGuideEntries,
  findFieldGuideEntry,
} from '@/features/field-guide/constants/fieldGuideEntries';
import {
  fieldGuideSources,
  findFieldGuideSource,
  sourcesForEntry,
} from '@/features/field-guide/constants/fieldGuideSources';
import type { FieldGuideEntry } from '@/features/field-guide/domain/fieldGuideTypes';

describe('field guide sources', () => {
  it('publishes only https sources and marks every missing document as awaiting supply', () => {
    const ids = fieldGuideSources.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const source of fieldGuideSources) {
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.supports.length).toBeGreaterThan(0);

      if (source.availability === 'published') {
        expect(source.url).toMatch(/^https:\/\//);
      } else {
        expect(source.url).toBeNull();
      }
    }
  });

  it('records the missing SRA documents as awaiting supply, never as dead links', () => {
    const missing = fieldGuideSources.filter((source) => source.availability === 'awaiting-supply');
    expect(missing.map((source) => source.id)).toEqual([
      'sra-booklet-smut',
      'sra-brochure-rssi-2025',
      'sra-brochure-rssi-2026',
    ]);
    for (const source of missing) {
      expect(source.url).toBeNull();
      expect(source.publisher).toMatch(/Sugar Regulatory Administration/);
    }
    expect(findFieldGuideSource('sra-booklet-smut')?.passage).toBe('pages 21-22');
  });

  it('resolves every source id an entry or a guide chapter cites', () => {
    for (const entry of fieldGuideEntries) {
      expect(entry.sourceIds.length).toBeGreaterThan(0);
      expect(sourcesForEntry(entry.sourceIds)).toHaveLength(entry.sourceIds.length);

      for (const section of entry.guide.sections) {
        expect(sourcesForEntry(section.sourceIds)).toHaveLength(section.sourceIds.length);
      }
    }
  });

  it('returns null for an unknown source id instead of inventing a citation', () => {
    expect(findFieldGuideSource('not-a-real-source')).toBeNull();
    expect(sourcesForEntry(['not-a-real-source'])).toEqual([]);
  });

  it('cites the local SRA sources on the pest entry and the booklet on smut', () => {
    const pest = findFieldGuideEntry('rssi');
    const smut = findFieldGuideEntry('smut');

    expect(pest?.sourceIds).toEqual(
      expect.arrayContaining(['sra-rssi-profile', 'sra-rssi-awareness', 'fpa-registered-products']),
    );
    expect(smut?.sourceIds).toEqual(expect.arrayContaining(['sra-booklet-smut']));
  });

  it('keeps rust at the model condition level without claiming a rust species', () => {
    const rust = findFieldGuideEntry('rust');
    expect(rust).not.toBeNull();
    expect(rust?.modelLabel).toBe('rust');
    expect(rust?.scientificName).toBeNull();
    expect(rust?.conditionLabel).toBe('Fungal disease');
    expect(rust?.category).toBe('disease');
  });

  it('keeps mosaic classified as a viral disease', () => {
    const mosaic = findFieldGuideEntry('mosaic');
    expect(mosaic).not.toBeNull();
    expect(mosaic?.conditionLabel).toBe('Viral disease');
    expect(mosaic?.category).toBe('disease');
  });

  it('keeps the healthy entry classified as a baseline, not a diagnosis', () => {
    const healthy = findFieldGuideEntry('healthy');
    expect(healthy).not.toBeNull();
    expect(healthy?.conditionLabel).toBe('Healthy baseline');
    expect(healthy?.category).toBe('healthy');
  });

  it('names smut and RSSI with their scientific names', () => {
    expect(findFieldGuideEntry('smut')?.scientificName).toBe('Sporisorium scitamineum');
    expect(findFieldGuideEntry('rssi')?.scientificName).toBe('Pulvinaria tenuivalata');
  });

  it('gives the pest entry no pesticide, active ingredient or dose', () => {
    const pest = findFieldGuideEntry('rssi') as FieldGuideEntry;
    const text = [pest.conditionLabel, ...pest.prevention, ...pest.management, pest.guide.intro]
      .join(' ')
      .toLowerCase();

    expect(text).not.toMatch(/\b\d+\s?(ml|kg|g|litre|liter|hectare|ha)\b/);
    expect(text).not.toMatch(/spray (this|with)/);
    expect(text).not.toMatch(/recommended dose|dosage/);
  });
});
