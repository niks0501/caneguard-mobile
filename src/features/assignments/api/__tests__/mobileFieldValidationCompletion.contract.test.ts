import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';

interface Contract {
  contract: string;
  version: number;
  wire: { method: string; path: string };
  fields: Record<string, { required: boolean; type: string; wire_type: string }>;
}

const contract = JSON.parse(
  readFileSync(join(process.cwd(), 'references/mobile-field-validation-completion-v1.json'), 'utf8'),
) as Contract;

const completion: FieldValidationCompletion = {
  id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
  ownerIdentity: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d',
  assignmentId: '01a04de2-280e-7140-bf56-3c98f98259d5',
  reportUuid: '01a04ddc-9d08-70f7-9b43-ca247cea1a60',
  fieldObservation: 'Fresh observation',
  fieldFinding: 'Fresh finding',
  actionTaken: 'Fresh action',
  visitedAt: '2026-09-02T04:05:06.123Z',
  gpsOutcome: 'unavailable',
  gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAccuracy: null,
  freshPhotoUri: null,
  freshPhotoMimeType: null,
  freshPhotoSizeBytes: null,
  syncStatus: 'pending',
  remoteId: null,
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
  createdAt: '2026-09-02T04:05:06.123Z',
  updatedAt: '2026-09-02T04:05:06.123Z',
};

class TestFormData {
  readonly parts: [string, unknown][] = [];
  append(name: string, value: unknown) {
    this.parts.push([name, value]);
  }
}

describe('mobile-field-validation-completion-v1 producer contract', () => {
  it('maps the required completion evidence to the web-owned contract fields', () => {
    const original = global.FormData;
    global.FormData = TestFormData as unknown as typeof FormData;
    try {
      const form = mapFieldValidationCompletionToMultipart({ completion });
      const parts = (form as unknown as TestFormData).parts;
      const names = parts.map(([name]) => name);
      expect(contract.contract).toBe('mobile-field-validation-completion-v1');
      expect(contract.version).toBe(1);
      expect(contract.wire).toMatchObject({
        method: 'POST',
        path: '/api/v1/mobile/assignments/{assignment}/completion',
      });
      expect(names).toEqual([
        'client_uuid',
        'field_observation',
        'field_finding',
        'action_taken',
        'visited_at',
        'gps_outcome',
        'gps_attempted_at',
      ]);
      expect(names.every((name) => name in contract.fields)).toBe(true);
      expect(Object.keys(contract.fields)).toEqual([
        'client_uuid',
        'field_observation',
        'field_finding',
        'action_taken',
        'visited_at',
        'gps_outcome',
        'gps_attempted_at',
        'gps_latitude',
        'gps_longitude',
        'gps_accuracy',
        'fresh_photo',
      ]);
    } finally {
      global.FormData = original;
    }
  });
});
