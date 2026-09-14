import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { getSubmissionImageUri } from '@/features/records/services/scanImageStorage';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const SCAN: ScanRecordDetails = {
  authorityReview: null,
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  ownerIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
  managedImageUri: 'file:///documents/caneguard/scan-images/a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17/2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2.jpg',
  submissionImageUri: getSubmissionImageUri(
    '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
  ),
  submissionImageMimeType: 'image/jpeg',
  submissionImageSizeBytes: 4096,
  predictedLabel: 'rust', confidence: 0.82, barangay: null,
  syncStatus: 'local_only', createdAt: '2026-07-25T05:30:00.000Z',
  imageMimeType: 'image/jpeg', imageSizeBytes: 4096, imageSourceType: 'camera',
  sourceWidth: 1200, sourceHeight: 900, checklistConsistency: 'consistent',
  reportedSeverity: 'Moderate', decisionSupportWording: 'Possible result only. This output does not confirm a disease.', modelVersion: 'v1.0-mobilenetv2', preprocessMs: 4.25,
  inferenceMs: 8.5, totalMs: 12.75, remoteId: null,
  updatedAt: '2026-07-25T05:30:00.000Z', syncAttemptCount: 0,
  lastSyncErrorCode: null, lastSyncAttemptAt: null, lastSyncedAt: null,
  classScores: [
    { label: 'healthy', score: 0.05 }, { label: 'mosaic', score: 0.13 },
    { label: 'rust', score: 0.82 }, { label: 'smut', score: 0 },
  ],
  symptoms: ['rust'], qualityWarnings: ['too-dark'],
};

const REPORT: FieldReport = {
  authorityReview: null,
  id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e', scanRecordId: SCAN.id,
  authoringState: 'finalized', farmerOrFarmOwnerName: 'Maria Santos',
  province: 'Batangas', municipality: 'Nasugbu', barangay: 'Wawa',
  affectedAreaHectares: null, affectedPortionPercent: null,
  sugarcaneVariety: null, cropAge: null, caneClass: null, fieldNotes: null,
  mismatchReported: null, reporterObservationText: null, reporterSuspectedCondition: null,
  submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
  submitterRole: 'field_reporter', finalLatitude: 14.0667,
  finalLongitude: 120.6319, locationSource: 'gps', gpsAccuracy: 4.2,
  gpsAttemptLatitude: 14.0667, gpsAttemptLongitude: 120.6319,
  gpsAttemptAccuracy: 4.2, gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
  gpsCaptureOutcome: 'resolved', gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
  manualLocationSelectedAt: null, observedAt: SCAN.createdAt,
  submittedAt: '2026-08-10T03:00:00.000Z', syncStatus: 'pending',
  remoteId: null, syncAttemptCount: 0, lastSyncErrorCode: null,
  lastSyncAttemptAt: null, lastSyncedAt: null,
  createdAt: '2026-08-10T01:00:00.000Z', updatedAt: '2026-08-10T03:00:00.000Z',
};

describe('Field Report multipart mapper', () => {
  const OriginalFormData = global.FormData;

  beforeAll(() => {
    class TestFormData {
      readonly _parts: [string, unknown][] = [];
      append(name: string, value: unknown) { this._parts.push([name, value]); }
    }
    global.FormData = TestFormData as unknown as typeof FormData;
  });
  afterAll(() => { global.FormData = OriginalFormData; });

  function map(report = REPORT, scanRecord = SCAN) {
    return mapFieldReportToMultipart({ report, scanRecord }, {
      createImageFile: () =>
        ({ name: 'scan.jpg', type: 'image/jpeg', size: 4096 }) as unknown as Blob,
      imageExists: () => true,
    });
  }

  it('sends Model V1 Smut evidence through the four-class V2 upload contract', () => {
    const parts = (
      map(REPORT, {
        ...SCAN,
        predictedLabel: 'smut',
        classScores: [
          { label: 'healthy', score: 0.01 },
          { label: 'mosaic', score: 0.01 },
          { label: 'rust', score: 0.01 },
          { label: 'smut', score: 0.97 },
        ],
      }) as unknown as { _parts: [string, unknown][] }
    )._parts;
    const values = new Map(parts);
    expect(values.get('predicted_label')).toBe('smut');
    expect(values.get('model_version')).toBe('v1.0-mobilenetv2');
    expect(values.get('class_scores[smut]')).toBe('0.97');
  });

  it('uploads the persisted submission artifact instead of the preserved source path', () => {
    const createImageFile = jest.fn(
      () => ({ name: 'submission.jpg', type: 'image/jpeg', size: 4096 }) as unknown as Blob,
    );
    mapFieldReportToMultipart({
      report: REPORT,
      scanRecord: {
        ...SCAN,
        submissionImageUri: getSubmissionImageUri(
          SCAN.id,
          SCAN.ownerIdentity,
        ),
      },
    }, { createImageFile, imageExists: () => true });

    expect(createImageFile).toHaveBeenCalledWith(
      getSubmissionImageUri(SCAN.id, SCAN.ownerIdentity),
    );
  });

  it('rejects a persisted derivative owned by another Scan Record', () => {
    expect(() =>
      mapFieldReportToMultipart(
        {
          report: REPORT,
          scanRecord: {
            ...SCAN,
            submissionImageUri: getSubmissionImageUri(
              'c863a5af-e9ad-44fe-a0dc-73f9d3436cac',
              SCAN.ownerIdentity,
            ),
          },
        },
        { imageExists: () => true },
      ),
    ).toThrow(expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }));
  });

  it('uses the stable Field Report identity and includes accepted P0 context plus scan evidence', () => {
    const parts = (map() as unknown as { _parts: [string, unknown][] })._parts;
    const values = new Map(parts);

    expect(values.get('client_uuid')).toBe(REPORT.id);
    expect(values.get('scan_record_client_uuid')).toBe(SCAN.id);
    expect(values.get('farmer_or_farm_owner_name')).toBe('Maria Santos');
    expect(values.get('submitter_identity')).toBeUndefined();
    expect(values.get('submitter_role')).toBeUndefined();
    expect(values.get('province')).toBe('Batangas');
    expect(values.get('municipality')).toBe('Nasugbu');
    expect(values.get('barangay')).toBe('Wawa');
    expect(values.get('final_latitude')).toBe('14.0667');
    expect(values.get('final_longitude')).toBe('120.6319');
    expect(values.get('location_source')).toBe('gps');
    expect(values.get('gps_accuracy')).toBe('4.2');
    expect(values.get('observed_at')).toBe(REPORT.observedAt);
    expect(values.get('submitted_at')).toBeUndefined();
    expect(values.get('predicted_label')).toBe('rust');
    expect(values.get('class_scores[rust]')).toBe('0.82');
    expect(parts).toContainEqual(['symptom_keys[]', 'rust']);
  });

  it('accepts the guided Something else observation as symptom evidence', () => {
    const parts = (
      map(
        REPORT,
        {
          ...SCAN,
          checklistConsistency: 'inconsistent',
          symptoms: ['something-else'],
        },
      ) as unknown as { _parts: [string, unknown][] }
    )._parts;

    expect(parts).toContainEqual(['symptom_keys[]', 'something-else']);
    expect(parts).toContainEqual(['checklist_consistency', 'inconsistent']);
    expect(parts).toContainEqual(['predicted_label', 'rust']);
  });

  it('emits the mismatch wire keys without changing model evidence', () => {
    const parts = (
      map({
        ...REPORT,
        mismatchReported: true,
        reporterSuspectedCondition: 'Local condition',
        reporterObservationText: 'The visible symptoms differ.',
      }) as unknown as { _parts: [string, unknown][] }
    )._parts;
    const values = new Map(parts);

    expect(values.get('mismatch_reported')).toBe('1');
    expect(values.get('reporter_suspected_condition')).toBe('Local condition');
    expect(values.get('reporter_observation_text')).toBe('The visible symptoms differ.');
    expect(values.get('predicted_label')).toBe('rust');
    expect(values.get('confidence')).toBe('0.82');
    expect(values.get('class_scores[rust]')).toBe('0.82');
    expect(parts).toContainEqual(['symptom_keys[]', 'rust']);
  });

  it('emits an explicit no-mismatch answer and omits empty optional text', () => {
    const parts = (
      map({
        ...REPORT,
        mismatchReported: false,
        reporterSuspectedCondition: null,
        reporterObservationText: null,
      }) as unknown as { _parts: [string, unknown][] }
    )._parts;
    const values = new Map(parts);

    expect(values.get('mismatch_reported')).toBe('0');
    expect(values.get('reporter_suspected_condition')).toBeUndefined();
    expect(values.get('reporter_observation_text')).toBeUndefined();
  });

  it('appends the smart field report details when present', () => {
    const values = new Map(
      (map({
        ...REPORT,
        sugarcaneVariety: 'Phil 2000',
        cropAge: '6 months',
        caneClass: 'Ratoon',
        affectedAreaHectares: 2.5,
        affectedPortionPercent: 40,
        fieldNotes: 'Wet patches near the river side.',
      }) as unknown as { _parts: [string, unknown][] })._parts,
    );

    expect(values.get('sugarcane_variety')).toBe('Phil 2000');
    expect(values.get('crop_age')).toBe('6 months');
    expect(values.get('cane_class')).toBe('Ratoon');
    expect(values.get('affected_area_hectares')).toBe('2.5');
    expect(values.get('affected_portion_percent')).toBe('40');
    expect(values.get('field_notes')).toBe('Wet patches near the river side.');
  });

  it('omits null, absent, and whitespace-only detail fields', () => {
    const parts = (map({
      ...REPORT,
      sugarcaneVariety: '   ',
      cropAge: null,
      caneClass: undefined as unknown as null,
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      fieldNotes: '',
    }) as unknown as { _parts: [string, unknown][] })._parts;
    const keys = parts.map(([name]) => name);

    expect(keys).not.toContain('sugarcane_variety');
    expect(keys).not.toContain('crop_age');
    expect(keys).not.toContain('cane_class');
    expect(keys).not.toContain('affected_area_hectares');
    expect(keys).not.toContain('affected_portion_percent');
    expect(keys).not.toContain('field_notes');
  });

  it('trims surrounding whitespace from detail text before appending', () => {
    const values = new Map(
      (map({
        ...REPORT,
        sugarcaneVariety: '  Phil 2000  ',
        fieldNotes: '  Waterlogged  ',
      }) as unknown as { _parts: [string, unknown][] })._parts,
    );
    expect(values.get('sugarcane_variety')).toBe('Phil 2000');
    expect(values.get('field_notes')).toBe('Waterlogged');
  });

  it('distinguishes manual-map provenance without fabricating GPS accuracy', () => {
    const form = map({
      ...REPORT, locationSource: 'manual_map', gpsAccuracy: null,
      finalLatitude: 14.071, finalLongitude: 120.635,
    });
    const values = new Map(
      (form as unknown as { _parts: [string, unknown][] })._parts,
    );
    expect(values.get('location_source')).toBe('manual_map');
    expect(values.get('gps_accuracy')).toBeUndefined();
  });

  it('reuses the same client identity on repeat mapping', () => {
    const identity = (form: FormData) => new Map(
      (form as unknown as { _parts: [string, unknown][] })._parts,
    ).get('client_uuid');
    expect(identity(map())).toBe(REPORT.id);
    expect(identity(map())).toBe(REPORT.id);
  });

  it.each([
    ['Draft', { ...REPORT, authoringState: 'draft', syncStatus: 'local_only' }],
    ['missing location', { ...REPORT, finalLatitude: null }],
  ])('rejects %s before a request', (_name, report) => {
    expect(() => map(report as FieldReport)).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );
  });
});
