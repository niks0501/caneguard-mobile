import type { CaneGuardDatabase } from '@/database/database';
import { fetchAllMobileFieldValidationAssignments } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import {
  listCachedFieldValidationAssignments,
  replaceCachedFieldValidationAssignments,
} from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

export interface FieldValidationAssignmentsRefreshResult {
  assignments: FieldValidationAssignment[];
  fetchedAt: string;
  syncBefore: string;
}

interface ActiveRefresh {
  promise: Promise<FieldValidationAssignmentsRefreshResult>;
  token: string;
}

const activeRefreshes = new WeakMap<CaneGuardDatabase, Map<string, ActiveRefresh>>();
const refreshGenerations = new WeakMap<CaneGuardDatabase, Map<string, number>>();

export function invalidateFieldValidationAssignmentsRefresh(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): void {
  const owner = ownerIdentity.trim();
  let databaseGenerations = refreshGenerations.get(database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(database, databaseGenerations);
  }
  databaseGenerations.set(owner, (databaseGenerations.get(owner) ?? 0) + 1);
  activeRefreshes.get(database)?.delete(owner);
}

export function refreshFieldValidationAssignments(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
}): Promise<FieldValidationAssignmentsRefreshResult> {
  const owner = options.ownerIdentity.trim();
  let databaseRefreshes = activeRefreshes.get(options.database);
  if (!databaseRefreshes) {
    databaseRefreshes = new Map();
    activeRefreshes.set(options.database, databaseRefreshes);
  }

  const active = databaseRefreshes.get(owner);
  if (active?.token === options.token) return active.promise;

  let databaseGenerations = refreshGenerations.get(options.database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(options.database, databaseGenerations);
  }
  const generation = (databaseGenerations.get(owner) ?? 0) + 1;
  databaseGenerations.set(owner, generation);

  const operation = executeRefresh({
    ...options,
    isCurrent: () => databaseGenerations?.get(owner) === generation,
    ownerIdentity: owner,
  });
  const promise = operation.finally(() => {
    if (databaseRefreshes?.get(owner)?.promise === promise) databaseRefreshes.delete(owner);
  });
  databaseRefreshes.set(owner, { promise, token: options.token });
  return promise;
}

async function executeRefresh(options: {
  database: CaneGuardDatabase;
  isCurrent: () => boolean;
  ownerIdentity: string;
  token: string;
}): Promise<FieldValidationAssignmentsRefreshResult> {
  const response = await fetchAllMobileFieldValidationAssignments({ token: options.token });
  if (!options.isCurrent()) throw new Error('The assignment refresh was superseded.');
  const fetchedAt = new Date().toISOString();
  await replaceCachedFieldValidationAssignments(
    options.database,
    options.ownerIdentity,
    response.assignments,
    fetchedAt,
    options.isCurrent,
  );
  const assignments = await listCachedFieldValidationAssignments(
    options.database,
    options.ownerIdentity,
  );
  return { assignments, fetchedAt, syncBefore: response.syncBefore };
}
