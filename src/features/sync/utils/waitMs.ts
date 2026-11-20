/** Largest delay a JS timer accepts; longer ones fire immediately. */
export const MAX_TIMER_DELAY_MS = 2_147_483_647;

export async function waitMs(milliseconds: number): Promise<void> {
  const chunk = Math.min(Math.max(milliseconds, 0), MAX_TIMER_DELAY_MS);
  await new Promise<void>((resolve) => setTimeout(resolve, chunk));
  if (milliseconds - chunk > 0) {
    await waitMs(milliseconds - chunk);
  }
}
