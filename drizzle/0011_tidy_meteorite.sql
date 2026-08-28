CREATE TABLE `notifications_cache` (
	`id` text NOT NULL,
	`owner_identity` text NOT NULL,
	`event_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`case_uuid` text,
	`reference_code` text,
	`assignment_uuid` text,
	`is_read` integer NOT NULL,
	`read_at` text,
	`created_at` text,
	`cached_at` text NOT NULL,
	PRIMARY KEY(`owner_identity`, `id`),
	CONSTRAINT "notifications_cache_event_type_check" CHECK("notifications_cache"."event_type" <> ''),
	CONSTRAINT "notifications_cache_is_read_check" CHECK("notifications_cache"."is_read" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `notifications_cache_owner_created_at_idx` ON `notifications_cache` (`owner_identity`,`created_at`);