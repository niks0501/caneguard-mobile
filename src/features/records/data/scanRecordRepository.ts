import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  fieldReports,
  scanClassScores,
  scanQualityWarnings,
  scanRecords,
  scanSymptoms,
} from '@/database/schema';
import type { ScanRecordRepository } from '@/features/records/data/repositoryContracts';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import {
  mapScanRecordDetails,
  mapScanRecordListItem,
} from '@/features/records/domain/recordMappers';
import {
  DEFAULT_RECORD_PAGE_SIZE,
  MAX_RECORD_PAGE_SIZE,
  type ScanRecordDetails,
  type ScanRecordListItem,
  type ScanRecordQuery,
} from '@/features/records/domain/recordTypes';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export function createScanRecordRepository(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  includeFieldReports = true,
): ScanRecordRepository {
  const owner = requireOwnerIdentity(submitterIdentity);
  return {
    insert: (input) => insertScanRecord(database, { ...input, ownerIdentity: owner }),
    list: (query) => listScanRecords(database, query, owner, includeFieldReports),
    findById: (id) => findScanRecordById(database, id, owner),
    deleteById: (id) => deleteScanRecordById(database, id, owner),
    listManagedImageUris: () => listManagedImageUris(database, owner),
  };
}

export async function listScanRecords(
  database: CaneGuardDatabase,
  query: ScanRecordQuery = {},
  submitterIdentity: string,
  includeFieldReports = true,
): Promise<ScanRecordListItem[]> {
  const owner = requireOwnerIdentity(submitterIdentity);
  const conditions = [
    eq(scanRecords.ownerIdentity, owner),
    ...buildConditions(query, includeFieldReports),
  ];
  const limit = Math.min(
    Math.max(Math.trunc(query.limit ?? DEFAULT_RECORD_PAGE_SIZE), 1),
    MAX_RECORD_PAGE_SIZE,
  );
  const offset = Math.max(Math.trunc(query.offset ?? 0), 0);

  try {
    const rows = await database
      .select({
        authorityFeedback: includeFieldReports
          ? fieldReports.authorityFeedback
          : sql<null>`null`,
        authorityFetchedAt: includeFieldReports
          ? fieldReports.authorityFetchedAt
          : sql<null>`null`,
        authorityReferenceCode: includeFieldReports
          ? fieldReports.authorityReferenceCode
          : sql<null>`null`,
        authorityReviewedAt: includeFieldReports
          ? fieldReports.authorityReviewedAt
          : sql<null>`null`,
        authorityStatusRaw: includeFieldReports
          ? fieldReports.authorityStatusRaw
          : sql<null>`null`,
        authorityUpdatedAt: includeFieldReports
          ? fieldReports.authorityUpdatedAt
          : sql<null>`null`,
        hasFieldReport: includeFieldReports
          ? sql<number>`case when ${fieldReports.id} is null then 0 else 1 end`
          : sql<number>`0`,
        id: scanRecords.id,
        managedImageUri: scanRecords.managedImageUri,
        predictedLabel: scanRecords.predictedLabel,
        confidence: scanRecords.confidence,
        barangay: includeFieldReports
          ? sql<string | null>`coalesce(${fieldReports.barangay}, ${scanRecords.barangay})`
          : scanRecords.barangay,
        syncStatus: includeFieldReports
          ? sql<ScanRecordListItem['syncStatus']>`coalesce(${fieldReports.syncStatus}, 'local_only')`
          : sql<ScanRecordListItem['syncStatus']>`'local_only'`,
        createdAt: scanRecords.createdAt,
      })
      .from(scanRecords)
      .leftJoin(
        fieldReports,
        includeFieldReports
          ? buildFieldReportJoinCondition(submitterIdentity)
          : sql`0`,
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(scanRecords.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map(mapScanRecordListItem);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Listing scan records failed.');
  }
}

export async function findScanRecordById(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
): Promise<ScanRecordDetails> {
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const row = await database
      .select()
      .from(scanRecords)
      .where(and(eq(scanRecords.id, id), eq(scanRecords.ownerIdentity, owner)))
      .get();

    if (!row) {
      throw new StorageError('RECORD_NOT_FOUND', 'The scan record does not exist.');
    }

    const [classScores, symptoms, qualityWarnings] = await Promise.all([
      database
        .select()
        .from(scanClassScores)
        .where(eq(scanClassScores.scanRecordId, id))
        .orderBy(asc(scanClassScores.label)),
      database
        .select()
        .from(scanSymptoms)
        .where(eq(scanSymptoms.scanRecordId, id))
        .orderBy(asc(scanSymptoms.symptomKey)),
      database
        .select()
        .from(scanQualityWarnings)
        .where(eq(scanQualityWarnings.scanRecordId, id))
        .orderBy(asc(scanQualityWarnings.warningKey)),
    ]);

    return mapScanRecordDetails(row, {
      classScores,
      symptoms,
      qualityWarnings,
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading a scan record failed.');
  }
}

export async function deleteScanRecordById(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
): Promise<{ managedImageUri: string | null; submissionImageUri?: string | null }> {
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const deleted = database.transaction((transaction) => {
      const row = transaction
        .select({
          managedImageUri: scanRecords.managedImageUri,
          submissionImageUri: scanRecords.submissionImageUri,
          reportSubmitterIdentity: fieldReports.submitterIdentity,
        })
        .from(scanRecords)
        .leftJoin(fieldReports, eq(fieldReports.scanRecordId, scanRecords.id))
        .where(
          and(eq(scanRecords.id, id), eq(scanRecords.ownerIdentity, owner)),
        )
        .get();

      if (!row) {
        throw new StorageError(
          'RECORD_NOT_FOUND',
          'The scan record does not exist.',
        );
      }
      if (
        row.reportSubmitterIdentity &&
        row.reportSubmitterIdentity !== submitterIdentity.trim()
      ) {
        throw new StorageError(
          'DELETE_FAILED',
          'A Scan Record owned by another Field Report submitter cannot be deleted.',
        );
      }

      const otherRows = transaction
        .select({
          managedImageUri: scanRecords.managedImageUri,
          submissionImageUri: scanRecords.submissionImageUri,
        })
        .from(scanRecords)
        .where(ne(scanRecords.id, id))
        .all();
      const referencedUris = new Set(
        otherRows.flatMap((otherRow) =>
          [otherRow.managedImageUri, otherRow.submissionImageUri].filter(
            (uri): uri is string => Boolean(uri),
          ),
        ),
      );

      transaction.delete(scanRecords).where(eq(scanRecords.id, id)).run();
      return {
        managedImageUri: referencedUris.has(row.managedImageUri)
          ? null
          : row.managedImageUri,
        submissionImageUri:
          row.submissionImageUri && referencedUris.has(row.submissionImageUri)
            ? null
            : row.submissionImageUri,
      };
    });

    emitSyncRecordsChanged();
    return deleted;
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Deleting a scan record failed.');
  }
}

export async function listManagedImageUris(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): Promise<string[]> {
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const rows = await database
      .select({
        managedImageUri: scanRecords.managedImageUri,
        submissionImageUri: scanRecords.submissionImageUri,
      })
      .from(scanRecords)
      .where(eq(scanRecords.ownerIdentity, owner));
    return [
      ...new Set(
        rows.flatMap((row) =>
          [row.managedImageUri, row.submissionImageUri].filter(
            (uri): uri is string => Boolean(uri),
          ),
        ),
      ),
    ];
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Listing managed scan image references failed.',
    );
  }
}

function buildConditions(
  query: ScanRecordQuery,
  includeFieldReports: boolean,
): SQL[] {
  const conditions: SQL[] = [];

  if (query.predictedLabel) {
    conditions.push(eq(scanRecords.predictedLabel, query.predictedLabel));
  }
  if (query.syncStatus) {
    conditions.push(
      includeFieldReports
        ? sql`coalesce(${fieldReports.syncStatus}, 'local_only') = ${query.syncStatus}`
        : query.syncStatus === 'local_only'
          ? sql`1 = 1`
          : sql`1 = 0`,
    );
  }
  if (query.hasFieldReport !== undefined) {
    if (!includeFieldReports) {
      if (query.hasFieldReport) {
        conditions.push(sql`1 = 0`);
      }
    } else {
      conditions.push(
        query.hasFieldReport
          ? sql`${fieldReports.id} is not null`
          : sql`${fieldReports.id} is null`,
      );
    }
  }
  if (query.barangay?.trim()) {
    const barangay = query.barangay.trim().toLowerCase();
    conditions.push(
      includeFieldReports
        ? sql`instr(lower(coalesce(${fieldReports.barangay}, ${scanRecords.barangay}, '')), ${barangay}) > 0`
        : sql`instr(lower(coalesce(${scanRecords.barangay}, '')), ${barangay}) > 0`,
    );
  }
  if (query.dateRange?.from) {
    conditions.push(gte(scanRecords.createdAt, query.dateRange.from));
  }
  if (query.dateRange?.to) {
    conditions.push(lte(scanRecords.createdAt, query.dateRange.to));
  }
  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    conditions.push(
      or(
        sql`instr(lower(${scanRecords.predictedLabel}), ${search}) > 0`,
        includeFieldReports
          ? sql`instr(lower(coalesce(${fieldReports.barangay}, ${scanRecords.barangay}, '')), ${search}) > 0`
          : sql`instr(lower(coalesce(${scanRecords.barangay}, '')), ${search}) > 0`,
      )!,
    );
  }

  return conditions;
}

function buildFieldReportJoinCondition(submitterIdentity?: string): SQL {
  const normalizedSubmitterIdentity = submitterIdentity?.trim();
  if (!normalizedSubmitterIdentity) {
    return sql`0`;
  }
  return and(
    eq(fieldReports.scanRecordId, scanRecords.id),
    eq(fieldReports.submitterIdentity, normalizedSubmitterIdentity),
  )!;
}
