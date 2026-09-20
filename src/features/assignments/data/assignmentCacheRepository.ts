import { and, asc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldValidationAssignments } from '@/database/schema';
import type {
  FieldValidationAssignment,
  FieldValidationAssignmentUpdate,
} from '@/features/assignments/domain/assignmentTypes';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import {
  getOwnerMobileDataStore,
  setOwnerAssignments,
} from '@/features/mobile-data/data/mobileDataStore';

export async function listCachedFieldValidationAssignments(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<FieldValidationAssignment[]> {
  const owner = requireOwner(ownerIdentity);
  try {
    const rows = await database
      .select()
      .from(fieldValidationAssignments)
      .where(eq(fieldValidationAssignments.ownerIdentity, owner))
      .orderBy(asc(fieldValidationAssignments.updatedAt), asc(fieldValidationAssignments.id));
    return rows.map(toAssignment);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading cached field validation assignments failed.',
    );
  }
}

/**
 * Replace one authenticated owner's complete server snapshot only after the
 * feed has been fully validated. A successful refresh removes assignments
 * that were reassigned away, while a failed refresh leaves the old cache intact.
 */
export async function findCachedFieldValidationAssignment(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
): Promise<FieldValidationAssignment | null> {
  const owner = requireOwner(ownerIdentity);
  try {
    const row = await database
      .select()
      .from(fieldValidationAssignments)
      .where(
        and(
          eq(fieldValidationAssignments.ownerIdentity, owner),
          eq(fieldValidationAssignments.id, assignmentId),
        ),
      )
      .get();
    return row ? toAssignment(row) : null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading the cached field validation assignment failed.',
    );
  }
}

export async function markCachedFieldValidationAssignmentInProgress(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
  updatedAt: string,
): Promise<void> {
  await updateCachedAssignmentState(database, ownerIdentity, assignmentId, 'in_progress', updatedAt);
}

export async function markCachedFieldValidationAssignmentCompleted(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
  updatedAt: string,
): Promise<void> {
  await updateCachedAssignmentState(database, ownerIdentity, assignmentId, 'completed', updatedAt);
}

async function updateCachedAssignmentState(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
  fieldValidationState: FieldValidationAssignment['fieldValidationState'],
  updatedAt: string,
): Promise<void> {
  const owner = requireOwner(ownerIdentity);
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) {
    throw new StorageError('UPDATE_FAILED', 'The assignment completion timestamp is invalid.');
  }
  try {
    await database
      .update(fieldValidationAssignments)
      .set({ fieldValidationState, updatedAt })
      .where(
        and(
          eq(fieldValidationAssignments.ownerIdentity, owner),
          eq(fieldValidationAssignments.id, assignmentId),
        ),
      );
    const store = getOwnerMobileDataStore(database, owner);
    if (store.assignments) {
      setOwnerAssignments(
        store,
        store.assignments.value.map((assignment) =>
          assignment.id === assignmentId
            ? { ...assignment, fieldValidationState, updatedAt }
            : assignment,
        ),
        store.assignments.fetchedAt,
      );
    }
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating the cached assignment completion state failed.',
    );
  }
}

export async function replaceCachedFieldValidationAssignments(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  updates: FieldValidationAssignmentUpdate[],
  cachedAt: string,
): Promise<void> {
  const owner = requireOwner(ownerIdentity);
  if (!cachedAt || Number.isNaN(Date.parse(cachedAt))) {
    throw new StorageError('UPDATE_FAILED', 'The assignment cache timestamp is invalid.');
  }

  try {
    const current = await listCachedFieldValidationAssignments(database, owner);
    const incoming = new Map(updates.map((update) => [update.id, update]));
    const currentById = new Map(current.map((assignment) => [assignment.id, assignment]));
    const removed = current.some((assignment) => !incoming.has(assignment.id));
    const changed = updates.some((update) => {
      const previous = currentById.get(update.id);
      if (!previous) return true;
      const { ownerIdentity: _owner, cachedAt: _cachedAt, ...previousData } = previous;
      return stableFingerprint(previousData) !== stableFingerprint(update);
    });

    if (!removed && !changed) {
      database
        .update(fieldValidationAssignments)
        .set({ cachedAt })
        .where(eq(fieldValidationAssignments.ownerIdentity, owner))
        .run();
      return;
    }

    database.transaction((transaction) => {
      for (const assignment of current) {
        if (!incoming.has(assignment.id)) {
          transaction
            .delete(fieldValidationAssignments)
            .where(
              and(
                eq(fieldValidationAssignments.ownerIdentity, owner),
                eq(fieldValidationAssignments.id, assignment.id),
              ),
            )
            .run();
        }
      }

      transaction
        .update(fieldValidationAssignments)
        .set({ cachedAt })
        .where(eq(fieldValidationAssignments.ownerIdentity, owner))
        .run();

      for (const update of updates) {
        const previous = currentById.get(update.id);
        const { ownerIdentity: _owner, cachedAt: _cachedAt, ...previousData } = previous ?? {};
        if (!previous || stableFingerprint(previousData) !== stableFingerprint(update)) {
          if (previous) {
            transaction
              .delete(fieldValidationAssignments)
              .where(
                and(
                  eq(fieldValidationAssignments.ownerIdentity, owner),
                  eq(fieldValidationAssignments.id, update.id),
                ),
              )
              .run();
          }
          transaction
            .insert(fieldValidationAssignments)
            .values(toRow(update, owner, cachedAt))
            .run();
        }
      }
    });
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating cached field validation assignments failed.',
    );
  }
}

function toRow(
  update: FieldValidationAssignmentUpdate,
  ownerIdentity: string,
  cachedAt: string,
): typeof fieldValidationAssignments.$inferInsert {
  return {
    id: update.id,
    ownerIdentity,
    reportUuid: update.reportUuid,
    reportClientUuid: update.reportClientUuid,
    referenceCode: update.referenceCode,
    submitterUuid: update.submitter.uuid,
    submitterName: update.submitter.name,
    assigneeUuid: update.assignee.uuid,
    assigneeName: update.assignee.name,
    submitterIsAssignee: update.submitterIsAssignee,
    targetVisitDate: update.targetVisitDate,
    fieldValidationState: update.fieldValidationState,
    assignedAt: update.assignedAt,
    updatedAt: update.updatedAt,
    cachedAt,
    barangay: update.case.barangay,
    province: update.case.province,
    municipality: update.case.municipality,
    farmerOrFarmOwnerName: update.case.farmerOrFarmOwnerName,
    affectedAreaHectares: update.case.affectedAreaHectares,
    affectedPortionPercent: update.case.affectedPortionPercent,
    capturedAt: update.case.capturedAt,
    observedAt: update.case.observedAt,
    submittedAt: update.case.submittedAt,
    predictedLabel: update.case.predictedLabel,
    confidence: update.case.confidence,
    previousVisitJson: update.previousVisit ? JSON.stringify(update.previousVisit) : null,
  };
}

function toAssignment(
  row: typeof fieldValidationAssignments.$inferSelect,
): FieldValidationAssignment {
  return {
    id: row.id,
    ownerIdentity: row.ownerIdentity,
    reportUuid: row.reportUuid,
    reportClientUuid: row.reportClientUuid,
    referenceCode: row.referenceCode,
    submitter: { uuid: row.submitterUuid, name: row.submitterName },
    assignee: { uuid: row.assigneeUuid, name: row.assigneeName },
    submitterIsAssignee: row.submitterIsAssignee,
    targetVisitDate: row.targetVisitDate,
    fieldValidationState: row.fieldValidationState,
    assignedAt: row.assignedAt,
    updatedAt: row.updatedAt,
    cachedAt: row.cachedAt,
    case: {
      barangay: row.barangay,
      province: row.province,
      municipality: row.municipality,
      farmerOrFarmOwnerName: row.farmerOrFarmOwnerName,
      affectedAreaHectares: row.affectedAreaHectares,
      affectedPortionPercent: row.affectedPortionPercent,
      capturedAt: row.capturedAt,
      observedAt: row.observedAt,
      submittedAt: row.submittedAt,
      predictedLabel: row.predictedLabel,
      confidence: row.confidence,
    },
    previousVisit: parsePreviousVisit(row.previousVisitJson),
  };
}

function parsePreviousVisit(value: string | null): PreviousVisitContext | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as PreviousVisitContext;
  } catch {
    return null;
  }
}

function stableFingerprint(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableFingerprint).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableFingerprint(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) {
    throw new StorageError('UPDATE_FAILED', 'The assignment cache owner is invalid.');
  }
  return owner;
}
