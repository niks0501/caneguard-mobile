import { act, fireEvent, render, screen } from '@testing-library/react-native';

import FieldValidationScreen from '@/app/field-validation';
import { ToastProvider } from '@/components/ui/Toast';
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
  draftSavedAt: null,
  draftStatus: 'idle' as const,
  errorMessage: null,
  formDraft: null,
  loading: false,
  ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
  persistDraftPhoto: jest.fn(async () => null),
  saveDraftCheckpoint: jest.fn(async () => true),
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
    expect(screen.getByTestId('field-validation.error')).toHaveTextContent(
      'Choose the follow-up outcome before completing this visit.',
    );
    await fireEvent.press(screen.getByTestId('field-validation.outcome.improved'));
    await fireEvent.press(screen.getByTestId('field-validation.complete'));

    // C2: completing a visit requires an explicit confirmation gate that
    // lists the committed facts. Nothing is saved yet.
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByTestId('field-validation.confirm-complete-dialog')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.confirm-complete-dialog')).toHaveTextContent(/Follow-up outcome: Improved/);
    await fireEvent.press(screen.getByTestId('field-validation.confirm-complete'));

    expect(complete).toHaveBeenCalledWith({
      fieldObservation: 'Leaves show fresh lesions.',
      fieldFinding: 'Field finding recorded for office review.',
      actionTaken: 'Provided field guidance.',
      followUpOutcome: 'improved',
      freshPhoto: null,
    });
  });

  it('leads with visit context and fresh observation before submitted AI evidence', async () => {
    await render(<FieldValidationScreen />);

    // Farmers, location, and the fresh human entry fields are all reachable
    // before any Possible Condition or confidence is shown.
    expect(screen.getByText('Visit context')).toBeOnTheScreen();
    expect(screen.getByText('Juan Dela Cruz')).toBeOnTheScreen();
    expect(screen.getByText('Mabini, Nasugbu, Batangas')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.observation-input')).toBeOnTheScreen();
    expect(screen.queryByText('Possible Condition: Rust')).not.toBeOnTheScreen();
    expect(screen.queryByText('93%')).not.toBeOnTheScreen();
    // The submitter and visit history live behind the disclosure.
    expect(screen.queryByText('Ana Reporter')).not.toBeOnTheScreen();

    const tree = JSON.stringify(screen.toJSON());
    const order = [
      'field-validation.assignment-summary',
      'field-validation.observation-input',
      'field-validation.finding-input',
      'field-validation.action-input',
      'field-validation.submitted-evidence',
      'field-validation.complete',
    ];
    expect([...order].sort((a, b) => tree.indexOf(a) - tree.indexOf(b))).toEqual(order);

    // The original report stays available behind an explicit disclosure,
    // with Possible Condition as visit context and no technical AI metadata.
    await fireEvent.press(screen.getByLabelText('Show Previous visit and original report'));
    expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
    expect(screen.queryByText('93%')).not.toBeOnTheScreen();
    expect(screen.getByText('Ana Reporter')).toBeOnTheScreen();
  });

  it('provides persistent hints with sugarcane examples and supports copy observation into finding', async () => {
    await render(<FieldValidationScreen />);

    // Updated heading covering all three aspects of the visit
    expect(screen.getByText('What did you record on this visit?')).toBeOnTheScreen();
    expect(screen.queryByText('What do you observe?')).not.toBeOnTheScreen();

    // Short definitions stay visible (Q6 option A); only the worked example
    // moves behind the help icon.
    expect(
      screen.getByText('What you physically saw on this visit.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Your own assessment of what those observations mean here.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('What you actually did or told the farmer.'),
    ).toBeOnTheScreen();

    // Worked examples are hidden until their help icon is tapped.
    expect(
      screen.queryByText(/Orange-brown pustules on the lower leaves/),
    ).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('field-validation.observation-help'));
    expect(
      screen.getByText(
        'For example: “Orange-brown pustules on the lower leaves of about a fifth of the block.”',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('field-validation.finding-help'));
    expect(
      screen.getByText(
        'For example: “Lesions consistent with Rust; no smut whip seen in the sampled rows.”',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('field-validation.action-help'));
    expect(
      screen.getByText(
        'For example: “Advised removal of affected leaves and a follow-up visit in 7 days.”',
      ),
    ).toBeOnTheScreen();

    // Copy action disabled initially
    const copyButton = screen.getByTestId('field-validation.copy-observation');
    expect(copyButton).toBeOnTheScreen();
    expect(screen.getByText('Copy observation into finding')).toBeOnTheScreen();

    // Type observation
    await fireEvent.changeText(
      screen.getByTestId('field-validation.observation-input'),
      'Orange-brown pustules observed on lower leaves.',
    );

    // Press copy
    await fireEvent.press(copyButton);

    // Finding input receives the observation text
    expect(screen.getByTestId('field-validation.finding-input')).toHaveProp(
      'value',
      'Orange-brown pustules observed on lower leaves.',
    );

    // Button text updates to reflect replacement
    expect(screen.getByText('Replace finding with observation')).toBeOnTheScreen();
  });

  it('displays confirmation toast when completing visit', async () => {
    complete.mockResolvedValueOnce({ id: 'comp-1' } as never);
    await render(
      <ToastProvider>
        <FieldValidationScreen />
      </ToastProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('field-validation.observation-input'), 'Orange-brown pustules.');
    await fireEvent.changeText(screen.getByTestId('field-validation.finding-input'), 'Lesions consistent with Rust.');
    await fireEvent.changeText(screen.getByTestId('field-validation.action-input'), 'Advised farmer.');
    await fireEvent.press(screen.getByTestId('field-validation.outcome.improved'));
    await fireEvent.press(screen.getByTestId('field-validation.complete'));
    await fireEvent.press(screen.getByTestId('field-validation.confirm-complete'));

    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Visit recorded');
  });

  describe('owner-scoped visit recovery (M04)', () => {
    const saveDraftCheckpoint = jest.fn(async () => true);
    const persistDraftPhoto = jest.fn(async () => ({
      mimeType: 'image/jpeg',
      sizeBytes: 4096,
      uri: 'file:///managed/field-validation/owner/assignment-draft-1.jpg',
    }));

    function mockHook(overrides: Record<string, unknown> = {}) {
      jest.mocked(useFieldValidationAssignment).mockReturnValue({
        ...state,
        complete,
        draftSavedAt: null,
        draftStatus: 'idle',
        formDraft: null,
        ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
        persistDraftPhoto,
        saveDraftCheckpoint,
        ...overrides,
      } as never);
    }

    beforeEach(() => {
      saveDraftCheckpoint.mockClear();
      persistDraftPhoto.mockClear();
      mockHook();
    });

    it('restores the saved visit draft for the same owner', async () => {
      mockHook({
        draftSavedAt: '2026-10-23T08:00:00.000Z',
        draftStatus: 'saved',
        formDraft: {
          action: 'Advised removal of affected leaves.',
          finding: 'Lesions consistent with Rust.',
          followUpOutcome: 'unchanged',
          observation: 'Fresh pustules on lower leaves.',
          photo: {
            mimeType: 'image/png',
            sizeBytes: 2048,
            uri: 'file:///managed/field-validation/owner/assignment-draft.png',
          },
          savedAt: '2026-10-23T08:00:00.000Z',
        },
      });

      await render(<FieldValidationScreen />);

      expect(screen.getByTestId('field-validation.observation-input')).toHaveProp(
        'value',
        'Fresh pustules on lower leaves.',
      );
      expect(screen.getByTestId('field-validation.finding-input')).toHaveProp(
        'value',
        'Lesions consistent with Rust.',
      );
      expect(screen.getByTestId('field-validation.action-input')).toHaveProp(
        'value',
        'Advised removal of affected leaves.',
      );
      expect(screen.getByTestId('field-validation.draft-status')).toHaveTextContent(
        /Draft saved on this device/,
      );
      expect(
        screen.getByLabelText('Fresh field validation photo'),
      ).toHaveProp('source', {
        uri: 'file:///managed/field-validation/owner/assignment-draft.png',
      });
    });

    it('checkpoints typed visit evidence without completing it', async () => {
      jest.useFakeTimers();
      try {
        await render(<FieldValidationScreen />);
        await fireEvent.changeText(
          screen.getByTestId('field-validation.observation-input'),
          'Fresh pustules on lower leaves.',
        );
        await fireEvent.changeText(
          screen.getByTestId('field-validation.finding-input'),
          'Lesions consistent with Rust.',
        );
        await fireEvent.changeText(
          screen.getByTestId('field-validation.action-input'),
          'Advised removal.',
        );
        await fireEvent.press(
          screen.getByTestId('field-validation.outcome.worsened'),
        );

        await act(async () => {
          jest.advanceTimersByTime(800);
        });

        expect(saveDraftCheckpoint).toHaveBeenCalledWith({
          action: 'Advised removal.',
          finding: 'Lesions consistent with Rust.',
          followUpOutcome: 'worsened',
          observation: 'Fresh pustules on lower leaves.',
          photo: null,
        });
        expect(complete).not.toHaveBeenCalled();
        expect(
          screen.queryByTestId('field-validation.completion-status'),
        ).not.toBeOnTheScreen();
      } finally {
        jest.useRealTimers();
      }
    });

    it('reuses a photo already saved with the draft instead of copying it again', async () => {
      mockHook({
        draftStatus: 'saved',
        formDraft: {
          action: 'Advised removal.',
          finding: 'Lesions consistent with Rust.',
          followUpOutcome: 'improved',
          observation: 'Fresh pustules on lower leaves.',
          photo: {
            mimeType: 'image/jpeg',
            sizeBytes: 4096,
            uri: 'file:///managed/field-validation/owner/assignment-draft-1.jpg',
          },
          savedAt: '2026-10-23T08:00:00.000Z',
        },
      });
      complete.mockResolvedValueOnce({ id: 'comp-1' } as never);

      await render(<FieldValidationScreen />);
      await fireEvent.press(screen.getByTestId('field-validation.complete'));
      await fireEvent.press(screen.getByTestId('field-validation.confirm-complete'));

      expect(complete).toHaveBeenCalledWith(
        expect.objectContaining({
          savedFreshPhoto: {
            mimeType: 'image/jpeg',
            sizeBytes: 4096,
            uri: 'file:///managed/field-validation/owner/assignment-draft-1.jpg',
          },
          freshPhoto: null,
        }),
      );
      expect(persistDraftPhoto).not.toHaveBeenCalled();
    });

    it('persists a photo removal to the saved draft', async () => {
      mockHook({
        draftStatus: 'saved',
        formDraft: {
          action: 'Advised removal.',
          finding: 'Lesions consistent with Rust.',
          followUpOutcome: 'improved',
          observation: 'Fresh pustules on lower leaves.',
          photo: {
            mimeType: 'image/jpeg',
            sizeBytes: 4096,
            uri: 'file:///managed/field-validation/owner/assignment-draft-1.jpg',
          },
          savedAt: '2026-10-23T08:00:00.000Z',
        },
      });

      await render(<FieldValidationScreen />);
      expect(
        screen.getByLabelText('Fresh field validation photo'),
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByTestId('field-validation.remove-photo'));

      expect(saveDraftCheckpoint).toHaveBeenCalledWith({
        action: 'Advised removal.',
        finding: 'Lesions consistent with Rust.',
        followUpOutcome: 'improved',
        observation: 'Fresh pustules on lower leaves.',
        photo: null,
      });
      expect(
        screen.queryByLabelText('Fresh field validation photo'),
      ).not.toBeOnTheScreen();
    });
  });
});
