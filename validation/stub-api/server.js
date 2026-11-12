/**
 * Deterministic stub API for the browser validation route.
 *
 * It exists so `npm run web:validate` can drive Home, Activity, Visits and the
 * farmer Check Again flow in a browser without a real backend, a real account
 * or real data. It answers the endpoints those screens read; anything else gets
 * an empty page. The only write it keeps is a validation image held in memory,
 * so a newly captured follow-up photo can be rendered until the run ends.
 *
 * The tokens, password and accounts in `fixtures.js` are fake and printed at
 * startup on purpose. Never point the app at this server with a real session.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const {
  FAKE_ACCOUNT,
  FAKE_FARMER_ACCOUNT,
  FAKE_FARMER_TOKEN,
  FAKE_PASSWORD,
  FAKE_TOKEN,
  buildAssignments,
  buildScanRecords,
  buildUser,
  emptyPage,
  resolveTodayKey,
} = require('./fixtures');

const REPO_ROOT = path.join(__dirname, '..', '..');
const VALIDATION_FILES_PATH = '/__validation__/files';
const SCAN_IMAGE_PREFIX = '/caneguard/scan-images/';
const SCAN_IMAGE_PATH_PATTERN =
  /^\/caneguard\/scan-images\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|img)$/;

const DEFAULT_STUB_API_HOST = '127.0.0.1';
const DEFAULT_STUB_API_PORT = 8210;
const LOGIN_PATH = '/api/v1/mobile/auth/login';
const LOGOUT_PATH = '/api/v1/mobile/auth/logout';
const ME_PATH = '/api/v1/mobile/auth/me';
const ASSIGNMENTS_PATH = '/api/v1/mobile/assignments';
const NOTIFICATIONS_PATH = '/api/v1/mobile/notifications';
const NOTIFICATIONS_READ_ALL_PATH = '/api/v1/mobile/notifications/read-all';
const SEEDED_OFFICE_NOTIFICATION = {
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  event_type: 'field_validation_assigned',
  title: 'Field validation assigned',
  message: 'A field validation assignment is ready.',
  case: {
    uuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
    reference_code: 'CG-LAB-0001',
  },
  assignment_uuid: 'b8c9d0e1-f2a3-4b4c-9d5e-7f8091a2b3c4',
  content: null,
  advisory: null,
  is_read: false,
  read_at: null,
  created_at: '2026-11-01T02:00:00.000Z',
};
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const ACCOUNT_BY_EMAIL = new Map([
  [FAKE_ACCOUNT.email, { account: FAKE_ACCOUNT, token: FAKE_TOKEN }],
  [
    FAKE_FARMER_ACCOUNT.email,
    { account: FAKE_FARMER_ACCOUNT, token: FAKE_FARMER_TOKEN },
  ],
]);
const ACCOUNT_BY_TOKEN = new Map(
  [...ACCOUNT_BY_EMAIL.values()].map(({ account, token }) => [token, account]),
);

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Accept, Authorization, Content-Type, X-XSRF-TOKEN',
  );
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  setCorsHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

function readBodyBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('The stub request body is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const raw = (await readBodyBuffer(req, MAX_BODY_BYTES)).toString('utf8');
  if (!raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('The stub request body is not JSON.');
  }
}

function authorizedAccount(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }
  return ACCOUNT_BY_TOKEN.get(header.slice('Bearer '.length)) ?? null;
}

function sendImage(res, body, contentType = 'image/jpeg') {
  setCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', body.length);
  res.end(body);
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function createRequestHandler({
  log = () => {},
  seedImageAssets = new Map(),
  syncBefore,
  validationFiles = new Map(),
  visits,
}) {
  return async function handleRequest(req, res) {
    const requestUrl = new URL(req.url ?? '/', 'http://stub.local');
    const pathname = requestUrl.pathname;
    log(`${req.method} ${pathname}`);

    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (pathname === VALIDATION_FILES_PATH && req.method === 'PUT') {
      const requestedPath = requestUrl.searchParams.get('path') ?? '';
      if (!SCAN_IMAGE_PATH_PATTERN.test(requestedPath)) {
        sendJson(res, 400, {
          code: 'VALIDATION_ERROR',
          message: 'The validation file path is outside the seeded image store.',
        });
        return;
      }
      let body;
      try {
        body = await readBodyBuffer(req, MAX_IMAGE_BYTES);
      } catch (error) {
        sendJson(res, 400, {
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }
      if (body.length === 0) {
        sendJson(res, 400, {
          code: 'VALIDATION_ERROR',
          message: 'The validation image is empty.',
        });
        return;
      }
      validationFiles.set(requestedPath, {
        body,
        contentType: req.headers['content-type'] ?? 'image/jpeg',
      });
      setCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (pathname.startsWith(SCAN_IMAGE_PREFIX) && req.method === 'GET') {
      const uploaded = validationFiles.get(pathname);
      if (uploaded) {
        sendImage(res, uploaded.body, uploaded.contentType);
        return;
      }
      const asset = seedImageAssets.get(pathname);
      if (asset) {
        try {
          sendImage(res, fs.readFileSync(path.join(REPO_ROOT, asset)));
          return;
        } catch {
          // Fall through to the normal not-found response.
        }
      }
      sendJson(res, 404, {
        code: 'NOT_FOUND',
        message: 'The validation image is not available.',
      });
      return;
    }

    if (pathname === LOGIN_PATH && req.method === 'POST') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        sendJson(res, 400, { code: 'VALIDATION_ERROR', message: error.message });
        return;
      }
      const email = isRecord(body) && typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';
      const password = isRecord(body) && typeof body.password === 'string'
        ? body.password
        : '';
      const entry = ACCOUNT_BY_EMAIL.get(email);
      if (!entry || password !== FAKE_PASSWORD) {
        sendJson(res, 401, {
          code: 'INVALID_CREDENTIALS',
          message: 'The email or password is incorrect.',
        });
        return;
      }
      sendJson(res, 200, {
        expires_at: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
        token: entry.token,
        token_type: 'Bearer',
        user: buildUser(entry.account),
      });
      return;
    }

    if (pathname === ME_PATH && req.method === 'GET') {
      const account = authorizedAccount(req);
      if (!account) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, { user: buildUser(account) });
      return;
    }

    if (pathname === LOGOUT_PATH && req.method === 'DELETE') {
      sendJson(res, 200, { message: 'The validation session ended.' });
      return;
    }

    if (pathname === ASSIGNMENTS_PATH && req.method === 'GET') {
      const account = authorizedAccount(req);
      if (!account) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, {
        data: account.role === 'field_reporter' ? visits : [],
        links: { next: null },
        meta: { per_page: 100 },
        sync: { before: syncBefore },
      });
      return;
    }

    if (pathname === NOTIFICATIONS_PATH && req.method === 'GET') {
      const account = authorizedAccount(req);
      if (!account) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, account.role === 'field_reporter'
        ? {
            data: [SEEDED_OFFICE_NOTIFICATION],
            links: { next: null },
            meta: { per_page: 100 },
            sync: { before: syncBefore, version: syncBefore, total: 1 },
          }
        : emptyPage(syncBefore));
      return;
    }

    if (pathname === NOTIFICATIONS_READ_ALL_PATH && req.method === 'POST') {
      if (!authorizedAccount(req)) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, { meta: { marked_count: 0, unread_count: 0 } });
      return;
    }

    // The read-only walkthrough also asks for feeds this stub does not seed
    // (report statuses, reference data). A well-formed empty page keeps those
    // screens quiet instead of inventing records.
    if (req.method === 'GET') {
      sendJson(res, 200, emptyPage(syncBefore));
      return;
    }

    sendJson(res, 404, {
      code: 'NOT_FOUND',
      message: 'The validation stub only seeds the read-only screens.',
    });
  };
}

/**
 * Starts the stub on an explicit port and resolves once it is listening.
 * Returns the bound base URL, the seeded fixture dates, and a close function.
 */
function startStubServer(options = {}) {
  const {
    host = DEFAULT_STUB_API_HOST,
    log = () => {},
    port = DEFAULT_STUB_API_PORT,
    today = resolveTodayKey(),
  } = options;
  const syncBefore = new Date().toISOString();
  const visits = buildAssignments({ today });
  const seedImageAssets = new Map(
    buildScanRecords({ today }).map((record) => [
      `${SCAN_IMAGE_PREFIX}${FAKE_FARMER_ACCOUNT.uuid}/${record.imageFileName}`,
      record.imageAsset,
    ]),
  );
  const validationFiles = new Map();
  const server = http.createServer(
    createRequestHandler({
      log,
      seedImageAssets,
      syncBefore,
      validationFiles,
      visits,
    }),
  );

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      resolve({
        baseUrl: `http://${host}:${boundPort}`,
        close: () =>
          new Promise((closed, failed) => {
            server.close((error) => (error ? failed(error) : closed()));
          }),
        server,
        syncBefore,
        today,
        validationFiles,
        visits,
      });
    });
  });
}

module.exports = {
  DEFAULT_STUB_API_HOST,
  DEFAULT_STUB_API_PORT,
  createRequestHandler,
  startStubServer,
};
