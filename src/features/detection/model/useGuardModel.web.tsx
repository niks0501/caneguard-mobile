import type { PropsWithChildren } from 'react';

import { GuardError } from '@/features/detection/model/guardInference';
import type { GuardModelController } from '@/features/detection/model/useGuardModel';

export type { GuardModelController, GuardErrorKind } from '@/features/detection/model/useGuardModel';

/** Web has no native TFLite runtime, so the required guard always fails closed. */
const WEB_GUARD_ERROR = new GuardError(
  'GUARD_UNSUPPORTED_PLATFORM',
  'The Guard V1 runtime is available in the Android build, not the web bundle.',
);

const WEB_CONTROLLER: GuardModelController = {
  state: 'error',
  error: WEB_GUARD_ERROR,
  errorKind: 'unsupported',
  start: () => undefined,
  retry: () => undefined,
  run: async () => {
    throw WEB_GUARD_ERROR;
  },
};

export function GuardModelProvider({ children }: PropsWithChildren) {
  return children;
}

export function useGuardModel(): GuardModelController {
  return WEB_CONTROLLER;
}
