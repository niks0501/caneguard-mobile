PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_field_validation_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`assignment_id` text NOT NULL,
	`report_uuid` text NOT NULL,
	`field_observation` text NOT NULL,
	`field_finding` text NOT NULL,
	`action_taken` text NOT NULL,
	`follow_up_outcome` text DEFAULT 'unable_to_determine' NOT NULL,
	`visited_at` text NOT NULL,
	`gps_outcome` text NOT NULL,
	`gps_attempted_at` text NOT NULL,
	`gps_latitude` real,
	`gps_longitude` real,
	`gps_accuracy` real,
	`fresh_photo_uri` text,
	`fresh_photo_mime_type` text,
	`fresh_photo_size_bytes` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`remote_id` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "field_validation_completions_gps_outcome_check" CHECK("__new_field_validation_completions"."gps_outcome" in ('resolved', 'low_accuracy', 'permission_denied', 'unavailable', 'error')),
	CONSTRAINT "field_validation_completions_follow_up_outcome_check" CHECK("__new_field_validation_completions"."follow_up_outcome" in ('improved', 'unchanged', 'worsened', 'unable_to_determine')),
	CONSTRAINT "field_validation_completions_sync_status_check" CHECK("__new_field_validation_completions"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "field_validation_completions_gps_latitude_check" CHECK("__new_field_validation_completions"."gps_latitude" is null or "__new_field_validation_completions"."gps_latitude" between -90 and 90),
	CONSTRAINT "field_validation_completions_gps_longitude_check" CHECK("__new_field_validation_completions"."gps_longitude" is null or "__new_field_validation_completions"."gps_longitude" between -180 and 180),
	CONSTRAINT "field_validation_completions_gps_accuracy_check" CHECK("__new_field_validation_completions"."gps_accuracy" is null or "__new_field_validation_completions"."gps_accuracy" >= 0),
	CONSTRAINT "field_validation_completions_photo_size_check" CHECK("__new_field_validation_completions"."fresh_photo_size_bytes" is null or "__new_field_validation_completions"."fresh_photo_size_bytes" > 0),
	CONSTRAINT "field_validation_completions_sync_attempt_count_check" CHECK("__new_field_validation_completions"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_field_validation_completions`("id", "owner_identity", "assignment_id", "report_uuid", "field_observation", "field_finding", "action_taken", "follow_up_outcome", "visited_at", "gps_outcome", "gps_attempted_at", "gps_latitude", "gps_longitude", "gps_accuracy", "fresh_photo_uri", "fresh_photo_mime_type", "fresh_photo_size_bytes", "sync_status", "remote_id", "sync_attempt_count", "last_sync_error_code", "last_sync_attempt_at", "last_synced_at", "created_at", "updated_at") SELECT "id", "owner_identity", "assignment_id", "report_uuid", "field_observation", "field_finding", "action_taken", 'unable_to_determine', "visited_at", "gps_outcome", "gps_attempted_at", "gps_latitude", "gps_longitude", "gps_accuracy", "fresh_photo_uri", "fresh_photo_mime_type", "fresh_photo_size_bytes", "sync_status", "remote_id", "sync_attempt_count", "last_sync_error_code", "last_sync_attempt_at", "last_synced_at", "created_at", "updated_at" FROM `field_validation_completions`;--> statement-breakpoint
DROP TABLE `field_validation_completions`;--> statement-breakpoint
ALTER TABLE `__new_field_validation_completions` RENAME TO `field_validation_completions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `field_validation_completions_owner_status_idx` ON `field_validation_completions` (`owner_identity`,`sync_status`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_validation_completions_owner_assignment_unique` ON `field_validation_completions` (`owner_identity`,`assignment_id`);