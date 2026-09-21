import { render, screen } from '@testing-library/react-native';

import { AssignmentCard } from '@/features/activity/components/AssignmentCard';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

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

describe('AssignmentCard', () => {
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
});
