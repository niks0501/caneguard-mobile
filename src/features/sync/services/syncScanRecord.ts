import type { ScanRecordSyncRepository } from '@/features/records/data/scanRecordSyncRepository';
import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import { mapReportToMultipart } from '@/features/sync/mappers/reportMultipartMapper';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type SyncResult =
  | { recordId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { recordId: string; status: 'failed'; error: SyncError };

interface SyncScanRecordOptions {
  delay?: (milliseconds: number) => Promise<void>;
  mapMultipart?: typeof mapReportToMultipart;
  now?: () => Date;
  recordId: string;
  repository: ScanRecordSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileReport;
}

export async function syncScanRecord({
  delay = wait,
  mapMultipart = mapReportToMultipart,
  now = () => new Date(),
  recordId,
  repository,
  token,
  upload = uploadMobileReport,
}: SyncScanRecordOptions): Promise<SyncResult> {
  const record = await repository.findById(recordId);
  if (record.syncStatus === 'synced') {
    return {
      recordId,
      remoteId: record.remoteId,
      status: 'already-synced',
    };
  }
  if (!token) {
    const error = new SyncError(
      'AUTH_REQUIRED',
      'Sign in before uploading pending reports.',
    );
    await repository.markFailed(recordId, error.code, now().toISOString());
    return { recordId, status: 'failed', error };
  }

  const attemptedAt = now().toISOString();
  await repository.markSyncing(recordId, attemptedAt);

  try {
    const form = mapMultipart(record);
    let retryIndex = 0;

    while (true) {
      try {
        const uploaded = await upload(form, token);
        const syncedAt = now().toISOString();
        await repository.markSynced(recordId, uploaded.remoteId, syncedAt);
        return {
          recordId,
          remoteId: uploaded.remoteId,
          status: 'synced',
        };
      } catch (error: unknown) {
        const syncError = toSyncError(error);
        if (!syncError.retryable || retryIndex >= RETRY_DELAYS_MS.length) {
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
    await repository.markFailed(
      recordId,
      syncError.code,
      now().toISOString(),
    );
    return { recordId, status: 'failed', error: syncError };
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
