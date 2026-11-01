PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_field_surveys` (
	`client_uuid` text PRIMARY KEY NOT NULL,
	`owner_identity` text NOT NULL,
	`district_code` text NOT NULL,
	`waypoints_json` text NOT NULL,
	`polygon_json` text,
	`area_sqm` real,
	`affected_area_polygons_json` text,
	`affected_area_sqm` real,
	`measurement_provenance_json` text,
	`captured_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`remote_id` text,
	`field_errors_json` text,
	`sync_attempt_count` integer DEFAULT 0 NOT NULL,
	`last_sync_error_code` text,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "field_surveys_status_check" CHECK("__new_field_surveys"."status" in ('draft', 'pending', 'syncing', 'synced', 'failed')),
	CONSTRAINT "field_surveys_area_check" CHECK("__new_field_surveys"."area_sqm" is null or "__new_field_surveys"."area_sqm" > 0),
	CONSTRAINT "field_surveys_affected_area_check" CHECK("__new_field_surveys"."affected_area_sqm" is null or "__new_field_surveys"."affected_area_sqm" >= 0),
	CONSTRAINT "field_surveys_sync_attempt_check" CHECK("__new_field_surveys"."sync_attempt_count" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_field_surveys`("client_uuid", "owner_identity", "district_code", "waypoints_json", "polygon_json", "area_sqm", "affected_area_polygons_json", "affected_area_sqm", "measurement_provenance_json", "captured_at", "status", "remote_id", "field_errors_json", "sync_attempt_count", "last_sync_error_code", "last_synced_at", "created_at", "updated_at") SELECT "client_uuid", "owner_identity", "district_code", "waypoints_json", "polygon_json", "area_sqm", "affected_area_polygons_json", "affected_area_sqm", "measurement_provenance_json", "captured_at", "status", "remote_id", "field_errors_json", "sync_attempt_count", "last_sync_error_code", "last_synced_at", "created_at", "updated_at" FROM `field_surveys`;--> statement-breakpoint
DROP TABLE `field_surveys`;--> statement-breakpoint
ALTER TABLE `__new_field_surveys` RENAME TO `field_surveys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `field_surveys_owner_updated_idx` ON `field_surveys` (`owner_identity`,`updated_at`);--> statement-breakpoint
CREATE INDEX `field_surveys_owner_status_updated_idx` ON `field_surveys` (`owner_identity`,`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_surveys_remote_id_unique` ON `field_surveys` (`remote_id`);