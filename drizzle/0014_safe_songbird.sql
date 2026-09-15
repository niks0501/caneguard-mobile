PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_field_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`scan_record_id` text NOT NULL,
	`authoring_state` text DEFAULT 'draft' NOT NULL,
	`farmer_or_farm_owner_name` text,
	`province` text DEFAULT 'Batangas' NOT NULL,
	`municipality` text DEFAULT 'Nasugbu' NOT NULL,
	`barangay` text,
	`sugarcane_variety` text,
	`crop_age` text,
	`cane_class` text,
	`affected_area_hectares` real,
	`affected_area_measurement` text,
	`affected_portion_percent` real,
	`affected_portion_measurement` text,
	`field_notes` text,
	`mismatch_reported` integer,
	`reporter_suspected_condition` text,
	`reporter_observation_text` text,
	`submitter_identity` text,
	`submitter_role` text,
	`final_latitude` real,
	`final_longitude` real,
	`location_source` text,
	`location_unavailable_reason` text,
	`gps_accuracy` real,
	`gps_attempt_latitude` real,
	`gps_attempt_longitude` real,
	`gps_attempt_accuracy` real,
	`gps_attempted_at` text,
	`gps_capture_outcome` text,
	`gps_outcome_recorded_at` text,
	`manual_location_selected_at` text,
	`observed_at` text NOT NULL,
	`submitted_at` text,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	`remote_id` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`authority_status_raw` text,
	`authority_reference_code` text,
	`authority_feedback` text,
	`authority_reviewed_at` text,
	`authority_updated_at` text,
	`authority_fetched_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`scan_record_id`) REFERENCES `scan_records`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "field_reports_authoring_state_check" CHECK("__new_field_reports"."authoring_state" in ('draft', 'ready_for_submission', 'finalized')),
	CONSTRAINT "field_reports_sync_status_check" CHECK("__new_field_reports"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "field_reports_draft_sync_check" CHECK("__new_field_reports"."authoring_state" <> 'draft' or "__new_field_reports"."sync_status" = 'local_only'),
	CONSTRAINT "field_reports_draft_submission_check" CHECK("__new_field_reports"."authoring_state" <> 'draft' or "__new_field_reports"."submitted_at" is null),
	CONSTRAINT "field_reports_location_check" CHECK((
        "__new_field_reports"."location_source" is null and
        "__new_field_reports"."final_latitude" is null and
        "__new_field_reports"."final_longitude" is null and
        "__new_field_reports"."gps_accuracy" is null
      ) or (
        "__new_field_reports"."location_source" = 'gps' and
        "__new_field_reports"."final_latitude" between -90 and 90 and
        "__new_field_reports"."final_longitude" between -180 and 180 and
        "__new_field_reports"."gps_accuracy" >= 0
      ) or (
        "__new_field_reports"."location_source" = 'manual_map' and
        "__new_field_reports"."final_latitude" between -90 and 90 and
        "__new_field_reports"."final_longitude" between -180 and 180 and
        "__new_field_reports"."gps_accuracy" is null
      ) or (
        "__new_field_reports"."location_source" = 'unavailable' and
        "__new_field_reports"."final_latitude" is null and
        "__new_field_reports"."final_longitude" is null and
        "__new_field_reports"."gps_accuracy" is null and
        "__new_field_reports"."location_unavailable_reason" is not null
      )),
	CONSTRAINT "field_reports_gps_attempt_check" CHECK((
        "__new_field_reports"."gps_attempt_latitude" is null and
        "__new_field_reports"."gps_attempt_longitude" is null and
        "__new_field_reports"."gps_attempt_accuracy" is null and
        "__new_field_reports"."gps_attempted_at" is null
      ) or (
        "__new_field_reports"."gps_attempt_latitude" between -90 and 90 and
        "__new_field_reports"."gps_attempt_longitude" between -180 and 180 and
        "__new_field_reports"."gps_attempt_accuracy" >= 0 and
        "__new_field_reports"."gps_attempted_at" is not null
      )),
	CONSTRAINT "field_reports_sync_attempt_count_check" CHECK("__new_field_reports"."sync_attempt_count" >= 0),
	CONSTRAINT "field_reports_affected_area_check" CHECK("__new_field_reports"."affected_area_hectares" is null or "__new_field_reports"."affected_area_hectares" > 0),
	CONSTRAINT "field_reports_affected_area_measurement_check" CHECK((
        "__new_field_reports"."affected_area_measurement" = 'measured' and "__new_field_reports"."affected_area_hectares" is not null
      ) or (
        "__new_field_reports"."affected_area_measurement" = 'not_measured' and "__new_field_reports"."affected_area_hectares" is null
      ) or (
        /* Legacy rows written before D-01 carry no explicit provenance. */
        "__new_field_reports"."affected_area_measurement" is null
      )),
	CONSTRAINT "field_reports_affected_portion_measurement_check" CHECK((
        "__new_field_reports"."affected_portion_measurement" = 'measured' and "__new_field_reports"."affected_portion_percent" is not null
      ) or (
        "__new_field_reports"."affected_portion_measurement" = 'not_measured' and "__new_field_reports"."affected_portion_percent" is null
      ) or (
        "__new_field_reports"."affected_portion_measurement" is null
      )),
	CONSTRAINT "field_reports_affected_portion_check" CHECK("__new_field_reports"."affected_portion_percent" is null or ("__new_field_reports"."affected_portion_percent" >= 0 and "__new_field_reports"."affected_portion_percent" <= 100))
);
--> statement-breakpoint
INSERT INTO `__new_field_reports`("id", "scan_record_id", "authoring_state", "farmer_or_farm_owner_name", "province", "municipality", "barangay", "sugarcane_variety", "crop_age", "cane_class", "affected_area_hectares", "affected_area_measurement", "affected_portion_percent", "affected_portion_measurement", "field_notes", "mismatch_reported", "reporter_suspected_condition", "reporter_observation_text", "submitter_identity", "submitter_role", "final_latitude", "final_longitude", "location_source", "location_unavailable_reason", "gps_accuracy", "gps_attempt_latitude", "gps_attempt_longitude", "gps_attempt_accuracy", "gps_attempted_at", "gps_capture_outcome", "gps_outcome_recorded_at", "manual_location_selected_at", "observed_at", "submitted_at", "sync_status", "remote_id", "sync_attempt_count", "last_sync_error_code", "last_sync_attempt_at", "last_synced_at", "authority_status_raw", "authority_reference_code", "authority_feedback", "authority_reviewed_at", "authority_updated_at", "authority_fetched_at", "created_at", "updated_at") SELECT "id", "scan_record_id", "authoring_state", "farmer_or_farm_owner_name", "province", "municipality", "barangay", "sugarcane_variety", "crop_age", "cane_class", "affected_area_hectares", NULL, "affected_portion_percent", NULL, "field_notes", "mismatch_reported", "reporter_suspected_condition", "reporter_observation_text", "submitter_identity", "submitter_role", "final_latitude", "final_longitude", "location_source", NULL, "gps_accuracy", "gps_attempt_latitude", "gps_attempt_longitude", "gps_attempt_accuracy", "gps_attempted_at", "gps_capture_outcome", "gps_outcome_recorded_at", "manual_location_selected_at", "observed_at", "submitted_at", "sync_status", "remote_id", "sync_attempt_count", "last_sync_error_code", "last_sync_attempt_at", "last_synced_at", "authority_status_raw", "authority_reference_code", "authority_feedback", "authority_reviewed_at", "authority_updated_at", "authority_fetched_at", "created_at", "updated_at" FROM `field_reports`;--> statement-breakpoint
DROP TABLE `field_reports`;--> statement-breakpoint
ALTER TABLE `__new_field_reports` RENAME TO `field_reports`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `field_reports_scan_record_id_unique` ON `field_reports` (`scan_record_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_reports_remote_id_unique` ON `field_reports` (`remote_id`);--> statement-breakpoint
CREATE INDEX `field_reports_authoring_updated_at_idx` ON `field_reports` (`authoring_state`,`updated_at`);--> statement-breakpoint
CREATE INDEX `field_reports_sync_updated_at_idx` ON `field_reports` (`sync_status`,`updated_at`);