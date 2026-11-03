ALTER TABLE `scan_records` ADD `follows_up_scan_id` text REFERENCES scan_records(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `scan_records` ADD `personal_note` text;--> statement-breakpoint
CREATE INDEX `scan_records_follows_up_idx` ON `scan_records` (`follows_up_scan_id`);
