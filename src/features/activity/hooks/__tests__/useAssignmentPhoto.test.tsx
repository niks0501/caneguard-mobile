import { act, renderHook, waitFor } from '@testing-library/react-native';

import { EMPTY_DATABASE } from '@/database/DatabaseProvider';
import { useAssignmentPhotoUri } from '@/features/activity/hooks/useAssignmentPhoto';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import { managedImageExists } from '@/features/records/services/scanImageStorage';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';

let mockDatabase: unknown = {};

jest.mock('@/database/DatabaseProvider', () => {
  const EMPTY_DATABASE = {};
  return {
    EMPTY_DATABASE,
    useCaneGuardDatabase: () => mockDatabase,
  };
});
jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  findFieldReportById: jest.fn(),
}));
jest.mock('@/features/records/data/scanRecordRepository', () => ({
  findScanRecordById: jest.fn(),
}));
jest.mock('@/features/records/services/scanImageStorage', () => ({
  managedImageExists: jest.fn(),
}));

const mockFindFieldReportById = jest.mocked(findFieldReportById);
const mockFindScanRecordById = jest.mocked(findScanRecordById);
const mockManagedImageExists = jest.mocked(managedImageExists);

const MANAGED_URI = 'file:///documents/caneguard/scan-images/scan.jpg';
const SUBMISSION_URI = 'file:///documents/caneguard/scan-images/scan.submission.jpg';
const ASSIGNMENT = {
  ownerIdentity: 'owner-1',
  reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
};

beforeEach(() => {
  mockDatabase = {};
  mockFindFieldReportById.mockResolvedValue({ scanRecordId: 'scan-1' } as never);
  mockFindScanRecordById.mockResolvedValue({
    managedImageUri: MANAGED_URI,
    submissionImageUri: SUBMISSION_URI,
  } as never);
  mockManagedImageExists.mockReturnValue(true);
});

describe('useAssignmentPhotoUri', () => {
  it('resolves the reporter scan picture already stored for this account', async () => {
    const { result } = await renderHook(() => useAssignmentPhotoUri(ASSIGNMENT));

    await waitFor(() => expect(result.current).toBe(MANAGED_URI));
    expect(mockFindFieldReportById).toHaveBeenCalledWith(
      mockDatabase,
      ASSIGNMENT.reportClientUuid,
      ASSIGNMENT.ownerIdentity,
    );
    expect(mockFindScanRecordById).toHaveBeenCalledWith(
      mockDatabase,
      'scan-1',
      ASSIGNMENT.ownerIdentity,
    );
  });

  it('falls back to the submission image when the original scan image is gone', async () => {
    mockManagedImageExists.mockImplementation((uri) => uri === SUBMISSION_URI);

    const { result } = await renderHook(() => useAssignmentPhotoUri(ASSIGNMENT));

    await waitFor(() => expect(result.current).toBe(SUBMISSION_URI));
  });

  it('shows no picture when the report is not stored on this device', async () => {
    mockFindFieldReportById.mockRejectedValue(new Error('FIELD_REPORT_NOT_FOUND'));
    const { result } = await renderHook(() => useAssignmentPhotoUri(ASSIGNMENT));

    await waitFor(() => expect(mockFindFieldReportById).toHaveBeenCalled());
    await act(async () => undefined);

    expect(result.current).toBeNull();
    expect(mockFindScanRecordById).not.toHaveBeenCalled();
  });

  it('shows no picture when neither image file is on disk', async () => {
    mockManagedImageExists.mockReturnValue(false);
    const { result } = await renderHook(() => useAssignmentPhotoUri(ASSIGNMENT));

    await waitFor(() => expect(mockManagedImageExists).toHaveBeenCalled());
    await act(async () => undefined);

    expect(result.current).toBeNull();
  });

  it('shows no picture before a database is ready', async () => {
    mockDatabase = EMPTY_DATABASE;
    const { result } = await renderHook(() => useAssignmentPhotoUri(ASSIGNMENT));

    await act(async () => undefined);

    expect(result.current).toBeNull();
    expect(mockFindFieldReportById).not.toHaveBeenCalled();
  });
});
