import type { DatabaseSync } from 'node:sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import {
  enqueueFarmerInquiry,
  listFarmerAdvisories,
  listFarmerInquiries,
} from '@/features/farmer-care/data/farmerCareRepository';
import {
  resetFarmerCareHolds,
  syncFarmerCare,
  type FarmerCareApi,
} from '@/features/farmer-care/services/syncFarmerCare';
import { ApiHttpError } from '@/features/shared/api/apiClient';
import { FARMER_A, insertScan, openFarmerTestDatabase } from '../../../../test/farmerCareTestDatabase';

const SCAN = '11111111-1111-4111-8111-111111111111';
const REQ = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NOW = Date.parse('2026-11-28T03:00:00.000Z');

describe('syncFarmerCare', () => {
  let database: CaneGuardDatabase;
  let native: DatabaseSync;
  let clock: number;
  let api: jest.Mocked<FarmerCareApi>;

  beforeEach(() => {
    resetFarmerCareHolds();
    ({ database, native } = openFarmerTestDatabase());
    insertScan(database, { id: SCAN, owner: FARMER_A });
    clock = NOW;
    api = {
      submit: jest.fn(),
      fetchInquiries: jest.fn().mockResolvedValue([]),
      fetchAdvisories: jest.fn().mockResolvedValue({ items: [], homeBarangay: null }),
    };
    enqueueFarmerInquiry(database, {
      id: REQ,
      ownerIdentity: FARMER_A,
      scanRecordId: SCAN,
      barangay: 'Aga',
      concern: 'spreading',
      aiLabel: 'smut',
      aiConfidencePercent: 91,
      createdAt: '2026-11-28T02:00:00.000Z',
    });
  });
  afterEach(() => native.close());

  const run = (extra: Partial<Parameters<typeof syncFarmerCare>[0]> = {}) =>
    syncFarmerCare({ database, ownerIdentity: FARMER_A, token: 'token', api, imageExists: () => true, nowMs: () => clock, ...extra });
  const row = () => listFarmerInquiries(database, FARMER_A)[0];

  it('sends the saved photo and request once, with the plant and the unverified hint', async () => {
    api.submit.mockResolvedValue({ remoteId: 'remote-1', clientUuid: REQ, status: 'new', replies: [] });
    const result = await run();

    expect(result).toMatchObject({ sent: 1, waiting: 0, failed: 0 });
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.submit.mock.calls[0][0]).toMatchObject({
      clientUuid: REQ,
      scanChainId: SCAN,
      barangay: 'Aga',
      concern: 'spreading',
      aiLabel: 'smut',
      image: { uri: `file:///documents/${SCAN}-submit.jpg`, mimeType: 'image/jpeg' },
    });
    expect(row()).toMatchObject({ syncStatus: 'synced', remoteId: 'remote-1', remoteStatus: 'new' });
    // Already sent: a second run does not send it again.
    await run();
    expect(api.submit).toHaveBeenCalledTimes(1);
  });

  it('keeps the request queued, without an error, when there is no signal', async () => {
    api.submit.mockRejectedValue(new ApiHttpError(503, 'down'));
    const result = await run();

    expect(result).toMatchObject({ sent: 0, waiting: 1, failed: 0 });
    expect(row()).toMatchObject({ syncStatus: 'pending', remoteId: null });
    // Not retried straight away, and retried after the cooldown.
    await run();
    expect(api.submit).toHaveBeenCalledTimes(1);
    clock += 61_000;
    api.submit.mockResolvedValue({ remoteId: 'remote-1', clientUuid: REQ, status: 'new', replies: [] });
    await run();
    expect(row().syncStatus).toBe('synced');
  });

  it('treats a paused or not-yet-ready office as "later", never as a failure', async () => {
    for (const status of [404, 403, 429]) {
      resetFarmerCareHolds();
      api.submit.mockRejectedValue(new ApiHttpError(status, 'later'));
      clock += 61_000;
      await run();
      expect(row().syncStatus).toBe('pending');
    }
  });

  it('holds every request for the Retry-After the office asks for', async () => {
    api.submit.mockRejectedValue(new ApiHttpError(429, 'slow down', { retryAfterMs: 600_000 }));
    await run();
    clock += 61_000;
    const held = await run();
    expect(held.held).toBe(true);
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.fetchInquiries).not.toHaveBeenCalled();
  });

  it('joins the request the office already holds for that plant', async () => {
    api.submit.mockRejectedValue(new ApiHttpError(409, 'open', { body: { code: 'INQUIRY_ALREADY_OPEN', inquiry_uuid: 'remote-9' } }));
    const result = await run();
    expect(result.sent).toBe(1);
    expect(row()).toMatchObject({ syncStatus: 'synced', remoteId: 'remote-9' });
  });

  it('marks a request the office will never accept as failed', async () => {
    api.submit.mockRejectedValue(new ApiHttpError(422, 'bad photo', { body: { errors: { photos: ['Only JPEG'] } } }));
    expect((await run()).failed).toBe(1);
    expect(row()).toMatchObject({ syncStatus: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED' });

  });

  it('fails a request whose saved photo is gone without calling the office', async () => {
    const result = await run({ imageExists: () => false });
    expect(result.failed).toBe(1);
    expect(api.submit).not.toHaveBeenCalled();
    expect(row()).toMatchObject({ syncStatus: 'failed', lastSyncErrorCode: 'IMAGE_MISSING' });
  });

  it('shows the office reply and counts it as newly answered once', async () => {
    api.submit.mockResolvedValue({ remoteId: 'remote-1', clientUuid: REQ, status: 'new', replies: [] });
    await run();
    api.fetchInquiries.mockResolvedValue([
      {
        remoteId: 'remote-1',
        clientUuid: REQ,
        status: 'replied',
        replies: [{ id: 'r1', kind: 'advice', body: 'Putulin ang usbong', advisoryTitle: 'Smut care', createdAt: null }],
      },
    ]);
    const result = await run();

    expect(result.newlyAnswered).toBe(1);
    expect(row()).toMatchObject({ remoteStatus: 'replied' });
    expect(row().replies[0]).toMatchObject({ advisoryTitle: 'Smut care', body: 'Putulin ang usbong' });
    expect((await run()).newlyAnswered).toBe(0);
  });

  it('keeps the last known state when the office cannot be reached for an update', async () => {
    api.submit.mockResolvedValue({ remoteId: 'remote-1', clientUuid: REQ, status: 'reviewing', replies: [] });
    await run();
    api.fetchInquiries.mockRejectedValue(new Error('offline'));
    await expect(run()).resolves.toBeDefined();
    expect(row().remoteStatus).toBe('reviewing');
  });

  it('downloads guidance when asked, reports advisoriesRefreshed accurately, and keeps the old copy when offline', async () => {
    const item = { remoteId: 'adv-1', headlineTl: 'Paalala', headlineEn: 'Reminder', bodyTl: 'Tl', bodyEn: 'En', publishedAt: '2026-11-28T00:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z' };
    api.submit.mockResolvedValue({ remoteId: 'remote-1', clientUuid: REQ, status: 'new', replies: [] });
    api.fetchAdvisories.mockResolvedValue({ items: [item], homeBarangay: 'Aga' });
    const first = await run({ refreshAdvisories: true });
    expect(first.homeBarangay).toBe('Aga');
    expect(first.advisoriesRefreshed).toBe(true);
    expect(listFarmerAdvisories(database, FARMER_A)).toHaveLength(1);

    api.fetchAdvisories.mockRejectedValue(new Error('offline'));
    const failed = await run({ refreshAdvisories: true });
    expect(failed.advisoriesRefreshed).toBe(false);
    expect(listFarmerAdvisories(database, FARMER_A)).toHaveLength(1);

    api.fetchAdvisories.mockResolvedValue({ items: [], homeBarangay: null });
    const cleared = await run({ refreshAdvisories: true });
    expect(cleared.advisoriesRefreshed).toBe(true);
    expect(listFarmerAdvisories(database, FARMER_A)).toHaveLength(0);
  });

  it('still downloads guidance when inquiry submission fails with 503 or 429 Retry-After, but stops on 401 auth expiry', async () => {
    const item = { remoteId: 'adv-1', headlineTl: 'Paalala', headlineEn: 'Reminder', bodyTl: 'Tl', bodyEn: 'En', publishedAt: '2026-11-28T00:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z' };
    api.submit.mockRejectedValueOnce(new ApiHttpError(503, 'inquiries paused', { body: { code: 'FEATURE_PAUSED' } }));
    api.fetchAdvisories.mockResolvedValue({ items: [item], homeBarangay: 'Aga' });

    const pausedResult = await run({ refreshAdvisories: true });
    expect(pausedResult.waiting).toBe(1);
    expect(pausedResult.advisoriesRefreshed).toBe(true);
    expect(api.fetchAdvisories).toHaveBeenCalledTimes(1);
    expect(listFarmerAdvisories(database, FARMER_A)).toHaveLength(1);

    // An inquiry 429 Retry-After holds inquiries without blocking guidance downloads.
    clock += 61_000;
    api.submit.mockRejectedValueOnce(new ApiHttpError(429, 'inquiry limit', { retryAfterMs: 600_000 }));
    const limitedFirst = await run({ refreshAdvisories: true });
    expect(limitedFirst.advisoriesRefreshed).toBe(true);
    expect(api.fetchAdvisories).toHaveBeenCalledTimes(2);

    clock += 61_000;
    const limitedSecond = await run({ refreshAdvisories: true });
    expect(limitedSecond.held).toBe(true);
    expect(limitedSecond.advisoriesRefreshed).toBe(true);
    expect(api.submit).toHaveBeenCalledTimes(2);
    expect(api.fetchAdvisories).toHaveBeenCalledTimes(3);

    // A 401 session expiry stops both channels cleanly.
    resetFarmerCareHolds();
    clock += 61_000;
    api.submit.mockRejectedValueOnce(new ApiHttpError(401, 'unauthorized'));
    const authResult = await run({ refreshAdvisories: true });
    expect(authResult.advisoriesRefreshed).toBe(false);
    expect(api.fetchAdvisories).toHaveBeenCalledTimes(3);
  });
});
