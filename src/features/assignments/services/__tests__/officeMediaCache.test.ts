import {
  OFFICE_MEDIA_BUDGET_BYTES,
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
    static async downloadFileAsync(url: string, file: MockFile, options?: { headers?: Record<string, string> }) {
      mockDownloads.push({ url, headers: options?.headers });
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

beforeEach(() => {
  mockDisk.clear();
  mockDownloads.length = 0;
  mockSizeFor = () => 1000;
  mockFailUrls = new Set();
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
});
