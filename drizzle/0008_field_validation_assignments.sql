CREATE TABLE `field_validation_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`report_uuid` text NOT NULL,
	`report_client_uuid` text NOT NULL,
	`reference_code` text NOT NULL,
	`submitter_uuid` text NOT NULL,
	`submitter_name` text NOT NULL,
	`assignee_uuid` text NOT NULL,
	`assignee_name` text NOT NULL,
	`submitter_is_assignee` integer NOT NULL,
	`target_visit_date` text,
	`field_validation_state` text NOT NULL,
	`assigned_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`cached_at` text NOT NULL,
	`barangay` text NOT NULL,
	`province` text,
	`municipality` text,
	`farmer_or_farm_owner_name` text,
	`affected_area_hectares` real,
	`affected_portion_percent` real,
	`captured_at` text NOT NULL,
	`observed_at` text,
	`submitted_at` text NOT NULL,
	`predicted_label` text NOT NULL,
	`confidence` real NOT NULL,
	CONSTRAINT `field_validation_assignments_state_check` CHECK (`field_validation_state` in ('unassigned', 'assigned', 'in_progress', 'completed')),
	CONSTRAINT `field_validation_assignments_confidence_check` CHECK (`confidence` >= 0 and `confidence` <= 1),
	CONSTRAINT `field_validation_assignments_area_check` CHECK (`affected_area_hectares` is null or `affected_area_hectares` >= 0),
	CONSTRAINT `field_validation_assignments_portion_check` CHECK (`affected_portion_percent` is null or (`affected_portion_percent` >= 0 and `affected_portion_percent` <= 100))
);
--> statement-breakpoint
CREATE INDEX `field_validation_assignments_owner_updated_at_idx` ON `field_validation_assignments` (`owner_identity`,`updated_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `field_validation_assignments_report_uuid_unique` ON `field_validation_assignments` (`report_uuid`);
