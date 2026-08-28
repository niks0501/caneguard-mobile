import { asc, eq, or } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldValidationAssignments } from '@/database/schema';
import type {
  FieldValidationAssignment,
  FieldValidationAssignmentUpdate,
} from '@/features/assignments/domain/assignmentTypes';

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
    database.transaction((transaction) => {
      transaction
        .delete(fieldValidationAssignments)
        .where(eq(fieldValidationAssignments.ownerIdentity, owner))
        .run();

      for (const update of updates) {
        transaction
          .delete(fieldValidationAssignments)
          .where(
            or(
              eq(fieldValidationAssignments.id, update.id),
              eq(fieldValidationAssignments.reportUuid, update.reportUuid),
            ),
          )
          .run();
        transaction
          .insert(fieldValidationAssignments)
          .values(toRow(update, owner, cachedAt))
          .run();
      }
    });
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
  };
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) {
    throw new StorageError('UPDATE_FAILED', 'The assignment cache owner is invalid.');
  }
  return owner;
}
