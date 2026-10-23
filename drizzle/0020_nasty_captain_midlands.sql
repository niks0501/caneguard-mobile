CREATE TABLE `local_drafts` (
	`owner_identity` text NOT NULL,
	`kind` text NOT NULL,
	`draft_key` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner_identity`, `kind`, `draft_key`),
	CONSTRAINT "local_drafts_kind_check" CHECK("local_drafts"."kind" in ('scan', 'field_report', 'field_validation')),
	CONSTRAINT "local_drafts_version_check" CHECK("local_drafts"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX `local_drafts_owner_kind_updated_idx` ON `local_drafts` (`owner_identity`,`kind`,`updated_at`);