/**
 * Deterministic fixtures for the browser validation stub API.
 *
 * Everything here is fake: the accounts, the two assignments, the farmer's
 * saved checks and the dates. The fixtures stay stable for a whole run so a
 * validator sees the same Home and Activity each time.
 * `CANEGUARD_WEB_VALIDATE_TODAY=YYYY-MM-DD` pins the reference day; the default
 * is the local date the script starts on.
 */

const FAKE_ACCOUNT = {
  capabilities: [
    'report:submit',
    'report:status',
    'assignment:read',
    'assignment:complete',
    'notification:read',
  ],
  email: 'inspector@validation.invalid',
  name: 'Validation Inspector',
  role: 'field_reporter',
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
};

const FAKE_FARMER_ACCOUNT = {
  capabilities: [],
  email: 'farmer@validation.invalid',
  name: 'Validation Farmer',
  role: 'farmer',
  uuid: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
};

const FAKE_PASSWORD = 'validation-only';
const FAKE_TOKEN = 'validation-only-token';
const FAKE_FARMER_TOKEN = 'validation-only-farmer-token';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

const MIN_FIXTURE_DATE_KEY = '1970-01-01';
const FIXTURE_BACKSTEP_DAYS = 9;
const MIN_TODAY_KEY = addDays(MIN_FIXTURE_DATE_KEY, FIXTURE_BACKSTEP_DAYS);

function resolveTodayKey(env = process.env) {
  const pinned = env.CANEGUARD_WEB_VALIDATE_TODAY?.trim();
  if (pinned) {
    if (
      !DATE_KEY_PATTERN.test(pinned) ||
      pinned < MIN_TODAY_KEY ||
      !isCalendarDate(pinned)
    ) {
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

function buildUser(account = FAKE_ACCOUNT) {
  return { ...account };
}

const FIRST_CHECK_ID = 'a1111111-1111-4111-8111-111111111111';
const SECOND_CHECK_ID = 'b2222222-2222-4222-8222-222222222222';
const THIRD_CHECK_ID = 'c3333333-3333-4333-8333-333333333333';

/**
 * One plant checked three times: the first check and two follow-ups, oldest
 * first. The follow-ups carry the farmer's own words and link to the first
 * check, so date-ordered history, the retained note after deleting the first
 * check, and the singleton-history case can all be driven in a browser.
 */
function buildScanRecords({ today }) {
  return [
    {
      confidence: 0.91,
      createdAt: timestamp(addDays(today, -8), '01:00:00.000Z'),
      followsUpScanId: null,
      id: FIRST_CHECK_ID,
      imageAsset: 'dev-assets/model-fixtures/v1-mosaic.jpg',
      imageFileName: `${FIRST_CHECK_ID}.jpg`,
      personalNote: null,
      predictedLabel: 'mosaic',
    },
    {
      confidence: 0.83,
      createdAt: timestamp(addDays(today, -4), '02:00:00.000Z'),
      followsUpScanId: FIRST_CHECK_ID,
      id: SECOND_CHECK_ID,
      imageAsset: 'dev-assets/model-fixtures/v1-rust.jpg',
      imageFileName: `${SECOND_CHECK_ID}.jpg`,
      personalNote: 'Leaves look darker at the edges since the first check.',
      predictedLabel: 'rust',
    },
    {
      confidence: 0.76,
      createdAt: timestamp(addDays(today, -1), '03:00:00.000Z'),
      followsUpScanId: FIRST_CHECK_ID,
      id: THIRD_CHECK_ID,
      imageAsset: 'dev-assets/model-fixtures/v1-healthy.jpg',
      imageFileName: `${THIRD_CHECK_ID}.jpg`,
      personalNote: 'New pale streaks on the middle leaves.',
      predictedLabel: 'healthy',
    },
  ];
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
  FAKE_FARMER_ACCOUNT,
  FAKE_FARMER_TOKEN,
  FAKE_PASSWORD,
  FAKE_TOKEN,
  FIRST_CHECK_ID,
  SECOND_CHECK_ID,
  THIRD_CHECK_ID,
  addDays,
  buildAssignments,
  buildScanRecords,
  buildUser,
  emptyPage,
  resolveTodayKey,
};
