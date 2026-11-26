import type { CaneGuardDatabase } from '@/database/database';
import { requeueFailedAerialAnalyses } from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import { requeueFailedFieldValidationCompletions } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { requeueFailedFieldReports } from '@/features/reports/data/fieldReportSyncRepository';
import { requeueFailedFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import {
  ACCESS_FAILURE_SYNC_ERROR_CODES,
  RESENDABLE_SYNC_ERROR_CODES,
} from '@/features/sync/errors/syncErrors';

/**
 * 'access': only failures caused by the account's standing, re-queued for the
 *   record types the account holds the capability to send again.
 * 'all': every failure that sending again could still fix ("Send all again").
 */
export type RequeueScope =
  | 'all'
  | { access: { authorReports: boolean; completeValidations: boolean } };

/** Moves failed reports, boundaries and visit evidence back to waiting; returns how many moved. */
export async function requeueFailedSends(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  scope: RequeueScope,
): Promise<number> {
  const codes =
    scope === 'all' ? RESENDABLE_SYNC_ERROR_CODES : ACCESS_FAILURE_SYNC_ERROR_CODES;
  const authorReports = scope === 'all' || scope.access.authorReports;
  const completeValidations = scope === 'all' || scope.access.completeValidations;
  const [surveys, reports, completions, aerialUploads] = await Promise.all([
    authorReports ? requeueFailedFieldSurveys(database, ownerIdentity, codes) : 0,
    authorReports ? requeueFailedFieldReports(database, ownerIdentity, codes) : 0,
    completeValidations
      ? requeueFailedFieldValidationCompletions(database, ownerIdentity, codes)
      : 0,
    completeValidations
      ? requeueFailedAerialAnalyses(database, ownerIdentity, codes)
      : 0,
  ]);
  return surveys + reports + completions + aerialUploads;
}
