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

/** The captain's verified links, exactly as supplied. Nothing else is published. */
const VERIFIED_SOURCE_URLS = [
  'https://www.sra.gov.ph/article/red-striped-soft-scale-insect-rssi-in-sugarcane-pest-profile-and-pest-management-recommendation/HLNwOhbTgYVglRl',
  'https://www.sra.gov.ph/article/sra-awareness-campaign-on-red-striped-soft-scale-insect-rssi/pV352Fkalf1FVkv',
  'https://www.lsuagcenter.com/profiles/lblack/articles/page1485980431119',
  'https://sugarresearch.com.au/diseases/rusts/',
  'https://sugarresearch.com.au/wp-content/uploads/2025/04/Mosaic_2022.pdf',
  'https://fpa.da.gov.ph/resources/reports/registered-products/',
];

function guideText(entry: FieldGuideEntry): string {
  return [entry.guide.intro, ...entry.guide.sections.flatMap((section) => section.paragraphs)].join(
    '\n',
  );
}

describe('field guide sources', () => {
  it('publishes exactly the verified links and nothing invented', () => {
    const published = fieldGuideSources.filter((source) => source.availability === 'published');
    expect(published.map((source) => source.url)).toEqual(VERIFIED_SOURCE_URLS);
    for (const source of published) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.supports.length).toBeGreaterThan(0);
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
  });

  it('cites the local SRA sources on the pest entry and the booklet on smut', () => {
    const pest = findFieldGuideEntry('rssi');
    const smut = findFieldGuideEntry('smut');

    expect(pest?.sourceIds).toEqual(
      expect.arrayContaining(['sra-rssi-profile', 'sra-rssi-awareness', 'fpa-registered-products']),
    );
    expect(smut?.sourceIds).toEqual(expect.arrayContaining(['sra-booklet-smut']));
  });

  it('states on the rust entry that the app does not distinguish rust species', () => {
    const rust = findFieldGuideEntry('rust');
    expect(rust).not.toBeNull();
    expect(rust?.modelLabel).toBe('rust');
    expect(rust?.scientificName).toBeNull();
    expect(guideText(rust as FieldGuideEntry)).toMatch(
      /does not identify brown rust or orange rust/i,
    );
    expect(guideText(rust as FieldGuideEntry)).toMatch(/app reports rust as one condition/i);
  });

  it('keeps mosaic viral and free of a curative-chemical claim', () => {
    const mosaic = findFieldGuideEntry('mosaic');
    expect(mosaic).not.toBeNull();
    expect(mosaic?.conditionLabel).toBe('Viral disease');
    expect(guideText(mosaic as FieldGuideEntry)).toMatch(/no spray that cures/i);
    expect(guideText(mosaic as FieldGuideEntry)).toMatch(
      /insecticides are not a reliable way to stop aphid transmission/i,
    );
  });

  it('keeps the healthy entry honest about what a healthy result can prove', () => {
    const healthy = findFieldGuideEntry('healthy');
    expect(healthy).not.toBeNull();
    expect(healthy?.conditionLabel).toBe('Healthy baseline');
    expect(guideText(healthy as FieldGuideEntry)).toMatch(/cannot certify a plant as disease-free/i);
    expect(guideText(healthy as FieldGuideEntry)).toMatch(/not a laboratory test/i);
  });

  it('names smut and RSSI with their scientific names and keeps RSSI provisional', () => {
    expect(findFieldGuideEntry('smut')?.scientificName).toBe('Sporisorium scitamineum');
    expect(findFieldGuideEntry('rssi')?.scientificName).toBe('Pulvinaria tenuivalvata');
    expect(guideText(findFieldGuideEntry('rssi') as FieldGuideEntry)).toMatch(
      /treat the name as provisional/i,
    );
  });

  it('gives the pest entry no pesticide, active ingredient or dose', () => {
    const pest = findFieldGuideEntry('rssi') as FieldGuideEntry;
    const text = [pest.conditionLabel, ...pest.prevention, ...pest.management, guideText(pest)]
      .join(' ')
      .toLowerCase();

    expect(text).not.toMatch(/\b\d+\s?(ml|kg|g|litre|liter|hectare|ha)\b/);
    expect(text).not.toMatch(/spray (this|with)/);
    expect(text).not.toMatch(/recommended dose|dosage/);
    expect(text).toMatch(/no pesticide name, no active ingredient and no dose/i);
  });
});
