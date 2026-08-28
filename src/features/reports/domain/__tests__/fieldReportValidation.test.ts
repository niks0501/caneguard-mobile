import { StorageError } from '@/database/errors';
import type {
  FieldReport,
  FieldReportSubmissionEvidence,
} from '@/features/reports/domain/fieldReportTypes';
import {
  getMissingSubmissionRequirements,
  normalizeFieldReportDraftInput,
  normalizeFinalizeFieldReportInput,
  validateCreateFieldReportDraftInput,
} from '@/features/reports/domain/fieldReportValidation';

const NOW = '2026-08-10T03:00:00.000Z';

function draft(overrides: Partial<FieldReport> = {}): FieldReport {
  return {
    authorityReview: null,
    id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
    scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    authoringState: 'draft',
    farmerOrFarmOwnerName: 'Maria Santos',
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: 'Wawa',
    affectedAreaHectares: 0.5,
    affectedPortionPercent: 30,
    sugarcaneVariety: null,
    cropAge: null,
    caneClass: null,
    fieldNotes: null,
    mismatchReported: null,
    reporterObservationText: null,
    reporterSuspectedCondition: null,
    finalLatitude: 14.0667,
    finalLongitude: 120.6319,
    locationSource: 'gps',
    gpsAccuracy: 4.2,
    lastSyncAttemptAt: null,
    lastSyncErrorCode: null,
    lastSyncedAt: null,
    gpsAttemptLatitude: 14.0667,
    gpsAttemptLongitude: 120.6319,
    gpsAttemptAccuracy: 4.2,
    gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
    gpsCaptureOutcome: 'resolved',
    gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
    manualLocationSelectedAt: null,
    observedAt: '2026-07-25T05:30:00.000Z',
    remoteId: null,
    submittedAt: null,
    submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    submitterRole: 'field_reporter',
    syncAttemptCount: 0,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
    ...overrides,
  };
}

function evidence(): FieldReportSubmissionEvidence {
  return {
    checklistConsistency: 'consistent',
    classScores: [
      { label: 'healthy', score: 0.1 },
      { label: 'mosaic', score: 0.1 },
      { label: 'rust', score: 0.8 },
    ],
    confidence: 0.8,
    managedImageUri: 'file:///caneguard/scan-images/scan.jpg',
    managedImageAvailable: true,
    predictedLabel: 'rust',
    sourceHeight: 900,
    sourceWidth: 1200,
    submissionImageAvailable: true,
    submissionImageMimeType: 'image/jpeg',
    submissionImageSizeBytes: 4096,
    submissionImageUri: 'file:///caneguard/scan-images/scan.jpg',
  };
}

describe('normalizeFieldReportDraftInput', () => {
  it('normalizes and trims the optional detail texts', () => {
    const values = normalizeFieldReportDraftInput({
      sugarcaneVariety: '  Phil 2000 ',
      cropAge: ' ~3 months ',
      caneClass: 'Plant cane ',
      fieldNotes: '  near the river ',
      updatedAt: NOW,
    });

    expect(values).toEqual({
      sugarcaneVariety: 'Phil 2000',
      cropAge: '~3 months',
      caneClass: 'Plant cane',
      fieldNotes: 'near the river',
      updatedAt: NOW,
    });
  });

  it('rejects field notes longer than the intentionally stricter 120-character mobile limit', () => {
    expect(() =>
      normalizeFieldReportDraftInput({
        fieldNotes: 'x'.repeat(121),
        updatedAt: NOW,
      }),
    ).toThrow(
      expect.objectContaining<Partial<StorageError>>({
        code: 'INVALID_FIELD_REPORT',
      }),
    );
  });

  it.each(['sugarcaneVariety', 'cropAge', 'caneClass'] as const)(
    'enforces the v1-safe 100-character limit for %s',
    (field) => {
      expect(() =>
        normalizeFieldReportDraftInput({
          [field]: 'x'.repeat(101),
          updatedAt: NOW,
        }),
      ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    },
  );

  it('normalizes mismatch observations with independent length and boolean validation', () => {
    expect(
      normalizeFieldReportDraftInput({
        mismatchReported: true,
        reporterSuspectedCondition: '  Local condition  ',
        reporterObservationText: '  The visible symptoms differ.  ',
        updatedAt: NOW,
      }),
    ).toMatchObject({
      mismatchReported: true,
      reporterSuspectedCondition: 'Local condition',
      reporterObservationText: 'The visible symptoms differ.',
    });
    expect(
      normalizeFieldReportDraftInput({ mismatchReported: false, updatedAt: NOW }),
    ).toMatchObject({ mismatchReported: false });
    expect(() =>
      normalizeFieldReportDraftInput({
        mismatchReported: 'yes' as unknown as boolean,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        reporterSuspectedCondition: 'x'.repeat(121),
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        reporterObservationText: 'x'.repeat(1_001),
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
  });

  it('validates the affected area range and portion range', () => {
    expect(
      normalizeFieldReportDraftInput({
        affectedAreaHectares: 0.25,
        affectedPortionPercent: 100,
        updatedAt: NOW,
      }),
    ).toMatchObject({
      affectedAreaHectares: 0.25,
      affectedPortionPercent: 100,
    });

    expect(() =>
      normalizeFieldReportDraftInput({
        affectedAreaHectares: 0,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        affectedAreaHectares: 10_001,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        affectedAreaHectares: Number.NaN,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        affectedPortionPercent: -1,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFieldReportDraftInput({
        affectedPortionPercent: 101,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
  });

  it('clears stored numbers with an explicit null and omits undefined', () => {
    const cleared = normalizeFieldReportDraftInput({
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      updatedAt: NOW,
    });
    expect(cleared.affectedAreaHectares).toBeNull();
    expect(cleared.affectedPortionPercent).toBeNull();

    const untouched = normalizeFieldReportDraftInput({ updatedAt: NOW });
    expect('affectedAreaHectares' in untouched).toBe(false);
    expect('affectedPortionPercent' in untouched).toBe(false);
  });

  it('requires non-empty region values', () => {
    expect(() =>
      normalizeFieldReportDraftInput({ province: '   ', updatedAt: NOW }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(
      normalizeFieldReportDraftInput({
        province: ' Cavite ',
        municipality: 'Tagaytay',
        updatedAt: NOW,
      }),
    ).toMatchObject({ province: 'Cavite', municipality: 'Tagaytay' });
  });
});

describe('normalizeFinalizeFieldReportInput', () => {
  it('passes through validated numbers and normalized texts', () => {
    const values = normalizeFinalizeFieldReportInput({
      affectedAreaHectares: 1.5,
      affectedPortionPercent: 45,
      barangay: 'Wawa',
      farmerOrFarmOwnerName: 'Maria Santos',
      sugarcaneVariety: 'Phil 2000',
      submittedAt: NOW,
      updatedAt: NOW,
    });

    expect(values).toMatchObject({
      affectedAreaHectares: 1.5,
      affectedPortionPercent: 45,
      barangay: 'Wawa',
      farmerOrFarmOwnerName: 'Maria Santos',
      sugarcaneVariety: 'Phil 2000',
    });
  });

  it('rejects missing or invalid required numbers', () => {
    expect(() =>
      normalizeFinalizeFieldReportInput({
        affectedAreaHectares: Number.NaN,
        affectedPortionPercent: 30,
        barangay: 'Wawa',
        farmerOrFarmOwnerName: 'Maria Santos',
        submittedAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
    expect(() =>
      normalizeFinalizeFieldReportInput({
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 150,
        barangay: 'Wawa',
        farmerOrFarmOwnerName: 'Maria Santos',
        submittedAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
  });
});

describe('getMissingSubmissionRequirements', () => {
  it.each([
    'Maria Santos',
    'North Block Farm 12',
    'Farm owner: Juan dela Cruz',
  ])('accepts a usable %s farm reference', (farmReference) => {
    const missing = getMissingSubmissionRequirements(
      draft({ farmerOrFarmOwnerName: farmReference }),
      evidence(),
    );

    expect(missing).not.toContain('farmer_or_farm_owner_name');
  });

  it('requires affected area and portion at finalization', () => {
    const missing = getMissingSubmissionRequirements(
      draft({ affectedAreaHectares: null, affectedPortionPercent: null }),
      evidence(),
    );

    expect(missing).toEqual(
      expect.arrayContaining(['affected_area_hectares', 'affected_portion_percent']),
    );
  });

  it('accepts any non-empty province and municipality instead of hardcoded values', () => {
    const missing = getMissingSubmissionRequirements(
      draft({ province: 'Cavite', municipality: 'Tagaytay' }),
      evidence(),
    );

    expect(missing).not.toEqual(expect.arrayContaining(['province', 'municipality']));
  });

  it('never blocks finalization on optional field details', () => {
    const missing = getMissingSubmissionRequirements(
      draft({
        sugarcaneVariety: null,
        cropAge: null,
        caneClass: null,
        fieldNotes: null,
      }),
      evidence(),
    );

    expect(missing).not.toEqual(
      expect.arrayContaining([
        'sugarcane_variety',
        'crop_age',
        'cane_class',
        'field_notes',
      ]),
    );
  });

  it('does not add a submission gate for mismatch observations', () => {
    const missing = getMissingSubmissionRequirements(
      draft({
        mismatchReported: true,
        reporterObservationText: null,
        reporterSuspectedCondition: null,
      }),
      evidence(),
    );

    expect(missing).toEqual([]);
  });

  it('flags empty region values as missing', () => {
    const missing = getMissingSubmissionRequirements(
      draft({ province: '', municipality: '' }),
      evidence(),
    );

    expect(missing).toEqual(expect.arrayContaining(['province', 'municipality']));
  });
});

describe('validateCreateFieldReportDraftInput', () => {
  it('accepts optional region seeds', () => {
    expect(() =>
      validateCreateFieldReportDraftInput({
        id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
        createdAt: NOW,
        submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
        submitterRole: 'field_reporter',
        province: 'Batangas',
        municipality: 'Nasugbu',
      }),
    ).not.toThrow();
  });

  it('rejects empty region seeds', () => {
    expect(() =>
      validateCreateFieldReportDraftInput({
        id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
        createdAt: NOW,
        submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
        submitterRole: 'field_reporter',
        municipality: '  ',
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_FIELD_REPORT' }));
  });
});
