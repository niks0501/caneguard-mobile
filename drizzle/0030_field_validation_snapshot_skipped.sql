CREATE TABLE `field_validation_assignment_snapshots` (
	`owner_identity` text PRIMARY KEY NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "field_validation_assignment_snapshots_skipped_check" CHECK("field_validation_assignment_snapshots"."skipped_count" >= 0)
);
