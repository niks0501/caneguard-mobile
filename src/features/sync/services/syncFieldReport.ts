import type { FieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import { mapFieldReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type SyncResult =
  | { reportId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { reportId: string; status: 'failed'; error: SyncError };

interface SyncFieldReportOptions {
  allowImmediateRetries?: boolean;
  delay?: (milliseconds: number) => Promise<void>;
  mapMultipart?: typeof mapFieldReportToMultipart;
  now?: () => Date;
  reportId: string;
  repository: FieldReportSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileReport;
}

export async function syncFieldReport({
  allowImmediateRetries = true,
  delay = wait,
  mapMultipart = mapFieldReportToMultipart,
  now = () => new Date(),
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
  if (!token) {
    const error = new SyncError(
      'AUTH_REQUIRED',
      'Sign in before uploading pending reports.',
    );
    await repository.markFailed(reportId, error.code, now().toISOString());
    return { reportId, status: 'failed', error };
  }

  const attemptedAt = now().toISOString();
  await repository.markSyncing(reportId, attemptedAt);

  try {
    const form = mapMultipart(uploadRecord);
    let retryIndex = 0;

    while (true) {
      try {
        const uploaded = await upload(form, token);
        const syncedAt = now().toISOString();
        await repository.markSynced(reportId, uploaded.remoteId, syncedAt);
        return { reportId, remoteId: uploaded.remoteId, status: 'synced' };
      } catch (error: unknown) {
        const syncError = toSyncError(error);
        if (
          !syncError.retryable ||
          !allowImmediateRetries ||
          retryIndex >= RETRY_DELAYS_MS.length
        ) {
          throw syncError;
        }
        const retryDelay = Math.min(
          syncError.retryAfterMs ?? RETRY_DELAYS_MS[retryIndex],
          60_000,
        );
        retryIndex += 1;
        await delay(retryDelay);
      }
    }
  } catch (error: unknown) {
    const syncError = toSyncError(error);
    await repository.markFailed(reportId, syncError.code, now().toISOString());
    return { reportId, status: 'failed', error: syncError };
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
