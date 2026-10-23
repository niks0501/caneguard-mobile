import { FIELD_VALIDATION_FOLLOW_UP_OUTCOMES, type FieldValidationFollowUpOutcome } from '@/database/schema';
import type { CaneGuardDatabase } from '@/database/database';
import {
  deleteLocalDraft,
  readLocalDraft,
  saveLocalDraft,
} from '@/database/localDraftRepository';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import type { FieldValidationPhotoArtifact } from '@/features/assignments/services/fieldValidationPhotoStorage';

export const FIELD_VALIDATION_DRAFT_KIND = 'field_validation' as const;
export const FIELD_VALIDATION_DRAFT_VERSION = 1;

const MAX_TEXT = 4000;

export interface FieldValidationCheckpoint {
  action: string;
  finding: string;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  observation: string;
  photo: FieldValidationPhotoArtifact | null;
  savedAt: string;
}

export interface FieldValidationDraftRecord {
  checkpoint: FieldValidationCheckpoint;
  updatedAt: string;
}

export async function writeFieldValidationCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
  checkpoint: FieldValidationCheckpoint,
): Promise<void> {
  await saveLocalDraft(database, {
    draftKey: assignmentId,
    kind: FIELD_VALIDATION_DRAFT_KIND,
    ownerIdentity: requireOwnerIdentity(ownerIdentity),
    payload: checkpoint,
    version: FIELD_VALIDATION_DRAFT_VERSION,
  });
}

export function readFieldValidationCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
): FieldValidationDraftRecord | null {
  let owner: string;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
  } catch {
    return null;
  }
  const record = readLocalDraft<unknown>(
    database,
    owner,
    FIELD_VALIDATION_DRAFT_KIND,
    assignmentId,
    FIELD_VALIDATION_DRAFT_VERSION,
  );
  if (!record) {
    return null;
  }
  const checkpoint = parseFieldValidationCheckpoint(record.payload);
  return checkpoint ? { checkpoint, updatedAt: record.updatedAt } : null;
}

export function deleteFieldValidationCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
): boolean {
  try {
    return deleteLocalDraft(
      database,
      requireOwnerIdentity(ownerIdentity),
      FIELD_VALIDATION_DRAFT_KIND,
      assignmentId,
    );
  } catch {
    return false;
  }
}

function parseFieldValidationCheckpoint(
  payload: unknown,
): FieldValidationCheckpoint | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const value = payload as Partial<FieldValidationCheckpoint>;
  if (
    typeof value.observation !== 'string' ||
    typeof value.finding !== 'string' ||
    typeof value.action !== 'string' ||
    (value.followUpOutcome !== null &&
      value.followUpOutcome !== undefined &&
      !(FIELD_VALIDATION_FOLLOW_UP_OUTCOMES as readonly string[]).includes(
        value.followUpOutcome,
      ))
  ) {
    return null;
  }
  return {
    action: value.action.slice(0, MAX_TEXT),
    finding: value.finding.slice(0, MAX_TEXT),
    followUpOutcome: (value.followUpOutcome ?? null) as FieldValidationFollowUpOutcome | null,
    observation: value.observation.slice(0, MAX_TEXT),
    photo: parsePhoto(value.photo),
    savedAt:
      typeof value.savedAt === 'string'
        ? value.savedAt
        : new Date(0).toISOString(),
  };
}

function parsePhoto(value: unknown): FieldValidationPhotoArtifact | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const photo = value as Partial<FieldValidationPhotoArtifact>;
  if (
    typeof photo.uri !== 'string' ||
    typeof photo.mimeType !== 'string' ||
    typeof photo.sizeBytes !== 'number' ||
    !Number.isFinite(photo.sizeBytes) ||
    photo.sizeBytes <= 0
  ) {
    return null;
  }
  return {
    mimeType: photo.mimeType,
    sizeBytes: photo.sizeBytes,
    uri: photo.uri,
  };
}
