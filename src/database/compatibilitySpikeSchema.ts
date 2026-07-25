import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Phase 0 only: this table proves Drizzle migration generation and runtime
 * application. Phase 1 replaces it with the approved scan-record schema.
 */
export const compatibilityProbe = sqliteTable('compatibility_probe', {
  id: integer('id').primaryKey(),
  createdAt: text('created_at').notNull(),
});
