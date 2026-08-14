-- P2-01 Smart Field Report: additive nullable columns on field_reports.
--
-- Follows the additive ALTER TABLE convention of 0004_sour_namora.sql: no
-- table rebuild, no data rewrite, safe to apply on devices with existing
-- drafts. SQLite cannot add CHECK constraints through ALTER TABLE, so the
-- range constraints for affected_area_hectares (> 0) and
-- affected_portion_percent (0-100) are declared in src/database/schema.ts
-- and enforced by domain validation in
-- src/features/reports/domain/fieldReportValidation.ts before any write.
ALTER TABLE `field_reports` ADD `sugarcane_variety` text;--> statement-breakpoint
ALTER TABLE `field_reports` ADD `crop_age` text;--> statement-breakpoint
ALTER TABLE `field_reports` ADD `cane_class` text;--> statement-breakpoint
ALTER TABLE `field_reports` ADD `affected_area_hectares` real;--> statement-breakpoint
ALTER TABLE `field_reports` ADD `affected_portion_percent` real;--> statement-breakpoint
ALTER TABLE `field_reports` ADD `field_notes` text;
