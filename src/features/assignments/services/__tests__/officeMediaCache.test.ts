import {
  OFFICE_MEDIA_BUDGET_BYTES,
  cancelOfficeMediaPrefetch,
  clearOfficeMediaForOwner,
  isOfficeCaseReadyOffline,
  listOfficeMediaItems,
  prefetchOfficeMedia,
  readOfficeMediaUri,
  selectOfficeMediaCases,
} from '@/features/assignments/services/officeMediaCache';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

jest.mock('@/config/env', () => ({ apiBaseUrl: 'http://127.0.0.1:8000' }));
jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const mockDisk = new Map<string, number>();
const mockDownloads: { url: string; headers?: Record<string, string> }[] = [];
let mockSizeFor: (url: string) => number = () => 1000;
let mockFailUrls = new Set<string>();
let mockInterruptUrls = new Set<string>();
let mockKillSnapshot: Map<string, number> | null = null;
let mockDuringMove: (() => void) | null = null;

jest.mock('expo-file-system', () => {
  class MockFile {
    readonly uri: string;
    readonly name: string;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : (part as { uri: string }).uri)).join('/');
      this.name = this.uri.split('/').at(-1) ?? '';
    }
    get exists() { return mockDisk.has(this.uri); }
    get size() { return mockDisk.get(this.uri) ?? 0; }
    delete() { mockDisk.delete(this.uri); }
    async move(destination: MockFile) {
      const bytes = mockDisk.get(this.uri);
      if (bytes === undefined) throw new Error('missing');
      const duringMove = mockDuringMove;
      mockDuringMove = null;
      duringMove?.();
      mockDisk.set(destination.uri, bytes);
      mockDisk.delete(this.uri);
    }
    static async downloadFileAsync(url: string, file: MockFile, options?: { headers?: Record<string, string> }) {
      mockDownloads.push({ url, headers: options?.headers });
      if (mockInterruptUrls.has(url)) {
        mockDisk.set(file.uri, 512);
        mockKillSnapshot = new Map(mockDisk);
        throw new Error('terminated');
      }
      if (mockFailUrls.has(url)) throw new Error('offline');
      mockDisk.set(file.uri, mockSizeFor(url));
      return file;
    }
  }
  class MockDirectory {
    readonly uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : (part as { uri: string }).uri)).join('/');
    }
    get exists() { return [...mockDisk.keys()].some((key) => key.startsWith(`${this.uri}/`)) || this.created; }
    created = false;
    create() { this.created = true; }
    list() { return [...mockDisk.keys()].filter((key) => key.startsWith(`${this.uri}/`)).map((key) => new MockFile(key)); }
    delete() { for (const key of [...mockDisk.keys()]) if (key.startsWith(`${this.uri}/`)) mockDisk.delete(key); }
  }
  return { File: MockFile, Directory: MockDirectory, Paths: { document: { uri: 'file:///docs' } } };
});

const NOW = new Date('2026-11-10T00:00:00.000Z');
const MB = 1024 * 1024;

const names: string[] = [];
const ids = (name: string) => {
  if (!names.includes(name)) names.push(name);
  return `00000000-0000-4000-8000-${String(names.indexOf(name)).padStart(12, '0')}`;
};

function office(name: string, overrides: Partial<FieldValidationAssignment> = {}, bytes = 1000): FieldValidationAssignment {
  return {
    id: ids(name),
    ownerIdentity: 'owner-1',
    fieldValidationState: 'assigned',
    targetVisitDate: null,
    previousVisit: null,
    officeCase: {
      version: 1,
      status: { workflowStatus: 'x', caseState: 'open', reviewStatus: 'pending', updatedAt: 't' },
      reporterConcern: { suspectedCondition: null, observationText: null },
      photo: { contentType: 'image/jpeg', bytes },
    },
    ...overrides,
  } as FieldValidationAssignment;
}

const run = (assignments: FieldValidationAssignment[], owner = 'owner-1') =>
  prefetchOfficeMedia({ assignments, now: NOW, ownerIdentity: owner, token: 'tok' });

function withVisit(
  assignment: FieldValidationAssignment,
  visitedAt = '2026-09-10T08:30:00.000Z',
): FieldValidationAssignment {
  return {
    ...assignment,
    previousVisit: {
      referenceCode: 'CG-0',
      visitedAt,
      reporterSuspectedCondition: null,
      authorityClassifiedCondition: null,
      actionTaken: 'a',
      followUpOutcome: null,
      fieldObservation: null,
      fieldFinding: null,
      freshPhotoAvailable: true,
      photo: { contentType: 'image/jpeg', bytes: 1000 },
    },
  };
}

beforeEach(() => {
  mockDisk.clear();
  mockDownloads.length = 0;
  mockSizeFor = () => 1000;
  mockFailUrls = new Set();
  mockInterruptUrls = new Set();
  mockKillSnapshot = null;
  mockDuringMove = null;
});

describe('office media cache', () => {
  // Proves L5: after one online refresh an eligible case's photos are on disk for offline render.
  it('downloads an eligible case photo with the session token and reports it ready offline', async () => {
    const a = office('a');
    await run([a]);
    expect(mockDownloads).toHaveLength(1);
    expect(mockDownloads[0].headers).toEqual({ Authorization: 'Bearer tok' });
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(true);
    expect(readOfficeMediaUri('owner-1', listOfficeMediaItems(a)[0])).toContain('/office-media/owner-1/');
  });

  // Proves L5: a case that is not downloaded says so instead of claiming readiness.
  it('is not ready offline when a download failed', async () => {
    const a = office('a');
    mockFailUrls = new Set([listOfficeMediaItems(a)[0].url]);
    await run([a]);
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(false);
  });

  // Proves L5: bytes stay within budget, keeping the nearest cases whole.
  it('keeps the nearest cases within the budget and skips the rest', async () => {
    const cases = Array.from({ length: 16 }, (_, index) =>
      office(`c${index}`, { targetVisitDate: `2026-11-11T00:${String(index).padStart(2, "0")}:00.000Z` }, 10 * MB),
    );
    mockSizeFor = () => 10 * MB;
    await run(cases);
    const total = [...mockDisk.values()].reduce((a, b) => a + b, 0);
    expect(mockDisk.size).toBe(15);
    expect(total).toBeLessThanOrEqual(OFFICE_MEDIA_BUDGET_BYTES);
    const ready = cases.filter((c) => isOfficeCaseReadyOffline('owner-1', c));
    expect(ready).toHaveLength(15);
    expect(isOfficeCaseReadyOffline('owner-1', cases[15])).toBe(false);
  });

  // Proves L5: a photo already on disk is not fetched again.
  it('does not download a photo that is already on the phone', async () => {
    const a = office('a');
    await run([a]);
    await run([a]);
    expect(mockDownloads).toHaveLength(1);
  });

  // Proves L5: a download cut short by the app dying is not readable and is repaired later.
  it('never treats an interrupted download as ready offline and retries it', async () => {
    const a = office('a');
    const entry = listOfficeMediaItems(a)[0];
    mockInterruptUrls = new Set([entry.url]);
    await run([a]);
    // A killed process runs no failure cleanup, so the disk keeps what it held at the interruption.
    mockDisk.clear();
    for (const [key, bytes] of mockKillSnapshot!) mockDisk.set(key, bytes);
    expect(readOfficeMediaUri('owner-1', entry)).toBeNull();
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(false);
    mockInterruptUrls = new Set();
    await run([a]);
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(true);
    expect(mockDownloads).toHaveLength(2);
  });

  // Proves L5: a refreshed case replaces its photo instead of showing the old evidence.
  it('replaces the report photo when the case revision changes', async () => {
    const before = office('a');
    await run([before]);
    const oldUri = readOfficeMediaUri('owner-1', listOfficeMediaItems(before)[0]);
    const after = office('a', { officeCase: { ...before.officeCase!, version: 2 } });
    await run([after]);
    const newUri = readOfficeMediaUri('owner-1', listOfficeMediaItems(after)[0]);
    expect(mockDownloads).toHaveLength(2);
    expect(newUri).not.toEqual(oldUri);
    expect(mockDisk.size).toBe(1);
  });

  // Proves L5: a different previous visit replaces the last-visit evidence on disk.
  it('replaces the last-visit photo when the visit changes', async () => {
    const first = withVisit(office('a'));
    await run([first]);
    const firstUri = readOfficeMediaUri('owner-1', listOfficeMediaItems(first)[1]);
    const second = withVisit(office('a'), '2026-10-11T09:00:00.000Z');
    await run([second]);
    const secondUri = readOfficeMediaUri('owner-1', listOfficeMediaItems(second)[1]);
    expect(secondUri).not.toEqual(firstUri);
    expect(readOfficeMediaUri('owner-1', listOfficeMediaItems(second)[0])).not.toBeNull();
    expect(mockDisk.size).toBe(2);
  });

  // Proves L5: a case is kept whole — one failed photo keeps none of its photos.
  it('keeps no photo of a case whose other photo failed', async () => {
    const a = withVisit(office('a'));
    const items = listOfficeMediaItems(a);
    expect(items.map((entry) => entry.kind)).toEqual(['report', 'last-visit']);
    mockFailUrls = new Set([items[1].url]);
    await run([a]);
    expect(mockDisk.size).toBe(0);
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(false);
  });

  // Proves L5: real bytes over budget evict a case whole, never one of its photos.
  it('evicts the whole case when its real bytes exceed the budget', async () => {
    const cases = Array.from({ length: 8 }, (_, index) => withVisit(office(`trim${index}`)));
    // Declared 1000 bytes each, so all eight cases are planned; the real bytes are 160 MiB.
    mockSizeFor = () => 10 * MB;
    await run(cases);
    expect(mockDisk.size).toBe(14);
    expect(isOfficeCaseReadyOffline('owner-1', cases[0])).toBe(true);
    expect(isOfficeCaseReadyOffline('owner-1', cases[7])).toBe(false);
  });

  // Proves L5: a file larger than the per-file cap is never kept.
  it('never keeps an oversized photo, declared or actual', async () => {
    await run([office('declared', {}, 11 * MB)]);
    expect(mockDownloads).toHaveLength(0);
    mockSizeFor = () => 11 * MB;
    await run([office('lying')]);
    expect(mockDisk.size).toBe(0);
  });

  // Proves L5: removing a case from the snapshot deletes its files.
  it('evicts files of cases that left the snapshot', async () => {
    await run([office('a'), office('b')]);
    expect(mockDisk.size).toBe(2);
    await run([office('b')]);
    expect(mockDisk.size).toBe(1);
    await run([]);
    expect(mockDisk.size).toBe(0);
  });

  // Proves L5: only assigned/in-progress cases due within 7 days (or undated) are prefetched.
  it('selects by state and due window, nearest first, undated last', () => {
    const picked = selectOfficeMediaCases(
      [
        office('far', { targetVisitDate: '2026-12-25' }),
        office('done', { fieldValidationState: 'completed' }),
        office('undated'),
        office('soon', { targetVisitDate: '2026-11-12' }),
        office('sooner', { targetVisitDate: '2026-11-11' }),
        { ...office('field'), officeCase: null },
      ],
      NOW,
    ).map((assignment) => assignment.id);
    expect(picked).toEqual(['sooner', 'soon', 'undated'].map(ids));
  });

  // Proves L5: the cache is owner-scoped and clearing removes only that owner's photos.
  it('clears only the requested owner', async () => {
    await run([office('a', { ownerIdentity: 'owner-1' })], 'owner-1');
    await run([office('b', { ownerIdentity: 'owner-2' })], 'owner-2');
    clearOfficeMediaForOwner('owner-1');
    expect(isOfficeCaseReadyOffline('owner-1', office('a'))).toBe(false);
    expect(isOfficeCaseReadyOffline('owner-2', office('b'))).toBe(true);
  });

  // Proves L5: a clear during a download does not leave the photo behind.
  it('drops a download that finishes after the owner was cleared', async () => {
    const pending = run([office('a')]);
    clearOfficeMediaForOwner('owner-1');
    await pending;
    expect(mockDisk.size).toBe(0);
  });

  // Proves L5: a clear that lands while a photo is published still removes that photo.
  it('keeps no photo published after the owner was cleared', async () => {
    const a = office('a');
    mockDuringMove = () => clearOfficeMediaForOwner('owner-1');
    await run([a]);
    expect(mockDisk.size).toBe(0);
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(false);
  });

  // Proves: no photo is requested with a token whose session has ended (logout boundary).
  it('downloads nothing once the session is no longer current', async () => {
    await prefetchOfficeMedia({
      assignments: [office('a')], isSessionCurrent: () => false, now: NOW, ownerIdentity: 'owner-1', token: 'tok',
    });
    expect(mockDownloads).toHaveLength(0);
    expect(mockDisk.size).toBe(0);
  });

  // Proves: logout cancels a queued prefetch without erasing photos the owner already cached.
  it('cancels a queued prefetch but keeps cached photos', async () => {
    const a = office('a');
    await run([a]);
    const pending = run([office('b')]);
    cancelOfficeMediaPrefetch('owner-1');
    await pending;
    expect(mockDownloads).toHaveLength(1);
    expect(isOfficeCaseReadyOffline('owner-1', a)).toBe(true);
  });
});
