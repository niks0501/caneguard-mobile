import type {
  FieldReportAuthoringState,
  FieldReportLocationSource,
  SyncStatus,
} from '@/database/schema';

export interface FieldReport {
  authoringState: FieldReportAuthoringState;
  barangay: string | null;
  createdAt: string;
  farmerOrFarmOwnerName: string | null;
  finalLatitude: number | null;
  finalLongitude: number | null;
  gpsAccuracy: number | null;
  id: string;
  locationSource: FieldReportLocationSource | null;
  municipality: string;
  observedAt: string;
  province: string;
  scanRecordId: string;
  submittedAt: string | null;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface CreateFieldReportDraftInput {
  createdAt: string;
  id: string;
  scanRecordId: string;
}

export interface SaveFieldReportDraftInput {
  barangay?: string;
  farmerOrFarmOwnerName?: string;
  updatedAt: string;
}
