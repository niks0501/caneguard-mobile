/**
 * Deterministic fixtures for the browser validation stub API.
 *
 * Everything here is fake: the account, the two assignments and the dates. The
 * fixtures stay stable for a whole run so a validator sees the same Home each
 * time. `CANEGUARD_WEB_VALIDATE_TODAY=YYYY-MM-DD` pins the reference day; the
 * default is the local date the script starts on.
 */

const FAKE_ACCOUNT = {
  email: 'inspector@validation.invalid',
  name: 'Validation Inspector',
  role: 'field_reporter',
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
};

const FAKE_PASSWORD = 'validation-only';
const FAKE_TOKEN = 'validation-only-token';

const DATE_KEY_PATTERN = /^(?!0000)\d{4}-\d{2}-\d{2}$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

function isCalendarDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateKey
  );
}

/** Local calendar date, matching the app's own "today" for a same-host run. */
function localDateKey(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day + days);
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-');
}

function resolveTodayKey(env = process.env) {
  const pinned = env.CANEGUARD_WEB_VALIDATE_TODAY?.trim();
  if (pinned) {
    if (!DATE_KEY_PATTERN.test(pinned) || !isCalendarDate(pinned)) {
      throw new Error('CANEGUARD_WEB_VALIDATE_TODAY must be a YYYY-MM-DD date.');
    }
    return pinned;
  }
  return localDateKey();
}

function timestamp(dateKey, time = '02:00:00.000Z') {
  return `${dateKey}T${time}`;
}

function buildAssignment({
  barangay,
  capturedAt,
  reportClientUuid,
  reportUuid,
  referenceCode,
  targetVisitDate,
  uuid,
}) {
  const assignedAt = timestamp(addDays(targetVisitDate, -7));
  const submitter = {
    name: 'Validation Submitter',
    uuid: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  };
  const assignee = { name: FAKE_ACCOUNT.name, uuid: FAKE_ACCOUNT.uuid };

  return {
    assignee,
    assigned_at: assignedAt,
    case: {
      affected_area_hectares: 1.5,
      affected_portion_percent: 25,
      barangay,
      captured_at: capturedAt,
      confidence: 0.92,
      farmer_or_farm_owner_name: 'Validation Farm',
      municipality: barangay,
      observed_at: null,
      predicted_label: 'mosaic',
      province: 'Batangas',
      submitted_at: capturedAt,
    },
    field_validation_state: 'assigned',
    previous_visit: null,
    reference_code: referenceCode,
    report_client_uuid: reportClientUuid,
    report_uuid: reportUuid,
    submitter,
    submitter_is_assignee: false,
    target_visit_date: targetVisitDate,
    updated_at: assignedAt,
    uuid,
  };
}

/**
 * Two active visits: one due today, one two days overdue. That is the Phase 3
 * scenario Home leads with: "One visit today. One is overdue."
 */
function buildAssignments({ today }) {
  const overdueDate = addDays(today, -2);

  return [
    buildAssignment({
      barangay: 'Mabini',
      capturedAt: timestamp(addDays(overdueDate, -3), '03:30:00.000Z'),
      referenceCode: 'CG-LAB-0002',
      reportClientUuid: 'c3d4e5f6-a7b8-4c9d-8e0f-2a3b4c5d6e7f',
      reportUuid: 'd4e5f6a7-b8c9-4d0e-9f1a-3b4c5d6e7f80',
      targetVisitDate: overdueDate,
      uuid: 'e5f6a7b8-c9d0-4e1f-8a2b-4c5d6e7f8091',
    }),
    buildAssignment({
      barangay: 'Balayan',
      capturedAt: timestamp(addDays(today, -1), '01:15:00.000Z'),
      referenceCode: 'CG-LAB-0001',
      reportClientUuid: 'f6a7b8c9-d0e1-4f2a-9b3c-5d6e7f8091a2',
      reportUuid: 'a7b8c9d0-e1f2-4a3b-8c4d-6e7f8091a2b3',
      targetVisitDate: today,
      uuid: 'b8c9d0e1-f2a3-4b4c-9d5e-7f8091a2b3c4',
    }),
  ];
}

function buildUser() {
  return { ...FAKE_ACCOUNT };
}

function emptyPage(syncBefore) {
  return {
    data: [],
    links: { next: null },
    meta: { per_page: 100 },
    sync: { before: syncBefore },
  };
}

module.exports = {
  FAKE_ACCOUNT,
  FAKE_PASSWORD,
  FAKE_TOKEN,
  addDays,
  buildAssignments,
  buildUser,
  emptyPage,
  resolveTodayKey,
};
