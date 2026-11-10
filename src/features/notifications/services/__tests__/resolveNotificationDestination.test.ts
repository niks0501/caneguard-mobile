import {
  findCachedFieldValidationAssignment,
  findCachedFieldValidationAssignmentForCase,
} from '@/features/assignments/data/assignmentCacheRepository';
import { findScanRecordIdForCase } from '@/features/reports/data/fieldReportRepository';
import {
  notificationDestinationRoute,
  resolveNotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

jest.mock('@/features/assignments/data/assignmentCacheRepository', () => ({
  findCachedFieldValidationAssignment: jest.fn(),
  findCachedFieldValidationAssignmentForCase: jest.fn(),
}));
jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  findScanRecordIdForCase: jest.fn(),
}));

const findAssignment = jest.mocked(findCachedFieldValidationAssignment);
const findByCase = jest.mocked(findCachedFieldValidationAssignmentForCase);
const findLocal = jest.mocked(findScanRecordIdForCase);
const database = {} as never;

describe('resolveNotificationDestination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findAssignment.mockResolvedValue({} as never);
    findByCase.mockResolvedValue(null);
  });

  // Intent: a notification for an office-born case opens its cached office card even without an assignment id.
  it('opens the cached office-case assignment matched by case', async () => {
    findByCase.mockResolvedValue({ id: 'assignment-9' } as never);
    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: null,
        caseUuid: 'case-1',
        referenceCode: 'CG-2026-0009',
      }),
    ).resolves.toEqual({ kind: 'assignment', assignmentId: 'assignment-9' });
    expect(findLocal).not.toHaveBeenCalled();
  });

  it('prefers a cached owner assignment without touching local reports', async () => {
    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: 'assignment-1',
        caseUuid: 'case-1',
        referenceCode: 'CG-2026-0001',
      }),
    ).resolves.toEqual({ kind: 'assignment', assignmentId: 'assignment-1' });
    expect(findAssignment).toHaveBeenCalledWith(database, 'owner-1', 'assignment-1');
    expect(findLocal).not.toHaveBeenCalled();
  });

  it('falls back to the owner-scoped local report when an assignment is not cached', async () => {
    findAssignment.mockResolvedValue(null);
    findLocal.mockResolvedValue('scan-1');

    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: 'assignment-1',
        caseUuid: 'case-1',
        referenceCode: null,
      }),
    ).resolves.toEqual({ kind: 'field_report', scanRecordId: 'scan-1' });
    expect(findLocal).toHaveBeenCalledWith(database, 'owner-1', {
      caseUuid: 'case-1',
      referenceCode: null,
    });
  });

  it('resolves a case notification to the owner-scoped local report', async () => {
    findLocal.mockResolvedValue('scan-1');

    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: null,
        caseUuid: 'case-1',
        referenceCode: null,
      }),
    ).resolves.toEqual({ kind: 'field_report', scanRecordId: 'scan-1' });
    expect(findLocal).toHaveBeenCalledWith(database, 'owner-1', {
      caseUuid: 'case-1',
      referenceCode: null,
    });
  });

  it('reports an unavailable destination when the case is not on this device', async () => {
    findAssignment.mockResolvedValue(null);
    findLocal.mockResolvedValue(null);

    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: null,
        caseUuid: 'case-1',
        referenceCode: 'CG-2026-0001',
      }),
    ).resolves.toEqual({ kind: 'unavailable' });
  });
});

describe('notificationDestinationRoute', () => {
  it('maps each destination to its owner-safe route', () => {
    expect(
      notificationDestinationRoute({ kind: 'assignment', assignmentId: 'a-1' }),
    ).toEqual({ pathname: '/field-validation', params: { assignmentId: 'a-1' } });
    expect(
      notificationDestinationRoute({ kind: 'field_report', scanRecordId: 's-1' }),
    ).toEqual({ pathname: '/field-report', params: { scanRecordId: 's-1' } });
    expect(notificationDestinationRoute({ kind: 'unavailable' })).toBeNull();
  });
});
