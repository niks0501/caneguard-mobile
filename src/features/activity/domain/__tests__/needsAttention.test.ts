import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

import {
  buildNeedsAttention,
  NEEDS_ATTENTION_ROW_LIMIT,
} from '@/features/activity/domain/needsAttention';

const TODAY = '2026-09-15';

function assignment(
  overrides: Partial<FieldValidationAssignment> = {},
): FieldValidationAssignment {
  return {
    id: 'assignment-1',
    ownerIdentity: 'owner-1',
    reportUuid: 'report-1',
    reportClientUuid: 'client-1',
    referenceCode: 'CG-2026-0001',
    submitter: { uuid: 'submitter-1', name: 'Ana Reporter' },
    assignee: { uuid: 'owner-1', name: 'Mara Reporter' },
    submitterIsAssignee: false,
    targetVisitDate: '2026-09-20',
    fieldValidationState: 'assigned',
    assignedAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    cachedAt: '2026-09-01T00:00:00.000Z',
    case: {
      barangay: 'Mabini',
      province: 'Negros Occidental',
      municipality: 'Bago',
      farmerOrFarmOwnerName: 'Juan Dela Cruz',
      affectedAreaHectares: 12.5,
      affectedPortionPercent: 42.75,
      capturedAt: '2026-08-01T00:00:00.000Z',
      observedAt: '2026-08-01T00:00:00.000Z',
      submittedAt: '2026-08-01T00:00:00.000Z',
      predictedLabel: 'rust',
      confidence: 0.93,
    },
    ...overrides,
  };
}

function notification(
  overrides: Partial<MobileNotification> = {},
): MobileNotification {
  return {
    id: 'notification-1',
    ownerIdentity: 'owner-1',
    eventType: 'office_review_completed',
    title: 'Office review completed',
    message: 'CG-2026-0001 was reviewed.',
    caseUuid: 'case-1',
    referenceCode: 'CG-2026-0001',
    assignmentUuid: null,
    isRead: false,
    readAt: null,
    createdAt: '2026-09-10T00:00:00.000Z',
    cachedAt: '2026-09-10T00:00:00.000Z',
    ...overrides,
  };
}

function build(overrides: {
  assignments?: FieldValidationAssignment[];
  destinations?: Map<string, NotificationDestination>;
  notifications?: MobileNotification[];
  pendingUploadCount?: number;
  pendingReportsCount?: number;
  pendingCompletionsCount?: number;
  syncErrorMessage?: string | null;
}) {
  return buildNeedsAttention({
    assignments: overrides.assignments ?? [],
    destinations: overrides.destinations ?? new Map(),
    notifications: overrides.notifications ?? [],
    pendingUploadCount: overrides.pendingUploadCount ?? 0,
    pendingReportsCount: overrides.pendingReportsCount,
    pendingCompletionsCount: overrides.pendingCompletionsCount,
    syncErrorMessage: overrides.syncErrorMessage ?? null,
    today: TODAY,
  });
}

describe('buildNeedsAttention', () => {
  it('orders unread office updates before assignments and uploads', () => {
    const summary = build({
      assignments: [assignment()],
      notifications: [notification()],
      pendingUploadCount: 2,
    });

    expect(summary.total).toBe(3);
    expect(summary.items.map((item) => item.kind)).toEqual([
      'notification',
      'assignment',
      'upload',
    ]);
  });

  it('marks an unread update whose case is not on this device as unavailable', () => {
    const summary = build({ notifications: [notification()] });

    expect(summary.items[0].destination).toEqual({ kind: 'unavailable' });
    expect(summary.items[0].meta).toBe('This case is not stored on this device');
  });

  it('uses the resolved destination meta for an actionable update', () => {
    const summary = build({
      destinations: new Map([
        ['notification-1', { kind: 'field_report', scanRecordId: 'scan-1' }],
      ]),
      notifications: [notification()],
    });

    expect(summary.items[0].destination).toEqual({
      kind: 'field_report',
      scanRecordId: 'scan-1',
    });
    expect(summary.items[0].meta).toBe('CG-2026-0001');
  });

  it('excludes read updates and completed assignments', () => {
    const summary = build({
      assignments: [
        assignment({ id: 'done', fieldValidationState: 'completed' }),
        assignment({ id: 'unassigned', fieldValidationState: 'unassigned' }),
      ],
      notifications: [notification({ isRead: true })],
    });

    expect(summary.total).toBe(0);
  });

  it('labels overdue, due today, and undated assignments accurately', () => {
    const summary = build({
      assignments: [
        assignment({ id: 'overdue', targetVisitDate: '2026-09-01' }),
        assignment({ id: 'today', targetVisitDate: TODAY }),
        assignment({ id: 'undated', targetVisitDate: null, fieldValidationState: 'in_progress' }),
      ],
    });

    expect(summary.items.map((item) => item.meta)).toEqual([
      'Visit was due 2026-09-01',
      'Visit due today',
      'Visit in progress',
    ]);
  });

  it('sorts assignments by due date with undated rows last', () => {
    const summary = build({
      assignments: [
        assignment({ id: 'later', targetVisitDate: '2026-09-30' }),
        assignment({ id: 'undated', targetVisitDate: null }),
        assignment({ id: 'sooner', targetVisitDate: '2026-09-16' }),
      ],
    });

    expect(summary.items.map((item) => item.id)).toEqual([
      'assignment-sooner',
      'assignment-later',
      'assignment-undated',
    ]);
  });

  it('reports an upload problem only while reports are waiting', () => {
    expect(build({ pendingUploadCount: 0, syncErrorMessage: 'failed' }).total).toBe(0);

    const failed = build({ pendingUploadCount: 1, syncErrorMessage: 'Server unreachable' });
    expect(failed.items[0].meta).toBe('Upload problem');
    expect(failed.items[0].message).toBe('Server unreachable');

    const pending = build({ pendingUploadCount: 3, syncErrorMessage: null });
    expect(pending.items[0].title).toBe('3 reports need synchronization');
    expect(pending.items[0].meta).toBe('Waiting to upload');

    const visitsOnly = build({
      pendingUploadCount: 1,
      pendingReportsCount: 0,
      pendingCompletionsCount: 1,
      syncErrorMessage: null,
    });
    expect(visitsOnly.items[0].title).toBe('1 field visit needs synchronization');

    const mixed = build({
      pendingUploadCount: 2,
      pendingReportsCount: 1,
      pendingCompletionsCount: 1,
      syncErrorMessage: null,
    });
    expect(mixed.items[0].title).toBe('2 items need synchronization');
  });

  it('reports every item while exposing how many rows collapse', () => {
    const summary = build({
      assignments: Array.from({ length: NEEDS_ATTENTION_ROW_LIMIT + 2 }, (_, index) =>
        assignment({ id: `assignment-${index}`, referenceCode: `CG-2026-000${index}` }),
      ),
    });

    expect(summary.items).toHaveLength(NEEDS_ATTENTION_ROW_LIMIT + 2);
    expect(summary.total).toBe(NEEDS_ATTENTION_ROW_LIMIT + 2);
    expect(summary.hiddenCount).toBe(2);
  });
});
