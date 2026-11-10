CREATE TABLE `sync_checkpoints` (
	`owner_identity` text NOT NULL,
	`feed` text NOT NULL,
	`version` text,
	`total` integer NOT NULL,
	`truncated` integer DEFAULT false NOT NULL,
	`page_count` integer NOT NULL,
	`sync_before` text NOT NULL,
	`fetched_at` text NOT NULL,
	PRIMARY KEY(`owner_identity`, `feed`),
	CONSTRAINT "sync_checkpoints_total_check" CHECK("sync_checkpoints"."total" >= 0),
	CONSTRAINT "sync_checkpoints_page_count_check" CHECK("sync_checkpoints"."page_count" >= 0)
);
