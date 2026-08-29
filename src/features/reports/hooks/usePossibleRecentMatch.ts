import { useCallback, useEffect, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { findPossibleRecentMatch } from '@/features/reports/data/possibleMatchRepository';
import {
  isPossibleMatchLookupReady,
  isPossibleRecentMatch,
  type PossibleMatchLookupInput,
  type PossibleRecentMatch,
} from '@/features/reports/domain/possibleMatch';

/**
 * Explicit lookup seam for a future Web/API implementation. The current
 * default is local-only so this feature remains useful offline.
 */
export type PossibleRecentMatchLookup = (
  input: PossibleMatchLookupInput,
) => Promise<PossibleRecentMatch | null>;

export interface PossibleRecentMatchState {
  match: PossibleRecentMatch | null;
  unavailable: boolean;
  loading: boolean;
}

interface StoredLookupState extends PossibleRecentMatchState {
  inputKey: string | null;
}

export function usePossibleRecentMatch(
  input: PossibleMatchLookupInput | null,
  lookup?: PossibleRecentMatchLookup,
): PossibleRecentMatchState {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const [state, setState] = useState<StoredLookupState>({
    inputKey: null,
    match: null,
    unavailable: false,
    loading: false,
  });
  const localLookup = useCallback(
    (lookupInput: PossibleMatchLookupInput) =>
      user
        ? findPossibleRecentMatch(database, user.uuid, lookupInput)
        : Promise.resolve(null),
    [database, user],
  );
  const activeLookup = lookup ?? localLookup;
  const inputKey = input ? JSON.stringify(input) : null;
  const canLookup = Boolean(
    input && user && isPossibleMatchLookupReady(input),
  );

  useEffect(() => {
    let active = true;
    if (!canLookup || !input || !user || !inputKey) {
      return () => {
        active = false;
      };
    }

    void activeLookup(input)
      .then((match) => {
        if (active) {
          const validMatch =
            match === null || isPossibleRecentMatch(match) ? match : null;
          setState({
            inputKey,
            match: validMatch,
            unavailable: match !== null && validMatch === null,
            loading: false,
          });
        }
      })
      .catch(() => {
        // This is advisory functionality. A local/API read failure must not
        // change the Field Report lifecycle or prevent finalization.
        if (active) {
          setState({ inputKey, match: null, unavailable: true, loading: false });
        }
      });

    return () => {
      active = false;
    };
  }, [activeLookup, canLookup, input, inputKey, user]);

  if (!canLookup || state.inputKey !== inputKey) {
    return {
      match: null,
      unavailable: false,
      loading: canLookup,
    };
  }
  return {
    match: state.match,
    unavailable: state.unavailable,
    loading: state.loading,
  };
}
