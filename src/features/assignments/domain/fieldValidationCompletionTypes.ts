import type {
  FieldValidationFollowUpOutcome,
  FieldValidationGpsOutcome,
  SyncStatus,
} from '@/database/schema';

export interface FieldValidationCompletion {
  actionTaken: string;
  assignmentId: string;
  createdAt: string;
  fieldFinding: string;
  fieldObservation: string;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  freshPhotoMimeType: string | null;
  freshPhotoSizeBytes: number | null;
  freshPhotoUri: string | null;
  gpsAccuracy: number | null;
  gpsAttemptedAt: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsOutcome: FieldValidationGpsOutcome;
  id: string;
  lastSyncAttemptAt: string | null;
  lastSyncErrorCode: string | null;
  lastSyncedAt: string | null;
  ownerIdentity: string;
  remoteId: string | null;
  reportUuid: string;
  syncAttemptCount: number;
  syncStatus: SyncStatus;
  updatedAt: string;
  visitedAt: string;
}

/**
 * The phone's own view of a saved visit: waiting to send, delivered, or one of
 * the named end states where the office refused it. A refused visit keeps its
 * saved evidence on the phone.
 */
export type PhoneCompletionState =
  | 'waiting'
  | 'sent'
  | 'moved'
  | 'case-closed'
  | 'done-by-someone'
  | 'visit-cancelled';

export function toPhoneCompletionState(row: {
  lastSyncErrorCode?: string | null;
  syncStatus: string;
}): PhoneCompletionState {
  if (row.syncStatus === 'synced') return 'sent';
  switch (row.lastSyncErrorCode) {
    case 'VISIT_MOVED':
      return 'moved';
    case 'VISIT_CASE_CLOSED':
      return 'case-closed';
    case 'VISIT_DONE_BY_SOMEONE':
      return 'done-by-someone';
    case 'VISIT_CANCELLED':
      return 'visit-cancelled';
    default:
      return 'waiting';
  }
}

export interface SaveFieldValidationCompletionInput {
  actionTaken: string;
  assignmentId: string;
  fieldFinding: string;
  fieldObservation: string;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  freshPhotoMimeType?: string | null;
  freshPhotoSizeBytes?: number | null;
  freshPhotoUri?: string | null;
  gpsAccuracy?: number | null;
  gpsAttemptedAt: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsOutcome: FieldValidationGpsOutcome;
  id: string;
  ownerIdentity: string;
  reportUuid: string;
  visitedAt: string;
}

export interface FieldValidationCompletionUploadRecord {
  completion: FieldValidationCompletion;
}
