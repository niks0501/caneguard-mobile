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

export const FIELD_REPORT_AUTHORING_STATES = [
  'draft',
  'ready_for_submission',
  'finalized',
] as const;

export type FieldReportAuthoringState =
  (typeof FIELD_REPORT_AUTHORING_STATES)[number];

export const FIELD_REPORT_LOCATION_SOURCES = ['gps', 'manual_map'] as const;

export type FieldReportLocationSource =
  (typeof FIELD_REPORT_LOCATION_SOURCES)[number];

export const GPS_CAPTURE_OUTCOMES = [
  'resolved',
  'low_accuracy',
  'permission_denied',
  'unavailable',
  'error',
] as const;

export type GpsCaptureOutcome = (typeof GPS_CAPTURE_OUTCOMES)[number];

export const FIELD_VALIDATION_ASSIGNMENT_STATES = [
  'unassigned',
  'assigned',
  'in_progress',
  'completed',
] as const;

export type FieldValidationAssignmentState =
  (typeof FIELD_VALIDATION_ASSIGNMENT_STATES)[number];

export const scanRecords = sqliteTable(
  'scan_records',
  {
    id: text('id').primaryKey(),
    managedImageUri: text('managed_image_uri').notNull(),
    imageMimeType: text('image_mime_type'),
    imageSizeBytes: integer('image_size_bytes'),
    submissionImageUri: text('submission_image_uri'),
    submissionImageMimeType: text('submission_image_mime_type'),
    submissionImageSizeBytes: integer('submission_image_size_bytes'),
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

export const fieldValidationAssignments = sqliteTable(
  'field_validation_assignments',
  {
    id: text('id').primaryKey(),
    ownerIdentity: text('owner_identity').notNull(),
    reportUuid: text('report_uuid').notNull(),
    reportClientUuid: text('report_client_uuid').notNull(),
    referenceCode: text('reference_code').notNull(),
    submitterUuid: text('submitter_uuid').notNull(),
    submitterName: text('submitter_name').notNull(),
    assigneeUuid: text('assignee_uuid').notNull(),
    assigneeName: text('assignee_name').notNull(),
    submitterIsAssignee: integer('submitter_is_assignee', { mode: 'boolean' }).notNull(),
    targetVisitDate: text('target_visit_date'),
    fieldValidationState: text('field_validation_state')
      .$type<FieldValidationAssignmentState>()
      .notNull(),
    assignedAt: text('assigned_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    cachedAt: text('cached_at').notNull(),
    barangay: text('barangay').notNull(),
    province: text('province'),
    municipality: text('municipality'),
    farmerOrFarmOwnerName: text('farmer_or_farm_owner_name'),
    affectedAreaHectares: real('affected_area_hectares'),
    affectedPortionPercent: real('affected_portion_percent'),
    capturedAt: text('captured_at').notNull(),
    observedAt: text('observed_at'),
    submittedAt: text('submitted_at').notNull(),
    predictedLabel: text('predicted_label').notNull(),
    confidence: real('confidence').notNull(),
  },
  (table) => [
    index('field_validation_assignments_owner_updated_at_idx').on(
      table.ownerIdentity,
      table.updatedAt,
    ),
    uniqueIndex('field_validation_assignments_report_uuid_unique').on(table.reportUuid),
    check(
      'field_validation_assignments_state_check',
      sql`${table.fieldValidationState} in ('unassigned', 'assigned', 'in_progress', 'completed')`,
    ),
    check(
      'field_validation_assignments_confidence_check',
      sql`${table.confidence} >= 0 and ${table.confidence} <= 1`,
    ),
    check(
      'field_validation_assignments_area_check',
      sql`${table.affectedAreaHectares} is null or ${table.affectedAreaHectares} >= 0`,
    ),
    check(
      'field_validation_assignments_portion_check',
      sql`${table.affectedPortionPercent} is null or (${table.affectedPortionPercent} >= 0 and ${table.affectedPortionPercent} <= 100)`,
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

export const fieldReports = sqliteTable(
  'field_reports',
  {
    id: text('id').primaryKey(),
    scanRecordId: text('scan_record_id')
      .notNull()
      .references(() => scanRecords.id, { onDelete: 'cascade' }),
    authoringState: text('authoring_state')
      .$type<FieldReportAuthoringState>()
      .notNull()
      .default('draft'),
    farmerOrFarmOwnerName: text('farmer_or_farm_owner_name'),
    province: text('province').notNull().default('Batangas'),
    municipality: text('municipality').notNull().default('Nasugbu'),
    barangay: text('barangay'),
    sugarcaneVariety: text('sugarcane_variety'),
    cropAge: text('crop_age'),
    caneClass: text('cane_class'),
    affectedAreaHectares: real('affected_area_hectares'),
    affectedPortionPercent: real('affected_portion_percent'),
    fieldNotes: text('field_notes'),
    mismatchReported: integer('mismatch_reported', { mode: 'boolean' }),
    reporterSuspectedCondition: text('reporter_suspected_condition'),
    reporterObservationText: text('reporter_observation_text'),
    submitterIdentity: text('submitter_identity'),
    submitterRole: text('submitter_role'),
    finalLatitude: real('final_latitude'),
    finalLongitude: real('final_longitude'),
    locationSource: text('location_source').$type<FieldReportLocationSource>(),
    gpsAccuracy: real('gps_accuracy'),
    gpsAttemptLatitude: real('gps_attempt_latitude'),
    gpsAttemptLongitude: real('gps_attempt_longitude'),
    gpsAttemptAccuracy: real('gps_attempt_accuracy'),
    gpsAttemptedAt: text('gps_attempted_at'),
    gpsCaptureOutcome: text('gps_capture_outcome').$type<GpsCaptureOutcome>(),
    gpsOutcomeRecordedAt: text('gps_outcome_recorded_at'),
    manualLocationSelectedAt: text('manual_location_selected_at'),
    observedAt: text('observed_at').notNull(),
    submittedAt: text('submitted_at'),
    syncStatus: text('sync_status')
      .$type<SyncStatus>()
      .notNull()
      .default('local_only'),
    remoteId: text('remote_id'),
    syncAttemptCount: integer('sync_attempt_count').notNull().default(0),
    lastSyncErrorCode: text('last_sync_error_code'),
    lastSyncAttemptAt: text('last_sync_attempt_at'),
    lastSyncedAt: text('last_synced_at'),
    authorityStatusRaw: text('authority_status_raw'),
    authorityReferenceCode: text('authority_reference_code'),
    authorityFeedback: text('authority_feedback'),
    authorityReviewedAt: text('authority_reviewed_at'),
    authorityUpdatedAt: text('authority_updated_at'),
    authorityFetchedAt: text('authority_fetched_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('field_reports_scan_record_id_unique').on(table.scanRecordId),
    uniqueIndex('field_reports_remote_id_unique').on(table.remoteId),
    index('field_reports_authoring_updated_at_idx').on(
      table.authoringState,
      table.updatedAt,
    ),
    index('field_reports_sync_updated_at_idx').on(
      table.syncStatus,
      table.updatedAt,
    ),
    check(
      'field_reports_authoring_state_check',
      sql`${table.authoringState} in ('draft', 'ready_for_submission', 'finalized')`,
    ),
    check(
      'field_reports_sync_status_check',
      sql`${table.syncStatus} in ('local_only', 'pending', 'syncing', 'synced', 'failed')`,
    ),
    check(
      'field_reports_draft_sync_check',
      sql`${table.authoringState} <> 'draft' or ${table.syncStatus} = 'local_only'`,
    ),
    check(
      'field_reports_draft_submission_check',
      sql`${table.authoringState} <> 'draft' or ${table.submittedAt} is null`,
    ),
    check(
      'field_reports_location_check',
      sql`(
        ${table.locationSource} is null and
        ${table.finalLatitude} is null and
        ${table.finalLongitude} is null and
        ${table.gpsAccuracy} is null
      ) or (
        ${table.locationSource} = 'gps' and
        ${table.finalLatitude} between -90 and 90 and
        ${table.finalLongitude} between -180 and 180 and
        ${table.gpsAccuracy} >= 0
      ) or (
        ${table.locationSource} = 'manual_map' and
        ${table.finalLatitude} between -90 and 90 and
        ${table.finalLongitude} between -180 and 180 and
        ${table.gpsAccuracy} is null
      )`,
    ),
    check(
      'field_reports_gps_attempt_check',
      sql`(
        ${table.gpsAttemptLatitude} is null and
        ${table.gpsAttemptLongitude} is null and
        ${table.gpsAttemptAccuracy} is null and
        ${table.gpsAttemptedAt} is null
      ) or (
        ${table.gpsAttemptLatitude} between -90 and 90 and
        ${table.gpsAttemptLongitude} between -180 and 180 and
        ${table.gpsAttemptAccuracy} >= 0 and
        ${table.gpsAttemptedAt} is not null
      )`,
    ),
    check(
      'field_reports_sync_attempt_count_check',
      sql`${table.syncAttemptCount} >= 0`,
    ),
    check(
      'field_reports_affected_area_check',
      sql`${table.affectedAreaHectares} is null or ${table.affectedAreaHectares} > 0`,
    ),
    check(
      'field_reports_affected_portion_check',
      sql`${table.affectedPortionPercent} is null or (${table.affectedPortionPercent} >= 0 and ${table.affectedPortionPercent} <= 100)`,
    ),
  ],
);

export type FieldValidationAssignmentRow = typeof fieldValidationAssignments.$inferSelect;
export type NewFieldValidationAssignmentRow = typeof fieldValidationAssignments.$inferInsert;
export type ScanRecordRow = typeof scanRecords.$inferSelect;
export type NewScanRecordRow = typeof scanRecords.$inferInsert;
export type ScanClassScoreRow = typeof scanClassScores.$inferSelect;
export type NewScanClassScoreRow = typeof scanClassScores.$inferInsert;
export type ScanSymptomRow = typeof scanSymptoms.$inferSelect;
export type NewScanSymptomRow = typeof scanSymptoms.$inferInsert;
export type ScanQualityWarningRow = typeof scanQualityWarnings.$inferSelect;
export type NewScanQualityWarningRow = typeof scanQualityWarnings.$inferInsert;
export type FieldReportRow = typeof fieldReports.$inferSelect;
export type NewFieldReportRow = typeof fieldReports.$inferInsert;
