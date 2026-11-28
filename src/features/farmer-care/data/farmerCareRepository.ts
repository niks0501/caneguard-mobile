import { and, asc, desc, eq, gt, inArray, lt, notInArray, or, sql } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  farmerAdvisories,
  farmerInquiries,
  scanRecords,
  type FarmerAdvisoryRow,
  type FarmerInquiryRow,
} from '@/database/schema';
import type { FarmerInquiryReply } from '@/features/farmer-care/domain/farmerCareTypes';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

/** A request that was tried a moment ago waits before the next automatic try. */
export const FARMER_INQUIRY_RETRY_COOLDOWN_MS = 60_000;
/** A row that has said "sending" for longer than this was left behind by a closed app. */
export const FARMER_INQUIRY_STALE_SYNCING_MS = 5 * 60_000;

export interface FarmerInquiryItem {
  id: string;
  scanRecordId: string;
  scanChainId: string;
  barangay: string;
  landmark: string | null;
  concern: string | null;
  aiLabel: string | null;
  aiConfidencePercent: number | null;
  syncStatus: FarmerInquiryRow['syncStatus'];
  remoteId: string | null;
  remoteStatus: string | null;
  replies: FarmerInquiryReply[];
  lastSyncErrorCode: string | null;
  createdAt: string;
}

export interface EnqueueFarmerInquiryInput {
  id: string;
  ownerIdentity: string;
  scanRecordId: string;
  barangay: string;
  landmark?: string | null;
  concern?: string | null;
  aiLabel?: string | null;
  aiConfidencePercent?: number | null;
  createdAt: string;
}

function toItem(row: FarmerInquiryRow): FarmerInquiryItem {
  return {
    id: row.id,
    scanRecordId: row.scanRecordId,
    scanChainId: row.scanChainId,
    barangay: row.barangay,
    landmark: row.landmark,
    concern: row.concern,
    aiLabel: row.aiLabel,
    aiConfidencePercent: row.aiConfidencePercent,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    remoteStatus: row.remoteStatus,
    replies: parseReplies(row.repliesJson),
    lastSyncErrorCode: row.lastSyncErrorCode,
    createdAt: row.createdAt,
  };
}

function parseReplies(value: string | null): FarmerInquiryReply[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as FarmerInquiryReply[]) : [];
  } catch {
    return [];
  }
}

/**
 * The first scan of a Check Again chain. A follow-up check belongs to the same
 * plant, so the whole chain shares one request.
 */
export function resolveScanChainId(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  scanRecordId: string,
): string | null {
  const owner = requireOwnerIdentity(ownerIdentity);
  let currentId = scanRecordId;
  const seen = new Set<string>();
  for (;;) {
    if (seen.has(currentId)) return currentId;
    seen.add(currentId);
    const row = database
      .select({ id: scanRecords.id, followsUpScanId: scanRecords.followsUpScanId })
      .from(scanRecords)
      .where(and(eq(scanRecords.id, currentId), eq(scanRecords.ownerIdentity, owner)))
      .get();
    if (!row) return seen.size === 1 ? null : currentId;
    if (!row.followsUpScanId) return row.id;
    currentId = row.followsUpScanId;
  }
}

/** The newest request for this plant, whatever its state. */
export function findFarmerInquiryForChain(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  scanChainId: string,
): FarmerInquiryItem | null {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = database
    .select()
    .from(farmerInquiries)
    .where(and(eq(farmerInquiries.ownerIdentity, owner), eq(farmerInquiries.scanChainId, scanChainId)))
    .orderBy(desc(farmerInquiries.createdAt))
    .get();
  return row ? toItem(row) : null;
}

export function listFarmerInquiries(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): FarmerInquiryItem[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  return database
    .select()
    .from(farmerInquiries)
    .where(eq(farmerInquiries.ownerIdentity, owner))
    .orderBy(desc(farmerInquiries.createdAt))
    .all()
    .map(toItem);
}

/** Whether this request is still waiting on the office, so asking again would only repeat it. */
export function isInquiryOpen(item: Pick<FarmerInquiryItem, 'syncStatus' | 'remoteStatus'>): boolean {
  return item.syncStatus !== 'failed' && item.remoteStatus !== 'replied';
}

/**
 * Saves a request for sending. One live request per plant: asking again while
 * the first is still open returns the first instead of making a duplicate.
 */
export function enqueueFarmerInquiry(
  database: CaneGuardDatabase,
  input: EnqueueFarmerInquiryInput,
): { item: FarmerInquiryItem; created: boolean } {
  const owner = requireOwnerIdentity(input.ownerIdentity);
  return database.transaction((transaction) => {
    const chainId = resolveScanChainId(transaction as unknown as CaneGuardDatabase, owner, input.scanRecordId);
    if (chainId === null) {
      throw new Error('The saved scan for this request was not found.');
    }
    const existing = findFarmerInquiryForChain(transaction as unknown as CaneGuardDatabase, owner, chainId);
    if (existing && isInquiryOpen(existing)) {
      return { item: existing, created: false };
    }
    transaction
      .insert(farmerInquiries)
      .values({
        id: input.id,
        ownerIdentity: owner,
        scanRecordId: input.scanRecordId,
        scanChainId: chainId,
        barangay: input.barangay,
        landmark: input.landmark?.trim() || null,
        concern: input.concern ?? null,
        aiLabel: input.aiLabel ?? null,
        aiConfidencePercent: input.aiConfidencePercent ?? null,
        syncStatus: 'pending',
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      })
      .run();
    const row = transaction.select().from(farmerInquiries).where(eq(farmerInquiries.id, input.id)).get();
    if (!row) throw new Error('The request could not be saved.');
    return { item: toItem(row), created: true };
  });
}

/** Requests the phone should try to send now: waiting, or left "sending" by a closed app. */
export function findFarmerInquirySendCandidates(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  options: { nowMs?: number; limit?: number } = {},
): FarmerInquiryItem[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  const nowMs = options.nowMs ?? Date.now();
  const cooledBefore = new Date(nowMs - FARMER_INQUIRY_RETRY_COOLDOWN_MS).toISOString();
  const staleBefore = new Date(nowMs - FARMER_INQUIRY_STALE_SYNCING_MS).toISOString();
  return database
    .select()
    .from(farmerInquiries)
    .where(
      and(
        eq(farmerInquiries.ownerIdentity, owner),
        or(
          and(
            eq(farmerInquiries.syncStatus, 'pending'),
            or(
              sql`${farmerInquiries.lastSyncAttemptAt} is null`,
              lt(farmerInquiries.lastSyncAttemptAt, cooledBefore),
            ),
          ),
          and(eq(farmerInquiries.syncStatus, 'syncing'), lt(farmerInquiries.lastSyncAttemptAt, staleBefore)),
        ),
      ),
    )
    .orderBy(asc(farmerInquiries.createdAt))
    .limit(options.limit ?? 5)
    .all()
    .map(toItem);
}

/** Claims a request for sending. False when another send already holds it or it is no longer waiting. */
export function markFarmerInquirySyncing(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  id: string,
  attemptedAt: string,
  staleBefore: string,
): boolean {
  const owner = requireOwnerIdentity(ownerIdentity);
  const result = database
    .update(farmerInquiries)
    .set({
      syncStatus: 'syncing',
      syncAttemptCount: sql`${farmerInquiries.syncAttemptCount} + 1`,
      lastSyncAttemptAt: attemptedAt,
      updatedAt: attemptedAt,
    })
    .where(
      and(
        eq(farmerInquiries.id, id),
        eq(farmerInquiries.ownerIdentity, owner),
        or(
          eq(farmerInquiries.syncStatus, 'pending'),
          and(eq(farmerInquiries.syncStatus, 'syncing'), lt(farmerInquiries.lastSyncAttemptAt, staleBefore)),
        ),
      ),
    )
    .run();
  return result.changes === 1;
}

export function markFarmerInquirySent(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  id: string,
  remote: { remoteId: string; status: string; replies: FarmerInquiryReply[] },
  syncedAt: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  database
    .update(farmerInquiries)
    .set({
      syncStatus: 'synced',
      remoteId: remote.remoteId,
      remoteStatus: remote.status,
      repliesJson: JSON.stringify(remote.replies),
      lastSyncErrorCode: null,
      lastSyncedAt: syncedAt,
      updatedAt: syncedAt,
    })
    .where(and(eq(farmerInquiries.id, id), eq(farmerInquiries.ownerIdentity, owner)))
    .run();
  emitSyncRecordsChanged();
}

/** The request goes back to waiting. Used for signal loss, a paused office, or any answer that says "later". */
export function markFarmerInquiryWaiting(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  id: string,
  errorCode: string,
  at: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  database
    .update(farmerInquiries)
    .set({ syncStatus: 'pending', lastSyncErrorCode: errorCode, lastSyncAttemptAt: at, updatedAt: at })
    .where(and(eq(farmerInquiries.id, id), eq(farmerInquiries.ownerIdentity, owner)))
    .run();
  emitSyncRecordsChanged();
}

/** The office will never accept this request as it stands: shown to the farmer, who can ask again. */
export function markFarmerInquiryFailed(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  id: string,
  errorCode: string,
  at: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  database
    .update(farmerInquiries)
    .set({ syncStatus: 'failed', lastSyncErrorCode: errorCode, lastSyncAttemptAt: at, updatedAt: at })
    .where(and(eq(farmerInquiries.id, id), eq(farmerInquiries.ownerIdentity, owner)))
    .run();
  emitSyncRecordsChanged();
}

/** Mirrors the office's progress and replies onto a request the office already holds. */
export function applyFarmerInquiryRemoteState(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  remoteId: string,
  remote: { status: string; replies: FarmerInquiryReply[] },
  at: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  database
    .update(farmerInquiries)
    .set({
      syncStatus: 'synced',
      remoteStatus: remote.status,
      repliesJson: JSON.stringify(remote.replies),
      lastSyncedAt: at,
      updatedAt: at,
    })
    .where(and(eq(farmerInquiries.remoteId, remoteId), eq(farmerInquiries.ownerIdentity, owner)))
    .run();
}

/** Removes a request that never reached the office. A sent request stays as the farmer's record. */
export function deleteUnsentFarmerInquiry(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  id: string,
): boolean {
  const owner = requireOwnerIdentity(ownerIdentity);
  const result = database
    .delete(farmerInquiries)
    .where(
      and(
        eq(farmerInquiries.id, id),
        eq(farmerInquiries.ownerIdentity, owner),
        inArray(farmerInquiries.syncStatus, ['pending', 'failed']),
      ),
    )
    .run();
  emitSyncRecordsChanged();
  return result.changes === 1;
}

export interface FarmerAdvisoryItem {
  remoteId: string;
  headlineTl: string;
  headlineEn: string;
  bodyTl: string;
  bodyEn: string;
  publishedAt: string;
  expiresAt: string;
  downloadedAt?: string;
}

function toAdvisory(row: FarmerAdvisoryRow): FarmerAdvisoryItem {
  return {
    remoteId: row.remoteId,
    headlineTl: row.headlineTl,
    headlineEn: row.headlineEn,
    bodyTl: row.bodyTl,
    bodyEn: row.bodyEn,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    downloadedAt: row.downloadedAt,
  };
}

/** Guidance still in date, newest first. Reads offline. */
export function listFarmerAdvisories(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  nowIso: string = new Date().toISOString(),
): FarmerAdvisoryItem[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  return database
    .select()
    .from(farmerAdvisories)
    .where(and(eq(farmerAdvisories.ownerIdentity, owner), gt(farmerAdvisories.expiresAt, nowIso)))
    .orderBy(desc(farmerAdvisories.publishedAt))
    .all()
    .map(toAdvisory);
}

/**
 * Makes the cache match what the office currently publishes for this farmer:
 * withdrawn or retired guidance disappears, new guidance arrives.
 */
export function replaceFarmerAdvisories(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  items: FarmerAdvisoryItem[],
  downloadedAt: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  database.transaction((transaction) => {
    const keep = items.map((item) => item.remoteId);
    transaction
      .delete(farmerAdvisories)
      .where(
        keep.length === 0
          ? eq(farmerAdvisories.ownerIdentity, owner)
          : and(eq(farmerAdvisories.ownerIdentity, owner), notInArray(farmerAdvisories.remoteId, keep)),
      )
      .run();
    for (const item of items) {
      transaction
        .insert(farmerAdvisories)
        .values({ id: `${owner}:${item.remoteId}`, ownerIdentity: owner, downloadedAt, ...item })
        .onConflictDoUpdate({
          target: [farmerAdvisories.ownerIdentity, farmerAdvisories.remoteId],
          set: { ...item, downloadedAt },
        })
        .run();
    }
  });
  emitSyncRecordsChanged();
}

/** Removes the farmer's whole local care record: requests and downloaded guidance. */
export function deleteFarmerCareForOwner(
  database: Pick<CaneGuardDatabase, 'delete'>,
  ownerIdentity: string,
): number {
  const owner = requireOwnerIdentity(ownerIdentity);
  return (
    database.delete(farmerInquiries).where(eq(farmerInquiries.ownerIdentity, owner)).run().changes +
    database.delete(farmerAdvisories).where(eq(farmerAdvisories.ownerIdentity, owner)).run().changes
  );
}

/** Removes only what can be downloaded again. Requests are the farmer's own record and stay. */
export function deleteCachedFarmerAdvisoriesForOwner(
  database: Pick<CaneGuardDatabase, 'delete'>,
  ownerIdentity: string,
): number {
  const owner = requireOwnerIdentity(ownerIdentity);
  return database.delete(farmerAdvisories).where(eq(farmerAdvisories.ownerIdentity, owner)).run().changes;
}
