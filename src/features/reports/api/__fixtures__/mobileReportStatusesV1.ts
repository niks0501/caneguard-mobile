export const MOBILE_REPORT_STATUSES_V1_FIXTURE = {
  data: [
    {
      uuid: 'remote-1',
      client_uuid: 'client-1',
      reference_code: 'CG-100',
      review_status: 'for_field_validation',
      review_notes: 'Latest field note',
      reviewed_at: '2026-08-13T12:00:00.000Z',
      updated_at: '2026-08-13T12:00:00.000Z',
    },
  ],
  links: {
    first: 'http://127.0.0.1:8000/api/v1/mobile/reports/statuses?page=1',
    last: 'http://127.0.0.1:8000/api/v1/mobile/reports/statuses?page=1',
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    per_page: 100,
    to: 1,
    total: 1,
  },
  sync: {
    before: '2026-08-13T12:05:00.000Z',
  },
} as const;
