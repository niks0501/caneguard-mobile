import { fireEvent, render, screen } from '@testing-library/react-native';

import { OfficeCaseCard } from '@/features/assignments/components/OfficeCaseCard';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

jest.mock('@/config/env', () => ({ apiBaseUrl: 'http://127.0.0.1:8000' }));
jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const mockLocalUri = jest.fn<string | null, []>(() => null);
jest.mock('@/features/assignments/services/officeMediaCache', () => ({
  isOfficeCaseReadyOffline: () => mockLocalUri() !== null,
  listOfficeMediaItems: () => [{ kind: 'report' }],
  readOfficeMediaUri: () => mockLocalUri(),
}));

const ID = '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f';

function assignment(overrides: Partial<FieldValidationAssignment> = {}): FieldValidationAssignment {
  return {
    id: ID,
    ownerIdentity: 'o',
    reportUuid: 'r',
    reportClientUuid: 'c',
    referenceCode: 'CG-2026-0001',
    submitter: { uuid: 's', name: 'Ana' },
    assignee: { uuid: 'a', name: 'Mara' },
    submitterIsAssignee: false,
    targetVisitDate: null,
    fieldValidationState: 'assigned',
    assignedAt: '2026-08-13T12:00:00.000Z',
    updatedAt: '2026-08-13T12:00:00.000Z',
    cachedAt: '2026-08-13T12:00:00.000Z',
    case: {
      barangay: 'Mabini', province: null, municipality: null, farmerOrFarmOwnerName: null,
      affectedAreaHectares: null, affectedPortionPercent: null,
      capturedAt: '2026-07-20T09:55:00.000Z', observedAt: null, submittedAt: '2026-07-20T10:00:00.000Z',
      predictedLabel: 'rust', confidence: 0.9,
    },
    previousVisit: null,
    officeCase: {
      version: 2,
      status: { workflowStatus: 'in_progress', caseState: 'open', reviewStatus: 'pending', updatedAt: '2026-08-13T12:00:00.000Z' },
      reporterConcern: { suspectedCondition: 'Rust', observationText: 'Orange spots on leaves' },
      photo: { contentType: 'image/jpeg', bytes: 10 },
    },
    ...overrides,
  };
}

describe('OfficeCaseCard', () => {
  // Proves L4: an office case renders with concern, status, version and photo.
  it('renders concern, status, version and an authorized photo', async () => {
    await render(<OfficeCaseCard accessToken="tok" assignment={assignment()} />);

    expect(screen.getByText('Office case')).toBeOnTheScreen();
    expect(screen.getByText('In progress')).toBeOnTheScreen();
    expect(screen.getByText('Version 2')).toBeOnTheScreen();
    expect(screen.getByText('Rust · reported concern')).toBeOnTheScreen();
    expect(screen.getByText('Orange spots on leaves')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.office-case.photo')).toHaveProp('source', {
      headers: { Authorization: 'Bearer tok' },
      uri: `http://127.0.0.1:8000/api/v1/mobile/assignments/${ID}/report-photo`,
    });
  });

  // Proves L4: a field case renders exactly as before (nothing from the office card).
  it('renders nothing for a field-born case', async () => {
    await render(<OfficeCaseCard accessToken="tok" assignment={assignment({ officeCase: null })} />);
    expect(screen.queryByTestId('field-validation.office-case')).not.toBeOnTheScreen();
  });

  // Proves L10: a scanless case shows concern, status and photo with no AI section and no crash.
  it('renders a scanless office case with no AI fields', async () => {
    const base = assignment();
    await render(
      <OfficeCaseCard
        accessToken="tok"
        assignment={{ ...base, case: { ...base.case, predictedLabel: null, confidence: null } }}
      />,
    );
    expect(screen.getByText('In progress')).toBeOnTheScreen();
    expect(screen.getByText('Rust · reported concern')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.office-case.photo')).toBeOnTheScreen();
    expect(screen.queryByText(/confidence/i)).not.toBeOnTheScreen();
  });

  // Proves L4: no photo shows the empty state, never a broken image.
  it('shows the empty state when the case has no photo', async () => {
    const base = assignment();
    await render(
      <OfficeCaseCard accessToken="tok" assignment={{ ...base, officeCase: { ...base.officeCase!, photo: null } }} />,
    );
    expect(screen.getByText('The office did not attach a photo to this case.')).toBeOnTheScreen();
    expect(screen.queryByTestId('field-validation.office-case.photo')).not.toBeOnTheScreen();
  });

  // Proves L4: a photo that cannot load (offline) falls back to words, never a broken image.
  it('replaces the image with a notice when it fails to load and never sends the token off-origin', async () => {
    await render(<OfficeCaseCard accessToken="tok" assignment={assignment()} />);
    await fireEvent(screen.getByTestId('field-validation.office-case.photo'), 'error');
    expect(screen.queryByTestId('field-validation.office-case.photo')).not.toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.office-case.photo.unavailable')).toBeOnTheScreen();
  });

  // Proves L4: the viewer is guarded — no session token means no image request at all.
  it('shows the unavailable notice without a session token', async () => {
    await render(<OfficeCaseCard accessToken={null} assignment={assignment()} />);
    expect(screen.queryByTestId('field-validation.office-case.photo')).not.toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.office-case.photo.unavailable')).toBeOnTheScreen();
  });

  // Proves L4: the last-visit photo shows when present and its empty state when the visit had none.
  it('shows the last-visit photo or its empty state', async () => {
    const visit = {
      referenceCode: 'CG-0', visitedAt: '2026-09-10T08:30:00.000Z', reporterSuspectedCondition: null,
      authorityClassifiedCondition: null, actionTaken: 'a', followUpOutcome: null, fieldObservation: null,
      fieldFinding: null, freshPhotoAvailable: true, photo: { contentType: 'image/jpeg', bytes: 5 },
    };
    const url = `http://127.0.0.1:8000/api/v1/mobile/assignments/${ID}/previous-evidence-photo`;
    const { rerender } = await render(
      <OfficeCaseCard accessToken="tok" assignment={assignment({ previousVisit: visit })} lastVisitPhotoUrl={url} />,
    );
    expect(screen.getByTestId('field-validation.office-case.last-visit-photo')).toHaveProp('source', {
      headers: { Authorization: 'Bearer tok' },
      uri: url,
    });

    await rerender(
      <OfficeCaseCard accessToken="tok" assignment={assignment({ previousVisit: { ...visit, photo: null } })} lastVisitPhotoUrl={url} />,
    );
    expect(screen.getByText('No photo was taken on the last visit.')).toBeOnTheScreen();
  });

  // Proves L5: a downloaded case shows its photo from disk without a token and says "Ready offline".
  it('renders the cached photo without the network and shows the Ready offline badge', async () => {
    mockLocalUri.mockReturnValue('file:///docs/office-media/o/a.report.jpg');
    await render(<OfficeCaseCard accessToken={null} assignment={assignment()} />);
    expect(screen.getByTestId('field-validation.office-case.photo')).toHaveProp('source', {
      uri: 'file:///docs/office-media/o/a.report.jpg',
    });
    expect(screen.getByText('Ready offline')).toBeOnTheScreen();
  });

  // Proves L5: a downloaded copy recovers the photo after the online load already failed.
  it('shows the downloaded photo after the online photo failed', async () => {
    mockLocalUri.mockReturnValue(null);
    const { rerender } = await render(<OfficeCaseCard accessToken="tok" assignment={assignment()} />);
    await fireEvent(screen.getByTestId('field-validation.office-case.photo'), 'error');
    expect(screen.getByTestId('field-validation.office-case.photo.unavailable')).toBeOnTheScreen();

    mockLocalUri.mockReturnValue('file:///docs/office-media/o/a.report.v2.jpg');
    await rerender(<OfficeCaseCard accessToken="tok" assignment={assignment()} />);
    expect(screen.getByTestId('field-validation.office-case.photo')).toHaveProp('source', {
      uri: 'file:///docs/office-media/o/a.report.v2.jpg',
    });
  });

  // Proves L5: with no cached copy and no session the card says the photo needs a connection.
  it('falls back to words and no badge when the photo is not on the phone', async () => {
    mockLocalUri.mockReturnValue(null);
    await render(<OfficeCaseCard accessToken={null} assignment={assignment()} />);
    expect(screen.getByTestId('field-validation.office-case.photo.unavailable')).toBeOnTheScreen();
    expect(screen.queryByText('Ready offline')).not.toBeOnTheScreen();
  });
});
