import { File } from 'expo-file-system';
import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { scanRecords } from '@/database/schema';
import {
  fetchFarmerAdvisories,
  fetchFarmerInquiries,
  readOpenInquiryUuid,
  submitFarmerInquiry,
  type FarmerAdvisoriesResult,
  type FarmerInquirySubmission,
  type RemoteFarmerInquiry,
} from '@/features/farmer-care/api/farmerCareApi';
import {
  FARMER_INQUIRY_STALE_SYNCING_MS,
  applyFarmerInquiryRemoteState,
  findFarmerInquirySendCandidates,
  listFarmerInquiries,
  markFarmerInquiryFailed,
  markFarmerInquirySent,
  markFarmerInquirySyncing,
  markFarmerInquiryWaiting,
  replaceFarmerAdvisories,
  type FarmerInquiryItem,
} from '@/features/farmer-care/data/farmerCareRepository';
import { ApiHttpError } from '@/features/shared/api/apiClient';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';

export interface FarmerCareApi {
  submit(submission: FarmerInquirySubmission, token: string): Promise<RemoteFarmerInquiry>;
  fetchInquiries(token: string): Promise<RemoteFarmerInquiry[]>;
  fetchAdvisories(token: string): Promise<FarmerAdvisoriesResult>;
}

const defaultApi: FarmerCareApi = {
  submit: submitFarmerInquiry,
  fetchInquiries: fetchFarmerInquiries,
  fetchAdvisories: fetchFarmerAdvisories,
};

export interface SyncFarmerCareOptions {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
  /** Also download guidance for the home barangay. Skipped on a quick refresh. */
  refreshAdvisories?: boolean;
  api?: FarmerCareApi;
  imageExists?: (uri: string) => boolean;
  nowMs?: () => number;
}

export interface SyncFarmerCareResult {
  sent: number;
  waiting: number;
  failed: number;
  /** The farmer's requests the office has now answered, newly seen in this run. */
  newlyAnswered: number;
  held: boolean;
  /** True only when the guidance endpoint succeeded and updated the local cache. */
  advisoriesRefreshed: boolean;
  /** Set when guidance was downloaded: the home barangay the office holds for this farmer. */
  homeBarangay: string | null;
}

/**
 * Per-channel server "wait" holds (Retry-After, rate limit, paused office) so an
 * inquiry throttle or feature pause never blocks barangay guidance downloads.
 */
const inquiryHoldsUntilMs = new Map<string, number>();
const advisoryHoldsUntilMs = new Map<string, number>();

export function resetFarmerCareHolds(): void {
  inquiryHoldsUntilMs.clear();
  advisoryHoldsUntilMs.clear();
}

/**
 * Sends waiting requests, then mirrors the office's progress and downloads
 * guidance. Never throws on a network problem: a request that cannot go yet
 * simply stays queued. Independent of inspector sync, so a shared phone's
 * inspector uploads are never blocked by this.
 */
export async function syncFarmerCare(options: SyncFarmerCareOptions): Promise<SyncFarmerCareResult> {
  const { database, ownerIdentity, token } = options;
  const api = options.api ?? defaultApi;
  const now = options.nowMs ?? Date.now;
  const imageExists = options.imageExists ?? ((uri: string) => new File(uri).exists);
  const result: SyncFarmerCareResult = {
    sent: 0,
    waiting: 0,
    failed: 0,
    newlyAnswered: 0,
    held: false,
    advisoriesRefreshed: false,
    homeBarangay: null,
  };

  const inquiryHeld = (inquiryHoldsUntilMs.get(ownerIdentity) ?? 0) > now();
  const advisoryHeld = (advisoryHoldsUntilMs.get(ownerIdentity) ?? 0) > now();
  if (inquiryHeld) {
    result.held = true;
  }

  let inquiryStopped = inquiryHeld;
  let globalStopped = false;

  if (!inquiryHeld) {
    const candidates = findFarmerInquirySendCandidates(database, ownerIdentity, { nowMs: now() });
    for (const candidate of candidates) {
      if (inquiryStopped || globalStopped) break;
      const attemptedAt = new Date(now()).toISOString();
      const staleBefore = new Date(now() - FARMER_INQUIRY_STALE_SYNCING_MS).toISOString();
      if (!markFarmerInquirySyncing(database, ownerIdentity, candidate.id, attemptedAt, staleBefore)) continue;

      let submission: FarmerInquirySubmission;
      try {
        submission = buildSubmission(database, ownerIdentity, candidate, imageExists);
      } catch (error: unknown) {
        const code = error instanceof SyncError ? error.code : 'INVALID_LOCAL_RECORD';
        markFarmerInquiryFailed(database, ownerIdentity, candidate.id, code, attemptedAt);
        result.failed += 1;
        continue;
      }

      try {
        const remote = await api.submit(submission, token);
        markFarmerInquirySent(database, ownerIdentity, candidate.id, remote, new Date(now()).toISOString());
        result.sent += 1;
      } catch (error: unknown) {
        const at = new Date(now()).toISOString();
        const openUuid = error instanceof ApiHttpError && error.status === 409 ? readOpenInquiryUuid(error.body) : null;
        if (openUuid) {
          // The office already holds a request for this plant: this one joins it rather than repeating it.
          markFarmerInquirySent(
            database,
            ownerIdentity,
            candidate.id,
            { remoteId: openUuid, status: 'new', replies: [] },
            at,
          );
          result.sent += 1;
          continue;
        }
        const syncError = toSyncError(error, { endpoint: 'report' });
        if (isLater(syncError)) {
          markFarmerInquiryWaiting(database, ownerIdentity, candidate.id, syncError.code, at);
          result.waiting += 1;
          if (syncError.retryAfterMs) {
            inquiryHoldsUntilMs.set(ownerIdentity, now() + jitter(syncError.retryAfterMs));
          }
          // Inquiry failures stop further inquiry tries, but only session/network outages block guidance downloads.
          inquiryStopped = true;
          if (isGlobalStop(syncError)) {
            globalStopped = true;
          }
        } else {
          markFarmerInquiryFailed(database, ownerIdentity, candidate.id, syncError.code, at);
          result.failed += 1;
        }
      }
    }
  }

  if (!inquiryStopped && !globalStopped) {
    result.newlyAnswered = await refreshRemoteState(database, ownerIdentity, token, api, now);
  }
  if (options.refreshAdvisories && !globalStopped && !advisoryHeld) {
    const refreshed = await refreshAdvisories(database, ownerIdentity, token, api, now);
    result.advisoriesRefreshed = refreshed.refreshed;
    result.homeBarangay = refreshed.homeBarangay;
  }
  return result;
}

/** Everything that means "not now" rather than "never": the request stays queued, calmly. */
function isLater(error: SyncError): boolean {
  return (
    error.retryable ||
    error.code === 'AUTH_REQUIRED' ||
    error.code === 'API_FORBIDDEN' ||
    error.code === 'CAPABILITY_REVOKED' ||
    error.code === 'NETWORK_UNAVAILABLE'
  );
}

/** Only auth expiry or no transport prevents unrelated guidance downloads in the same run. */
function isGlobalStop(error: SyncError): boolean {
  return error.code === 'AUTH_REQUIRED' || error.code === 'NETWORK_UNAVAILABLE';
}

function jitter(ms: number): number {
  return Math.round(ms + Math.random() * ms * 0.5);
}

function buildSubmission(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  item: FarmerInquiryItem,
  imageExists: (uri: string) => boolean,
): FarmerInquirySubmission {
  const scan = database
    .select({
      managedImageUri: scanRecords.managedImageUri,
      imageMimeType: scanRecords.imageMimeType,
      submissionImageUri: scanRecords.submissionImageUri,
      submissionImageMimeType: scanRecords.submissionImageMimeType,
    })
    .from(scanRecords)
    .where(and(eq(scanRecords.id, item.scanRecordId), eq(scanRecords.ownerIdentity, ownerIdentity)))
    .get();
  if (!scan) {
    throw new SyncError('IMAGE_MISSING', 'The saved scan for this request is no longer on this phone.');
  }
  const uri = scan.submissionImageUri ?? scan.managedImageUri;
  if (!imageExists(uri)) {
    throw new SyncError('IMAGE_MISSING', 'The saved photo for this request is missing from this phone.');
  }
  return {
    clientUuid: item.id,
    barangay: item.barangay,
    landmark: item.landmark,
    concern: item.concern,
    scanChainId: item.scanChainId,
    aiLabel: item.aiLabel,
    aiConfidencePercent: item.aiConfidencePercent,
    image: { uri, mimeType: scan.submissionImageMimeType ?? scan.imageMimeType ?? 'image/jpeg' },
  };
}

async function refreshRemoteState(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  token: string,
  api: FarmerCareApi,
  now: () => number,
): Promise<number> {
  const open = listFarmerInquiries(database, ownerIdentity).filter(
    (item) => item.remoteId !== null && item.remoteStatus !== 'replied',
  );
  if (open.length === 0) return 0;
  try {
    const remote = await api.fetchInquiries(token);
    const at = new Date(now()).toISOString();
    let answered = 0;
    for (const item of open) {
      const match = remote.find((candidate) => candidate.remoteId === item.remoteId);
      if (!match) continue;
      if (match.status === 'replied' && item.remoteStatus !== 'replied') answered += 1;
      applyFarmerInquiryRemoteState(
        database,
        ownerIdentity,
        match.remoteId,
        { status: match.status, replies: match.replies },
        at,
      );
    }
    return answered;
  } catch {
    // Offline or paused: the last known state keeps reading fine.
    return 0;
  }
}

async function refreshAdvisories(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  token: string,
  api: FarmerCareApi,
  now: () => number,
): Promise<{ refreshed: boolean; homeBarangay: string | null }> {
  try {
    const { items, homeBarangay } = await api.fetchAdvisories(token);
    replaceFarmerAdvisories(database, ownerIdentity, items, new Date(now()).toISOString());
    return { refreshed: true, homeBarangay };
  } catch (error: unknown) {
    const syncError = toSyncError(error, { endpoint: 'report' });
    if (syncError.retryAfterMs) {
      advisoryHoldsUntilMs.set(ownerIdentity, now() + jitter(syncError.retryAfterMs));
    }
    // Keep what is already downloaded; guidance reads offline.
    return { refreshed: false, homeBarangay: null };
  }
}
