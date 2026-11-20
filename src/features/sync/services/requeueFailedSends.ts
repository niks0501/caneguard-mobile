import type { CaneGuardDatabase } from '@/database/database';
import { requeueFailedFieldValidationCompletions } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { requeueFailedFieldReports } from '@/features/reports/data/fieldReportSyncRepository';
import { requeueFailedFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import {
  ACCESS_FAILURE_SYNC_ERROR_CODES,
  RESENDABLE_SYNC_ERROR_CODES,
} from '@/features/sync/errors/syncErrors';

/**
 * 'access': only failures caused by the account's standing (sign-in, access),
 *   run after a fresh sign-in or capability grant.
 * 'all': every failure that sending again could still fix ("Send all again").
 */
export type RequeueScope = 'access' | 'all';

/** Moves failed reports, boundaries and visit evidence back to waiting; returns how many moved. */
export async function requeueFailedSends(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  scope: RequeueScope,
): Promise<number> {
  const codes =
    scope === 'access'
      ? ACCESS_FAILURE_SYNC_ERROR_CODES
      : RESENDABLE_SYNC_ERROR_CODES;
  const surveys = requeueFailedFieldSurveys(database, ownerIdentity, codes);
  const [reports, completions] = await Promise.all([
    requeueFailedFieldReports(database, ownerIdentity, codes),
    requeueFailedFieldValidationCompletions(database, ownerIdentity, codes),
  ]);
  return surveys + reports + completions;
}
