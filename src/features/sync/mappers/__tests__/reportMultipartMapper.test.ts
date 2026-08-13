import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const SCAN: ScanRecordDetails = {
  authorityReview: null,
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri: 'file:///documents/caneguard/scan-images/scan.jpg',
  predictedLabel: 'rust', confidence: 0.82, barangay: null,
  syncStatus: 'local_only', createdAt: '2026-07-25T05:30:00.000Z',
  imageMimeType: 'image/jpeg', imageSizeBytes: 4096, imageSourceType: 'camera',
  sourceWidth: 1200, sourceHeight: 900, checklistConsistency: 'consistent',
  reportedSeverity: 'Moderate', modelVersion: 'v0.1-baseline', preprocessMs: 4.25,
  inferenceMs: 8.5, totalMs: 12.75, remoteId: null,
  updatedAt: '2026-07-25T05:30:00.000Z', syncAttemptCount: 0,
  lastSyncErrorCode: null, lastSyncAttemptAt: null, lastSyncedAt: null,
  classScores: [
    { label: 'healthy', score: 0.05 }, { label: 'mosaic', score: 0.13 },
    { label: 'rust', score: 0.82 },
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
        ({ name: 'scan.jpg', type: 'image/jpeg' }) as unknown as Blob,
      imageExists: () => true,
    });
  }

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
    expect(values.get('submitted_at')).toBe(REPORT.submittedAt);
    expect(values.get('predicted_label')).toBe('rust');
    expect(values.get('class_scores[rust]')).toBe('0.82');
    expect(parts).toContainEqual(['symptom_keys[]', 'rust']);
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
