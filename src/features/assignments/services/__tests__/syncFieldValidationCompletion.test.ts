import type { FieldValidationCompletionSyncRepository } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { syncFieldValidationCompletion } from '@/features/assignments/services/syncFieldValidationCompletion';
import { SyncError } from '@/features/sync/errors/syncErrors';

const COMPLETION: FieldValidationCompletion = {
  id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
  ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
  assignmentId: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
  reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  fieldObservation: 'Fresh observation',
  fieldFinding: 'Fresh finding',
  actionTaken: 'Fresh action',
  visitedAt: '2026-09-02T04:05:06.123Z',
  gpsOutcome: 'unavailable',
  gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAccuracy: null,
  freshPhotoUri: null,
  freshPhotoMimeType: null,
  freshPhotoSizeBytes: null,
  syncStatus: 'pending',
  remoteId: null,
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
  createdAt: '2026-09-02T04:05:06.123Z',
  updatedAt: '2026-09-02T04:05:06.123Z',
};

function repository(): FieldValidationCompletionSyncRepository {
  return {
    countUnsynced: jest.fn(),
    findById: jest.fn(async () => COMPLETION),
    findLastSuccessfulSyncAt: jest.fn(),
    findSyncCandidates: jest.fn(),
    markFailed: jest.fn(),
    markPending: jest.fn(),
    markSynced: jest.fn(),
    markSyncing: jest.fn(),
    resetStaleSyncing: jest.fn(),
  };
}

describe('field validation completion synchronization', () => {
  it('keeps offline evidence after a network failure and synchronizes the same completion on reconnect', async () => {
    const firstRepository = repository();
    const upload = jest.fn(async () => {
      throw new SyncError('NETWORK_REQUEST_FAILED', 'offline');
    });
    const first = await syncFieldValidationCompletion({
      allowImmediateRetries: false,
      completionId: COMPLETION.id,
      repository: firstRepository,
      token: 'secure-token',
      upload,
    });

    expect(first).toMatchObject({ reportId: COMPLETION.id, status: 'failed' });
    expect(firstRepository.markFailed).toHaveBeenCalledWith(
      COMPLETION.id,
      'NETWORK_REQUEST_FAILED',
      expect.any(String),
    );

    const secondRepository = repository();
    const retry = await syncFieldValidationCompletion({
      allowImmediateRetries: false,
      completionId: COMPLETION.id,
      repository: secondRepository,
      token: 'secure-token',
      upload: jest.fn(async (record) => {
        expect(record.completion.id).toBe(COMPLETION.id);
        return { remoteId: 'server-completion-uuid' };
      }),
    });

    expect(retry).toEqual({
      reportId: COMPLETION.id,
      remoteId: 'server-completion-uuid',
      status: 'synced',
    });
    expect(secondRepository.markSyncing).toHaveBeenCalled();
    expect(secondRepository.markSynced).toHaveBeenCalledWith(
      COMPLETION.id,
      'server-completion-uuid',
      expect.any(String),
    );
  });
});
