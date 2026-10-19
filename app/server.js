'use strict';
const http = require('http');
const os = require('os');

const PORT = 8080;
const VERSION = process.env.APP_VERSION || '1.0.0';
const STUDENT = process.env.STUDENT_ID || '02230123';
const BROKEN_HEALTH = process.env.BROKEN_HEALTH === 'true';
const FEATURE_PINNED = process.env.FEATURE_PINNED === 'true';
const startedAt = Date.now();

const baseNotices = [
  { id: 1, title: 'Semester registration', message: 'Semester registration is now open.' },
  { id: 2, title: 'Library hours', message: 'The library closes at 8 PM on weekdays.' },
  { id: 3, title: 'Student meeting', message: 'The student meeting is scheduled for Friday.' }
];

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  if (path === '/healthz') {
    if (BROKEN_HEALTH || Date.now() - startedAt < 5000) {
      return send(res, 503, { status: 'unhealthy', version: VERSION });
    }
    return send(res, 200, { status: 'healthy', version: VERSION });
  }

  if (path === '/version') {
    return send(res, 200, { version: VERSION, student: STUDENT, pod: os.hostname() });
  }

  if (path === '/notices') {
    let notices = baseNotices.map(n => ({ ...n }));
    let response = {};
    if (VERSION !== '1.0.0') {
      notices = notices.map(n => ({ ...n, category: n.id === 1 ? 'Academic' : 'General', pinned: n.id === 1 }));
      if (FEATURE_PINNED) notices.sort((a, b) => Number(b.pinned) - Number(a.pinned));
      response.pinnedFirst = FEATURE_PINNED;
    }
    return send(res, 200, { notices, ...response });
  }

  return send(res, 404, { error: 'Not found', endpoints: ['/notices', '/version', '/healthz'] });
});

server.listen(PORT, '0.0.0.0');
