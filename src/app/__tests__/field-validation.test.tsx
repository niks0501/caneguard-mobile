import { fireEvent, render, screen } from '@testing-library/react-native';

import FieldValidationScreen from '@/app/field-validation';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ assignmentId: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f' })),
  useFocusEffect: (callback: () => void) => callback(),
}));
jest.mock('@/features/assignments/hooks/useFieldValidationAssignment', () => ({
  useFieldValidationAssignment: jest.fn(),
}));

const complete = jest.fn(async () => null);
const state = {
  assignment: {
    id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
    ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
    reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
    reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
    referenceCode: 'CG-2026-0001',
    submitter: { uuid: '1ca4cd6e-ab57-4744-a8be-47a91271fd02', name: 'Ana Reporter' },
    assignee: { uuid: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d', name: 'Mara Reporter' },
    submitterIsAssignee: false,
    targetVisitDate: null,
    fieldValidationState: 'assigned' as const,
    assignedAt: '2026-08-13T12:00:00.000Z',
    updatedAt: '2026-08-13T12:00:00.000Z',
    cachedAt: '2026-08-13T12:05:00.000Z',
    case: {
      barangay: 'Mabini', province: 'Batangas', municipality: 'Nasugbu', farmerOrFarmOwnerName: 'Juan Dela Cruz',
      affectedAreaHectares: 1, affectedPortionPercent: 20, capturedAt: '2026-07-20T09:55:00.000Z',
      observedAt: '2026-07-20T09:58:00.000Z', submittedAt: '2026-07-20T10:00:00.000Z', predictedLabel: 'rust', confidence: 0.93,
    },
  },
  completion: null,
  errorMessage: null,
  loading: false,
  saving: false,
  refresh: jest.fn(async () => undefined),
  retry: jest.fn(async () => undefined),
};

jest.mocked(useFieldValidationAssignment).mockReturnValue({ ...state, complete } as never);

describe('FieldValidationScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires fresh observation, finding, and action before saving offline completion', async () => {
    await render(<FieldValidationScreen />);

    await fireEvent.press(screen.getByTestId('field-validation.complete'));
    expect(screen.getByTestId('field-validation.error')).toHaveTextContent(
      'Field observation, field finding, and action taken are required.',
    );
    expect(complete).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('field-validation.observation-input'), 'Leaves show fresh lesions.');
    await fireEvent.changeText(screen.getByTestId('field-validation.finding-input'), 'Field finding recorded for office review.');
    await fireEvent.changeText(screen.getByTestId('field-validation.action-input'), 'Provided field guidance.');
    await fireEvent.press(screen.getByTestId('field-validation.complete'));

    expect(complete).toHaveBeenCalledWith({
      fieldObservation: 'Leaves show fresh lesions.',
      fieldFinding: 'Field finding recorded for office review.',
      actionTaken: 'Provided field guidance.',
      freshPhoto: null,
    });
  });
});
