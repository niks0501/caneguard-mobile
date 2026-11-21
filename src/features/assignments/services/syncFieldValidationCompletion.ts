import { uploadMobileFieldValidationCompletion } from '@/features/assignments/api/mobileFieldValidationCompletionApi';
import type { FieldValidationCompletionSyncRepository } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type FieldValidationCompletionSyncResult =
  | { reportId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { reportId: string; status: 'failed'; error: SyncError }
  | { reportId: string; status: 'skipped' };

export interface SyncFieldValidationCompletionOptions {
  allowImmediateRetries?: boolean;
  delay?: (milliseconds: number) => Promise<void>;
  isSendHeld?: () => boolean;
  mapMultipart?: typeof mapFieldValidationCompletionToMultipart;
  now?: () => Date;
  onOutcome?: (result: FieldValidationCompletionSyncResult) => void;
  completionId: string;
  repository: FieldValidationCompletionSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileFieldValidationCompletion;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function syncFieldValidationCompletion({
  allowImmediateRetries = true,
  completionId,
  delay = wait,
  isSendHeld,
  mapMultipart = mapFieldValidationCompletionToMultipart,
  now = () => new Date(),
  onOutcome,
  repository,
  token,
  upload = uploadMobileFieldValidationCompletion,
}: SyncFieldValidationCompletionOptions): Promise<FieldValidationCompletionSyncResult> {
  const completion = await repository.findById(completionId);
  if (completion.syncStatus === 'synced') {
    return { reportId: completionId, remoteId: completion.remoteId, status: 'already-synced' };
  }
  const fail = async (error: SyncError): Promise<FieldValidationCompletionSyncResult> => {
    const result: FieldValidationCompletionSyncResult = { reportId: completionId, status: 'failed', error };
    onOutcome?.(result);
    await repository.markFailed(completionId, error.code, now().toISOString());
    return result;
  };
  if (!token) {
    return fail(new SyncError('AUTH_REQUIRED', 'Sign in before synchronizing visit evidence.'));
  }

  const attemptedAt = now().toISOString();
  if ((await repository.markSyncing(completionId, attemptedAt)) === 0) {
    return { reportId: completionId, status: 'skipped' };
  }
  try {
    const record: FieldValidationCompletionUploadRecord = { completion };
    const form = mapMultipart(record);
    if (isSendHeld?.()) {
      await repository.releaseClaim(completionId);
      return { reportId: completionId, status: 'skipped' };
    }
    let retryIndex = 0;
    while (true) {
      try {
        const uploaded = await upload(record, token, form);
        const syncedAt = now().toISOString();
        const result: FieldValidationCompletionSyncResult = { reportId: completionId, remoteId: uploaded.remoteId, status: 'synced' };
        onOutcome?.(result);
        await repository.markSynced(completionId, uploaded.remoteId, syncedAt);
        return result;
      } catch (error: unknown) {
        const syncError = toSyncError(error);
        if (syncError.code === 'UPLOAD_TOO_LARGE' || !syncError.retryable || !allowImmediateRetries || syncError.retryAfterMs !== null || retryIndex >= RETRY_DELAYS_MS.length) {
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
