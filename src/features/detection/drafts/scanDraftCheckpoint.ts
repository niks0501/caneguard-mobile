import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  deleteLocalDraft,
  readLocalDraft,
  saveLocalDraft,
} from '@/database/localDraftRepository';
import { MODEL_LABELS, type ModelLabel } from '@/features/detection/constants/modelContract';
import type { ChecklistObservationId } from '@/features/detection/checklist/checklistConsistency';
import type {
  DetectionResult,
  ReportedSeverity,
  ScanSessionState,
  ScanSourceType,
} from '@/features/detection/types';
import {
  deleteManagedScanImage,
  isManagedScanImageUri,
  managedImageExists,
} from '@/features/records/services/scanImageStorage';
import type { ImageQualityAssessment, QualityWarning } from '@/features/detection/validation/assessImageQuality';

export const SCAN_DRAFT_KIND = 'scan' as const;
export const SCAN_DRAFT_KEY = 'current';
export const SCAN_DRAFT_VERSION = 1;

const QUALITY_WARNINGS: readonly QualityWarning[] = [
  'low-resolution',
  'too-dark',
  'too-bright',
  'low-contrast',
];
const REPORTED_SEVERITIES: readonly ReportedSeverity[] = [
  'Mild',
  'Moderate',
  'Severe',
];
const MAX_SYMPTOMS = 12;

export interface ScanDraftCheckpoint {
  draftId: string;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  managedImageUri: string;
  preprocessMs: number | null;
  qualityAssessment: ImageQualityAssessment | null;
  reportedSeverity: ReportedSeverity | null;
  result: DetectionResult | null;
  savedAt: string;
  selectedSymptoms: ChecklistObservationId[];
  sourceHeight: number | null;
  sourceType: ScanSourceType;
  sourceWidth: number | null;
  status: 'image-selected' | 'completed';
}

export interface ScanDraftRecord {
  checkpoint: ScanDraftCheckpoint;
  updatedAt: string;
}

/**
 * Builds the checkpoint payload for the current session. Only durable,
 * resumable state is written: the display derivative and in-flight statuses
 * are intentionally excluded.
 */
export function buildScanDraftCheckpoint(input: {
  draftId: string;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  managedImageUri: string;
  savedAt: string;
  state: ScanSessionState;
}): ScanDraftCheckpoint | null {
  const { state } = input;
  if (!state.sourceUri || !state.sourceType) {
    return null;
  }
  if (!input.managedImageUri || !isManagedScanImageUri(input.managedImageUri)) {
    return null;
  }
  const completed = state.result !== null && state.status === 'completed';
  return {
    draftId: input.draftId,
    imageMimeType: input.imageMimeType,
    imageSizeBytes: input.imageSizeBytes,
    managedImageUri: input.managedImageUri,
    preprocessMs: state.preprocessMs,
    qualityAssessment: sanitizeQualityAssessment(state.qualityAssessment),
    reportedSeverity: sanitizeSeverity(state.reportedSeverity),
    result: completed ? sanitizeResult(state.result) : null,
    savedAt: input.savedAt,
    selectedSymptoms: sanitizeSymptoms(state.selectedSymptoms),
    sourceHeight: state.sourceHeight,
    sourceType: state.sourceType,
    sourceWidth: state.sourceWidth,
    status: completed ? 'completed' : 'image-selected',
  };
}

export async function writeScanDraftCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  checkpoint: ScanDraftCheckpoint,
): Promise<void> {
  const owner = requireOwnerIdentity(ownerIdentity);
  await saveLocalDraft(database, {
    draftKey: SCAN_DRAFT_KEY,
    kind: SCAN_DRAFT_KIND,
    ownerIdentity: owner,
    payload: checkpoint,
    version: SCAN_DRAFT_VERSION,
  });
}

/**
 * Reads this owner's last good checkpoint. A checkpoint whose managed image is
 * gone is removed and reported as absent rather than offered as recoverable.
 */
export function readScanDraftCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): ScanDraftRecord | null {
  try {
    const owner = requireOwnerIdentity(ownerIdentity);
    const record = readLocalDraft<unknown>(
      database,
      owner,
      SCAN_DRAFT_KIND,
      SCAN_DRAFT_KEY,
      SCAN_DRAFT_VERSION,
    );
    if (!record) {
      return null;
    }
    const checkpoint = parseScanDraftCheckpoint(record.payload, owner);
    if (!checkpoint) {
      return null;
    }
    if (!managedImageExists(checkpoint.managedImageUri)) {
      deleteScanDraftCheckpoint(database, owner);
      return null;
    }
    return { checkpoint, updatedAt: record.updatedAt };
  } catch {
    // A missing or still-migrating database must never break provider render.
    return null;
  }
}

/**
 * Removes the checkpoint row and its managed draft image. Returns true when the
 * checkpoint is gone afterwards; a failed row delete reports false so the
 * caller never claims the draft was discarded.
 */
export function deleteScanDraftCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): boolean {
  const owner = requireOwnerIdentity(ownerIdentity);
  let rowDeleted = true;
  try {
    const record = readLocalDraft<unknown>(
      database,
      owner,
      SCAN_DRAFT_KIND,
      SCAN_DRAFT_KEY,
      SCAN_DRAFT_VERSION,
    );
    const checkpoint = record ? parseScanDraftCheckpoint(record.payload, owner) : null;
    if (checkpoint) {
      deleteManagedScanImage(checkpoint.managedImageUri, owner);
    }
    deleteLocalDraft(database, owner, SCAN_DRAFT_KIND, SCAN_DRAFT_KEY);
  } catch (error: unknown) {
    rowDeleted = false;
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Discarding the saved scan draft failed.',
    );
  }
  return rowDeleted;
}

export function parseScanDraftCheckpoint(
  payload: unknown,
  ownerIdentity: string,
): ScanDraftCheckpoint | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const value = payload as Partial<ScanDraftCheckpoint>;
  if (
    typeof value.draftId !== 'string' ||
    value.draftId.length === 0 ||
    typeof value.managedImageUri !== 'string' ||
    !isManagedScanImageUri(value.managedImageUri) ||
    !isManagedImageOwnedBy(value.managedImageUri, ownerIdentity) ||
    (value.status !== 'image-selected' && value.status !== 'completed') ||
    (value.sourceType !== 'camera' && value.sourceType !== 'gallery')
  ) {
    return null;
  }
  const result = value.status === 'completed' ? sanitizeResult(value.result) : null;
  if (value.status === 'completed' && !result) {
    return null;
  }
  return {
    draftId: value.draftId,
    imageMimeType: typeof value.imageMimeType === 'string' ? value.imageMimeType : null,
    imageSizeBytes:
      typeof value.imageSizeBytes === 'number' && Number.isFinite(value.imageSizeBytes)
        ? value.imageSizeBytes
        : null,
    managedImageUri: value.managedImageUri,
    preprocessMs:
      typeof value.preprocessMs === 'number' && Number.isFinite(value.preprocessMs)
        ? value.preprocessMs
        : null,
    qualityAssessment: sanitizeQualityAssessment(value.qualityAssessment),
    reportedSeverity: sanitizeSeverity(value.reportedSeverity),
    result,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date(0).toISOString(),
    selectedSymptoms: sanitizeSymptoms(value.selectedSymptoms),
    sourceHeight: finiteOrNull(value.sourceHeight),
    sourceType: value.sourceType,
    sourceWidth: finiteOrNull(value.sourceWidth),
    status: value.status,
  };
}

function isManagedImageOwnedBy(uri: string, ownerIdentity: string): boolean {
  // Managed scan images live under .../scan-images/<owner>/<record>.<ext>.
  return uri.includes(`/scan-images/${ownerIdentity}/`);
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sanitizeSymptoms(value: unknown): ChecklistObservationId[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(
      (entry): entry is ChecklistObservationId =>
        typeof entry === 'string' && entry.length > 0 && entry.length <= 40,
    )
    .slice(0, MAX_SYMPTOMS);
}

function sanitizeSeverity(value: unknown): ReportedSeverity | null {
  return typeof value === 'string' &&
    (REPORTED_SEVERITIES as readonly string[]).includes(value)
    ? (value as ReportedSeverity)
    : null;
}

function sanitizeQualityAssessment(
  value: unknown,
): ImageQualityAssessment | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const assessment = value as Partial<ImageQualityAssessment>;
  if (!Array.isArray(assessment.warnings)) {
    return null;
  }
  const warnings = assessment.warnings.filter(
    (warning): warning is QualityWarning =>
      typeof warning === 'string' &&
      (QUALITY_WARNINGS as readonly string[]).includes(warning),
  );
  const meanLuminance = finiteOrNull(assessment.meanLuminance);
  const luminanceStandardDeviation = finiteOrNull(
    assessment.luminanceStandardDeviation,
  );
  if (meanLuminance === null || luminanceStandardDeviation === null) {
    return null;
  }
  return { warnings, meanLuminance, luminanceStandardDeviation };
}

function sanitizeResult(value: unknown): DetectionResult | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const result = value as Partial<DetectionResult>;
  if (
    typeof result.predictedLabel !== 'string' ||
    !(MODEL_LABELS as readonly string[]).includes(result.predictedLabel) ||
    typeof result.confidence !== 'number' ||
    !Number.isFinite(result.confidence) ||
    result.confidence < 0 ||
    result.confidence > 1 ||
    !Array.isArray(result.scores) ||
    result.scores.length !== MODEL_LABELS.length ||
    typeof result.modelVersion !== 'string' ||
    !result.timings ||
    typeof result.timings.preprocessMs !== 'number' ||
    typeof result.timings.inferenceMs !== 'number' ||
    typeof result.timings.totalMs !== 'number'
  ) {
    return null;
  }
  const scores = result.scores.filter(
    (score): score is DetectionResult['scores'][number] =>
      Boolean(score) &&
      typeof score.label === 'string' &&
      (MODEL_LABELS as readonly string[]).includes(score.label) &&
      typeof score.score === 'number' &&
      Number.isFinite(score.score),
  );
  if (scores.length !== MODEL_LABELS.length) {
    return null;
  }
  const predictedLabel = result.predictedLabel as ModelLabel;
  return {
    confidence: result.confidence,
    ...(typeof result.decisionSupportWording === 'string'
      ? { decisionSupportWording: result.decisionSupportWording.slice(0, 300) }
      : {}),
    modelVersion: result.modelVersion.slice(0, 80),
    predictedLabel,
    scores: scores.map((score) => ({
      label: score.label,
      score: score.score,
    })),
    timings: {
      inferenceMs: result.timings.inferenceMs,
      preprocessMs: result.timings.preprocessMs,
      totalMs: result.timings.totalMs,
    },
  };
}
