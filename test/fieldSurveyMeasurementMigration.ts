import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Tests that build only the `field_surveys` table (no `field_reports`) cannot run the whole
 * measured-zero migration, which also rebuilds `field_reports`. This returns just its
 * `field_surveys.affected_area_measurement` column statement.
 */
export function fieldSurveyMeasurementMigration(): string {
  const sql = readFileSync(join(process.cwd(), 'drizzle', '0043_measured_zero_plot_area.sql'), 'utf8');
  const statement = sql
    .split('--> statement-breakpoint')
    .map((part) => part.trim())
    .find((part) => /^ALTER TABLE `field_surveys` ADD `affected_area_measurement`/.test(part));
  if (!statement) throw new Error('The field_surveys measurement column statement was not found in migration 0043.');
  return statement;
}

/**
 * The `field_reports` half of migration 0043, for test databases that have no `field_surveys`
 * table (the survey column statement would fail there).
 */
export function fieldReportMeasurementMigration(): string {
  const sql = readFileSync(join(process.cwd(), 'drizzle', '0043_measured_zero_plot_area.sql'), 'utf8');
  return sql
    .split('--> statement-breakpoint')
    .filter((part) => !part.includes('field_surveys'))
    .join('');
}
