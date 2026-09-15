import { useEffect, useState } from 'react';

import {
  getSyncRecordsRevision,
  subscribeSyncRecords,
} from '@/features/sync/services/syncEvents';

export function useSyncRecordsRevision(): number {
  const [currentRevision, setCurrentRevision] = useState(getSyncRecordsRevision);

  useEffect(
    () =>
      subscribeSyncRecords(() => {
        setCurrentRevision(getSyncRecordsRevision());
      }),
    [],
  );

  return currentRevision;
}

export function useSyncRecordsRefresh(refresh: () => void): void {
  useEffect(
    () =>
      subscribeSyncRecords(() => {
        refresh();
      }),
    [refresh],
  );
}
