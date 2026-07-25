import { useContext } from 'react';

import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';

export function useScanSession() {
  const scanSession = useContext(ScanSessionContext);

  if (!scanSession) {
    throw new Error('useScanSession must be used within ScanSessionProvider.');
  }

  return scanSession;
}
