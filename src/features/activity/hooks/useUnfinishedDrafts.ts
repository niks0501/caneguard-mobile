import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listUnfinishedDrafts } from '@/features/activity/data/unfinishedWorkRepository';
import type { UnfinishedDraft } from '@/features/activity/domain/needsAttention';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

const NO_DRAFTS: UnfinishedDraft[] = [];

/**
 * The report, visit and plot drafts saved on this phone for the signed-in
 * owner. They are local rows: reload on focus (returning from a form) and
 * whenever local records change, so a finished or deleted draft leaves at once.
 */
export function useUnfinishedDrafts(): UnfinishedDraft[] {
  const database = useCaneGuardDatabase();
  const ownerIdentity = useContext(AuthContext)?.session?.user.uuid ?? null;
  const [snapshot, setSnapshot] = useState<{
    drafts: UnfinishedDraft[];
    ownerIdentity: string | null;
  }>({ drafts: NO_DRAFTS, ownerIdentity: null });

  useFocusEffect(
    useCallback(() => {
      if (!ownerIdentity || !database || database === EMPTY_DATABASE) return;
      let active = true;
      const load = () => {
        listUnfinishedDrafts(database, ownerIdentity)
          .then((drafts) => {
            if (active) setSnapshot({ drafts, ownerIdentity });
          })
          .catch(() => undefined);
      };
      load();
      const unsubscribe = subscribeSyncRecords(load);
      return () => {
        active = false;
        unsubscribe();
      };
    }, [database, ownerIdentity]),
  );

  return snapshot.ownerIdentity === ownerIdentity ? snapshot.drafts : NO_DRAFTS;
}
