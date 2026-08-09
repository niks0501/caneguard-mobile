import type {
  FieldReportAuthoringState,
  FieldReportLocationSource,
  GpsCaptureOutcome,
  SyncStatus,
} from '@/database/schema';
import type { MobileUserRole } from '@/features/auth/types';

export interface FieldReport {
  authoringState: FieldReportAuthoringState;
  barangay: string | null;
  createdAt: string;
  farmerOrFarmOwnerName: string | null;
  finalLatitude: number | null;
  finalLongitude: number | null;
  gpsAccuracy: number | null;
  gpsAttemptAccuracy: number | null;
  gpsAttemptLatitude: number | null;
  gpsAttemptLongitude: number | null;
  gpsAttemptedAt: string | null;
  gpsCaptureOutcome: GpsCaptureOutcome | null;
  gpsOutcomeRecordedAt: string | null;
  id: string;
  locationSource: FieldReportLocationSource | null;
  municipality: string;
  observedAt: string;
  province: string;
  scanRecordId: string;
  submittedAt: string | null;
  submitterIdentity: string | null;
  submitterRole: MobileUserRole | null;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface CreateFieldReportDraftInput {
  createdAt: string;
  id: string;
  scanRecordId: string;
  submitterIdentity: string;
  submitterRole: MobileUserRole;
}

export interface SaveFieldReportDraftInput {
  barangay?: string;
  farmerOrFarmOwnerName?: string;
  updatedAt: string;
}

export type SaveGpsCaptureInput =
  | {
      accuracy: number;
      capturedAt: string;
      latitude: number;
      longitude: number;
      outcome: 'low_accuracy' | 'resolved';
      updatedAt: string;
    }
  | {
      capturedAt: string;
      outcome: 'error' | 'permission_denied' | 'unavailable';
      updatedAt: string;
    };
