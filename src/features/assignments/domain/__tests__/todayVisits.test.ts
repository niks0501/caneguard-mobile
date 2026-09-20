import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  bucketForVisit,
  compareVisits,
  getLocalDateKey,
  selectTodayVisits,
} from '@/features/assignments/domain/todayVisits';

function assignment(overrides: Partial<FieldValidationAssignment> = {}): FieldValidationAssignment {
  return {
    id: 'a',
    ownerIdentity: 'owner',
    reportUuid: 'report',
    reportClientUuid: 'client',
    referenceCode: 'CG-2',
    submitter: { uuid: 'submitter', name: 'Reporter' },
    assignee: { uuid: 'owner', name: 'Inspector' },
    submitterIsAssignee: false,
    targetVisitDate: '2026-09-20',
    fieldValidationState: 'assigned',
    assignedAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    cachedAt: '2026-09-01T00:00:00.000Z',
    case: {
      barangay: 'Mabini',
      province: 'Batangas',
      municipality: 'Nasugbu',
      farmerOrFarmOwnerName: 'Farm',
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      capturedAt: '2026-09-01T00:00:00.000Z',
      observedAt: null,
      submittedAt: '2026-09-01T00:00:00.000Z',
      predictedLabel: 'rust',
      confidence: 0.9,
    },
    ...overrides,
  };
}

describe('today visits', () => {
  it('buckets a due-today visit without calling it overdue', () => {
    expect(bucketForVisit(assignment({ targetVisitDate: '2026-09-20' }), '2026-09-20')).toBe('today');
    expect(bucketForVisit(assignment({ targetVisitDate: '2026-09-19' }), '2026-09-20')).toBe('overdue');
    expect(bucketForVisit(assignment({ targetVisitDate: null }), '2026-09-20')).toBe('none');
  });

  it('orders due date, barangay, then case code and excludes completed work', () => {
    const visits = selectTodayVisits([
      assignment({ id: 'later', targetVisitDate: '2026-09-21', referenceCode: 'CG-1' }),
      assignment({ id: 'barangay', targetVisitDate: '2026-09-20', referenceCode: 'CG-3', case: { ...assignment().case, barangay: 'Balayan' } }),
      assignment({ id: 'case', targetVisitDate: '2026-09-20', referenceCode: 'CG-1' }),
      assignment({ id: 'done', targetVisitDate: '2026-09-19', fieldValidationState: 'in_progress' }),
    ], new Set(['done']));
    expect(visits.map((visit) => visit.id)).toEqual(['barangay', 'case', 'later']);
    expect(compareVisits(visits[0], visits[1])).toBeLessThan(0);
  });

  it('uses the device calendar date rather than UTC date', () => {
    expect(getLocalDateKey(new Date(2026, 8, 20, 0, 30))).toBe('2026-09-20');
  });
});
