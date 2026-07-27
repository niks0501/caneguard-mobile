import { useEffect } from 'react';

import {
  subscribeSyncRecords,
} from '@/features/sync/services/syncEvents';

export function useSyncRecordsRefresh(refresh: () => void): void {
  useEffect(
    () =>
      subscribeSyncRecords(() => {
        refresh();
      }),
    [refresh],
  );
}
