import { StorageError } from '@/database/errors';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionState } from '@/features/detection/types';
import {
  createCompletedScanDraft,
  validateCompletedScanDraft,
} from '@/features/records/domain/recordValidation';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const NOW = new Date('2026-07-25T05:30:00.000Z');

function completedState(
  overrides: Partial<ScanSessionState> = {},
): ScanSessionState {
  return {
    ...initialScanSessionState,
    barangay: 'Wawa',
    status: 'completed',
    sourceUri: 'content://gallery/leaf',
    sourceType: 'gallery',
    sourceWidth: 1920,
    sourceHeight: 1080,
    selectedSymptoms: ['rust'],
    reportedSeverity: 'Moderate',
    qualityAssessment: {
      warnings: ['too-dark'],
      meanLuminance: 22,
      luminanceStandardDeviation: 18,
    },
    result: {
      predictedLabel: 'rust',
      confidence: 0.82,
      scores: [
        { label: 'healthy', score: 0.05 },
        { label: 'mosaic', score: 0.13 },
        { label: 'rust', score: 0.82 },
      ],
      timings: {
        preprocessMs: 4.25,
        inferenceMs: 8.5,
        totalMs: 12.75,
      },
      modelVersion: 'v0.1-baseline',
    },
    ...overrides,
  };
}

describe('completed scan record validation', () => {
  it('maps the completed session without rounding model output or timings', () => {
    const draft = createCompletedScanDraft(completedState(), RECORD_ID, NOW);

    expect(draft).toMatchObject({
      id: RECORD_ID,
      sourceUri: 'content://gallery/leaf',
      imageSourceType: 'gallery',
      sourceWidth: 1920,
      sourceHeight: 1080,
      predictedLabel: 'rust',
      confidence: 0.82,
      symptoms: ['rust'],
      checklistConsistency: 'consistent',
      reportedSeverity: 'Moderate',
      qualityWarnings: ['too-dark'],
      barangay: 'Wawa',
      modelVersion: 'v0.1-baseline',
      preprocessMs: 4.25,
      inferenceMs: 8.5,
      totalMs: 12.75,
      createdAt: '2026-07-25T05:30:00.000Z',
      updatedAt: '2026-07-25T05:30:00.000Z',
    });
    expect(draft.classScores).toEqual([
      { label: 'healthy', score: 0.05 },
      { label: 'mosaic', score: 0.13 },
      { label: 'rust', score: 0.82 },
    ]);
  });

  it.each([
    ['incomplete session', completedState({ status: 'running' })],
    ['missing source', completedState({ sourceUri: null })],
    ['missing result', completedState({ result: null })],
  ])('rejects an %s before persistence', (_name, state) => {
    expect(() => createCompletedScanDraft(state, RECORD_ID, NOW)).toThrow(
      expect.objectContaining<Partial<StorageError>>({
        code: 'INVALID_SCAN_RECORD',
      }),
    );
  });

  it('allows completed scan evidence without report-owned barangay data', () => {
    expect(
      createCompletedScanDraft(
        completedState({ barangay: '   ' }),
        RECORD_ID,
        NOW,
      ).barangay,
    ).toBe('');
  });

  it.each([
    ['confidence', { confidence: 1.1 }],
    [
      'complete score set',
      {
        classScores: [
          { label: 'healthy' as const, score: 0.1 },
          { label: 'rust' as const, score: 0.9 },
        ],
      },
    ],
    ['non-negative timing', { inferenceMs: -1 }],
    ['positive dimensions', { sourceWidth: 0 }],
    ['UTC timestamp', { createdAt: '2026-07-25 05:30:00' }],
  ])('rejects an invalid %s', (_name, override) => {
    const draft = createCompletedScanDraft(completedState(), RECORD_ID, NOW);

    expect(() => validateCompletedScanDraft({ ...draft, ...override })).toThrow(
      expect.objectContaining<Partial<StorageError>>({
        code: 'INVALID_SCAN_RECORD',
      }),
    );
  });
});
