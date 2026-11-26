import { File } from 'expo-file-system';

import type { AerialAnalysisOutboxItem } from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import { parseAerialCheck } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import type { OfficeAerialCheck } from '@/features/assignments/domain/assignmentTypes';
import {
  isSupportedPhotoMimeType,
  isUuid,
} from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { MAX_AERIAL_PHOTO_BYTES } from '@/features/assignments/services/aerialPhotoStorage';
import {
  ApiHttpError,
  ApiTransportError,
  apiRequest,
} from '@/features/shared/api/apiClient';
import { SyncError } from '@/features/sync/errors/syncErrors';

export interface AerialUploadMapperDependencies {
  createImageFile?: (uri: string) => Blob;
  imageExists?: (uri: string) => boolean;
}

interface AerialUploadIdentity {
  client_uuid?: unknown;
  uuid?: unknown;
}

interface AerialUploadResponse {
  analysis?: AerialUploadIdentity;
  aerial_check?: unknown;
  data?: {
    analysis?: AerialUploadIdentity;
    aerial_check?: unknown;
  };
}

export interface UploadedAerialAnalysis {
  remoteId: string;
  aerialCheck: OfficeAerialCheck | null;
  hasAerialCheck: boolean;
}

export function mapAerialUploadToMultipart(
  item: AerialAnalysisOutboxItem,
  dependencies: AerialUploadMapperDependencies = {},
): FormData {
  const imageExists = dependencies.imageExists ?? ((uri: string) => new File(uri).exists);
  const createImageFile = dependencies.createImageFile ?? ((uri: string) => new File(uri));

  if (!isUuid(item.id) || !isUuid(item.assignmentId) || !isUuid(item.reportUuid)) {
    throw new SyncError('INVALID_LOCAL_RECORD', 'This queued drone photo record has an invalid identifier.');
  }
  if (!isSupportedPhotoMimeType(item.imageMimeType)) {
    throw new SyncError('INVALID_LOCAL_RECORD', 'The queued drone photo format is unsupported.');
  }
  if (!Number.isInteger(item.imageSizeBytes) || item.imageSizeBytes <= 0 || item.imageSizeBytes > MAX_AERIAL_PHOTO_BYTES) {
    throw new SyncError('INVALID_LOCAL_RECORD', 'The queued drone photo size is invalid.');
  }
  if (!imageExists(item.imageUri)) {
    throw new SyncError('IMAGE_MISSING', 'The saved drone photo is missing from this device.');
  }

  const image = createImageFile(item.imageUri);
  if (!(image instanceof Blob) && (typeof image !== 'object' || image === null)) {
    throw new SyncError('IMAGE_MISSING', 'The saved drone photo could not be opened.');
  }

  const form = new FormData();
  form.append('client_uuid', item.id);
  form.append('image', image);
  return form;
}

export async function uploadMobileAerialAnalysis(
  item: AerialAnalysisOutboxItem,
  token: string,
  form: FormData = mapAerialUploadToMultipart(item),
): Promise<UploadedAerialAnalysis> {
  let response: unknown;
  try {
    response = await apiRequest<unknown>(
      `/api/v1/mobile/assignments/${encodeURIComponent(item.assignmentId)}/aerial-analyses`,
      {
        method: 'POST',
        body: form,
        token,
        timeoutMs: 90_000,
      },
    );
  } catch (error: unknown) {
    if (error instanceof ApiHttpError && error.status === 409) {
      const existingRemoteId = readRemoteId(error.body);
      const submittedClientUuid = readSubmittedClientUuid(form);
      const existingClientUuid = readClientUuid(error.body);
      if (
        existingRemoteId &&
        submittedClientUuid !== null &&
        existingClientUuid?.toLowerCase() === submittedClientUuid.toLowerCase()
      ) {
        const parsed = readAerialCheck(error.body);
        return {
          remoteId: existingRemoteId,
          aerialCheck: parsed.aerialCheck,
          hasAerialCheck: parsed.hasAerialCheck,
        };
      }
    }
    throw error;
  }

  const remoteId = readRemoteId(response);
  if (!remoteId) {
    throw new ApiTransportError(
      'The aerial upload response did not include analysis.uuid.',
    );
  }

  const parsed = readAerialCheck(response);
  return {
    remoteId,
    aerialCheck: parsed.aerialCheck,
    hasAerialCheck: parsed.hasAerialCheck,
  };
}

function readRemoteId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as AerialUploadResponse;
  return readString(body.analysis?.uuid) ?? readString(body.data?.analysis?.uuid);
}

function readClientUuid(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as AerialUploadResponse;
  return readString(body.analysis?.client_uuid) ?? readString(body.data?.analysis?.client_uuid);
}

function readAerialCheck(value: unknown): {
  aerialCheck: OfficeAerialCheck | null;
  hasAerialCheck: boolean;
} {
  if (!value || typeof value !== 'object') {
    return { aerialCheck: null, hasAerialCheck: false };
  }
  const body = value as AerialUploadResponse;
  const raw =
    body.data && typeof body.data === 'object' && 'aerial_check' in body.data
      ? body.data.aerial_check
      : 'aerial_check' in body
        ? body.aerial_check
        : undefined;
  if (raw === undefined) {
    return { aerialCheck: null, hasAerialCheck: false };
  }
  try {
    return {
      aerialCheck: parseAerialCheck(raw),
      hasAerialCheck: true,
    };
  } catch {
    return { aerialCheck: null, hasAerialCheck: false };
  }
}

function readSubmittedClientUuid(form: FormData): string | null {
  const value = form.get('client_uuid');
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
