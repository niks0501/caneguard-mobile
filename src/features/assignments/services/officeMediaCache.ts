import { Directory, File, Paths } from 'expo-file-system';

import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  buildMobilePreviousEvidencePhotoUrl,
  buildMobileReportPhotoUrl,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

/** Largest single photo kept for offline use (matches the upload limit). */
export const OFFICE_MEDIA_MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Most photo bytes kept on this phone for one signed-in owner. */
export const OFFICE_MEDIA_BUDGET_BYTES = 150 * 1024 * 1024;
/** Only visits due within this many days (or undated) are prefetched. */
export const OFFICE_MEDIA_DUE_WINDOW_DAYS = 7;

export type OfficeMediaKind = 'report' | 'last-visit';

export interface OfficeMediaItem {
  assignmentId: string;
  kind: OfficeMediaKind;
  url: string;
  declaredBytes: number;
  fileName: string;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * The photos a case needs to be "Ready offline": the office report photo and
 * the previous-visit photo, only for office-born cases that carry them.
 */
export function listOfficeMediaItems(assignment: FieldValidationAssignment): OfficeMediaItem[] {
  const officeCase = assignment.officeCase;
  if (!officeCase) return [];
  const items: OfficeMediaItem[] = [];
  if (officeCase.photo) {
    items.push(
      item(
        assignment.id,
        'report',
        `v${officeCase.version}`,
        buildMobileReportPhotoUrl(assignment.id),
        officeCase.photo,
      ),
    );
  }
  const visit = assignment.previousVisit;
  if (visit?.photo && visit.freshPhotoAvailable) {
    items.push(
      item(assignment.id, 'last-visit', visit.visitedAt, buildMobilePreviousEvidencePhotoUrl(assignment.id), {
        bytes: visit.photo.bytes ?? OFFICE_MEDIA_MAX_FILE_BYTES,
        contentType: visit.photo.contentType,
      }),
    );
  }
  return items;
}

function item(
  assignmentId: string,
  kind: OfficeMediaKind,
  revision: string,
  url: string,
  photo: { contentType: string | null; bytes: number },
): OfficeMediaItem {
  const extension = EXTENSIONS[(photo.contentType ?? '').toLowerCase()] ?? 'jpg';
  return {
    assignmentId,
    kind,
    url,
    declaredBytes: photo.bytes,
    fileName: `${encodeURIComponent(assignmentId)}.${kind}.${revisionKey(revision)}.${extension}`,
  };
}

/** A cache name changes with the snapshot revision, so a replaced photo is never reused. */
function revisionKey(revision: string): string {
  const key = revision.replace(/[^0-9A-Za-z_-]/g, '');
  return key || '0';
}

function ownerDirectory(ownerIdentity: string): Directory {
  return new Directory(Paths.document, 'caneguard', 'office-media', requireOwnerIdentity(ownerIdentity));
}

/** Local file uri of a cached photo, or null when it is not on this phone. */
export function readOfficeMediaUri(ownerIdentity: string, entry: OfficeMediaItem): string | null {
  try {
    const file = new File(ownerDirectory(ownerIdentity), entry.fileName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/** True when the case has photos and every one of them is on disk. */
export function isOfficeCaseReadyOffline(
  ownerIdentity: string,
  assignment: FieldValidationAssignment,
): boolean {
  const items = listOfficeMediaItems(assignment);
  return items.length > 0 && items.every((entry) => readOfficeMediaUri(ownerIdentity, entry) !== null);
}

/**
 * Cases worth keeping photos for: assigned or in progress, due within the
 * window or undated, nearest first (undated last, then by id for a stable order).
 */
export function selectOfficeMediaCases(
  assignments: readonly FieldValidationAssignment[],
  now: Date,
): FieldValidationAssignment[] {
  const horizon = now.getTime() + OFFICE_MEDIA_DUE_WINDOW_DAYS * 86_400_000;
  const due = (assignment: FieldValidationAssignment): number => {
    const time = assignment.targetVisitDate ? Date.parse(assignment.targetVisitDate) : Number.NaN;
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
  };
  return assignments
    .filter((assignment) => {
      if (assignment.fieldValidationState !== 'assigned' && assignment.fieldValidationState !== 'in_progress') {
        return false;
      }
      if (listOfficeMediaItems(assignment).length === 0) return false;
      return due(assignment) === Number.POSITIVE_INFINITY || due(assignment) <= horizon;
    })
    .sort((a, b) => {
      const left = due(a);
      const right = due(b);
      if (left !== right) return left < right ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
}

const generations = new Map<string, number>();
const queues = new Map<string, Promise<void>>();

function generationOf(owner: string): number {
  return generations.get(owner) ?? 0;
}

/**
 * Downloads photos for the selected cases within the per-owner budget and
 * removes every other cached photo of that owner. A case is kept whole or
 * not at all so "Ready offline" is always true. Best effort: a failed
 * download leaves the case showing its online fallback.
 */
export function prefetchOfficeMedia(options: {
  assignments: readonly FieldValidationAssignment[];
  now?: Date;
  ownerIdentity: string;
  token: string;
}): Promise<void> {
  const owner = requireOwnerIdentity(options.ownerIdentity);
  const generation = generationOf(owner);
  const run = (queues.get(owner) ?? Promise.resolve()).then(() =>
    runPrefetch({ ...options, now: options.now ?? new Date(), ownerIdentity: owner }, generation),
  );
  const settled = run.catch(() => undefined);
  queues.set(owner, settled);
  return run;
}

async function runPrefetch(
  options: {
    assignments: readonly FieldValidationAssignment[];
    now: Date;
    ownerIdentity: string;
    token: string;
  },
  generation: number,
): Promise<void> {
  const owner = options.ownerIdentity;
  const directory = ownerDirectory(owner);
  const stale = () => generationOf(owner) !== generation;

  // Plan: admit whole cases, nearest first, while they fit the budget.
  const admitted: OfficeMediaItem[][] = [];
  let planned = 0;
  for (const assignment of selectOfficeMediaCases(options.assignments, options.now)) {
    const items = listOfficeMediaItems(assignment);
    if (items.some((entry) => entry.declaredBytes > OFFICE_MEDIA_MAX_FILE_BYTES)) continue;
    const cost = items.reduce((sum, entry) => sum + entry.declaredBytes, 0);
    if (planned + cost > OFFICE_MEDIA_BUDGET_BYTES) continue;
    planned += cost;
    admitted.push(items);
  }

  const keep = new Set(admitted.flat().map((entry) => entry.fileName));
  if (directory.exists) {
    for (const entry of directory.list()) {
      if (entry instanceof File && !keep.has(entry.name)) entry.delete();
    }
  }
  if (admitted.length === 0 || stale()) return;
  directory.create({ idempotent: true, intermediates: true });

  for (const items of admitted) {
    if (stale()) return;
    let complete = true;
    for (const entry of items) {
      if (await downloadPhoto(directory, entry, options.token, stale)) continue;
      complete = false;
      break;
    }
    if (complete) continue;
    for (const entry of items) {
      const file = new File(directory, entry.fileName);
      if (file.exists) file.delete();
    }
    if (stale()) return;
  }

  // The server's declared sizes can lie; trim by real bytes, farthest cases first.
  let total = 0;
  for (const items of admitted) {
    const files = items
      .map((entry) => new File(directory, entry.fileName))
      .filter((file) => file.exists);
    const bytes = files.reduce((sum, file) => sum + file.size, 0);
    if (total + bytes > OFFICE_MEDIA_BUDGET_BYTES) {
      for (const file of files) file.delete();
      continue;
    }
    total += bytes;
  }
}

async function downloadPhoto(
  directory: Directory,
  entry: OfficeMediaItem,
  token: string,
  stale: () => boolean,
): Promise<boolean> {
  const file = new File(directory, entry.fileName);
  if (file.exists) return true;
  const partial = new File(directory, `${entry.fileName}.part`);
  try {
    await File.downloadFileAsync(entry.url, partial, {
      headers: { Authorization: `Bearer ${token}` },
      idempotent: true,
    });
    const size = partial.size;
    if (size <= 0 || size > OFFICE_MEDIA_MAX_FILE_BYTES || stale()) {
      partial.delete();
      return false;
    }
    await partial.move(file, { overwrite: true });
    if (stale()) {
      if (file.exists) file.delete();
      return false;
    }
    return true;
  } catch {
    if (partial.exists) partial.delete();
    return false;
  }
}

/** Deletes every cached photo for the owner and cancels in-flight prefetches. */
export function clearOfficeMediaForOwner(ownerIdentity: string): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  generations.set(owner, generationOf(owner) + 1);
  const directory = ownerDirectory(owner);
  if (directory.exists) directory.delete();
}
