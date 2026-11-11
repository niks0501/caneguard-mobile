import { and, desc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldReports, fieldSurveys, localDrafts, scanRecords } from '@/database/schema';
import type { UnfinishedDraft } from '@/features/activity/domain/needsAttention';
import { FIELD_VALIDATION_DRAFT_KIND } from '@/features/assignments/drafts/fieldValidationDraft';

/**
 * Report, visit and plot drafts this owner started and has not finished, newest
 * first. Read-only and local: nothing here is uploaded, and a finalized report
 * is never listed (its `authoringState` is no longer `draft`).
 */
export async function listUnfinishedDrafts(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<UnfinishedDraft[]> {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const reports = database
      .select({
        scanRecordId: fieldReports.scanRecordId,
        barangay: fieldReports.barangay,
        updatedAt: fieldReports.updatedAt,
      })
      .from(fieldReports)
      .innerJoin(
        scanRecords,
        and(eq(scanRecords.id, fieldReports.scanRecordId), eq(scanRecords.ownerIdentity, owner)),
      )
      .where(and(eq(fieldReports.submitterIdentity, owner), eq(fieldReports.authoringState, 'draft')))
      .orderBy(desc(fieldReports.updatedAt))
      .all();
    const visits = database
      .select({ draftKey: localDrafts.draftKey, updatedAt: localDrafts.updatedAt })
      .from(localDrafts)
      .where(and(eq(localDrafts.ownerIdentity, owner), eq(localDrafts.kind, FIELD_VALIDATION_DRAFT_KIND)))
      .all();
    const plots = database
      .select({ clientUuid: fieldSurveys.clientUuid, updatedAt: fieldSurveys.updatedAt })
      .from(fieldSurveys)
      .where(and(eq(fieldSurveys.ownerIdentity, owner), eq(fieldSurveys.status, 'draft')))
      .all();

    return [
      ...reports.map((row): UnfinishedDraft => ({
        kind: 'report',
        id: row.scanRecordId,
        place: row.barangay,
        updatedAt: row.updatedAt,
      })),
      ...visits.map((row): UnfinishedDraft => ({
        kind: 'visit',
        id: row.draftKey,
        place: null,
        updatedAt: row.updatedAt,
      })),
      ...plots.map((row): UnfinishedDraft => ({
        kind: 'plot',
        id: row.clientUuid,
        place: null,
        updatedAt: row.updatedAt,
      })),
    ];
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading unfinished drafts failed.');
  }
}
