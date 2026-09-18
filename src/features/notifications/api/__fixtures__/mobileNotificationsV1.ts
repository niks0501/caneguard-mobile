export const MOBILE_NOTIFICATIONS_V1_FIXTURE = {
  data: [
    {
      id: '4e04321c-a879-423f-875d-4cdce5e028a6',
      event_type: 'field_validation_assigned',
      title: 'Field validation assigned',
      message: 'CG-2026-0001 was assigned to you for a field visit by 2026-08-20.',
      case: {
        uuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
        reference_code: 'CG-2026-0001',
      },
      assignment_uuid: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
      content: 'Visit the farm and record the observed symptoms before submitting the report.',
      advisory: {
        uuid: '2eaf6f1b-1c44-4f9b-95f2-7c8c682c2b5f',
        code: 'CG-ADVISORY-001',
        title: 'Inspect affected leaves',
        content: 'Inspect the affected leaves and capture clear evidence during the visit.',
        status: 'validated',
        selected_at: '2026-08-13T11:55:00.000Z',
      },
      is_read: false,
      read_at: null,
      created_at: '2026-08-13T12:00:00.000Z',
    },
  ],
  links: { next: null },
  meta: { per_page: 100 },
  sync: { before: '2026-08-13T12:05:00.000Z' },
} as const;
