import { useEffect } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isWebValidationRuntimeEnabled } from './runtime';
import { seedValidationScanRecords } from './seedScanRecords';

const SEEDED_STORAGE_KEY = 'caneguard.web-validation.seeded-farmers';

function readSeededOwners(): Set<string> {
  try {
    const raw = globalThis.localStorage?.getItem(SEEDED_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function rememberSeededOwner(owner: string): void {
  seededOwners.add(owner);
  try {
    globalThis.localStorage?.setItem(
      SEEDED_STORAGE_KEY,
      JSON.stringify([...seededOwners]),
    );
  } catch {
    // The page-session guard is still enough for the current page.
  }
}

const seededOwners = readSeededOwners();

/**
 * Seeds the fake farmer's saved checks once the validation session and local
 * database are ready. A completed seed is remembered in this browser profile so
 * a check the validator deletes stays deleted across a later render or reload.
 */
export function WebValidationSeed() {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();

  useEffect(() => {
    if (
      !isWebValidationRuntimeEnabled() ||
      !user ||
      user.role !== 'farmer' ||
      seededOwners.has(user.uuid)
    ) {
      return;
    }
    void seedValidationScanRecords({ database, user })
      .then(() => {
        rememberSeededOwner(user.uuid);
      })
      .catch((error: unknown) => {
        console.warn(
          '[web:validate] The seeded farmer checks could not be prepared.',
          error instanceof Error ? error.message : String(error),
        );
      });
  }, [database, user]);

  return null;
}
