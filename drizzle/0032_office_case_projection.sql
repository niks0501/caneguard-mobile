ALTER TABLE `field_validation_assignments` ADD `office_case_json` text;--> statement-breakpoint
UPDATE `sync_checkpoints` SET `version` = NULL WHERE `feed` = 'assignments';
