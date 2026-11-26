CREATE TABLE `farmer_advisories` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`remote_id` text NOT NULL,
	`headline_tl` text NOT NULL,
	`headline_en` text NOT NULL,
	`body_tl` text NOT NULL,
	`body_en` text NOT NULL,
	`published_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`downloaded_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `farmer_advisories_owner_remote_idx` ON `farmer_advisories` (`owner_identity`,`remote_id`);--> statement-breakpoint
CREATE INDEX `farmer_advisories_owner_published_idx` ON `farmer_advisories` (`owner_identity`,`published_at`);--> statement-breakpoint
CREATE TABLE `farmer_inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`scan_record_id` text NOT NULL,
	`scan_chain_id` text NOT NULL,
	`barangay` text NOT NULL,
	`landmark` text,
	`concern` text,
	`ai_label` text,
	`ai_confidence_percent` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`remote_id` text,
	`remote_status` text,
	`replies_json` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_sync_attempt_at` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "farmer_inquiries_sync_status_check" CHECK("farmer_inquiries"."sync_status" in ('local_only', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "farmer_inquiries_sync_attempt_count_check" CHECK("farmer_inquiries"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `farmer_inquiries_owner_created_idx` ON `farmer_inquiries` (`owner_identity`,`created_at`);--> statement-breakpoint
CREATE INDEX `farmer_inquiries_owner_status_idx` ON `farmer_inquiries` (`owner_identity`,`sync_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `farmer_inquiries_owner_chain_idx` ON `farmer_inquiries` (`owner_identity`,`scan_chain_id`);