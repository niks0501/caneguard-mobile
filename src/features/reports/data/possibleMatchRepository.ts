import { and, desc, eq, gte, lte, ne } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { fieldReports, scanRecords } from '@/database/schema';
import {
  isPossibleMatchLookupReady,
  POSSIBLE_MATCH_CANDIDATE_LIMIT,
  POSSIBLE_MATCH_RECENCY_WINDOW_MS,
  type PossibleMatchLookupInput,
  type PossibleRecentMatch,
  type RecentFieldReportMatchCandidate,
  selectConservativePossibleRecentMatch,
} from '@/features/reports/domain/possibleMatch';

/**
 * Reads only finalized reports owned by the current submitter. This is a
 * local-only source for the optional warning and does not alter any record.
 */
export async function findPossibleRecentMatch(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  input: PossibleMatchLookupInput,
): Promise<PossibleRecentMatch | null> {
  if (!isPossibleMatchLookupReady(input) || !submitterIdentity.trim()) {
    return null;
  }

  const observedAtMs = Date.parse(input.observedAt);
  const earliestObservedAt = new Date(
    observedAtMs - POSSIBLE_MATCH_RECENCY_WINDOW_MS,
  ).toISOString();

  try {
    const rows = await database
      .select({
        barangay: fieldReports.barangay,
        finalLatitude: fieldReports.finalLatitude,
        finalLongitude: fieldReports.finalLongitude,
        farmerOrFarmOwnerName: fieldReports.farmerOrFarmOwnerName,
        locationSource: fieldReports.locationSource,
        municipality: fieldReports.municipality,
        observedAt: fieldReports.observedAt,
        predictedLabel: scanRecords.predictedLabel,
        province: fieldReports.province,
        reportId: fieldReports.id,
        scanRecordId: fieldReports.scanRecordId,
      })
      .from(fieldReports)
      .innerJoin(scanRecords, eq(scanRecords.id, fieldReports.scanRecordId))
      .where(
        and(
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(scanRecords.ownerIdentity, submitterIdentity.trim()),
          eq(scanRecords.predictedLabel, input.predictedLabel!.trim()),
          ne(fieldReports.id, input.reportId),
          ne(fieldReports.scanRecordId, input.scanRecordId),
          gte(fieldReports.observedAt, earliestObservedAt),
          lte(fieldReports.observedAt, input.observedAt),
        ),
      )
      .orderBy(desc(fieldReports.observedAt))
      .limit(POSSIBLE_MATCH_CANDIDATE_LIMIT);

    return selectConservativePossibleRecentMatch(
      input,
      rows as RecentFieldReportMatchCandidate[],
    );
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading possible recent Field Report matches failed.',
    );
  }
}
