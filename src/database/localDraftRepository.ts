import { and, desc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  localDrafts,
  type LocalDraftKind,
  type LocalDraftRow,
} from '@/database/schema';

export interface LocalDraftInput {
  draftKey: string;
  kind: LocalDraftKind;
  ownerIdentity: string;
  payload: unknown;
  version: number;
}

export interface LocalDraftRecord<T = unknown> {
  draftKey: string;
  kind: LocalDraftKind;
  ownerIdentity: string;
  payload: T;
  updatedAt: string;
  version: number;
}

export interface LocalDraftSummary {
  draftKey: string;
  kind: LocalDraftKind;
  updatedAt: string;
  version: number;
}

function requireDraftKey(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200) {
    throw new StorageError(
      'UPDATE_FAILED',
      'The local draft identifier is invalid.',
    );
  }
  return normalized;
}

function requireVersion(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new StorageError('UPDATE_FAILED', 'The local draft version is invalid.');
  }
  return value;
}

/**
 * Writes the last good checkpoint for one owner, kind and key. A newer version
 * replaces the previous payload in place; nothing here is uploaded.
 */
export async function saveLocalDraft(
  database: CaneGuardDatabase,
  input: LocalDraftInput,
): Promise<LocalDraftRecord> {
  const owner = requireOwnerIdentity(input.ownerIdentity);
  const draftKey = requireDraftKey(input.draftKey);
  const version = requireVersion(input.version);
  let payloadJson: string;
  try {
    payloadJson = JSON.stringify(input.payload);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'The local draft could not be serialized.',
    );
  }
  if (payloadJson === undefined) {
    throw new StorageError('UPDATE_FAILED', 'The local draft payload is invalid.');
  }

  const now = new Date().toISOString();
  const existing = findRow(database, owner, input.kind, draftKey);

  try {
    if (existing) {
      database
        .update(localDrafts)
        .set({ payloadJson, updatedAt: now, version })
        .where(
          and(
            eq(localDrafts.ownerIdentity, owner),
            eq(localDrafts.kind, input.kind),
            eq(localDrafts.draftKey, draftKey),
          ),
        )
        .run();
    } else {
      database
        .insert(localDrafts)
        .values({
          createdAt: now,
          draftKey,
          kind: input.kind,
          ownerIdentity: owner,
          payloadJson,
          updatedAt: now,
          version,
        })
        .run();
    }
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'SAVE_TRANSACTION_FAILED',
      'Saving the local draft checkpoint failed.',
    );
  }

  return {
    draftKey,
    kind: input.kind,
    ownerIdentity: owner,
    payload: input.payload,
    updatedAt: now,
    version,
  };
}

/**
 * Reads one owner's checkpoint. A payload written by a different draft schema
 * version is treated as absent so an old shape can never hydrate current state.
 */
export function readLocalDraft<T = unknown>(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  kind: LocalDraftKind,
  draftKey: string,
  version: number,
): LocalDraftRecord<T> | null {
  let owner: string;
  let key: string;
  let expectedVersion: number;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
    key = requireDraftKey(draftKey);
    expectedVersion = requireVersion(version);
  } catch {
    return null;
  }

  let row: LocalDraftRow | null;
  try {
    row = findRow(database, owner, kind, key);
  } catch {
    // An unavailable database (for example during migration) reads as absent;
    // recovery must never break screen rendering.
    return null;
  }
  if (!row || row.version !== expectedVersion) {
    return null;
  }

  try {
    return {
      draftKey: row.draftKey,
      kind: row.kind,
      ownerIdentity: row.ownerIdentity,
      payload: JSON.parse(row.payloadJson) as T,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  } catch {
    return null;
  }
}

export function deleteLocalDraft(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  kind: LocalDraftKind,
  draftKey: string,
): boolean {
  const owner = requireOwnerIdentity(ownerIdentity);
  const key = requireDraftKey(draftKey);
  try {
    const result = database
      .delete(localDrafts)
      .where(
        and(
          eq(localDrafts.ownerIdentity, owner),
          eq(localDrafts.kind, kind),
          eq(localDrafts.draftKey, key),
        ),
      )
      .run();
    return result.changes > 0;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Deleting the local draft checkpoint failed.',
    );
  }
}

export function listLocalDraftSummaries(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  kind?: LocalDraftKind,
): LocalDraftSummary[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  const base = database
    .select({
      draftKey: localDrafts.draftKey,
      kind: localDrafts.kind,
      updatedAt: localDrafts.updatedAt,
      version: localDrafts.version,
    })
    .from(localDrafts);
  return (kind ? base.where(and(eq(localDrafts.ownerIdentity, owner), eq(localDrafts.kind, kind))) : base.where(eq(localDrafts.ownerIdentity, owner)))
    .orderBy(desc(localDrafts.updatedAt))
    .all();
}

function findRow(
  database: CaneGuardDatabase,
  owner: string,
  kind: LocalDraftKind,
  draftKey: string,
): LocalDraftRow | null {
  if (typeof database.select !== 'function') {
    return null;
  }
  return (
    database
      .select()
      .from(localDrafts)
      .where(
        and(
          eq(localDrafts.ownerIdentity, owner),
          eq(localDrafts.kind, kind),
          eq(localDrafts.draftKey, draftKey),
        ),
      )
      .get() ?? null
  );
}
