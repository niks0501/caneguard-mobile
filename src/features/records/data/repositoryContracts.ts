import type {
  DateRange,
  LocalReportSummary,
  SaveCompletedScanInput,
  ScanCheckHistoryItem,
  ScanRecordDetails,
  ScanRecordListItem,
  ScanRecordQuery,
} from '@/features/records/domain/recordTypes';

export interface ScanRecordWriteRepository {
  insert(input: SaveCompletedScanInput): Promise<{ id: string }>;
}

export interface ScanRecordRepository extends ScanRecordWriteRepository {
  deleteById(id: string): Promise<{
    managedImageUri: string | null;
    submissionImageUri?: string | null;
  }>;
  findById(id: string): Promise<ScanRecordDetails>;
  list(query: ScanRecordQuery): Promise<ScanRecordListItem[]>;
  listCheckHistory(id: string): Promise<ScanCheckHistoryItem[]>;
  listManagedImageUris(): Promise<string[]>;
}

export interface ReportRepository {
  getLocalSummary(options?: {
    dateRange?: DateRange;
    lowScoreThreshold?: number;
    recentLimit?: number;
  }): Promise<LocalReportSummary>;
}
