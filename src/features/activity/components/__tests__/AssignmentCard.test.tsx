import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ASSIGNMENT_PHOTO_PLACEHOLDER } from '@/constants/copy';
import { AssignmentCard } from '@/features/activity/components/AssignmentCard';
import { useAssignmentPhotoUri } from '@/features/activity/hooks/useAssignmentPhoto';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

jest.mock('@/features/activity/hooks/useAssignmentPhoto', () => ({
  useAssignmentPhotoUri: jest.fn(() => null),
}));

const mockUseAssignmentPhotoUri = jest.mocked(useAssignmentPhotoUri);
const STORED_PHOTO_URI = 'file:///documents/caneguard/scan-images/case.jpg';

type JsonNode = { type?: string; props?: { testID?: string; numberOfLines?: number }; children?: unknown };

/** Line caps of every host Text node inside the card with `testID`, in render order. */
function renderedLineCaps(rootTestID: string): (number | undefined)[] {
  const caps: (number | undefined)[] = [];
  const walk = (node: unknown, insideCard: boolean) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, insideCard));
      return;
    }
    const element = node as JsonNode;
    const inside = insideCard || element.props?.testID === rootTestID;
    if (inside && element.type === 'Text' && element.children) {
      caps.push(element.props?.numberOfLines);
    }
    if (Array.isArray(element.children)) {
      element.children.forEach((child) => walk(child, inside));
    }
  };
  walk(screen.toJSON(), false);
  return caps;
}

const ASSIGNMENT: FieldValidationAssignment = {
  id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
  ownerIdentity: 'owner-1',
  reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
  referenceCode: 'CG-2026-0001',
  submitter: { uuid: 'submitter-1', name: 'Ana Reporter' },
  assignee: { uuid: 'owner-1', name: 'Mara Reporter' },
  submitterIsAssignee: true,
  targetVisitDate: '2026-08-20',
  fieldValidationState: 'assigned',
  assignedAt: '2026-08-13T12:00:00.000Z',
  updatedAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:05:00.000Z',
  case: {
    barangay: 'Mabini',
    province: 'Batangas',
    municipality: 'Nasugbu',
    farmerOrFarmOwnerName: 'Juan Dela Cruz',
    affectedAreaHectares: 1,
    affectedPortionPercent: 20,
    capturedAt: '2026-07-20T09:55:00.000Z',
    observedAt: '2026-07-20T09:58:00.000Z',
    submittedAt: '2026-07-20T10:00:00.000Z',
    predictedLabel: 'rust',
    confidence: 0.93,
  },
} as FieldValidationAssignment;

const LONG_BARANGAY =
  'Barangay San Isidro de la Cruz ng Napakahabang Pangalan na Walang Hangganan sa Mundo';

const LONG_ASSIGNMENT: FieldValidationAssignment = {
  ...ASSIGNMENT,
  referenceCode: 'CG-2026-0001-EXTREMELY-LONG-REFERENCE-CODE-WITHOUT-ANY-BREAK-OPPORTUNITY',
  submitter: {
    uuid: 'submitter-1',
    name: 'Ana Reporter with a name far longer than any list row should ever grow',
  },
  case: {
    ...ASSIGNMENT.case,
    barangay: `${LONG_BARANGAY} ${LONG_BARANGAY} ${LONG_BARANGAY}`,
  },
};

describe('AssignmentCard', () => {
  beforeEach(() => {
    mockUseAssignmentPhotoUri.mockReturnValue(null);
  });

  it('renders exactly one due row when a due state is shown', async () => {
    await render(
      <AssignmentCard assignment={ASSIGNMENT} dueState="today" today="2026-08-20" />,
    );

    expect(screen.getByText('Due')).toBeOnTheScreen();
    expect(screen.queryByText('Visit')).not.toBeOnTheScreen();
  });

  it('renders the visit row when no due state is shown', async () => {
    await render(<AssignmentCard assignment={ASSIGNMENT} />);

    expect(screen.getByText('Visit')).toBeOnTheScreen();
    expect(screen.queryByText('Due')).not.toBeOnTheScreen();
  });

  it('keeps the same-person warning off the list row', async () => {
    await render(
      <AssignmentCard assignment={ASSIGNMENT} dueState="today" today="2026-08-20" />,
    );

    expect(
      screen.queryByText('You submitted this case and are its validator.'),
    ).not.toBeOnTheScreen();
  });

  it('bounds long values to one line each', async () => {
    await render(<AssignmentCard assignment={LONG_ASSIGNMENT} />);

    expect(screen.getByText(LONG_ASSIGNMENT.referenceCode)).toHaveProp('numberOfLines', 1);
    expect(screen.getByText(LONG_ASSIGNMENT.case.barangay)).toHaveProp('numberOfLines', 1);
    expect(screen.getByText(LONG_ASSIGNMENT.submitter.name)).toHaveProp('numberOfLines', 1);
    expect(screen.getByText('Assigned')).toHaveProp('numberOfLines', 1);
  });

  it('renders the same bounded line structure for short and long content', async () => {
    await render(
      <>
        <AssignmentCard assignment={ASSIGNMENT} testID="assignment.short" />
        <AssignmentCard assignment={LONG_ASSIGNMENT} testID="assignment.long" />
      </>,
    );

    const shortCaps = renderedLineCaps('assignment.short');
    const longCaps = renderedLineCaps('assignment.long');

    // Every content line is capped at one line, so height cannot grow with text.
    expect(shortCaps).toEqual(longCaps);
    expect(shortCaps.every((cap) => cap === undefined || cap === 1)).toBe(true);
  });

  it('shows the stored case picture for the assignment', async () => {
    mockUseAssignmentPhotoUri.mockReturnValue(STORED_PHOTO_URI);
    await render(<AssignmentCard assignment={ASSIGNMENT} />);

    expect(screen.getByTestId('assignment.photo.image')).toHaveProp('source', {
      uri: STORED_PHOTO_URI,
    });
    expect(screen.queryByTestId('assignment.photo.placeholder')).not.toBeOnTheScreen();
  });

  it('renders the designed placeholder when no picture is stored', async () => {
    await render(<AssignmentCard assignment={ASSIGNMENT} />);

    expect(screen.getByTestId('assignment.photo.placeholder')).toBeOnTheScreen();
    expect(screen.getByText(ASSIGNMENT_PHOTO_PLACEHOLDER)).toBeOnTheScreen();
    expect(screen.queryByTestId('assignment.photo.image')).not.toBeOnTheScreen();
  });

  it('falls back to the placeholder when a stored picture cannot be loaded', async () => {
    mockUseAssignmentPhotoUri.mockReturnValue(STORED_PHOTO_URI);
    await render(<AssignmentCard assignment={ASSIGNMENT} />);

    await act(() => screen.getByTestId('assignment.photo.image').props.onError());

    expect(screen.getByTestId('assignment.photo.placeholder')).toBeOnTheScreen();
    expect(screen.queryByTestId('assignment.photo.image')).not.toBeOnTheScreen();
  });

  it('keeps one photo frame size for loaded, missing, and long content', async () => {
    mockUseAssignmentPhotoUri.mockReturnValue(STORED_PHOTO_URI);
    const view = await render(<AssignmentCard assignment={ASSIGNMENT} />);
    expect(photoFrameSize()).toEqual({ height: 72, width: 72 });

    mockUseAssignmentPhotoUri.mockReturnValue(null);
    await view.rerender(
      <>
        <AssignmentCard assignment={ASSIGNMENT} testID="assignment.short" />
        <AssignmentCard assignment={LONG_ASSIGNMENT} testID="assignment.long" />
      </>,
    );

    const frames = screen.getAllByTestId('assignment.photo');
    expect(frames).toHaveLength(2);
    frames.forEach((frame) => {
      expect(flattenedSize(frame.props.style)).toEqual({ height: 72, width: 72 });
    });
  });

  it('keeps the assignment pill to the disease name only', async () => {
    await render(<AssignmentCard assignment={ASSIGNMENT} />);

    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.queryByText(/Possible Condition/)).not.toBeOnTheScreen();
  });
});

function photoFrameSize(): { height: number; width: number } {
  return flattenedSize(screen.getByTestId('assignment.photo').props.style);
}

function flattenedSize(style: unknown): { height: number; width: number } {
  const flattened = StyleSheet.flatten(style) as { height: number; width: number };
  return { height: flattened.height, width: flattened.width };
}
