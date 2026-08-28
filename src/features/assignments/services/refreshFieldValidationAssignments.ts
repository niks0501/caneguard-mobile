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

  const operation = executeRefresh({ ...options, ownerIdentity: owner });
  const promise = operation.finally(() => {
    if (databaseRefreshes?.get(owner)?.promise === promise) databaseRefreshes.delete(owner);
  });
  databaseRefreshes.set(owner, { promise, token: options.token });
  return promise;
}

async function executeRefresh(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
}): Promise<FieldValidationAssignmentsRefreshResult> {
  const response = await fetchAllMobileFieldValidationAssignments({ token: options.token });
  const fetchedAt = new Date().toISOString();
  await replaceCachedFieldValidationAssignments(
    options.database,
    options.ownerIdentity,
    response.assignments,
    fetchedAt,
  );
  const assignments = await listCachedFieldValidationAssignments(
    options.database,
    options.ownerIdentity,
  );
  return { assignments, fetchedAt, syncBefore: response.syncBefore };
}
