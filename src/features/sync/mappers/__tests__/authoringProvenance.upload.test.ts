import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { getSubmissionImageUri } from '@/features/records/services/scanImageStorage';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const SCAN: ScanRecordDetails = {
  authorityReview: null,
  hasLinkedFieldReport: false,
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
  affectedAreaMeasurement: 'not_measured', affectedPortionMeasurement: 'not_measured',
  locationUnavailableReason: null,
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

const COMPLETION: FieldValidationCompletion = {
  id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
  ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
  assignmentId: '01a04de2-280e-7140-bf56-3c98f98259d5',
  reportUuid: '01a04ddc-9d08-70f7-9b43-ca247cea1a60',
  fieldObservation: 'Fresh leaves show rust-like lesions.',
  fieldFinding: 'Evidence was recorded for office review.',
  actionTaken: 'Provided field guidance and recorded the visit.',
  followUpOutcome: 'improved',
  visitedAt: '2026-09-02T04:05:06.123Z',
  gpsOutcome: 'unavailable',
  gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAccuracy: null,
  freshPhotoUri: null,
  freshPhotoMimeType: null,
  freshPhotoSizeBytes: null,
  syncStatus: 'pending',
  remoteId: null,
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
  createdAt: '2026-09-02T04:05:06.123Z',
  updatedAt: '2026-09-02T04:05:06.123Z',
};

describe('upload provenance (NET-3)', () => {
  const OriginalFormData = global.FormData;

  beforeAll(() => {
    class TestFormData {
      readonly _parts: [string, unknown][] = [];
      append(name: string, value: unknown) { this._parts.push([name, value]); }
    }
    global.FormData = TestFormData as unknown as typeof FormData;
  });
  afterAll(() => { global.FormData = OriginalFormData; });

  const parts = (form: FormData) =>
    (form as unknown as { _parts: [string, unknown][] })._parts;

  function mapReport(report: FieldReport) {
    return mapFieldReportToMultipart({ report, scanRecord: SCAN }, {
      createImageFile: () => ({ name: 'scan.jpg', type: 'image/jpeg', size: 4096 }) as unknown as Blob,
      imageExists: () => true,
    });
  }

  // Intent: "freeze provenance at finish": a report finished under carry-over uploads its basis and the /me time it rested on.
  it('sends the frozen basis and verification time', () => {
    const form = mapReport({
      ...REPORT,
      authorizationBasis: 'carryover',
      capabilitiesVerifiedAt: '2026-11-12T08:00:00.000Z',
    });
    expect(parts(form)).toEqual(expect.arrayContaining([
      ['authorization_basis', 'carryover'],
      ['capabilities_verified_at', '2026-11-12T08:00:00.000Z'],
    ]));
  });

  // Intent: records finished before provenance existed upload exactly as before (no invented basis).
  it('sends no provenance for a report finished before it existed', () => {
    const names = parts(mapReport(REPORT)).map(([name]) => name);
    expect(names).not.toContain('authorization_basis');
    expect(names).not.toContain('capabilities_verified_at');
  });

  // Intent: "freeze provenance at finish" for visits too.
  it('sends the frozen basis and verification time, and nothing for an older visit', () => {
    const done = parts(mapFieldValidationCompletionToMultipart({
      completion: { ...COMPLETION, authorizationBasis: 'verified', capabilitiesVerifiedAt: '2026-11-13T01:00:00.000Z' },
    }));
    expect(done).toEqual(expect.arrayContaining([
      ['authorization_basis', 'verified'],
      ['capabilities_verified_at', '2026-11-13T01:00:00.000Z'],
    ]));
    const older = parts(mapFieldValidationCompletionToMultipart({ completion: COMPLETION })).map(([name]) => name);
    expect(older).not.toContain('authorization_basis');
  });
});
