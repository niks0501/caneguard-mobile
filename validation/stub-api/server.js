/**
 * Deterministic stub API for the browser validation route.
 *
 * It exists so `npm run web:validate` can drive Home, Activity and Visits in a
 * browser without a real backend, a real account or real data. It answers only
 * the endpoints those screens read during a read-only walkthrough; anything
 * else gets an empty page, and no write is ever persisted.
 *
 * The token, password and account in `fixtures.js` are fake and printed at
 * startup on purpose. Never point the app at this server with a real session.
 */

const http = require('node:http');

const {
  FAKE_ACCOUNT,
  FAKE_PASSWORD,
  FAKE_TOKEN,
  buildAssignments,
  buildUser,
  emptyPage,
  resolveTodayKey,
} = require('./fixtures');

const DEFAULT_STUB_API_HOST = '127.0.0.1';
const DEFAULT_STUB_API_PORT = 8210;
const LOGIN_PATH = '/api/v1/mobile/auth/login';
const LOGOUT_PATH = '/api/v1/mobile/auth/logout';
const ME_PATH = '/api/v1/mobile/auth/me';
const ASSIGNMENTS_PATH = '/api/v1/mobile/assignments';
const NOTIFICATIONS_PATH = '/api/v1/mobile/notifications';
const NOTIFICATIONS_READ_ALL_PATH = '/api/v1/mobile/notifications/read-all';
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 64 * 1024;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Accept, Authorization, Content-Type, X-XSRF-TOKEN',
  );
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  setCorsHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('The stub request body is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('The stub request body is not JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function isAuthorized(req) {
  return req.headers.authorization === `Bearer ${FAKE_TOKEN}`;
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function createRequestHandler({ log = () => {}, syncBefore, visits }) {
  return async function handleRequest(req, res) {
    const pathname = new URL(req.url ?? '/', 'http://stub.local').pathname;
    log(`${req.method} ${pathname}`);

    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.statusCode = 204;
      res.end();
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
      if (email !== FAKE_ACCOUNT.email || password !== FAKE_PASSWORD) {
        sendJson(res, 401, {
          code: 'INVALID_CREDENTIALS',
          message: 'The email or password is incorrect.',
        });
        return;
      }
      sendJson(res, 200, {
        expires_at: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
        token: FAKE_TOKEN,
        token_type: 'Bearer',
        user: buildUser(),
      });
      return;
    }

    if (pathname === ME_PATH && req.method === 'GET') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, { user: buildUser() });
      return;
    }

    if (pathname === LOGOUT_PATH && req.method === 'DELETE') {
      sendJson(res, 200, { message: 'The validation session ended.' });
      return;
    }

    if (pathname === ASSIGNMENTS_PATH && req.method === 'GET') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, {
        data: visits,
        links: { next: null },
        meta: { per_page: 100 },
        sync: { before: syncBefore },
      });
      return;
    }

    if (pathname === NOTIFICATIONS_PATH && req.method === 'GET') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, {
          code: 'UNAUTHENTICATED',
          message: 'The validation session is not signed in.',
        });
        return;
      }
      sendJson(res, 200, emptyPage(syncBefore));
      return;
    }

    if (pathname === NOTIFICATIONS_READ_ALL_PATH && req.method === 'POST') {
      if (!isAuthorized(req)) {
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
  const server = http.createServer(createRequestHandler({ log, syncBefore, visits }));

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
