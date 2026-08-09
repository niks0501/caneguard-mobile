CREATE TABLE `field_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`scan_record_id` text NOT NULL,
	`authoring_state` text DEFAULT 'draft' NOT NULL,
	`farmer_or_farm_owner_name` text,
	`province` text DEFAULT 'Batangas' NOT NULL,
	`municipality` text DEFAULT 'Nasugbu' NOT NULL,
	`barangay` text,
	`submitter_identity` text,
	`submitter_role` text,
	`final_latitude` real,
	`final_longitude` real,
	`location_source` text,
	`gps_accuracy` real,
	`gps_attempt_latitude` real,
	`gps_attempt_longitude` real,
	`gps_attempt_accuracy` real,
	`gps_attempted_at` text,
	`manual_location_selected_at` text,
	`observed_at` text NOT NULL,
	`submitted_at` text,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	`remote_id` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`scan_record_id`) REFERENCES `scan_records`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "field_reports_authoring_state_check" CHECK("field_reports"."authoring_state" in ('draft', 'ready_for_submission', 'finalized')),
	CONSTRAINT "field_reports_sync_status_check" CHECK("field_reports"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "field_reports_draft_sync_check" CHECK("field_reports"."authoring_state" <> 'draft' or "field_reports"."sync_status" = 'local_only'),
	CONSTRAINT "field_reports_draft_submission_check" CHECK("field_reports"."authoring_state" <> 'draft' or "field_reports"."submitted_at" is null),
	CONSTRAINT "field_reports_location_check" CHECK((
        "field_reports"."location_source" is null and
        "field_reports"."final_latitude" is null and
        "field_reports"."final_longitude" is null and
        "field_reports"."gps_accuracy" is null
      ) or (
        "field_reports"."location_source" = 'gps' and
        "field_reports"."final_latitude" between -90 and 90 and
        "field_reports"."final_longitude" between -180 and 180 and
        "field_reports"."gps_accuracy" >= 0
      ) or (
        "field_reports"."location_source" = 'manual_map' and
        "field_reports"."final_latitude" between -90 and 90 and
        "field_reports"."final_longitude" between -180 and 180 and
        "field_reports"."gps_accuracy" is null
      )),
	CONSTRAINT "field_reports_gps_attempt_check" CHECK((
        "field_reports"."gps_attempt_latitude" is null and
        "field_reports"."gps_attempt_longitude" is null and
        "field_reports"."gps_attempt_accuracy" is null and
        "field_reports"."gps_attempted_at" is null
      ) or (
        "field_reports"."gps_attempt_latitude" between -90 and 90 and
        "field_reports"."gps_attempt_longitude" between -180 and 180 and
        "field_reports"."gps_attempt_accuracy" >= 0 and
        "field_reports"."gps_attempted_at" is not null
      )),
	CONSTRAINT "field_reports_sync_attempt_count_check" CHECK("field_reports"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `field_reports_scan_record_id_unique` ON `field_reports` (`scan_record_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_reports_remote_id_unique` ON `field_reports` (`remote_id`);--> statement-breakpoint
CREATE INDEX `field_reports_authoring_updated_at_idx` ON `field_reports` (`authoring_state`,`updated_at`);--> statement-breakpoint
CREATE INDEX `field_reports_sync_updated_at_idx` ON `field_reports` (`sync_status`,`updated_at`);