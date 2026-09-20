import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { farmKey, selectPreviousVisit } from '@/features/assignments/domain/previousVisit';

function assignment(id: string, name: string | null, updatedAt: string): FieldValidationAssignment {
  return {
    id,
    ownerIdentity: 'owner',
    reportUuid: `report-${id}`,
    reportClientUuid: `client-${id}`,
    referenceCode: `CG-${id}`,
    submitter: { uuid: 'submitter', name: 'Reporter' },
    assignee: { uuid: 'owner', name: 'Inspector' },
    submitterIsAssignee: false,
    targetVisitDate: null,
    fieldValidationState: 'assigned',
    assignedAt: updatedAt,
    updatedAt,
    cachedAt: updatedAt,
    case: {
      barangay: ' Mabini ',
      province: 'Batangas',
      municipality: 'Nasugbu',
      farmerOrFarmOwnerName: name,
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      capturedAt: updatedAt,
      observedAt: null,
      submittedAt: updatedAt,
      predictedLabel: 'rust',
      confidence: 0.9,
    },
  };
}

function completion(assignmentId: string, visitedAt: string, createdAt = visitedAt): FieldValidationCompletion {
  return {
    id: `completion-${assignmentId}`,
    ownerIdentity: 'owner',
    assignmentId,
    reportUuid: `report-${assignmentId}`,
    fieldObservation: 'Observation',
    fieldFinding: 'Finding',
    actionTaken: 'Action',
    followUpOutcome: 'unchanged',
    visitedAt,
    gpsOutcome: 'unavailable',
    gpsAttemptedAt: visitedAt,
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAccuracy: null,
    freshPhotoUri: null,
    freshPhotoMimeType: null,
    freshPhotoSizeBytes: null,
    syncStatus: 'pending',
    remoteId: null,
    syncAttemptCount: 0,
    lastSyncErrorCode: null,
    lastSyncAttemptAt: null,
    lastSyncedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('previous visit selector', () => {
  it('matches exact normalized farm identity and chooses the latest earlier completion', () => {
    const current = assignment('current', '  Farm   A ', '2026-09-20T00:00:00.000Z');
    const earlier = assignment('earlier', 'Farm A', '2026-09-01T00:00:00.000Z');
    const older = assignment('older', 'Farm A', '2026-08-01T00:00:00.000Z');
    const result = selectPreviousVisit({
      currentAssignment: current,
      assignments: [current, earlier, older],
      completions: [
        completion('earlier', '2026-09-10T00:00:00.000Z'),
        completion('older', '2026-08-10T00:00:00.000Z'),
      ],
      currentVisitAt: '2026-09-20T00:00:00.000Z',
      reporterConcerns: new Map([['earlier', 'RSSI']]),
    });
    expect(result).toMatchObject({
      assignment: { id: 'earlier' },
      reporterConcern: 'RSSI',
      completion: { actionTaken: 'Action' },
    });
    expect(farmKey(current)).toBe(farmKey(earlier));
  });

  it('does not fuzzy-match farms with different references and never selects the current completion', () => {
    const current = assignment('current', 'Farm A', '2026-09-20T00:00:00.000Z');
    const different = assignment('different', 'Farm AB', '2026-09-19T00:00:00.000Z');
    expect(selectPreviousVisit({
      currentAssignment: current,
      assignments: [current, different],
      completions: [completion('current', '2026-09-19T00:00:00.000Z')],
      currentVisitAt: '2026-09-20T00:00:00.000Z',
    })).toBeNull();
  });

  it('uses barangay-only matching when the current farm reference is blank', () => {
    const current = assignment('current', null, '2026-09-20T00:00:00.000Z');
    const earlier = assignment('earlier', 'A reference', '2026-09-10T00:00:00.000Z');
    expect(selectPreviousVisit({
      currentAssignment: current,
      assignments: [current, earlier],
      completions: [],
      currentVisitAt: '2026-09-20T00:00:00.000Z',
    })?.assignment.id).toBe('earlier');
  });
});
