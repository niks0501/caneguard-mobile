import { and, eq, inArray, sql } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { fieldReports, fieldSurveys, fieldValidationCompletions } from '@/database/schema';

const UNSENT = ['pending', 'syncing', 'failed'] as const;

/**
 * Yes/no only: does this phone hold any unsent inspector work, whoever saved
 * it? Deliberately returns a boolean so no count or detail can reach a farmer
 * session that reads it.
 */
export async function hasUnsentInspectorWork(database: CaneGuardDatabase): Promise<boolean> {
  try {
    const [report, survey, completion] = await Promise.all([
      database
        .select({ one: sql<number>`1` })
        .from(fieldReports)
        .where(and(eq(fieldReports.authoringState, 'finalized'), inArray(fieldReports.syncStatus, UNSENT)))
        .limit(1)
        .get(),
      database
        .select({ one: sql<number>`1` })
        .from(fieldSurveys)
        .where(inArray(fieldSurveys.status, UNSENT))
        .limit(1)
        .get(),
      database
        .select({ one: sql<number>`1` })
        .from(fieldValidationCompletions)
        .where(inArray(fieldValidationCompletions.syncStatus, UNSENT))
        .limit(1)
        .get(),
    ]);
    return Boolean(report || survey || completion);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Checking for unsent inspector work failed.');
  }
}
