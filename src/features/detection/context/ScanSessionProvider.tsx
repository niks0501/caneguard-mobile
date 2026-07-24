import { createContext, useMemo, useReducer, type Dispatch, type PropsWithChildren } from 'react';

import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

export type ScanSessionContextValue = {
  state: ScanSessionState;
  dispatch: Dispatch<ScanSessionAction>;
};

export const ScanSessionContext = createContext<ScanSessionContextValue | null>(null);

export function ScanSessionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(scanSessionReducer, initialScanSessionState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ScanSessionContext.Provider value={value}>{children}</ScanSessionContext.Provider>;
}
