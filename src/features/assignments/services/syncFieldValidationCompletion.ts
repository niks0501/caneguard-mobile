import { uploadMobileFieldValidationCompletion } from '@/features/assignments/api/mobileFieldValidationCompletionApi';
import type { FieldValidationCompletionSyncRepository } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type FieldValidationCompletionSyncResult =
  | { reportId: string; status: 'already-synced' | 'synced'; remoteId: string | null }
  | { reportId: string; status: 'failed'; error: SyncError };

export interface SyncFieldValidationCompletionOptions {
  allowImmediateRetries?: boolean;
  delay?: (milliseconds: number) => Promise<void>;
  mapMultipart?: typeof mapFieldValidationCompletionToMultipart;
  now?: () => Date;
  completionId: string;
  repository: FieldValidationCompletionSyncRepository;
  token: string | null;
  upload?: typeof uploadMobileFieldValidationCompletion;
}

export async function syncFieldValidationCompletion({
  allowImmediateRetries = true,
  completionId,
  delay = wait,
  mapMultipart = mapFieldValidationCompletionToMultipart,
  now = () => new Date(),
  repository,
  token,
  upload = uploadMobileFieldValidationCompletion,
}: SyncFieldValidationCompletionOptions): Promise<FieldValidationCompletionSyncResult> {
  const completion = await repository.findById(completionId);
  if (completion.syncStatus === 'synced') {
    return { reportId: completionId, remoteId: completion.remoteId, status: 'already-synced' };
  }
  if (!token) {
    const error = new SyncError('AUTH_REQUIRED', 'Sign in before synchronizing field validation evidence.');
    await repository.markFailed(completionId, error.code, now().toISOString());
    return { reportId: completionId, status: 'failed', error };
  }

  const attemptedAt = now().toISOString();
  await repository.markSyncing(completionId, attemptedAt);
  try {
    const record: FieldValidationCompletionUploadRecord = { completion };
    const form = mapMultipart(record);
    let retryIndex = 0;
    while (true) {
      try {
        const uploaded = await upload(record, token, form);
        const syncedAt = now().toISOString();
        await repository.markSynced(completionId, uploaded.remoteId, syncedAt);
        return { reportId: completionId, remoteId: uploaded.remoteId, status: 'synced' };
      } catch (error: unknown) {
        const syncError = toSyncError(error);
        if (!syncError.retryable || !allowImmediateRetries || retryIndex >= RETRY_DELAYS_MS.length) {
          throw syncError;
        }
        const retryDelay = Math.min(syncError.retryAfterMs ?? RETRY_DELAYS_MS[retryIndex], 60_000);
        retryIndex += 1;
        await delay(retryDelay);
      }
    }
  } catch (error: unknown) {
    const syncError = toSyncError(error);
    await repository.markFailed(completionId, syncError.code, now().toISOString());
    return { reportId: completionId, status: 'failed', error: syncError };
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
