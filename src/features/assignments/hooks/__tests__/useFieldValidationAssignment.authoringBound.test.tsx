import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { AUTHORING_WINDOW_COPY } from '@/constants/copy';
import { findCachedFieldValidationAssignment } from '@/features/assignments/data/assignmentCacheRepository';
import {
  findFieldValidationCompletion,
  saveFieldValidationCompletion,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import {
  deleteFieldValidationCheckpoint,
  readFieldValidationCheckpoint,
} from '@/features/assignments/drafts/fieldValidationDraft';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { useSync } from '@/features/sync/hooks/useSync';

const DATABASE = {};
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const NOW = '2026-10-23T08:00:00.000Z';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return { useFocusEffect: (callback: () => void) => { mockReact.useEffect(callback, [callback]); } };
});
jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: () => DATABASE }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/sync/hooks/useSync', () => ({ useSync: jest.fn() }));
jest.mock('@/features/assignments/data/assignmentCacheRepository', () => ({ findCachedFieldValidationAssignment: jest.fn() }));
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
jest.mock('@/features/reports/data/fieldReportRepository', () => ({ findFieldReportById: jest.fn() }));
jest.mock('@/features/reports/services/captureGpsLocation', () => ({ captureGpsLocation: jest.fn() }));
jest.mock('@/features/reports/services/expoForegroundLocationClient', () => ({ expoForegroundLocationClient: {} }));

const COMPLETION_INPUT = {
  actionTaken: 'Advised removal.',
  fieldFinding: 'Lesions consistent with Rust.',
  fieldObservation: 'Fresh pustules on lower leaves.',
  followUpOutcome: 'improved' as const,
};

describe('visit completion authoring bound (NET-3)', () => {
  const getAuthoringProvenance = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(randomUUID).mockReturnValue('9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f');
    jest.mocked(useAuth).mockReturnValue({
      getAuthoringProvenance,
      session: { token: 't', user: { capabilities: ['assignment:complete'], role: 'field_reporter', uuid: OWNER_ID } },
      status: 'authenticated',
    } as never);
    jest.mocked(useSync).mockReturnValue({ isOnline: false, syncNow: jest.fn(async () => undefined) } as never);
    jest.mocked(findCachedFieldValidationAssignment).mockResolvedValue({
      id: ASSIGNMENT_ID,
      previousVisit: null,
      reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
      reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
    } as never);
    jest.mocked(findFieldValidationCompletion).mockResolvedValue(null);
    jest.mocked(findFieldReportById).mockResolvedValue({ reporterSuspectedCondition: null } as never);
    jest.mocked(readFieldValidationCheckpoint).mockReturnValue(null);
    jest.mocked(deleteFieldValidationCheckpoint).mockReturnValue(true);
    jest.mocked(captureGpsLocation).mockResolvedValue({ capturedAt: NOW, outcome: 'unavailable' } as never);
    jest.mocked(saveFieldValidationCompletion).mockResolvedValue({ id: 'saved' } as never);
  });

  // Intent: "the authoring bound": once the window has closed, a visit cannot be finished, and the inspector is told why.
  it('refuses to save a visit when the session may not author, and says why', async () => {
    getAuthoringProvenance.mockReturnValue(null);
    const { result } = await renderHook(() => useFieldValidationAssignment(ASSIGNMENT_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.complete(COMPLETION_INPUT)).resolves.toBeNull();
    });

    expect(saveFieldValidationCompletion).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe(AUTHORING_WINDOW_COPY.ended);
  });

  // Intent: "freeze provenance at finish": the visit is saved with the basis it was finished under.
  it('saves the visit with the provenance the session gives at that moment', async () => {
    getAuthoringProvenance.mockReturnValue({ basis: 'carryover', verifiedAt: '2026-10-22T08:00:00.000Z' });
    const { result } = await renderHook(() => useFieldValidationAssignment(ASSIGNMENT_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.complete(COMPLETION_INPUT);
    });

    expect(saveFieldValidationCompletion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ provenance: { basis: 'carryover', verifiedAt: '2026-10-22T08:00:00.000Z' } }),
    );
  });
});
