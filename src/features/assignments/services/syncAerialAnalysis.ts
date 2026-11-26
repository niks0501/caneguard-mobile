import {
  mapAerialUploadToMultipart,
  uploadMobileAerialAnalysis,
} from '@/features/assignments/api/mobileAerialUploadApi';
import type { AerialAnalysisSyncRepository } from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import type { OfficeAerialCheck } from '@/features/assignments/domain/assignmentTypes';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type AerialAnalysisSyncResult =
  | { reportId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { reportId: string; status: 'failed'; error: SyncError }
  | { reportId: string; status: 'skipped' };

export interface SyncAerialAnalysisOptions {
  allowImmediateRetries?: boolean;
  delay?: (milliseconds: number) => Promise<void>;
  isSendHeld?: () => boolean;
  mapMultipart?: typeof mapAerialUploadToMultipart;
  now?: () => Date;
  onAerialCheckUpdated?: (
    assignmentId: string,
    aerialCheck: OfficeAerialCheck | null,
  ) => Promise<void> | void;
  onOutcome?: (result: AerialAnalysisSyncResult) => void;
  repository: AerialAnalysisSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileAerialAnalysis;
  uploadId: string;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function syncAerialAnalysis({
  allowImmediateRetries = true,
  delay = wait,
  isSendHeld,
  mapMultipart = mapAerialUploadToMultipart,
  now = () => new Date(),
  onAerialCheckUpdated,
  onOutcome,
  repository,
  token,
  upload = uploadMobileAerialAnalysis,
  uploadId,
}: SyncAerialAnalysisOptions): Promise<AerialAnalysisSyncResult> {
  const item = await repository.findById(uploadId);
  if (item.syncStatus === 'synced') {
    return { reportId: uploadId, remoteId: item.remoteId, status: 'already-synced' };
  }

  const fail = async (error: SyncError): Promise<AerialAnalysisSyncResult> => {
    const result: AerialAnalysisSyncResult = { reportId: uploadId, status: 'failed', error };
    onOutcome?.(result);
    await repository.markFailed(uploadId, error.code, now().toISOString());
    return result;
  };

  if (!token) {
    return fail(new SyncError('AUTH_REQUIRED', 'Sign in before uploading drone photos.'));
  }

  const attemptedAt = now().toISOString();
  if ((await repository.markSyncing(uploadId, attemptedAt)) === 0) {
    return { reportId: uploadId, status: 'skipped' };
  }

  try {
    const form = mapMultipart(item);
    if (isSendHeld?.()) {
      await repository.releaseClaim(uploadId);
      return { reportId: uploadId, status: 'skipped' };
    }

    let retryIndex = 0;
    while (true) {
      try {
        const uploaded = await upload(item, token, form);
        const syncedAt = now().toISOString();
        await repository.markSynced(uploadId, uploaded.remoteId, syncedAt);
        if (uploaded.hasAerialCheck) {
          await onAerialCheckUpdated?.(item.assignmentId, uploaded.aerialCheck);
        }
        const result: AerialAnalysisSyncResult = {
          reportId: uploadId,
          remoteId: uploaded.remoteId,
          status: 'synced',
        };
        onOutcome?.(result);
        return result;
      } catch (error: unknown) {
        const syncError = toSyncError(error);
        if (
          syncError.code === 'UPLOAD_TOO_LARGE' ||
          !syncError.retryable ||
          !allowImmediateRetries ||
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
    return fail(toSyncError(error));
  }
}
