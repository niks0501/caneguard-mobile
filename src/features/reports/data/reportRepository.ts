import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { V1_CONFIDENCE_CAUTION_THRESHOLD } from '@/features/detection/constants/confidenceCaution';
import { fieldReports, scanRecords } from '@/database/schema';
import type { ReportRepository } from '@/features/records/data/repositoryContracts';
import { listScanRecords } from '@/features/records/data/scanRecordRepository';
import type {
  DateRange,
  LocalReportSummary,
} from '@/features/records/domain/recordTypes';

export const DEFAULT_RECENT_RECORD_LIMIT = 3;

export interface LocalReportOptions {
  dateRange?: DateRange;
  lowScoreThreshold?: number;
  recentLimit?: number;
}

export function createReportRepository(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): ReportRepository {
  return {
    getLocalSummary: (options) =>
      getLocalReportSummary(database, submitterIdentity, options),
  };
}

export async function getLocalReportSummary(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  options: LocalReportOptions = {},
): Promise<LocalReportSummary> {
  const owner = requireOwnerIdentity(submitterIdentity);
  const lowScoreThreshold =
    options.lowScoreThreshold ?? V1_CONFIDENCE_CAUTION_THRESHOLD;
  const recentLimit = Math.min(
    Math.max(Math.trunc(options.recentLimit ?? DEFAULT_RECENT_RECORD_LIMIT), 1),
    25,
  );
  const where = buildDateCondition(options.dateRange, owner);

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
    const [totals, recordsByLabel, recentRecords, pendingReports] = await Promise.all([
      database
        .select({
          totalSavedScans: count(),
          healthyPredictions:
            sql<number>`coalesce(sum(case when ${scanRecords.predictedLabel} = 'healthy' then 1 else 0 end), 0)`,
          possibleDiseasePredictions:
            sql<number>`coalesce(sum(case when ${scanRecords.predictedLabel} <> 'healthy' then 1 else 0 end), 0)`,
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
      listScanRecords(
        database,
        {
          dateRange: options.dateRange,
          limit: recentLimit,
        },
        owner,
      ),
      database
        .select({ count: count() })
        .from(fieldReports)
        .where(buildPendingReportCondition(options.dateRange, submitterIdentity))
        .get(),
    ]);

    return {
      totalSavedScans: Number(totals?.totalSavedScans ?? 0),
      healthyPredictions: Number(totals?.healthyPredictions ?? 0),
      possibleDiseasePredictions: Number(
        totals?.possibleDiseasePredictions ?? 0,
      ),
      pendingSyncRecords: Number(pendingReports?.count ?? 0),
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

function buildDateCondition(
  dateRange: DateRange | undefined,
  ownerIdentity: string,
): SQL {
  const conditions: SQL[] = [eq(scanRecords.ownerIdentity, ownerIdentity)];
  if (dateRange?.from) {
    conditions.push(gte(scanRecords.createdAt, dateRange.from));
  }
  if (dateRange?.to) {
    conditions.push(lte(scanRecords.createdAt, dateRange.to));
  }
  return and(...conditions)!;
}

function buildPendingReportCondition(
  dateRange: DateRange | undefined,
  submitterIdentity: string,
): SQL {
  const conditions: SQL[] = [
    eq(fieldReports.authoringState, 'finalized'),
    eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
    inArray(fieldReports.syncStatus, ['pending', 'syncing', 'failed']),
  ];
  if (dateRange?.from) {
    conditions.push(gte(fieldReports.observedAt, dateRange.from));
  }
  if (dateRange?.to) {
    conditions.push(lte(fieldReports.observedAt, dateRange.to));
  }
  return and(...conditions)!;
}
