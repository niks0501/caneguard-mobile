import type { DatabaseSync } from 'node:sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import {
  deleteCachedFarmerAdvisoriesForOwner,
  deleteFarmerCareForOwner,
  deleteUnsentFarmerInquiry,
  enqueueFarmerInquiry,
  findFarmerInquiryForChain,
  findFarmerInquirySendCandidates,
  listFarmerAdvisories,
  listFarmerInquiries,
  markFarmerInquirySent,
  markFarmerInquirySyncing,
  markFarmerInquiryWaiting,
  replaceFarmerAdvisories,
  resolveScanChainId,
} from '@/features/farmer-care/data/farmerCareRepository';
import { inquiryStage } from '@/features/farmer-care/domain/farmerCareTypes';
import { FARMER_A, FARMER_B, insertScan, openFarmerTestDatabase } from '../../../../test/farmerCareTestDatabase';

const FIRST = '11111111-1111-4111-8111-111111111111';
const AGAIN = '22222222-2222-4222-8222-222222222222';
const AGAIN_2 = '33333333-3333-4333-8333-333333333333';
const REQ_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const REQ_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('farmerCareRepository', () => {
  let database: CaneGuardDatabase;
  let native: DatabaseSync;

  beforeEach(() => {
    ({ database, native } = openFarmerTestDatabase());
    insertScan(database, { id: FIRST, owner: FARMER_A });
    insertScan(database, { id: AGAIN, owner: FARMER_A, followsUpScanId: FIRST, createdAt: '2026-11-27T01:00:00.000Z' });
    insertScan(database, { id: AGAIN_2, owner: FARMER_A, followsUpScanId: AGAIN, createdAt: '2026-11-28T01:00:00.000Z' });
  });
  afterEach(() => native.close());

  const enqueue = (id: string, scanRecordId: string, owner = FARMER_A) =>
    enqueueFarmerInquiry(database, {
      id,
      ownerIdentity: owner,
      scanRecordId,
      barangay: 'Aga',
      landmark: '  Tabing sapa ',
      concern: 'spreading',
      aiLabel: 'smut',
      aiConfidencePercent: 91,
      createdAt: '2026-11-28T02:00:00.000Z',
    });

  it('resolves a Check Again chain to its first scan, and refuses someone else\'s scan', () => {
    expect(resolveScanChainId(database, FARMER_A, AGAIN_2)).toBe(FIRST);
    expect(resolveScanChainId(database, FARMER_A, FIRST)).toBe(FIRST);
    expect(resolveScanChainId(database, FARMER_B, FIRST)).toBeNull();
    expect(() => enqueue(REQ_1, FIRST, FARMER_B)).toThrow(/not found/);
  });

  it('queues a request against the plant, trims the landmark and starts it as waiting', () => {
    const { item, created } = enqueue(REQ_1, AGAIN_2);
    expect(created).toBe(true);
    expect(item).toMatchObject({ scanChainId: FIRST, landmark: 'Tabing sapa', syncStatus: 'pending', remoteId: null });
    expect(inquiryStage(item)).toBe('queued');
  });

  it('keeps one live request per plant and allows another once the office has replied', () => {
    const first = enqueue(REQ_1, FIRST);
    const again = enqueue(REQ_2, AGAIN);
    expect(again.created).toBe(false);
    expect(again.item.id).toBe(first.item.id);

    markFarmerInquirySent(database, FARMER_A, REQ_1, { remoteId: 'r1', status: 'replied', replies: [] }, '2026-11-28T03:00:00.000Z');
    const next = enqueue(REQ_2, AGAIN_2);
    expect(next.created).toBe(true);
    expect(findFarmerInquiryForChain(database, FARMER_A, FIRST)?.id).toBe(REQ_2);
  });

  it('only offers waiting requests that have cooled down, and recovers one left sending', () => {
    enqueue(REQ_1, FIRST);
    const now = Date.parse('2026-11-28T03:00:00.000Z');
    expect(findFarmerInquirySendCandidates(database, FARMER_A, { nowMs: now }).map((row) => row.id)).toEqual([REQ_1]);

    const stale = new Date(now - 5 * 60_000).toISOString();
    expect(markFarmerInquirySyncing(database, FARMER_A, REQ_1, new Date(now).toISOString(), stale)).toBe(true);
    // Already claimed: a second send cannot take it.
    expect(markFarmerInquirySyncing(database, FARMER_A, REQ_1, new Date(now + 1000).toISOString(), stale)).toBe(false);
    expect(findFarmerInquirySendCandidates(database, FARMER_A, { nowMs: now + 1000 })).toEqual([]);
    // A closed app left it "sending": it comes back after the stale window.
    expect(findFarmerInquirySendCandidates(database, FARMER_A, { nowMs: now + 6 * 60_000 }).map((row) => row.id)).toEqual([REQ_1]);

    markFarmerInquiryWaiting(database, FARMER_A, REQ_1, 'NETWORK_UNAVAILABLE', new Date(now).toISOString());
    expect(findFarmerInquirySendCandidates(database, FARMER_A, { nowMs: now + 10_000 })).toEqual([]);
    expect(findFarmerInquirySendCandidates(database, FARMER_A, { nowMs: now + 61_000 }).map((row) => row.id)).toEqual([REQ_1]);
  });

  it('mirrors the office stage onto a sent request', () => {
    enqueue(REQ_1, FIRST);
    markFarmerInquirySent(database, FARMER_A, REQ_1, { remoteId: 'r1', status: 'new', replies: [] }, '2026-11-28T03:00:00.000Z');
    expect(inquiryStage(listFarmerInquiries(database, FARMER_A)[0])).toBe('sent');
    markFarmerInquirySent(
      database,
      FARMER_A,
      REQ_1,
      { remoteId: 'r1', status: 'replied', replies: [{ id: 'x', kind: 'note', body: 'Salamat', advisoryTitle: null, createdAt: null }] },
      '2026-11-28T04:00:00.000Z',
    );
    const [row] = listFarmerInquiries(database, FARMER_A);
    expect(inquiryStage(row)).toBe('advice');
    expect(row.replies[0].body).toBe('Salamat');
  });

  it('removes only an unsent request', () => {
    enqueue(REQ_1, FIRST);
    expect(deleteUnsentFarmerInquiry(database, FARMER_A, REQ_1)).toBe(true);
    enqueue(REQ_2, FIRST);
    markFarmerInquirySent(database, FARMER_A, REQ_2, { remoteId: 'r2', status: 'new', replies: [] }, '2026-11-28T03:00:00.000Z');
    expect(deleteUnsentFarmerInquiry(database, FARMER_A, REQ_2)).toBe(false);
    expect(listFarmerInquiries(database, FARMER_A)).toHaveLength(1);
  });

  it('keeps each farmer\'s requests and guidance to that farmer', () => {
    insertScan(database, { id: 'b-scan', owner: FARMER_B });
    enqueue(REQ_1, FIRST);
    enqueueFarmerInquiry(database, { id: REQ_2, ownerIdentity: FARMER_B, scanRecordId: 'b-scan', barangay: 'Banilad', createdAt: '2026-11-28T02:00:00.000Z' });
    const advisory = { remoteId: 'adv-1', headlineTl: 'Paalala', headlineEn: 'Reminder', bodyTl: 'Tl', bodyEn: 'En', publishedAt: '2026-11-28T00:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z' };
    replaceFarmerAdvisories(database, FARMER_A, [advisory], '2026-11-28T05:00:00.000Z');

    expect(listFarmerInquiries(database, FARMER_A).map((row) => row.id)).toEqual([REQ_1]);
    expect(listFarmerInquiries(database, FARMER_B).map((row) => row.id)).toEqual([REQ_2]);
    expect(listFarmerAdvisories(database, FARMER_A)).toHaveLength(1);
    expect(listFarmerAdvisories(database, FARMER_B)).toHaveLength(0);
  });

  it('makes the guidance cache match what the office publishes now, and hides expired guidance', () => {
    const make = (remoteId: string, expiresAt: string) => ({ remoteId, headlineTl: 'T', headlineEn: 'E', bodyTl: 'T', bodyEn: 'E', publishedAt: '2026-11-28T00:00:00.000Z', expiresAt });
    replaceFarmerAdvisories(database, FARMER_A, [make('a', '2099-01-01T00:00:00.000Z'), make('b', '2099-01-01T00:00:00.000Z')], '2026-11-28T05:00:00.000Z');
    replaceFarmerAdvisories(database, FARMER_A, [make('b', '2099-02-01T00:00:00.000Z'), make('c', '2020-01-01T00:00:00.000Z')], '2026-11-28T06:00:00.000Z');
    expect(listFarmerAdvisories(database, FARMER_A).map((row) => row.remoteId)).toEqual(['b']);
    replaceFarmerAdvisories(database, FARMER_A, [], '2026-11-28T07:00:00.000Z');
    expect(listFarmerAdvisories(database, FARMER_A)).toEqual([]);
  });

  it('wipes everything for one owner, or only the downloaded guidance, without touching another farmer', () => {
    insertScan(database, { id: 'b-scan', owner: FARMER_B });
    enqueue(REQ_1, FIRST);
    enqueueFarmerInquiry(database, { id: REQ_2, ownerIdentity: FARMER_B, scanRecordId: 'b-scan', barangay: 'Banilad', createdAt: '2026-11-28T02:00:00.000Z' });
    const advisory = { remoteId: 'adv-1', headlineTl: 'T', headlineEn: 'E', bodyTl: 'T', bodyEn: 'E', publishedAt: '2026-11-28T00:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z' };
    replaceFarmerAdvisories(database, FARMER_A, [advisory], '2026-11-28T05:00:00.000Z');
    replaceFarmerAdvisories(database, FARMER_B, [advisory], '2026-11-28T05:00:00.000Z');

    expect(deleteCachedFarmerAdvisoriesForOwner(database, FARMER_A)).toBe(1);
    expect(listFarmerInquiries(database, FARMER_A)).toHaveLength(1);
    expect(deleteFarmerCareForOwner(database, FARMER_A)).toBe(1);
    expect(listFarmerInquiries(database, FARMER_A)).toHaveLength(0);
    expect(listFarmerInquiries(database, FARMER_B)).toHaveLength(1);
    expect(listFarmerAdvisories(database, FARMER_B)).toHaveLength(1);
  });
});
