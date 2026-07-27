import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { mapReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const RECORD: ScanRecordDetails = {
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri:
    'file:///documents/caneguard/scan-images/2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2.jpg',
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: 'Wawa',
  syncStatus: 'pending',
  createdAt: '2026-07-25T05:30:00.000Z',
  imageMimeType: 'image/jpeg',
  imageSizeBytes: 4096,
  imageSourceType: 'camera',
  sourceWidth: 1200,
  sourceHeight: 900,
  checklistConsistency: 'consistent',
  reportedSeverity: 'Moderate',
  modelVersion: 'v0.1-baseline',
  preprocessMs: 4.25,
  inferenceMs: 8.5,
  totalMs: 12.75,
  remoteId: null,
  updatedAt: '2026-07-25T05:30:00.000Z',
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
  classScores: [
    { label: 'healthy', score: 0.05 },
    { label: 'mosaic', score: 0.13 },
    { label: 'rust', score: 0.82 },
  ],
  symptoms: ['rust'],
  qualityWarnings: ['too-dark'],
};

describe('report multipart mapper', () => {
  const OriginalFormData = global.FormData;

  beforeAll(() => {
    class TestFormData {
      readonly _parts: [string, unknown][] = [];

      append(name: string, value: unknown) {
        this._parts.push([name, value]);
      }
    }
    global.FormData = TestFormData as unknown as typeof FormData;
  });

  afterAll(() => {
    global.FormData = OriginalFormData;
  });

  it('maps the exact Laravel field names and preserves client UUID', () => {
    const imageFile = {
      bytes: jest.fn(async () => new Uint8Array([1, 2, 3])),
      name: `${RECORD.id}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob;
    const createImageFile = jest.fn(() => imageFile);
    const form = mapReportToMultipart(RECORD, {
      createImageFile,
      imageExists: () => true,
    });
    const parts = (form as unknown as { _parts: [string, unknown][] })._parts;
    const values = new Map(parts);

    expect(values.get('client_uuid')).toBe(RECORD.id);
    expect(values.get('predicted_label')).toBe('rust');
    expect(values.get('class_scores[healthy]')).toBe('0.05');
    expect(values.get('class_scores[mosaic]')).toBe('0.13');
    expect(values.get('class_scores[rust]')).toBe('0.82');
    expect(values.get('checklist_consistency')).toBe('consistent');
    expect(values.get('reported_severity')).toBe('Moderate');
    expect(values.get('barangay')).toBe('Wawa');
    expect(values.get('captured_at')).toBe(RECORD.createdAt);
    expect(parts).toContainEqual(['symptom_keys[]', 'rust']);
    expect(parts).toContainEqual(['quality_warnings[]', 'too-dark']);
    expect(createImageFile).toHaveBeenCalledWith(RECORD.managedImageUri);
    expect(values.get('image')).toBe(imageFile);
    expect(values.get('image')).toMatchObject({
      bytes: expect.any(Function),
      name: `${RECORD.id}.jpg`,
      type: 'image/jpeg',
    });
  });

  it.each([
    ['missing image', RECORD, () => false, 'IMAGE_MISSING'],
    [
      'missing barangay',
      { ...RECORD, barangay: null },
      () => true,
      'INVALID_LOCAL_RECORD',
    ],
    [
      'missing class score',
      { ...RECORD, classScores: RECORD.classScores.slice(0, 2) },
      () => true,
      'INVALID_LOCAL_RECORD',
    ],
  ])('rejects %s before a request', (_name, record, imageExists, code) => {
    expect(() =>
      mapReportToMultipart(record as ScanRecordDetails, { imageExists }),
    ).toThrow(expect.objectContaining({ code }));
  });
});
