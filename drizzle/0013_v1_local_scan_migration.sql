-- Model V1 deliberately removes unsynchronized V0 local work. A report with
-- server synchronization evidence is retained with its scan; this migration
-- never deletes a server-side report or its local synchronized mirror.
ALTER TABLE `scan_records` ADD `decision_support_wording` text NOT NULL DEFAULT 'Possible result only. This output does not confirm a disease.';

CREATE TEMP TABLE `_caneguard_v0_scan_records_to_delete` (
  `id` text PRIMARY KEY NOT NULL
);

INSERT INTO `_caneguard_v0_scan_records_to_delete` (`id`)
SELECT `scan_records`.`id`
FROM `scan_records`
WHERE `scan_records`.`model_version` = 'v0.1-baseline'
  AND NOT EXISTS (
    SELECT 1
    FROM `field_reports`
    WHERE `field_reports`.`scan_record_id` = `scan_records`.`id`
      AND (
        `field_reports`.`sync_status` = 'synced'
        OR `field_reports`.`remote_id` IS NOT NULL
        OR `field_reports`.`last_synced_at` IS NOT NULL
      )
  );

-- Delete every local child explicitly instead of relying on foreign-key cascade.
DELETE FROM `field_reports`
WHERE `scan_record_id` IN (
  SELECT `id` FROM `_caneguard_v0_scan_records_to_delete`
);
DELETE FROM `scan_class_scores`
WHERE `scan_record_id` IN (
  SELECT `id` FROM `_caneguard_v0_scan_records_to_delete`
);
DELETE FROM `scan_symptoms`
WHERE `scan_record_id` IN (
  SELECT `id` FROM `_caneguard_v0_scan_records_to_delete`
);
DELETE FROM `scan_quality_warnings`
WHERE `scan_record_id` IN (
  SELECT `id` FROM `_caneguard_v0_scan_records_to_delete`
);
DELETE FROM `scan_records`
WHERE `id` IN (
  SELECT `id` FROM `_caneguard_v0_scan_records_to_delete`
);

DROP TABLE `_caneguard_v0_scan_records_to_delete`;
