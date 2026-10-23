import type { CaneGuardDatabase } from '@/database/database';
import {
  deleteLocalDraft,
  readLocalDraft,
  saveLocalDraft,
} from '@/database/localDraftRepository';
import type { MeasurementProvenance } from '@/database/schema';
import { requireOwnerIdentity } from '@/database/ownerIdentity';

export const FIELD_REPORT_FORM_DRAFT_KIND = 'field_report' as const;
export const FIELD_REPORT_FORM_DRAFT_VERSION = 1;

const PROVENANCES: readonly MeasurementProvenance[] = ['measured', 'not_measured'];
const MAX_SHORT_TEXT = 500;
const MAX_NOTES = 4000;

export interface FieldReportFormCheckpoint {
  affectedAreaChoice: MeasurementProvenance | null;
  affectedAreaText: string;
  affectedPortionChoice: MeasurementProvenance | null;
  affectedPortionText: string;
  barangay: string;
  caneClass: string;
  cropAge: string;
  farmerName: string;
  mismatchReported: boolean | null;
  municipality: string;
  notes: string;
  province: string;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
  savedAt: string;
  step: number;
  variety: string;
}

export interface FieldReportFormDraftRecord {
  checkpoint: FieldReportFormCheckpoint;
  updatedAt: string;
}

export async function writeFieldReportFormCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  reportId: string,
  checkpoint: FieldReportFormCheckpoint,
): Promise<void> {
  await saveLocalDraft(database, {
    draftKey: reportId,
    kind: FIELD_REPORT_FORM_DRAFT_KIND,
    ownerIdentity: requireOwnerIdentity(ownerIdentity),
    payload: checkpoint,
    version: FIELD_REPORT_FORM_DRAFT_VERSION,
  });
}

/**
 * Reads the owner's last good form checkpoint for one Draft. Finalized reports
 * never hydrate a checkpoint, and a payload from an older schema version is
 * discarded rather than applied to current fields.
 */
export function readFieldReportFormCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  reportId: string,
  reportAuthoringState: 'draft' | 'ready_for_submission' | 'finalized',
): FieldReportFormDraftRecord | null {
  if (reportAuthoringState !== 'draft') {
    return null;
  }
  let owner: string;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
  } catch {
    return null;
  }
  const record = readLocalDraft<unknown>(
    database,
    owner,
    FIELD_REPORT_FORM_DRAFT_KIND,
    reportId,
    FIELD_REPORT_FORM_DRAFT_VERSION,
  );
  if (!record) {
    return null;
  }
  const checkpoint = parseFieldReportFormCheckpoint(record.payload);
  return checkpoint ? { checkpoint, updatedAt: record.updatedAt } : null;
}

export function deleteFieldReportFormCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  reportId: string,
): boolean {
  try {
    return deleteLocalDraft(
      database,
      requireOwnerIdentity(ownerIdentity),
      FIELD_REPORT_FORM_DRAFT_KIND,
      reportId,
    );
  } catch {
    return false;
  }
}

function parseFieldReportFormCheckpoint(
  payload: unknown,
): FieldReportFormCheckpoint | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const value = payload as Partial<FieldReportFormCheckpoint>;
  if (
    typeof value.step !== 'number' ||
    !Number.isInteger(value.step) ||
    value.step < 1 ||
    value.step > 5 ||
    (value.mismatchReported !== null && typeof value.mismatchReported !== 'boolean')
  ) {
    return null;
  }
  return {
    affectedAreaChoice: sanitizeProvenance(value.affectedAreaChoice),
    affectedAreaText: boundedText(value.affectedAreaText, 40),
    affectedPortionChoice: sanitizeProvenance(value.affectedPortionChoice),
    affectedPortionText: boundedText(value.affectedPortionText, 40),
    barangay: boundedText(value.barangay, MAX_SHORT_TEXT),
    caneClass: boundedText(value.caneClass, MAX_SHORT_TEXT),
    cropAge: boundedText(value.cropAge, MAX_SHORT_TEXT),
    farmerName: boundedText(value.farmerName, MAX_SHORT_TEXT),
    mismatchReported: value.mismatchReported ?? null,
    municipality: boundedText(value.municipality, MAX_SHORT_TEXT),
    notes: boundedText(value.notes, MAX_NOTES),
    province: boundedText(value.province, MAX_SHORT_TEXT),
    reporterObservationText: boundedText(value.reporterObservationText, MAX_NOTES),
    reporterSuspectedCondition: boundedText(value.reporterSuspectedCondition, MAX_SHORT_TEXT),
    savedAt:
      typeof value.savedAt === 'string'
        ? value.savedAt
        : new Date(0).toISOString(),
    step: value.step,
    variety: boundedText(value.variety, MAX_SHORT_TEXT),
  };
}

function sanitizeProvenance(value: unknown): MeasurementProvenance | null {
  return typeof value === 'string' &&
    (PROVENANCES as readonly string[]).includes(value)
    ? (value as MeasurementProvenance)
    : null;
}

function boundedText(value: unknown, maximum: number): string {
  return typeof value === 'string' ? value.slice(0, maximum) : '';
}
