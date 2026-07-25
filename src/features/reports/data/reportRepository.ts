import { and, asc, count, desc, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { scanRecords } from '@/database/schema';
import type { ReportRepository } from '@/features/records/data/repositoryContracts';
import { listScanRecords } from '@/features/records/data/scanRecordRepository';
import type {
  DateRange,
  LocalReportSummary,
} from '@/features/records/domain/recordTypes';

export const PROTOTYPE_LOW_SCORE_THRESHOLD = 0.5;
export const DEFAULT_RECENT_RECORD_LIMIT = 3;

export interface LocalReportOptions {
  dateRange?: DateRange;
  lowScoreThreshold?: number;
  recentLimit?: number;
}

export function createReportRepository(
  database: CaneGuardDatabase,
): ReportRepository {
  return {
    getLocalSummary: (options) => getLocalReportSummary(database, options),
  };
}

export async function getLocalReportSummary(
  database: CaneGuardDatabase,
  options: LocalReportOptions = {},
): Promise<LocalReportSummary> {
  const lowScoreThreshold =
    options.lowScoreThreshold ?? PROTOTYPE_LOW_SCORE_THRESHOLD;
  const recentLimit = Math.min(
    Math.max(Math.trunc(options.recentLimit ?? DEFAULT_RECENT_RECORD_LIMIT), 1),
    25,
  );
  const where = buildDateCondition(options.dateRange);

  if (
    !Number.isFinite(lowScoreThreshold) ||
    lowScoreThreshold < 0 ||
    lowScoreThreshold > 1
  ) {
    throw toStorageError(
      new Error('Invalid low-score threshold.'),
      'QUERY_FAILED',
      'Report query options are invalid.',
    );
  }

  try {
    const [totals, recordsByLabel, recentRecords] = await Promise.all([
      database
        .select({
          totalSavedScans: count(),
          healthyPredictions:
            sql<number>`coalesce(sum(case when ${scanRecords.predictedLabel} = 'healthy' then 1 else 0 end), 0)`,
          possibleDiseasePredictions:
            sql<number>`coalesce(sum(case when ${scanRecords.predictedLabel} <> 'healthy' then 1 else 0 end), 0)`,
          localOnlyRecords:
            sql<number>`coalesce(sum(case when ${scanRecords.syncStatus} = 'local_only' then 1 else 0 end), 0)`,
          lowScorePredictions:
            sql<number>`coalesce(sum(case when ${scanRecords.confidence} < ${lowScoreThreshold} then 1 else 0 end), 0)`,
        })
        .from(scanRecords)
        .where(where)
        .get(),
      database
        .select({
          label: scanRecords.predictedLabel,
          count: count(),
        })
        .from(scanRecords)
        .where(where)
        .groupBy(scanRecords.predictedLabel)
        .orderBy(desc(count()), asc(scanRecords.predictedLabel)),
      listScanRecords(database, {
        dateRange: options.dateRange,
        limit: recentLimit,
      }),
    ]);

    return {
      totalSavedScans: Number(totals?.totalSavedScans ?? 0),
      healthyPredictions: Number(totals?.healthyPredictions ?? 0),
      possibleDiseasePredictions: Number(
        totals?.possibleDiseasePredictions ?? 0,
      ),
      localOnlyRecords: Number(totals?.localOnlyRecords ?? 0),
      lowScorePredictions: Number(totals?.lowScorePredictions ?? 0),
      recordsByLabel: recordsByLabel.map((row) => ({
        label: row.label,
        count: Number(row.count),
      })),
      recentRecords,
    };
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Calculating the local report summary failed.',
    );
  }
}

function buildDateCondition(dateRange?: DateRange): SQL | undefined {
  const conditions: SQL[] = [];
  if (dateRange?.from) {
    conditions.push(gte(scanRecords.createdAt, dateRange.from));
  }
  if (dateRange?.to) {
    conditions.push(lte(scanRecords.createdAt, dateRange.to));
  }
  return conditions.length ? and(...conditions) : undefined;
}
