CREATE TABLE `scan_class_scores` (
	`scan_record_id` text NOT NULL,
	`label` text NOT NULL,
	`score` real NOT NULL,
	PRIMARY KEY(`scan_record_id`, `label`),
	FOREIGN KEY (`scan_record_id`) REFERENCES `scan_records`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "scan_class_scores_score_check" CHECK("scan_class_scores"."score" >= 0 and "scan_class_scores"."score" <= 1)
);
--> statement-breakpoint
CREATE TABLE `scan_quality_warnings` (
	`scan_record_id` text NOT NULL,
	`warning_key` text NOT NULL,
	PRIMARY KEY(`scan_record_id`, `warning_key`),
	FOREIGN KEY (`scan_record_id`) REFERENCES `scan_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scan_records` (
	`id` text PRIMARY KEY NOT NULL,
	`managed_image_uri` text NOT NULL,
	`image_mime_type` text,
	`image_size_bytes` integer,
	`image_source_type` text NOT NULL,
	`source_width` integer,
	`source_height` integer,
	`predicted_label` text NOT NULL,
	`confidence` real NOT NULL,
	`checklist_consistency` text NOT NULL,
	`reported_severity` text,
	`barangay` text,
	`model_version` text NOT NULL,
	`preprocess_ms` real NOT NULL,
	`inference_ms` real NOT NULL,
	`total_ms` real NOT NULL,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	`remote_id` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "scan_records_image_source_check" CHECK("scan_records"."image_source_type" in ('camera', 'gallery')),
	CONSTRAINT "scan_records_confidence_check" CHECK("scan_records"."confidence" >= 0 and "scan_records"."confidence" <= 1),
	CONSTRAINT "scan_records_consistency_check" CHECK("scan_records"."checklist_consistency" in ('consistent', 'inconsistent', 'not-applicable', 'not-enough-information')),
	CONSTRAINT "scan_records_severity_check" CHECK("scan_records"."reported_severity" is null or "scan_records"."reported_severity" in ('Mild', 'Moderate', 'Severe')),
	CONSTRAINT "scan_records_sync_status_check" CHECK("scan_records"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "scan_records_image_size_check" CHECK("scan_records"."image_size_bytes" is null or "scan_records"."image_size_bytes" >= 0),
	CONSTRAINT "scan_records_width_check" CHECK("scan_records"."source_width" is null or "scan_records"."source_width" > 0),
	CONSTRAINT "scan_records_height_check" CHECK("scan_records"."source_height" is null or "scan_records"."source_height" > 0),
	CONSTRAINT "scan_records_timings_check" CHECK("scan_records"."preprocess_ms" >= 0 and "scan_records"."inference_ms" >= 0 and "scan_records"."total_ms" >= 0),
	CONSTRAINT "scan_records_sync_attempt_count_check" CHECK("scan_records"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `scan_records_created_at_idx` ON `scan_records` (`created_at`);--> statement-breakpoint
CREATE INDEX `scan_records_label_created_at_idx` ON `scan_records` (`predicted_label`,`created_at`);--> statement-breakpoint
CREATE INDEX `scan_records_sync_created_at_idx` ON `scan_records` (`sync_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `scan_records_barangay_created_at_idx` ON `scan_records` (`barangay`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `scan_records_remote_id_unique` ON `scan_records` (`remote_id`);--> statement-breakpoint
CREATE TABLE `scan_symptoms` (
	`scan_record_id` text NOT NULL,
	`symptom_key` text NOT NULL,
	PRIMARY KEY(`scan_record_id`, `symptom_key`),
	FOREIGN KEY (`scan_record_id`) REFERENCES `scan_records`(`id`) ON UPDATE no action ON DELETE cascade
);
