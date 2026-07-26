import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import type { ChecklistConsistency } from '@/features/detection/checklist/checklistConsistency';
import type { ReportedSeverity, ScanSourceType } from '@/features/detection/types';

export const SYNC_STATUSES = [
  'local_only',
  'pending',
  'syncing',
  'synced',
  'failed',
] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const scanRecords = sqliteTable(
  'scan_records',
  {
    id: text('id').primaryKey(),
    managedImageUri: text('managed_image_uri').notNull(),
    imageMimeType: text('image_mime_type'),
    imageSizeBytes: integer('image_size_bytes'),
    imageSourceType: text('image_source_type').$type<ScanSourceType>().notNull(),
    sourceWidth: integer('source_width'),
    sourceHeight: integer('source_height'),
    predictedLabel: text('predicted_label').notNull(),
    confidence: real('confidence').notNull(),
    checklistConsistency: text('checklist_consistency')
      .$type<ChecklistConsistency>()
      .notNull(),
    reportedSeverity: text('reported_severity').$type<ReportedSeverity>(),
    barangay: text('barangay'),
    modelVersion: text('model_version').notNull(),
    preprocessMs: real('preprocess_ms').notNull(),
    inferenceMs: real('inference_ms').notNull(),
    totalMs: real('total_ms').notNull(),
    syncStatus: text('sync_status')
      .$type<SyncStatus>()
      .notNull()
      .default('local_only'),
    remoteId: text('remote_id'),
    syncAttemptCount: integer('sync_attempt_count').notNull().default(0),
    lastSyncErrorCode: text('last_sync_error_code'),
    lastSyncAttemptAt: text('last_sync_attempt_at'),
    lastSyncedAt: text('last_synced_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('scan_records_created_at_idx').on(table.createdAt),
    index('scan_records_label_created_at_idx').on(table.predictedLabel, table.createdAt),
    index('scan_records_sync_created_at_idx').on(table.syncStatus, table.createdAt),
    index('scan_records_barangay_created_at_idx').on(table.barangay, table.createdAt),
    uniqueIndex('scan_records_remote_id_unique').on(table.remoteId),
    check(
      'scan_records_image_source_check',
      sql`${table.imageSourceType} in ('camera', 'gallery')`,
    ),
    check(
      'scan_records_confidence_check',
      sql`${table.confidence} >= 0 and ${table.confidence} <= 1`,
    ),
    check(
      'scan_records_consistency_check',
      sql`${table.checklistConsistency} in ('consistent', 'inconsistent', 'not-applicable', 'not-enough-information')`,
    ),
    check(
      'scan_records_severity_check',
      sql`${table.reportedSeverity} is null or ${table.reportedSeverity} in ('Mild', 'Moderate', 'Severe')`,
    ),
    check(
      'scan_records_sync_status_check',
      sql`${table.syncStatus} in ('local_only', 'pending', 'syncing', 'synced', 'failed')`,
    ),
    check(
      'scan_records_image_size_check',
      sql`${table.imageSizeBytes} is null or ${table.imageSizeBytes} >= 0`,
    ),
    check(
      'scan_records_width_check',
      sql`${table.sourceWidth} is null or ${table.sourceWidth} > 0`,
    ),
    check(
      'scan_records_height_check',
      sql`${table.sourceHeight} is null or ${table.sourceHeight} > 0`,
    ),
    check(
      'scan_records_timings_check',
      sql`${table.preprocessMs} >= 0 and ${table.inferenceMs} >= 0 and ${table.totalMs} >= 0`,
    ),
    check(
      'scan_records_sync_attempt_count_check',
      sql`${table.syncAttemptCount} >= 0`,
    ),
  ],
);

export const scanClassScores = sqliteTable(
  'scan_class_scores',
  {
    scanRecordId: text('scan_record_id')
      .notNull()
      .references(() => scanRecords.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    score: real('score').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scanRecordId, table.label] }),
    check(
      'scan_class_scores_score_check',
      sql`${table.score} >= 0 and ${table.score} <= 1`,
    ),
  ],
);

export const scanSymptoms = sqliteTable(
  'scan_symptoms',
  {
    scanRecordId: text('scan_record_id')
      .notNull()
      .references(() => scanRecords.id, { onDelete: 'cascade' }),
    symptomKey: text('symptom_key').notNull(),
  },
  (table) => [primaryKey({ columns: [table.scanRecordId, table.symptomKey] })],
);

export const scanQualityWarnings = sqliteTable(
  'scan_quality_warnings',
  {
    scanRecordId: text('scan_record_id')
      .notNull()
      .references(() => scanRecords.id, { onDelete: 'cascade' }),
    warningKey: text('warning_key').notNull(),
  },
  (table) => [primaryKey({ columns: [table.scanRecordId, table.warningKey] })],
);

export type ScanRecordRow = typeof scanRecords.$inferSelect;
export type NewScanRecordRow = typeof scanRecords.$inferInsert;
export type ScanClassScoreRow = typeof scanClassScores.$inferSelect;
export type NewScanClassScoreRow = typeof scanClassScores.$inferInsert;
export type ScanSymptomRow = typeof scanSymptoms.$inferSelect;
export type NewScanSymptomRow = typeof scanSymptoms.$inferInsert;
export type ScanQualityWarningRow = typeof scanQualityWarnings.$inferSelect;
export type NewScanQualityWarningRow = typeof scanQualityWarnings.$inferInsert;
