import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import {
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

export function createScanRecordRepository(
  database: CaneGuardDatabase,
): ScanRecordRepository {
  return {
    insert: (input) => insertScanRecord(database, input),
    list: (query) => listScanRecords(database, query),
    findById: (id) => findScanRecordById(database, id),
    deleteById: (id) => deleteScanRecordById(database, id),
    listManagedImageUris: () => listManagedImageUris(database),
  };
}

export async function listScanRecords(
  database: CaneGuardDatabase,
  query: ScanRecordQuery = {},
): Promise<ScanRecordListItem[]> {
  const conditions = buildConditions(query);
  const limit = Math.min(
    Math.max(Math.trunc(query.limit ?? DEFAULT_RECORD_PAGE_SIZE), 1),
    MAX_RECORD_PAGE_SIZE,
  );
  const offset = Math.max(Math.trunc(query.offset ?? 0), 0);

  try {
    const rows = await database
      .select({
        id: scanRecords.id,
        managedImageUri: scanRecords.managedImageUri,
        predictedLabel: scanRecords.predictedLabel,
        confidence: scanRecords.confidence,
        barangay: scanRecords.barangay,
        syncStatus: scanRecords.syncStatus,
        createdAt: scanRecords.createdAt,
      })
      .from(scanRecords)
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
): Promise<ScanRecordDetails> {
  try {
    const row = await database
      .select()
      .from(scanRecords)
      .where(eq(scanRecords.id, id))
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
): Promise<{ managedImageUri: string }> {
  try {
    const deleted = database.transaction((transaction) => {
      const row = transaction
        .select({ managedImageUri: scanRecords.managedImageUri })
        .from(scanRecords)
        .where(eq(scanRecords.id, id))
        .get();

      if (!row) {
        throw new StorageError(
          'RECORD_NOT_FOUND',
          'The scan record does not exist.',
        );
      }

      transaction.delete(scanRecords).where(eq(scanRecords.id, id)).run();
      return row;
    });

    return deleted;
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Deleting a scan record failed.');
  }
}

export async function listManagedImageUris(
  database: CaneGuardDatabase,
): Promise<string[]> {
  try {
    const rows = await database
      .select({ managedImageUri: scanRecords.managedImageUri })
      .from(scanRecords);
    return rows.map((row) => row.managedImageUri);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Listing managed scan image references failed.',
    );
  }
}

function buildConditions(query: ScanRecordQuery): SQL[] {
  const conditions: SQL[] = [];

  if (query.predictedLabel) {
    conditions.push(eq(scanRecords.predictedLabel, query.predictedLabel));
  }
  if (query.syncStatus) {
    conditions.push(eq(scanRecords.syncStatus, query.syncStatus));
  }
  if (query.barangay?.trim()) {
    conditions.push(
      sql`instr(lower(coalesce(${scanRecords.barangay}, '')), ${query.barangay.trim().toLowerCase()}) > 0`,
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
        sql`instr(lower(coalesce(${scanRecords.barangay}, '')), ${search}) > 0`,
      )!,
    );
  }

  return conditions;
}
