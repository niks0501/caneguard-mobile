import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import {
  findCachedFieldValidationAssignment,
  markCachedFieldValidationAssignmentInProgress,
} from '@/features/assignments/data/assignmentCacheRepository';
import {
  findFieldValidationCompletion,
  saveFieldValidationCompletion,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import {
  deleteFieldValidationCheckpoint,
  readFieldValidationCheckpoint,
  writeFieldValidationCheckpoint,
} from '@/features/assignments/drafts/fieldValidationDraft';
import { isUuid } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';
import {
  deleteFieldValidationPhoto,
  persistFieldValidationPhoto,
  type FieldValidationPhotoArtifact,
} from '@/features/assignments/services/fieldValidationPhotoStorage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { useSync } from '@/features/sync/hooks/useSync';

const DATABASE = {};
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const SAVED_AT = '2026-10-23T08:00:00.000Z';
const DRAFT_PHOTO: FieldValidationPhotoArtifact = {
  mimeType: 'image/jpeg',
  sizeBytes: 4096,
  uri: `file:///documents/caneguard/field-validation/${OWNER_ID}/${ASSIGNMENT_ID}-draft-a.jpg`,
};
const REPLACEMENT_PHOTO: FieldValidationPhotoArtifact = {
  mimeType: 'image/jpeg',
  sizeBytes: 8192,
  uri: `file:///documents/caneguard/field-validation/${OWNER_ID}/${ASSIGNMENT_ID}-draft-b.jpg`,
};
const COMPLETION_PHOTO: FieldValidationPhotoArtifact = {
  mimeType: 'image/jpeg',
  sizeBytes: 6144,
  uri: `file:///documents/caneguard/field-validation/${OWNER_ID}/${ASSIGNMENT_ID}-completion-c.jpg`,
};

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void) => {
      mockReact.useEffect(callback, [callback]);
    },
  };
});
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: jest.fn(),
}));
jest.mock('@/features/assignments/data/assignmentCacheRepository', () => ({
  findCachedFieldValidationAssignment: jest.fn(),
  markCachedFieldValidationAssignmentInProgress: jest.fn(),
}));
jest.mock('@/features/assignments/data/fieldValidationCompletionRepository', () => ({
  findFieldValidationCompletion: jest.fn(),
  saveFieldValidationCompletion: jest.fn(),
}));
jest.mock('@/features/assignments/drafts/fieldValidationDraft', () => ({
  deleteFieldValidationCheckpoint: jest.fn(),
  readFieldValidationCheckpoint: jest.fn(),
  writeFieldValidationCheckpoint: jest.fn(),
}));
jest.mock('@/features/assignments/services/fieldValidationPhotoStorage', () => ({
  deleteFieldValidationPhoto: jest.fn(),
  persistFieldValidationPhoto: jest.fn(),
}));
jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  findFieldReportById: jest.fn(),
}));
jest.mock('@/features/reports/services/captureGpsLocation', () => ({
  captureGpsLocation: jest.fn(),
}));
jest.mock('@/features/reports/services/expoForegroundLocationClient', () => ({
  expoForegroundLocationClient: {},
}));

const mockRandomUUID = jest.mocked(randomUUID);
const mockUseAuth = jest.mocked(useAuth);
const mockUseSync = jest.mocked(useSync);
const mockFindAssignment = jest.mocked(findCachedFieldValidationAssignment);
const mockMarkInProgress = jest.mocked(markCachedFieldValidationAssignmentInProgress);
const mockFindCompletion = jest.mocked(findFieldValidationCompletion);
const mockSaveCompletion = jest.mocked(saveFieldValidationCompletion);
const mockDeleteCheckpoint = jest.mocked(deleteFieldValidationCheckpoint);
const mockReadCheckpoint = jest.mocked(readFieldValidationCheckpoint);
const mockWriteCheckpoint = jest.mocked(writeFieldValidationCheckpoint);
const mockDeletePhoto = jest.mocked(deleteFieldValidationPhoto);
const mockPersistPhoto = jest.mocked(persistFieldValidationPhoto);
const mockFindReport = jest.mocked(findFieldReportById);
const mockCaptureGps = jest.mocked(captureGpsLocation);

function checkpointWith(photo: FieldValidationPhotoArtifact | null) {
  return {
    checkpoint: {
      action: 'Advised removal.',
      finding: 'Lesions consistent with Rust.',
      followUpOutcome: 'improved' as const,
      observation: 'Fresh pustules on lower leaves.',
      photo,
      savedAt: SAVED_AT,
    },
    updatedAt: SAVED_AT,
  };
}

function renderAssignment() {
  return renderHook(() => useFieldValidationAssignment(ASSIGNMENT_ID));
}

describe('useFieldValidationAssignment visit drafts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRandomUUID.mockReturnValue('9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f');
    mockUseAuth.mockReturnValue({
      session: { token: 'token-1', user: { uuid: OWNER_ID } },
      status: 'authenticated',
    } as never);
    mockUseSync.mockReturnValue({
      isOnline: false,
      retryFieldValidationCompletion: jest.fn(),
      syncNow: jest.fn(async () => undefined),
    } as never);
    mockFindAssignment.mockResolvedValue({
      id: ASSIGNMENT_ID,
      previousVisit: null,
      reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
      reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
    } as never);
    mockFindCompletion.mockResolvedValue(null);
    mockFindReport.mockResolvedValue({ reporterSuspectedCondition: null } as never);
    mockMarkInProgress.mockResolvedValue(undefined as never);
    mockWriteCheckpoint.mockResolvedValue(undefined);
    mockDeleteCheckpoint.mockReturnValue(true);
    mockCaptureGps.mockResolvedValue({
      capturedAt: SAVED_AT,
      outcome: 'unavailable',
    } as never);
  });

  it('keeps the draft photo when recording the visit fails after reusing it', async () => {
    mockReadCheckpoint.mockReturnValue(checkpointWith(DRAFT_PHOTO));
    mockSaveCompletion.mockRejectedValue(new Error('The device is out of space.'));

    const { result } = await renderAssignment();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.formDraft).not.toBeNull());

    await act(async () => {
      await result.current.complete({
        actionTaken: 'Advised removal.',
        fieldFinding: 'Lesions consistent with Rust.',
        fieldObservation: 'Fresh pustules on lower leaves.',
        followUpOutcome: 'improved',
        savedFreshPhoto: DRAFT_PHOTO,
      });
    });

    expect(mockDeletePhoto).not.toHaveBeenCalled();
    expect(mockDeleteCheckpoint).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toEqual(expect.any(String));
  });

  it('removes only the photo the failed attempt copied itself', async () => {
    mockReadCheckpoint.mockReturnValue(null);
    mockPersistPhoto.mockResolvedValue(COMPLETION_PHOTO);
    mockSaveCompletion.mockRejectedValue(new Error('The device is out of space.'));

    const { result } = await renderAssignment();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.complete({
        actionTaken: 'Advised removal.',
        fieldFinding: 'Lesions consistent with Rust.',
        fieldObservation: 'Fresh pustules on lower leaves.',
        followUpOutcome: 'improved',
        freshPhoto: {
          fileName: 'leaf.jpg',
          mimeType: 'image/jpeg',
          uri: 'file:///picker/leaf.jpg',
        } as never,
      });
    });

    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith(COMPLETION_PHOTO.uri, OWNER_ID);
  });

  it('persists a draft photo under a storage identity the device accepts', async () => {
    mockReadCheckpoint.mockReturnValue(null);
    mockPersistPhoto.mockResolvedValue(REPLACEMENT_PHOTO);

    const { result } = await renderAssignment();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.persistDraftPhoto({
        fileName: 'leaf.jpg',
        mimeType: 'image/jpeg',
        uri: 'file:///picker/leaf.jpg',
      } as never);
    });

    expect(mockPersistPhoto).toHaveBeenCalledTimes(1);
    const input = mockPersistPhoto.mock.calls[0][0];
    expect(input.assignmentId).toBe(ASSIGNMENT_ID);
    expect(isUuid(input.completionId)).toBe(true);
  });

  it('retires the previous draft photo only once the checkpoint stops referencing it', async () => {
    mockReadCheckpoint.mockReturnValue(checkpointWith(DRAFT_PHOTO));
    mockPersistPhoto.mockResolvedValue(REPLACEMENT_PHOTO);

    const { result } = await renderAssignment();
    await waitFor(() => expect(result.current.formDraft).not.toBeNull());

    await act(async () => {
      await result.current.persistDraftPhoto({
        fileName: 'leaf.jpg',
        mimeType: 'image/jpeg',
        uri: 'file:///picker/leaf.jpg',
      } as never);
    });
    expect(mockDeletePhoto).not.toHaveBeenCalled();

    mockWriteCheckpoint.mockRejectedValueOnce(new Error('The checkpoint write failed.'));
    await act(async () => {
      const saved = await result.current.saveDraftCheckpoint({
        action: 'Advised removal.',
        finding: 'Lesions consistent with Rust.',
        followUpOutcome: 'improved',
        observation: 'Fresh pustules on lower leaves.',
        photo: REPLACEMENT_PHOTO,
      });
      expect(saved).toBe(false);
    });
    expect(mockDeletePhoto).not.toHaveBeenCalled();

    await act(async () => {
      const saved = await result.current.saveDraftCheckpoint({
        action: 'Advised removal.',
        finding: 'Lesions consistent with Rust.',
        followUpOutcome: 'improved',
        observation: 'Fresh pustules on lower leaves.',
        photo: REPLACEMENT_PHOTO,
      });
      expect(saved).toBe(true);
    });
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith(DRAFT_PHOTO.uri, OWNER_ID);
    expect(mockDeletePhoto).not.toHaveBeenCalledWith(
      REPLACEMENT_PHOTO.uri,
      OWNER_ID,
    );

    await act(async () => {
      const saved = await result.current.saveDraftCheckpoint({
        action: 'Advised removal.',
        finding: 'Lesions consistent with Rust.',
        followUpOutcome: 'improved',
        observation: 'Fresh pustules on lower leaves.',
        photo: null,
      });
      expect(saved).toBe(true);
    });
    expect(mockDeletePhoto).toHaveBeenCalledTimes(2);
    expect(mockDeletePhoto).toHaveBeenLastCalledWith(
      REPLACEMENT_PHOTO.uri,
      OWNER_ID,
    );
  });

  it('keeps the draft photo when the completed visit cannot clear its checkpoint', async () => {
    mockReadCheckpoint.mockReturnValue(checkpointWith(DRAFT_PHOTO));
    mockSaveCompletion.mockResolvedValue({
      id: 'completion-1',
      updatedAt: SAVED_AT,
    } as never);
    mockDeleteCheckpoint.mockReturnValue(false);

    const { result } = await renderAssignment();
    await waitFor(() => expect(result.current.formDraft).not.toBeNull());

    await act(async () => {
      await result.current.complete({
        actionTaken: 'Advised removal.',
        fieldFinding: 'Lesions consistent with Rust.',
        fieldObservation: 'Fresh pustules on lower leaves.',
        followUpOutcome: 'improved',
      });
    });

    expect(mockDeleteCheckpoint).toHaveBeenCalled();
    expect(mockDeletePhoto).not.toHaveBeenCalledWith(DRAFT_PHOTO.uri, OWNER_ID);
  });
});
