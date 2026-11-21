import type { FieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type SyncResult =
  | { reportId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { reportId: string; status: 'failed'; error: SyncError }
  /** Another run already holds this row (or it left the sendable states), so nothing was uploaded. */
  | { reportId: string; status: 'skipped' };

interface SyncFieldReportOptions {
  allowImmediateRetries?: boolean;
  delay?: (milliseconds: number) => Promise<void>;
  isSendHeld?: () => boolean;
  mapMultipart?: typeof mapFieldReportToMultipart;
  now?: () => Date;
  onOutcome?: (result: SyncResult) => void;
  reportId: string;
  repository: FieldReportSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileReport;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function syncFieldReport({
  allowImmediateRetries = true,
  delay = wait,
  isSendHeld,
  mapMultipart = mapFieldReportToMultipart,
  now = () => new Date(),
  onOutcome,
  reportId,
  repository,
  token,
  upload = uploadMobileReport,
}: SyncFieldReportOptions): Promise<SyncResult> {
  const uploadRecord = await repository.findById(reportId);
  if (uploadRecord.report.syncStatus === 'synced') {
    return {
      reportId,
      remoteId: uploadRecord.report.remoteId,
      status: 'already-synced',
    };
  }
  const fail = async (error: SyncError): Promise<SyncResult> => {
    const result: SyncResult = { reportId, status: 'failed', error };
    onOutcome?.(result);
    await repository.markFailed(reportId, error.code, now().toISOString());
    return result;
  };
  if (!token) {
    return fail(new SyncError('AUTH_REQUIRED', 'Sign in before uploading pending reports.'));
  }

  const attemptedAt = now().toISOString();
  if ((await repository.markSyncing(reportId, attemptedAt)) === 0) {
    return { reportId, status: 'skipped' };
  }

  try {
    const form = mapMultipart(uploadRecord);
    if (isSendHeld?.()) {
      await repository.releaseClaim(reportId);
      return { reportId, status: 'skipped' };
    }
    let retryIndex = 0;

    while (true) {
      try {
        const uploaded = await upload(form, token);
        const syncedAt = now().toISOString();
        const result: SyncResult = { reportId, remoteId: uploaded.remoteId, status: 'synced' };
        onOutcome?.(result);
        await repository.markSynced(reportId, uploaded.remoteId, syncedAt);
        return result;
      } catch (error: unknown) {
        const syncError = toSyncError(error, { endpoint: 'report' });
        if (
          !syncError.retryable ||
          !allowImmediateRetries ||
          syncError.code === 'UPLOAD_TOO_LARGE' ||
          syncError.retryAfterMs !== null ||
          retryIndex >= RETRY_DELAYS_MS.length
        ) {
          throw syncError;
        }
        const retryDelay = RETRY_DELAYS_MS[retryIndex];
        retryIndex += 1;
        await delay(retryDelay);
        if (isSendHeld?.()) {
          throw syncError;
        }
      }
    }
  } catch (error: unknown) {
    return fail(toSyncError(error, { endpoint: 'report' }));
  }
}
