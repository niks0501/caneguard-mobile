/**
 * Lightweight in-memory handoff when a Field Report opens a locked (sent/pending)
 * whole-plot map and the inspector transitions to a new draft to measure affected areas.
 * Field Report consumes this on focus return so it links and reads the new draft without
 * mutating the immutable historical survey row.
 */
const replacedReportSurveys = new Map<string, string>();

export function recordReplacedReportSurvey(originalClientUuid: string, nextClientUuid: string): void {
  if (!originalClientUuid || !nextClientUuid || originalClientUuid === nextClientUuid) return;
  replacedReportSurveys.set(originalClientUuid, nextClientUuid);
}

export function consumeReplacedReportSurvey(originalClientUuid: string): string | null {
  const next = replacedReportSurveys.get(originalClientUuid) ?? null;
  if (next !== null) replacedReportSurveys.delete(originalClientUuid);
  return next;
}

export function clearReplacedReportSurveys(): void {
  replacedReportSurveys.clear();
}
