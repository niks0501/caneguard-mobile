import type { Event } from '@sentry/react-native';

import {
  REDACTED,
  redactFieldDataText,
  redactUrlQuery,
  scrubSentryBreadcrumb,
  scrubSentryData,
  scrubSentryEvent,
} from '../scrubSentryPayload';

describe('scrubSentryData', () => {
  it('deletes field data and credential keys while keeping operational keys', () => {
    const scrubbed = scrubSentryData({
      farmerOrFarmOwnerName: 'Asha',
      farmer_name: 'Asha',
      fullName: 'Asha Rao',
      gpsAccuracy: 4,
      latitude: 12.9716,
      longitude: 77.5946,
      position: { latitude: 12.9716, longitude: 77.5946 },
      photoUri: 'file:///data/user/0/com.niks0501.caneguard/files/scans/1.jpg',
      image_uri: 'file:///data/user/0/com.niks0501.caneguard/files/scans/2.jpg',
      thumbnail: 'file:///thumb.png',
      notes: 'Ring the bell twice',
      description: 'Reddish lesions near the midrib',
      accessToken: 'unused',
      storageErrorCode: 'IMAGE_DELETE_FAILED',
      workspace: 'field-42',
      httpStatus: 500,
    });

    expect(scrubbed).toEqual({
      storageErrorCode: 'IMAGE_DELETE_FAILED',
      workspace: 'field-42',
      httpStatus: 500,
    });
  });

  it('redacts resource URIs, image paths, and coordinate pairs inside free text', () => {
    expect(
      scrubSentryData({
        detail:
          'Saved file:///data/scans/leaf.jpg from ph://asset-id and 12.9716,77.5946',
      }),
    ).toEqual({
      detail: `Saved ${REDACTED} from ${REDACTED} and ${REDACTED}`,
    });
  });

  it('drops query strings from nested URLs and keeps the useful path', () => {
    expect(
      scrubSentryData({
        breadcrumbs: [
          {
            detail:
              'https://api.example.test/api/v2/mobile/reports/9?farmer=Asha#notes',
          },
        ],
      }),
    ).toEqual({
      breadcrumbs: [
        { detail: 'https://api.example.test/api/v2/mobile/reports/9' },
      ],
    });
  });

  it('keeps harmless nested records and primitives', () => {
    expect(
      scrubSentryData({
        device: { name: 'Pixel 8', os: 'Android 15' },
        attempts: [1, 2, 3],
        retryable: true,
        nextRetryAt: null,
      }),
    ).toEqual({
      device: { name: 'Pixel 8', os: 'Android 15' },
      attempts: [1, 2, 3],
      retryable: true,
      nextRetryAt: null,
    });
  });

  it('cuts cycles and over-deep payloads instead of walking them forever', () => {
    const cyclic: Record<string, unknown> = { storageErrorCode: 'X' };
    cyclic.self = cyclic;

    expect(scrubSentryData(cyclic)).toEqual({
      storageErrorCode: 'X',
      self: REDACTED,
    });

    let deep: Record<string, unknown> = { storageErrorCode: 'X' };
    for (let depth = 0; depth < 15; depth += 1) {
      deep = { nested: deep };
    }
    expect(JSON.stringify(scrubSentryData(deep))).toContain(REDACTED);
  });

  it('replaces class instances that could hide field data', () => {
    class FieldReportDraft {
      farmerName = 'Asha';
    }

    expect(scrubSentryData({ draft: new FieldReportDraft() })).toEqual({
      draft: REDACTED,
    });
  });
});

describe('redactFieldDataText', () => {
  it('leaves ordinary text untouched', () => {
    expect(redactFieldDataText('Report saved locally.')).toBe(
      'Report saved locally.',
    );
  });

  it('redacts a bare document URI', () => {
    expect(
      redactFieldDataText(
        'file:///data/user/0/com.niks0501.caneguard/files/scans/1.jpg',
      ),
    ).toBe(REDACTED);
  });

  it('redacts embedded data URIs, image extensions, and coordinates', () => {
    expect(
      redactFieldDataText(
        'image data:image/png;base64,AAAA plus /scans/leaf.jpeg at 8.5241, 76.9366',
      ),
    ).toBe(`image ${REDACTED} plus ${REDACTED} at ${REDACTED}`);
  });
});

describe('redactUrlQuery', () => {
  it('keeps origin and path but drops query and fragment', () => {
    expect(
      redactUrlQuery('https://api.example.test/v2/reports?id=7#section'),
    ).toBe('https://api.example.test/v2/reports');
  });

  it('drops the query of a relative URL', () => {
    expect(redactUrlQuery('/v2/reports?id=7')).toBe('/v2/reports');
  });

  it('redacts a device resource reference', () => {
    expect(redactUrlQuery('file:///data/scans/1.jpg')).toBe(REDACTED);
  });
});

describe('scrubSentryBreadcrumb', () => {
  it('drops console breadcrumbs because their text is arbitrary app output', () => {
    expect(
      scrubSentryBreadcrumb({
        category: 'console',
        level: 'error',
        message: 'Report for Asha is incomplete',
      }),
    ).toBeNull();
  });

  it('scrubs an http breadcrumb instead of dropping it', () => {
    expect(
      scrubSentryBreadcrumb({
        category: 'http',
        level: 'error',
        message: 'POST https://api.example.test/v2/reports?farmer=Asha failed',
        data: {
          url: 'https://api.example.test/v2/reports?farmer=Asha',
          method: 'POST',
          status_code: 500,
          latitude: 12.9716,
        },
      }),
    ).toEqual({
      category: 'http',
      level: 'error',
      message: `POST https://api.example.test/v2/reports failed`,
      data: {
        url: 'https://api.example.test/v2/reports',
        method: 'POST',
        status_code: 500,
      },
    });
  });
});

describe('scrubSentryEvent', () => {
  it('removes identity and request data', () => {
    const event: Event = {
      user: { id: 'submitter-uuid', email: 'asha@example.test' },
      request: {
        url: 'https://api.example.test/v2/reports?farmer=Asha',
        headers: { Authorization: 'Bearer secret' },
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request).toBeUndefined();
  });

  it('scrubs extra, contexts, tags, and exception messages', () => {
    const event: Event = {
      extra: {
        farmerOrFarmOwnerName: 'Asha',
        photoUri: 'file:///data/scans/leaf.jpg',
        storageErrorCode: 'DATABASE_OPEN_FAILED',
      },
      contexts: {
        device: { name: 'Pixel 8', family: 'Pixel' },
        fieldFix: { latitude: 12.9716, longitude: 77.5946 },
      },
      tags: {
        gpsAccuracy: 4,
        syncStage: 'upload',
      },
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Failed to store file:///data/scans/leaf.jpg',
            stacktrace: {
              frames: [
                { filename: 'app:///index.bundle', function: 'saveReport' },
              ],
            },
          },
        ],
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.extra).toEqual({
      storageErrorCode: 'DATABASE_OPEN_FAILED',
    });
    expect(scrubbed.contexts).toEqual({
      device: { name: 'Pixel 8', family: 'Pixel' },
      fieldFix: {},
    });
    expect(scrubbed.tags).toEqual({ syncStage: 'upload' });
    expect(scrubbed.exception?.values?.[0]?.value).toBe(
      `Failed to store ${REDACTED}`,
    );
  });

  it('keeps stack frames so crashes stay actionable', () => {
    const frames = [
      { filename: 'app:///index.bundle', function: 'saveReport' },
      { filename: 'app:///index.bundle', function: 'onPress' },
    ];
    const event: Event = {
      exception: { values: [{ type: 'Error', value: 'boom', stacktrace: { frames } }] },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames).toEqual(frames);
  });

  it('drops console breadcrumbs and keeps scrubbed http breadcrumbs', () => {
    const event: Event = {
      breadcrumbs: [
        { category: 'console', message: 'Report for Asha is incomplete' },
        {
          category: 'http',
          data: {
            url: 'https://api.example.test/v2/reports?farmer=Asha',
            status_code: 200,
          },
        },
      ],
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.breadcrumbs).toEqual([
      {
        category: 'http',
        data: {
          url: 'https://api.example.test/v2/reports',
          status_code: 200,
        },
      },
    ]);
  });
});
