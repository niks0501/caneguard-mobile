CREATE TABLE `aerial_analysis_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`assignment_id` text NOT NULL,
	`report_uuid` text NOT NULL,
	`image_uri` text NOT NULL,
	`image_mime_type` text NOT NULL,
	`image_size_bytes` integer NOT NULL,
	`authorization_basis` text,
	`capabilities_verified_at` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`remote_id` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "aerial_analysis_outbox_sync_status_check" CHECK("aerial_analysis_outbox"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "aerial_analysis_outbox_image_size_check" CHECK("aerial_analysis_outbox"."image_size_bytes" > 0),
	CONSTRAINT "aerial_analysis_outbox_sync_attempt_count_check" CHECK("aerial_analysis_outbox"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `aerial_analysis_outbox_owner_status_idx` ON `aerial_analysis_outbox` (`owner_identity`,`sync_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `aerial_analysis_outbox_owner_assignment_idx` ON `aerial_analysis_outbox` (`owner_identity`,`assignment_id`,`created_at`);