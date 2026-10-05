import type { CaneGuardDatabase } from '@/database/database';
import type { SurveyPolygon } from '@/features/surveys/domain/fieldSurvey';
import { findOwnedFieldSurvey, updateFieldSurveySyncResult } from '@/features/surveys/data/fieldSurveyRepository';
import { FieldSurveyValidationError, submitFieldSurvey } from '@/features/surveys/api/fieldSurveysApi';

export type FieldSurveySyncResult =
  | { status: 'synced'; remoteId: string }
  | { status: 'needs_correction'; fieldErrors: Record<string, string[]> }
  | { status: 'failed'; message: string }
  | { status: 'auth_required' };

export async function syncFieldSurvey(options: {
  clientUuid: string;
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string | null;
}): Promise<FieldSurveySyncResult> {
  if (!options.token?.trim()) return { status: 'auth_required' };
  const row = findOwnedFieldSurvey(options.database, options.clientUuid, options.ownerIdentity);
  if (!row?.polygonJson || row.areaSqm === null || row.status === 'draft') {
    return { status: 'failed', message: 'Finish and save a valid boundary before syncing.' };
  }
  if (row.status === 'synced' && row.remoteId) return { status: 'synced', remoteId: row.remoteId };

  updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, { status: 'syncing' });
  try {
    const response = await submitFieldSurvey({
      client_uuid: row.clientUuid,
      polygon: JSON.parse(row.polygonJson) as SurveyPolygon,
      area_sqm: row.areaSqm,
      captured_at: row.capturedAt,
      district_code: row.districtCode,
    }, options.token);
    updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, {
      remoteId: response.id,
      status: 'synced',
      fieldErrors: null,
    });
    return { status: 'synced', remoteId: response.id };
  } catch (error: unknown) {
    if (error instanceof FieldSurveyValidationError) {
      updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, {
        fieldErrors: error.fieldErrors,
        lastSyncErrorCode: 'VALIDATION_FAILED',
        status: 'failed',
      });
      return { status: 'needs_correction', fieldErrors: error.fieldErrors };
    }
    const message = error instanceof Error ? error.message : 'The survey could not sync.';
    updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, {
      lastSyncErrorCode: 'UPLOAD_FAILED',
      status: 'pending',
    });
    return { status: 'failed', message };
  }
}
