ALTER TABLE `field_validation_assignments` ADD `aerial_check_json` text;--> statement-breakpoint
UPDATE `sync_checkpoints` SET `version` = NULL WHERE `feed` = 'assignments';
