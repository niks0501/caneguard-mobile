CREATE TABLE `field_surveys` (
	`client_uuid` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`district_code` text NOT NULL,
	`waypoints_json` text NOT NULL,
	`polygon_json` text,
	`area_sqm` real,
	`captured_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`remote_id` text,
	`field_errors_json` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "field_surveys_status_check" CHECK("field_surveys"."status" in ('draft', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "field_surveys_area_check" CHECK("field_surveys"."area_sqm" is null or "field_surveys"."area_sqm" > 0),
	CONSTRAINT "field_surveys_sync_attempt_check" CHECK("field_surveys"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `field_surveys_owner_updated_idx` ON `field_surveys` (`owner_identity`,`updated_at`);--> statement-breakpoint
CREATE INDEX `field_surveys_owner_status_updated_idx` ON `field_surveys` (`owner_identity`,`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_surveys_remote_id_unique` ON `field_surveys` (`remote_id`);