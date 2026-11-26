import { fireEvent, render, screen } from '@testing-library/react-native';

import { OfficeAerialCheckCard } from '@/features/assignments/components/OfficeAerialCheckCard';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

jest.mock('@/config/env', () => ({ apiBaseUrl: 'http://127.0.0.1:8000' }));
jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const mockLocalUris = new Map<string, string>();
jest.mock('@/features/assignments/services/officeMediaCache', () => ({
  isAerialBriefReadyOffline: () =>
    mockLocalUris.has('aerial-preview') && mockLocalUris.has('aerial-overlay'),
  listOfficeMediaItems: () => [
    { kind: 'aerial-preview', fileName: 'p.jpg' },
    { kind: 'aerial-overlay', fileName: 'o.jpg' },
  ],
  readOfficeMediaUri: (_owner: string, entry: { kind: string }) =>
    mockLocalUris.get(entry.kind) ?? null,
}));

const ID = '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f';

function makeAssignment(overrides: Partial<FieldValidationAssignment> = {}): FieldValidationAssignment {
  return {
    id: ID,
    ownerIdentity: 'owner-1',
    reportUuid: 'r',
    reportClientUuid: 'c',
    referenceCode: 'CG-2026-0001',
    submitter: { uuid: 's', name: 'Ana' },
    assignee: { uuid: 'a', name: 'Mara' },
    submitterIsAssignee: false,
    targetVisitDate: null,
    fieldValidationState: 'assigned',
    assignedAt: '2026-11-26T00:00:00.000Z',
    updatedAt: '2026-11-26T00:00:00.000Z',
    cachedAt: '2026-11-26T00:00:00.000Z',
    case: {
      barangay: 'Mabini',
      province: null,
      municipality: null,
      farmerOrFarmOwnerName: null,
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      capturedAt: '2026-11-25T09:55:00.000Z',
      observedAt: null,
      submittedAt: '2026-11-25T10:00:00.000Z',
      predictedLabel: 'rust',
      confidence: 0.9,
    },
    previousVisit: null,
    officeCase: null,
    aerialCheck: {
      uuid: '0195b3c4-7f10-7000-8000-000000000001',
      enoughCanopy: true,
      abnormalCanopyPercent: 22.4,
      canopyCoveragePercent: 74.5,
      modelVersion: 'aerial-v3',
      createdAt: '2026-11-26T05:30:00.000Z',
      preview: { contentType: 'image/jpeg', bytes: 180_000 },
      overlay: { contentType: 'image/jpeg', bytes: 195_000 },
    },
    ...overrides,
  };
}

describe('OfficeAerialCheckCard', () => {
  beforeEach(() => {
    mockLocalUris.clear();
  });

  it('renders nothing when aerialCheck is absent', async () => {
    await render(<OfficeAerialCheckCard accessToken="tok" assignment={makeAssignment({ aerialCheck: null })} />);
    expect(screen.queryByTestId('field-validation.aerial-brief')).not.toBeOnTheScreen();
  });

  it('defaults to Problem areas overlay and flips to Original photo in one tap', async () => {
    await render(<OfficeAerialCheckCard accessToken="tok" assignment={makeAssignment()} />);

    expect(screen.getByText('Office aerial brief')).toBeOnTheScreen();
    expect(screen.getByText('Photo estimate')).toBeOnTheScreen();
    expect(screen.getByText('22.4%')).toBeOnTheScreen();
    expect(screen.getByText('74.5%')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.aerial-brief.guardrail')).toHaveTextContent(
      'Aerial photo estimate · not a ground hectare measurement.',
    );
    expect(screen.getByTestId('field-validation.aerial-brief.legend')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.aerial-brief.photo')).toHaveProp('source', {
      headers: { Authorization: 'Bearer tok' },
      uri: `http://127.0.0.1:8000/api/v1/mobile/assignments/${ID}/aerial-overlay`,
    });

    await fireEvent.press(screen.getByTestId('field-validation.aerial-brief.mode-preview'));

    expect(screen.queryByTestId('field-validation.aerial-brief.legend')).not.toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.aerial-brief.photo')).toHaveProp('source', {
      headers: { Authorization: 'Bearer tok' },
      uri: `http://127.0.0.1:8000/api/v1/mobile/assignments/${ID}/aerial-preview`,
    });
  });

  it('hides abnormal percentage when canopy coverage is below the floor', async () => {
    const base = makeAssignment();
    await render(
      <OfficeAerialCheckCard
        accessToken="tok"
        assignment={{
          ...base,
          aerialCheck: {
            ...base.aerialCheck!,
            enoughCanopy: false,
            abnormalCanopyPercent: null,
            canopyCoveragePercent: 4.2,
          },
        }}
      />,
    );

    expect(screen.getByText('Not enough cane visible to estimate')).toBeOnTheScreen();
    expect(screen.getByText('4.2%')).toBeOnTheScreen();
  });

  it('uses cached local URIs and shows Ready offline when both images are on disk', async () => {
    mockLocalUris.set('aerial-overlay', 'file:///docs/overlay.jpg');
    mockLocalUris.set('aerial-preview', 'file:///docs/preview.jpg');

    await render(<OfficeAerialCheckCard accessToken={null} assignment={makeAssignment()} />);

    expect(screen.getByText('Ready offline')).toBeOnTheScreen();
    expect(screen.getByTestId('field-validation.aerial-brief.photo')).toHaveProp('source', {
      uri: 'file:///docs/overlay.jpg',
    });

    await fireEvent.press(screen.getByTestId('field-validation.aerial-brief.mode-preview'));
    expect(screen.getByTestId('field-validation.aerial-brief.photo')).toHaveProp('source', {
      uri: 'file:///docs/preview.jpg',
    });
  });

  it('shows Attach drone photo when canUpload is enabled even before an office aerial brief exists', async () => {
    const onAttachPhoto = jest.fn();
    await render(
      <OfficeAerialCheckCard
        accessToken="tok"
        assignment={makeAssignment({ aerialCheck: null })}
        canUpload
        onAttachPhoto={onAttachPhoto}
      />,
    );

    expect(screen.getByTestId('field-validation.aerial-brief.guardrail')).toHaveTextContent(
      'Aerial photo estimate · not a ground hectare measurement.',
    );
    await fireEvent.press(screen.getByTestId('field-validation.aerial-brief.attach'));
    expect(onAttachPhoto).toHaveBeenCalledTimes(1);
  });

  it('displays AERIAL_DISABLED refusal copy with Retry and Remove controls', async () => {
    const onRetryUpload = jest.fn();
    const onRemoveQueued = jest.fn();
    await render(
      <OfficeAerialCheckCard
        accessToken="tok"
        assignment={makeAssignment({ aerialCheck: null })}
        canUpload
        isOnline
        onAttachPhoto={jest.fn()}
        onRemoveQueued={onRemoveQueued}
        onRetryUpload={onRetryUpload}
        queuedUpload={{
          id: '11111111-1111-4111-8111-111111111111',
          ownerIdentity: 'owner-1',
          assignmentId: ID,
          reportUuid: 'r',
          imageUri: 'file:///docs/drone.jpg',
          imageMimeType: 'image/jpeg',
          imageSizeBytes: 500_000,
          syncStatus: 'failed',
          remoteId: null,
          syncAttemptCount: 1,
          lastSyncErrorCode: 'AERIAL_DISABLED',
          lastSyncAttemptAt: '2026-11-26T06:00:00.000Z',
          lastSyncedAt: null,
          createdAt: '2026-11-26T05:59:00.000Z',
          updatedAt: '2026-11-26T06:00:00.000Z',
        }}
      />,
    );

    expect(
      screen.getByText(
        'Aerial canopy checks are turned off by the office. Your saved drone photo stays on this device.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('field-validation.aerial-brief.retry'));
    expect(onRetryUpload).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('field-validation.aerial-brief.remove'));
    expect(onRemoveQueued).toHaveBeenCalledTimes(1);
  });
});
