/** Largest delay a JS timer accepts; longer ones fire immediately. */
export const MAX_TIMER_DELAY_MS = 2_147_483_647;

export function waitMs(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
