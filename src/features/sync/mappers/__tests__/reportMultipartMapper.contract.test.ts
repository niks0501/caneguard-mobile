import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

interface CanonicalScalarRules {
  type?: string;
  enum?: string[];
  accepted_wire_values?: (boolean | number | string)[];
  max_length?: number;
  minimum?: number;
  maximum?: number;
  exclusive_minimum?: number;
}

interface CanonicalField extends CanonicalScalarRules {
  wire_type?: string;
  wire_name_template?: string;
  required?: boolean;
  min_items?: number;
  min_properties?: number;
  max_properties?: number;
  required_keys?: string[];
  items?: CanonicalScalarRules;
  values?: CanonicalScalarRules;
  formats?: { mime_types: string[] }[];
  max_bytes?: number;
  conditions?: CanonicalCondition[];
}

interface CanonicalCondition {
  rule: string;
  fields?: string[];
  field?: string;
  value?: string;
}

interface CanonicalContract {
  contract: string;
  version: number;
  fields: Record<string, CanonicalField>;
}

type MultipartPart = [string, unknown];

const CANONICAL = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../../../references/mobile-report-upload-v1.json'),
    'utf8',
  ),
) as CanonicalContract;

const SCAN: ScanRecordDetails = {
  authorityReview: null,
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri: 'file:///documents/caneguard/scan-images/scan.jpg',
  submissionImageUri: 'file:///documents/caneguard/scan-images/scan.jpg',
  submissionImageMimeType: 'image/jpeg',
  submissionImageSizeBytes: 4096,
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: null,
  syncStatus: 'local_only',
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

const REPORT: FieldReport = {
  authorityReview: null,
  id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
  scanRecordId: SCAN.id,
  authoringState: 'finalized',
  farmerOrFarmOwnerName: 'Maria Santos',
  province: 'Batangas',
  municipality: 'Nasugbu',
  barangay: 'Wawa',
  affectedAreaHectares: null,
  affectedPortionPercent: null,
  sugarcaneVariety: null,
  cropAge: null,
  caneClass: null,
  fieldNotes: null,
  mismatchReported: null,
  reporterObservationText: null,
  reporterSuspectedCondition: null,
  submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
  submitterRole: 'field_reporter',
  finalLatitude: 14.0667,
  finalLongitude: 120.6319,
  locationSource: 'gps',
  gpsAccuracy: 4.2,
  gpsAttemptLatitude: 14.0667,
  gpsAttemptLongitude: 120.6319,
  gpsAttemptAccuracy: 4.2,
  gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
  gpsCaptureOutcome: 'resolved',
  gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
  manualLocationSelectedAt: null,
  observedAt: SCAN.createdAt,
  submittedAt: '2026-08-10T03:00:00.000Z',
  syncStatus: 'pending',
  remoteId: null,
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
  createdAt: '2026-08-10T01:00:00.000Z',
  updatedAt: '2026-08-10T03:00:00.000Z',
};

class TestFormData {
  readonly _parts: MultipartPart[] = [];

  append(name: string, value: unknown): void {
    this._parts.push([name, value]);
  }
}

const OriginalFormData = global.FormData;

beforeAll(() => {
  global.FormData = TestFormData as unknown as typeof FormData;
});

afterAll(() => {
  global.FormData = OriginalFormData;
});

describe('mobile-report-upload-v1 producer contract', () => {
  it('proves a complete mobile payload is inside the canonical artifact', () => {
    expect(CANONICAL.contract).toBe('mobile-report-upload-v1');
    expect(CANONICAL.version).toBe(1);
    expectCanonicalV1(map());
  });

  it('rejects undeclared names and missing required fields using the canonical artifact', () => {
    const form = map() as unknown as TestFormData;
    form.append('submitted_at', REPORT.submittedAt);
    expect(() =>
      expectCanonicalV1(form as unknown as FormData),
    ).toThrow(/submitted_at/i);

    const withoutImage = formFromParts(
      parts(map()).filter(([name]) => name !== 'image'),
    );
    expect(() => expectCanonicalV1(withoutImage)).toThrow(/required|Received:\s+0/i);

    const withoutSymptoms = formFromParts(
      parts(map()).filter(([name]) => name !== 'symptom_keys[]'),
    );
    expect(() => expectCanonicalV1(withoutSymptoms)).toThrow();
  });

  it.each([
    ['invalid Field Report UUID', { report: { id: 'not-a-uuid' } }],
    ['invalid Scan Record UUID', { scan: { id: 'not-a-uuid' } }],
    ['unsupported image source enum', { scan: { imageSourceType: 'import' } }],
    ['unsupported predicted label enum', { scan: { predictedLabel: 'blight' } }],
    ['unsupported reported severity enum', { scan: { reportedSeverity: 'Critical' } }],
    ['invalid mismatch boolean value', { report: { mismatchReported: 'yes' } }],
    ['unsupported class score key', { scan: { classScores: [{ label: 'blight', score: 0.1 }, { label: 'mosaic', score: 0.1 }, { label: 'rust', score: 0.8 }] } }],
    ['unsupported symptom array value', { scan: { symptoms: ['blight'] } }],
    ['duplicate symptom array value', { scan: { symptoms: ['rust', 'rust'] } }],
    ['empty required symptom array', { scan: { symptoms: [] } }],
    ['unsupported quality warning array value', { scan: { qualityWarnings: ['blurry'] } }],
    ['duplicate quality warning array value', { scan: { qualityWarnings: ['too-dark', 'too-dark'] } }],
    ['confidence above one', { scan: { confidence: 1.01 } }],
    ['class score below zero', { scan: { classScores: [{ label: 'healthy', score: -0.01 }, { label: 'mosaic', score: 0.1 }, { label: 'rust', score: 0.9 }] } }],
    ['source width above canonical maximum', { scan: { sourceWidth: 50_001 } }],
    ['source height below canonical minimum', { scan: { sourceHeight: 0 } }],
    ['processing timing above canonical maximum', { scan: { totalMs: 1_000_000_000 } }],
    ['latitude outside canonical range', { report: { finalLatitude: 90.01 } }],
    ['longitude outside canonical range', { report: { finalLongitude: -180.01 } }],
    ['negative GPS accuracy', { report: { gpsAccuracy: -0.01 } }],
    ['zero affected area', { report: { affectedAreaHectares: 0 } }],
    ['affected portion above one hundred', { report: { affectedPortionPercent: 100.01 } }],
    ['checklist text above canonical maximum', { scan: { checklistConsistency: 'x'.repeat(41) } }],
    ['farmer name above canonical maximum', { report: { farmerOrFarmOwnerName: 'x'.repeat(161) } }],
    ['barangay above canonical maximum', { report: { barangay: 'x'.repeat(121) } }],
    ['province above canonical maximum', { report: { province: 'x'.repeat(121) } }],
    ['municipality above canonical maximum', { report: { municipality: 'x'.repeat(121) } }],
    ['suspected condition above canonical maximum', { report: { reporterSuspectedCondition: 'x'.repeat(121) } }],
    ['observation text above canonical maximum', { report: { reporterObservationText: 'x'.repeat(1_001) } }],
    ['sugarcane variety above mobile maximum', { report: { sugarcaneVariety: 'x'.repeat(101) } }],
    ['crop age above mobile maximum', { report: { cropAge: 'x'.repeat(101) } }],
    ['cane class above mobile maximum', { report: { caneClass: 'x'.repeat(101) } }],
    ['field notes above intentionally stricter mobile maximum', { report: { fieldNotes: 'x'.repeat(121) } }],
    ['model version above canonical maximum', { scan: { modelVersion: 'x'.repeat(101) } }],
    ['invalid observed timestamp', { report: { observedAt: 'not-a-date' } }],
    ['invalid captured timestamp', { scan: { createdAt: 'not-a-date' } }],
  ] as [string, { report?: object; scan?: object }][])('rejects %s', (_name, overrides) => {
    expect(() => map(overrides.report, overrides.scan)).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );
  });

  it.each([
    ['GPS location without accuracy', { locationSource: 'gps', gpsAccuracy: null }],
    ['manual location with GPS accuracy', { locationSource: 'manual_map', gpsAccuracy: 4.2 }],
    ['manual location without coordinates', { locationSource: 'manual_map', finalLatitude: null }],
    ['unsupported location source', { locationSource: 'device' }],
  ] as [string, object][])('rejects invalid conditional location fields: %s', (_name, report) => {
    expect(() => map(report)).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );
  });

  it('accepts mobile values at every relevant canonical boundary', () => {
    const boundaryReport: Partial<FieldReport> = {
      farmerOrFarmOwnerName: 'x'.repeat(160),
      province: 'x'.repeat(120),
      municipality: 'x'.repeat(120),
      barangay: 'x'.repeat(120),
      reporterSuspectedCondition: 'x'.repeat(120),
      reporterObservationText: 'x'.repeat(1_000),
      sugarcaneVariety: 'x'.repeat(100),
      cropAge: 'x'.repeat(100),
      caneClass: 'x'.repeat(100),
      fieldNotes: 'x'.repeat(120),
      affectedAreaHectares: 10_000,
      affectedPortionPercent: 100,
      finalLatitude: 90,
      finalLongitude: -180,
      gpsAccuracy: 0,
    };
    const boundaryScan: Partial<ScanRecordDetails> = {
      sourceWidth: 50_000,
      sourceHeight: 50_000,
      confidence: 1,
      classScores: [
        { label: 'healthy', score: 0 },
        { label: 'mosaic', score: 1 },
        { label: 'rust', score: 0.5 },
      ],
      symptoms: ['mosaic', 'rust', 'none', 'unable-to-tell'],
      qualityWarnings: ['low-resolution', 'too-dark', 'too-bright', 'low-contrast'],
      preprocessMs: 999_999_999,
      inferenceMs: 0,
      totalMs: 999_999_999,
    };

    expectCanonicalV1(map(boundaryReport, boundaryScan));
  });

  it('documents the intentionally stricter mobile subset of widened v1 fields', () => {
    const fieldNotesAtV1Maximum = replacePart(
      map({ fieldNotes: 'x'.repeat(120) }),
      'field_notes',
      'x'.repeat(5_000),
    );
    expectCanonicalV1(fieldNotesAtV1Maximum);
    expect(() => map({ fieldNotes: 'x'.repeat(5_000) })).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );

    const affectedAreaAboveMobileCeiling = replacePart(
      map({ affectedAreaHectares: 1 }),
      'affected_area_hectares',
      '10001',
    );
    expectCanonicalV1(affectedAreaAboveMobileCeiling);
    expect(() => map({ affectedAreaHectares: 10_001 })).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );
  });

  it.each([
    ['unsupported persisted MIME type', { submissionImageMimeType: 'image/gif' }, undefined],
    ['zero persisted image size', { submissionImageSizeBytes: 0 }, undefined],
    ['oversized persisted image', { submissionImageSizeBytes: 10 * 1024 * 1024 + 1 }, undefined],
    ['non-integer persisted image size', { submissionImageSizeBytes: 4096.5 }, undefined],
    ['missing persisted image URI', { submissionImageUri: null }, undefined],
    ['uploaded file MIME mismatch', {}, { type: 'image/png', size: 4096 }],
    ['uploaded file non-v1 MIME type', {}, { type: 'image/jpg', size: 4096 }],
    ['uploaded file size mismatch', {}, { type: 'image/jpeg', size: 4097 }],
    ['uploaded file over canonical maximum', {}, { type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 }],
  ] as const)('rejects invalid image metadata: %s', (_name, scan, file) => {
    expect(() => map(undefined, scan, file ?? undefined)).toThrow(
      expect.objectContaining({ code: 'INVALID_LOCAL_RECORD' }),
    );
  });

  it('rejects a missing persisted image file distinctly from invalid metadata', () => {
    expect(() =>
      map(undefined, undefined, undefined, () => false),
    ).toThrow(expect.objectContaining({ code: 'IMAGE_MISSING' }));
  });
});

function map(
  reportOverrides: object | undefined = undefined,
  scanOverrides: object | undefined = undefined,
  file: { type: string; size: number } | undefined = undefined,
  imageExists: (() => boolean) | undefined = undefined,
): FormData {
  const report = { ...REPORT, ...reportOverrides } as FieldReport;
  const scanRecord = { ...SCAN, ...scanOverrides } as ScanRecordDetails;
  return mapFieldReportToMultipart(
    { report, scanRecord },
    {
      createImageFile: () =>
        (file ?? {
          type: scanRecord.submissionImageMimeType ?? 'image/jpeg',
          size: scanRecord.submissionImageSizeBytes ?? 4096,
        }) as unknown as Blob,
      imageExists: imageExists ?? (() => true),
    },
  );
}

function parts(form: FormData): MultipartPart[] {
  return (form as unknown as TestFormData)._parts;
}

function formFromParts(formParts: MultipartPart[]): FormData {
  const form = new TestFormData();
  form._parts.push(...formParts);
  return form as unknown as FormData;
}

function replacePart(form: FormData, name: string, value: unknown): FormData {
  return formFromParts(
    parts(form).map(([partName, partValue]) =>
      partName === name ? [partName, value] : [partName, partValue],
    ),
  );
}

function expectCanonicalV1(form: FormData): void {
  const formParts = parts(form);
  const undeclared = formParts
    .map(([name]) => name)
    .filter((name) => !findCanonicalField(name));
  expect(undeclared).toEqual([]);

  for (const [fieldName, field] of Object.entries(CANONICAL.fields)) {
    const fieldParts = formParts.filter(([name]) =>
      isPartForField(name, fieldName, field),
    );
    validateField(fieldName, field, fieldParts);
  }
  validateConditions(formParts);
}

function validateField(
  fieldName: string,
  field: CanonicalField,
  fieldParts: MultipartPart[],
): void {
  if (field.required) {
    expect(fieldParts.length).toBeGreaterThan(0);
  }
  if (field.wire_type === 'file') {
    if (fieldParts.length === 0) return;
    expect(fieldParts).toHaveLength(1);
    const file = fieldParts[0][1] as { type?: unknown; size?: unknown };
    const acceptedMimes = (field.formats ?? []).flatMap(
      ({ mime_types }) => mime_types,
    );
    expect(acceptedMimes).toContain(file.type);
    expect(Number.isInteger(file.size)).toBe(true);
    expect(file.size as number).toBeGreaterThan(0);
    expect(file.size as number).toBeLessThanOrEqual(field.max_bytes ?? Infinity);
    return;
  }
  if (field.wire_type === 'nested-object') {
    validateNestedField(field, fieldParts);
    return;
  }
  if (field.wire_type === 'repeated-text') {
    const values = fieldParts.map(([, value]) => textValue(value));
    if (values.length === 0) return;
    if (field.min_items !== undefined) {
      expect(values.length).toBeGreaterThanOrEqual(field.min_items);
    }
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      validateScalar(value, field.items ?? {});
    }
    return;
  }
  if (fieldParts.length === 0) return;
  expect(fieldParts).toHaveLength(1);
  validateScalar(textValue(fieldParts[0][1]), field);
}

function validateNestedField(
  field: CanonicalField,
  fieldParts: MultipartPart[],
): void {
  if (fieldParts.length === 0) return;
  const entries = fieldParts.map(([name, value]) => {
    const match = name.match(/^class_scores\[([^\]]+)\]$/);
    expect(match).not.toBeNull();
    return { key: match?.[1] ?? '', value: textValue(value) };
  });
  expect(entries.length).toBeGreaterThanOrEqual(field.min_properties ?? 0);
  expect(entries.length).toBeLessThanOrEqual(field.max_properties ?? Infinity);
  expect(new Set(entries.map(({ key }) => key)).size).toBe(entries.length);
  expect(entries.map(({ key }) => key).sort()).toEqual(
    [...(field.required_keys ?? [])].sort(),
  );
  for (const entry of entries) {
    validateScalar(entry.value, field.values ?? {});
  }
}

function validateScalar(value: string, rules: CanonicalScalarRules): void {
  if (rules.max_length !== undefined) {
    expect(value.length).toBeLessThanOrEqual(rules.max_length);
  }
  if (rules.enum) {
    expect(rules.enum).toContain(value);
  }
  if (rules.accepted_wire_values) {
    expect(rules.accepted_wire_values.map(String)).toContain(value);
  }
  if (rules.type === 'uuid') {
    expect(value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  }
  if (rules.type === 'integer' || rules.type === 'number') {
    const number = Number(value);
    expect(value.trim()).not.toBe('');
    expect(Number.isFinite(number)).toBe(true);
    if (rules.type === 'integer') {
      expect(Number.isInteger(number)).toBe(true);
    }
    if (rules.minimum !== undefined) {
      expect(number).toBeGreaterThanOrEqual(rules.minimum);
    }
    if (rules.maximum !== undefined) {
      expect(number).toBeLessThanOrEqual(rules.maximum);
    }
    if (rules.exclusive_minimum !== undefined) {
      expect(number).toBeGreaterThan(rules.exclusive_minimum);
    }
  }
  if (rules.type === 'date-time') {
    expect(Number.isNaN(Date.parse(value))).toBe(false);
  }
}

function validateConditions(formParts: MultipartPart[]): void {
  for (const [fieldName, field] of Object.entries(CANONICAL.fields)) {
    for (const condition of field.conditions ?? []) {
      if (condition.rule === 'required_with') {
        const referencedPresent = condition.fields?.some((name) =>
          hasEffectiveValue(formParts, name),
        );
        if (referencedPresent) {
          expect(hasEffectiveValue(formParts, fieldName)).toBe(true);
        }
      }
      if (condition.rule === 'required_if') {
        if (scalarValue(formParts, condition.field ?? '') === condition.value) {
          expect(hasEffectiveValue(formParts, fieldName)).toBe(true);
        }
      }
      if (condition.rule === 'prohibited_unless') {
        if (scalarValue(formParts, condition.field ?? '') !== condition.value) {
          expect(hasEffectiveValue(formParts, fieldName)).toBe(false);
        }
      }
    }
  }
}

function findCanonicalField(name: string): [string, CanonicalField] | null {
  for (const [fieldName, field] of Object.entries(CANONICAL.fields)) {
    if (isPartForField(name, fieldName, field)) {
      return [fieldName, field];
    }
  }
  return null;
}

function isPartForField(
  name: string,
  fieldName: string,
  field: CanonicalField,
): boolean {
  if (name === fieldName) return true;
  const template = field.wire_name_template;
  if (!template) return false;
  if (template === `${fieldName}[]`) {
    return name === template;
  }
  const token = '{key}';
  const tokenIndex = template.indexOf(token);
  if (tokenIndex === -1) return false;
  const prefix = template.slice(0, tokenIndex);
  const suffix = template.slice(tokenIndex + token.length);
  return (
    name.startsWith(prefix) &&
    name.endsWith(suffix) &&
    name.length > prefix.length + suffix.length
  );
}

function hasEffectiveValue(formParts: MultipartPart[], fieldName: string): boolean {
  const value = scalarValue(formParts, fieldName);
  return value !== undefined && value.trim() !== '';
}

function scalarValue(formParts: MultipartPart[], fieldName: string): string | undefined {
  const part = formParts.find(([name]) => name === fieldName);
  return part ? textValue(part[1]) : undefined;
}

function textValue(value: unknown): string {
  expect(typeof value).toBe('string');
  return String(value);
}
