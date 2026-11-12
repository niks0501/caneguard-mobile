import { act, fireEvent, render, screen } from '@testing-library/react-native';

import FieldValidationScreen from '@/app/field-validation';
import { ToastProvider } from '@/components/ui/Toast';
import { VISIT_CHIPS } from '@/constants/copy';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';
import { deleteFieldValidationPhoto } from '@/features/assignments/services/fieldValidationPhotoStorage';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ assignmentId: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f' })),
  useFocusEffect: (callback: () => void) => callback(),
}));
jest.mock('@/features/assignments/hooks/useFieldValidationAssignment', () => ({
  useFieldValidationAssignment: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  CameraType: { back: 'back' },
  launchCameraAsync: jest.fn(async () => ({
    assets: [
      {
        fileName: 'leaf.jpg',
        mimeType: 'image/jpeg',
        uri: 'file:///picker/leaf.jpg',
      },
    ],
    canceled: false,
  })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));
jest.mock('@/features/assignments/services/fieldValidationPhotoStorage', () => ({
  deleteFieldValidationPhoto: jest.fn(),
}));

const complete = jest.fn(async () => null);
const state = {
  canComplete: true,
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

  it('replaces the visit form with an unavailable notice without assignment:complete', async () => {
    jest.mocked(useFieldValidationAssignment).mockReturnValueOnce({
      ...state,
      assignment: null,
      canComplete: false,
      complete,
    } as never);

    await render(<FieldValidationScreen />);

    expect(screen.getByTestId('field-validation.unavailable')).toBeOnTheScreen();
    expect(screen.getByText(/active inspector assignment to the pilot district/)).toBeOnTheScreen();
    expect(screen.queryByTestId('field-validation.observation-input')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('field-validation.complete')).not.toBeOnTheScreen();
  });

  it('names the screen and its primary action with the Visit word', async () => {
    await render(<FieldValidationScreen />);

    expect(screen.getByRole('header', { name: 'Visit' })).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.complete')).toHaveTextContent('Complete visit');
  });

  it('shows the target visit date in the one shared display format', async () => {
    jest.mocked(useFieldValidationAssignment).mockReturnValue({
      ...state,
      complete,
      assignment: { ...state.assignment, targetVisitDate: '2026-11-09' },
    } as never);

    await render(<FieldValidationScreen />);

    expect(screen.getByText('Nov 9, 2026')).toBeOnTheScreen();
    expect(screen.queryByText('2026-11-09')).not.toBeOnTheScreen();
  });

  it('requires fresh observation, finding, and action before saving offline completion', async () => {
    jest.mocked(useFieldValidationAssignment).mockReturnValue({
      ...state,
      complete,
      previousVisit: {
        referenceCode: 'CG-2026-0000',
        visitedAt: '2026-07-01T00:00:00.000Z',
        reporterSuspectedCondition: null,
        authorityClassifiedCondition: null,
        actionTaken: 'Earlier action',
        followUpOutcome: null,
        fieldObservation: null,
        fieldFinding: null,
        freshPhotoAvailable: false,
      },
    } as never);
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

  it('completes a first visit with no follow-up outcome and sends null', async () => {
    jest.mocked(useFieldValidationAssignment).mockReturnValue({ ...state, complete } as never);
    await render(<FieldValidationScreen />);
    await fireEvent.changeText(screen.getByTestId('field-validation.observation-input'), 'Leaves show fresh lesions.');
    await fireEvent.changeText(screen.getByTestId('field-validation.finding-input'), 'Field finding recorded for office review.');
    await fireEvent.changeText(screen.getByTestId('field-validation.action-input'), 'Provided field guidance.');
    await fireEvent.press(screen.getByTestId('field-validation.complete'));
    expect(screen.queryByTestId('field-validation.error')).toBeNull();
    await fireEvent.press(screen.getByTestId('field-validation.confirm-complete'));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ followUpOutcome: null }));
  });

  it('leads with visit context and fresh observation before submitted AI evidence', async () => {
    await render(<FieldValidationScreen />);

    // Farmers, location, and the fresh human entry fields are all reachable
    // before any Possible Condition or confidence is shown.
    expect(screen.getByText('Visit context')).toBeOnTheScreen();
    expect(screen.getByText('Juan Dela Cruz')).toBeOnTheScreen();
    expect(screen.getByText('Mabini, Nasugbu, Batangas')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.observation-input')).toBeOnTheScreen();
    // The case being checked leads the screen (approved visit-form change).
    expect(screen.getByTestId('field-validation.case-under-check')).toBeOnTheScreen();
    expect(screen.getByText('Possible Condition')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.queryByText('93%')).not.toBeOnTheScreen();
    expect(screen.getByText('Ana Reporter')).toBeOnTheScreen();

    const tree = JSON.stringify(screen.toJSON());
    const order = [
      'field-validation.assignment-summary',
      'field-validation.case-under-check',
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
    expect(screen.queryByText('93%')).not.toBeOnTheScreen();
  });

  it('hides the follow-up question on a first visit', async () => {
    await render(<FieldValidationScreen />);
    expect(screen.queryByTestId('field-validation.outcome-group')).toBeNull();
    expect(screen.queryByText('No previous visit on record')).toBeNull();
  });

  it('chips write editable sentences into the matching field and never close the case', async () => {
    await render(<FieldValidationScreen />);
    await fireEvent.press(screen.getByTestId('field-validation.observation.chip.0'));
    await fireEvent.press(screen.getByTestId('field-validation.finding.chip.0'));
    await fireEvent.press(screen.getByTestId('field-validation.action.chip.0'));
    expect(screen.getByTestId('field-validation.observation-input')).toHaveProp('value', VISIT_CHIPS.observation[0]);
    expect(screen.getByTestId('field-validation.finding-input')).toHaveProp('value', VISIT_CHIPS.finding[0]);
    expect(screen.getByTestId('field-validation.action-input')).toHaveProp('value', VISIT_CHIPS.action[0]);
    // The sentence stays editable and a second tap takes it back out.
    await fireEvent.changeText(screen.getByTestId('field-validation.observation-input'), `${VISIT_CHIPS.observation[0]} Plus my note.`);
    await fireEvent.press(screen.getByTestId('field-validation.observation.chip.0'));
    expect(screen.getByTestId('field-validation.observation-input')).toHaveProp('value', 'Plus my note.');
    expect(screen.getByText(/does not verify or close the case/)).toBeOnTheScreen();
  });

  it('shows a scanless office case with no AI section', async () => {
    // Persistent, matching the rest of this file: the screen can call the hook
    // more than once per render, so a one-shot value would be consumed early.
    jest.mocked(useFieldValidationAssignment).mockReturnValue({
      ...state,
      photoAccessToken: 'session-token',
      assignment: {
        ...state.assignment,
        case: { ...state.assignment.case, predictedLabel: null, confidence: null },
        officeCase: {
          version: 2,
          status: {
            workflowStatus: 'assigned',
            caseState: 'open',
            reviewStatus: 'pending',
            updatedAt: '2026-08-13T12:00:00.000Z',
          },
          reporterConcern: { suspectedCondition: 'Rust', observationText: 'Orange spots on leaves' },
          photo: { contentType: 'image/jpeg', bytes: 10 },
        },
      },
    } as never);

    try {
      await render(<FieldValidationScreen />);

      expect(screen.getByText('Assigned')).toBeOnTheScreen();
      expect(screen.getByText('Rust · reported concern')).toBeOnTheScreen();
      expect(screen.getByTestId('field-validation.office-case.photo')).toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('Show Previous visit and original report'));
      expect(screen.getByText('Ana Reporter')).toBeOnTheScreen();
      expect(screen.queryByText(/Possible Condition/)).not.toBeOnTheScreen();
    } finally {
      // Restore the shared default so later tests in this file see a field case.
      jest.mocked(useFieldValidationAssignment).mockReturnValue({ ...state, complete } as never);
    }
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
    jest.mocked(useFieldValidationAssignment).mockReturnValue({
      ...state,
      complete,
      previousVisit: {
        referenceCode: 'CG-2026-0000',
        visitedAt: '2026-07-01T00:00:00.000Z',
        reporterSuspectedCondition: null,
        authorityClassifiedCondition: null,
        actionTaken: 'Earlier action',
        followUpOutcome: null,
        fieldObservation: null,
        fieldFinding: null,
        freshPhotoAvailable: false,
      },
    } as never);
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
        screen.getByLabelText('Fresh visit photo'),
      ).toHaveProp('source', {
        uri: 'file:///managed/field-validation/owner/assignment-draft.png',
      });
    });

    it('checkpoints typed visit evidence without completing it', async () => {
      jest.useFakeTimers();
      mockHook({
        previousVisit: {
          referenceCode: 'CG-2026-0000',
          visitedAt: '2026-07-01T00:00:00.000Z',
          reporterSuspectedCondition: null,
          authorityClassifiedCondition: null,
          actionTaken: 'Earlier action',
          followUpOutcome: null,
          fieldObservation: null,
          fieldFinding: null,
          freshPhotoAvailable: false,
        },
      });
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
        screen.getByLabelText('Fresh visit photo'),
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByTestId('field-validation.remove-photo'));

      expect(saveDraftCheckpoint).toHaveBeenCalledWith({
        action: 'Advised removal.',
        finding: 'Lesions consistent with Rust.',
        followUpOutcome: 'improved',
        observation: 'Fresh pustules on lower leaves.',
        photo: null,
      });
      expect(deleteFieldValidationPhoto).not.toHaveBeenCalled();
      expect(
        screen.queryByLabelText('Fresh visit photo'),
      ).not.toBeOnTheScreen();
    });

    it('ignores a photo copy that finishes after the photo was removed', async () => {
      let resolvePersist!: (value: {
        mimeType: string;
        sizeBytes: number;
        uri: string;
      }) => void;
      const persistDraftPhoto = jest.fn(
        () =>
          new Promise<{
            mimeType: string;
            sizeBytes: number;
            uri: string;
          }>((resolve) => {
            resolvePersist = resolve;
          }),
      );
      mockHook({ persistDraftPhoto });

      await render(<FieldValidationScreen />);
      await fireEvent.press(screen.getByTestId('field-validation.capture-photo'));

      expect(
        screen.getByLabelText('Fresh visit photo'),
      ).toBeOnTheScreen();
      await fireEvent.press(screen.getByTestId('field-validation.remove-photo'));
      expect(
        screen.queryByLabelText('Fresh visit photo'),
      ).not.toBeOnTheScreen();

      const copied = {
        mimeType: 'image/jpeg',
        sizeBytes: 4096,
        uri: 'file:///managed/field-validation/owner/assignment-draft-2.jpg',
      };
      await act(async () => {
        resolvePersist(copied);
      });

      expect(
        screen.queryByLabelText('Fresh visit photo'),
      ).not.toBeOnTheScreen();
      expect(deleteFieldValidationPhoto).toHaveBeenCalledWith(
        copied.uri,
        'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
      );
      expect(saveDraftCheckpoint).not.toHaveBeenCalled();
    });

    it('deletes a photo that never reached a checkpoint when it is removed', async () => {
      mockHook();

      await render(<FieldValidationScreen />);
      await fireEvent.press(screen.getByTestId('field-validation.capture-photo'));

      expect(
        screen.getByLabelText('Fresh visit photo'),
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByTestId('field-validation.remove-photo'));

      expect(deleteFieldValidationPhoto).toHaveBeenCalledWith(
        'file:///managed/field-validation/owner/assignment-draft-1.jpg',
        'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
      );
      expect(saveDraftCheckpoint).not.toHaveBeenCalled();
      expect(
        screen.queryByLabelText('Fresh visit photo'),
      ).not.toBeOnTheScreen();
    });
  });
});
