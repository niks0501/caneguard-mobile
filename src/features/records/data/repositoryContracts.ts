import type {
  DateRange,
  LocalReportSummary,
  SaveCompletedScanInput,
  ScanRecordDetails,
  ScanRecordListItem,
  ScanRecordQuery,
} from '@/features/records/domain/recordTypes';

export interface ScanRecordRepository {
  deleteById(id: string): Promise<{ managedImageUri: string }>;
  findById(id: string): Promise<ScanRecordDetails>;
  insert(input: SaveCompletedScanInput): Promise<{ id: string }>;
  list(query: ScanRecordQuery): Promise<ScanRecordListItem[]>;
  listManagedImageUris(): Promise<string[]>;
}

export interface ReportRepository {
  getLocalSummary(options?: {
    dateRange?: DateRange;
    lowScoreThreshold?: number;
    recentLimit?: number;
  }): Promise<LocalReportSummary>;
}
