import { findScanRecordIdForCase } from '@/features/reports/data/fieldReportRepository';
import {
  notificationDestinationRoute,
  resolveNotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  findScanRecordIdForCase: jest.fn(),
}));

const findLocal = jest.mocked(findScanRecordIdForCase);
const database = {} as never;

describe('resolveNotificationDestination', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prefers the assignment destination without touching local reports', async () => {
    await expect(
      resolveNotificationDestination(database, 'owner-1', {
        assignmentUuid: 'assignment-1',
        caseUuid: 'case-1',
        referenceCode: 'CG-2026-0001',
      }),
    ).resolves.toEqual({ kind: 'assignment', assignmentId: 'assignment-1' });
    expect(findLocal).not.toHaveBeenCalled();
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
