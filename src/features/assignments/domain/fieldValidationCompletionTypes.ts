import type {
  FieldValidationGpsOutcome,
  SyncStatus,
} from '@/database/schema';

export interface FieldValidationCompletion {
  actionTaken: string;
  assignmentId: string;
  createdAt: string;
  fieldFinding: string;
  fieldObservation: string;
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

export interface SaveFieldValidationCompletionInput {
  actionTaken: string;
  assignmentId: string;
  fieldFinding: string;
  fieldObservation: string;
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
