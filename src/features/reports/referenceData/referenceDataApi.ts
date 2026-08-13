import { apiBaseUrl } from '@/config/env';
import {
  parseLocationReferenceData,
  ReferenceDataApiError,
  type LocationReferenceData,
  type LocationReferenceFetchResult,
} from '@/features/reports/referenceData/referenceDataTypes';

/**
 * Backend contract for the location reference lists (decisions D2/D3).
 *
 * The endpoint does not exist yet — this module defines the expected contract
 * and points the client at it. Until the endpoint answers, the service falls
 * back to the seeded static list (see nasugbuSeed.ts).
 *
 *   GET {apiBaseUrl}/api/v1/reference/locations
 *   Headers:
 *     Accept: application/json
 *     If-None-Match: <etag from the previous response>   (optional)
 *
 *   200 OK:
 *   {
 *     "version": "2026-08-13T00:00:00.000Z",  // opaque; MUST change when the
 *                                              // lists change (change detection)
 *     "etag": "\"v42\""                       // optional; echoed in ETag header
 *     "regions": [
 *       { "province": "Batangas", "municipalities": ["Nasugbu", "..."] }
 *     ],
 *     "barangays": ["Wawa", "Lumbangan", "..."]
 *   }
 *
 *   304 Not Modified: when the If-None-Match ETag still matches; the client
 *   keeps its cached lists.
 *
 *   401 Unauthorized: AUTH_REQUIRED (the endpoint is expected to be public,
 *   but the client handles the case where the server requires a session).
 *
 * The client treats `version` as the authoritative change signal and uses the
 * ETag purely as a bandwidth optimization. No auth token is sent: the list is
 * reference data, not submitter data.
 */
export const LOCATION_REFERENCE_PATH = '/api/v1/reference/locations';

const FETCH_TIMEOUT_MS = 20_000;

export interface FetchLocationReferenceOptions {
  etag?: string | null;
  signal?: AbortSignal;
  baseUrl?: string;
  now?: () => Date;
}

export async function fetchLocationReferenceData(
  options: FetchLocationReferenceOptions = {},
): Promise<LocationReferenceFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS,
  );
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(
      `${options.baseUrl ?? apiBaseUrl}${LOCATION_REFERENCE_PATH}`,
      {
        headers: {
          Accept: 'application/json',
          ...(options.etag ? { 'If-None-Match': options.etag } : {}),
        },
        signal,
      },
    );

    if (response.status === 304) {
      return { status: 'unchanged' };
    }
    if (response.status === 401 || response.status === 403) {
      throw new ReferenceDataApiError(
        'AUTH_REQUIRED',
        'The location reference list requires authentication.',
        response.status,
      );
    }
    if (!response.ok) {
      throw new ReferenceDataApiError(
        'NETWORK',
        `The location reference list returned HTTP ${response.status}.`,
        response.status,
      );
    }

    const body = await readJson(response);
    const etag = response.headers.get('ETag');
    const data: LocationReferenceData = parseLocationReferenceData(body, {
      etag,
      fetchedAt: (options.now ?? (() => new Date()))().toISOString(),
    });
    return { status: 'updated', data };
  } catch (error: unknown) {
    if (error instanceof ReferenceDataApiError) {
      throw error;
    }
    throw new ReferenceDataApiError(
      'NETWORK',
      'The location reference list could not be fetched.',
      null,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      'The location reference list is not valid JSON.',
      response.status,
    );
  }
}
