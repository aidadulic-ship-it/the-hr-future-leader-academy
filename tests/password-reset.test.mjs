import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Platform } from '../src/platform.mjs';

const PW = 'a-long-password-123';
const setup = async () => {
  const p = new Platform();
  const admin = await p.register('admin@example.org', PW, true);
  const lead = await p.register('lead@example.org', PW);
  const student = await p.register('student@example.org', PW);
  const outsider = await p.register('outsider@example.org', PW);
  const request = p.requestCampus(lead.id, 'Testcampus');
  p.approveCampus(admin.id, request.id, 5);
  p.addMemberByEmail(lead.id, request.id, student.email, 'student');
  return { p, admin, lead, student, outsider, campusId: request.id };
};

test('Passwort-Reset: Plattform-Admin setzt ein Einmal-Passwort, altes Passwort und Sitzung sind ungültig', async () => {
  const { p, admin, student } = await setup();
  const before = await p.login(student.email, PW);
  const result = await p.resetPassword(admin.id, student.email);
  assert.ok(result.temporaryPassword.length >= 12);
  assert.equal(p.session(before.token), null);
  await assert.rejects(p.login(student.email, PW), /invalid_credentials/);
  const login = await p.login(student.email, result.temporaryPassword);
  assert.equal(login.user.mustChangePassword, true);
  assert.ok(!JSON.stringify(p.exportState()).includes(result.temporaryPassword));
});

test('Passwort-Reset: Campus-Leitung darf nur Mitglieder des eigenen Campus zurücksetzen', async () => {
  const { p, admin, lead, student, outsider } = await setup();
  const ok = await p.resetPassword(lead.id, student.email);
  assert.ok(ok.temporaryPassword);
  await assert.rejects(p.resetPassword(lead.id, outsider.email), /forbidden/);
  await assert.rejects(p.resetPassword(lead.id, admin.email), /forbidden/);
  await assert.rejects(p.resetPassword(lead.id, 'unbekannt@example.org'), /forbidden/);
});

test('Passwort-Reset: Lernende und Lehrende ohne Verwaltungsrolle dürfen nicht zurücksetzen', async () => {
  const { p, student, outsider, lead, campusId } = await setup();
  await assert.rejects(p.resetPassword(student.id, outsider.email), /forbidden/);
  p.addMemberByEmail(lead.id, campusId, outsider.email, 'teacher');
  await assert.rejects(p.resetPassword(outsider.id, student.email), /forbidden/);
});

test('Passwort ändern: prüft das aktuelle Passwort, die Länge und hebt den Änderungszwang auf', async () => {
  const { p, admin, student } = await setup();
  const { temporaryPassword } = await p.resetPassword(admin.id, student.email);
  await assert.rejects(p.changePassword(student.id, 'falsch-falsch-123', 'neues-passwort-456'), /invalid_credentials/);
  await assert.rejects(p.changePassword(student.id, temporaryPassword, 'kurz'), /invalid_password/);
  await p.changePassword(student.id, temporaryPassword, 'neues-passwort-456');
  await assert.rejects(p.login(student.email, temporaryPassword), /invalid_credentials/);
  const login = await p.login(student.email, 'neues-passwort-456');
  assert.equal(login.user.mustChangePassword, false);
});

test('Passwort-Reset über HTTP: Admin setzt zurück, Konto meldet sich an und ändert das Passwort', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'academy-reset-')); t.after(() => rm(dir, { recursive: true, force: true }));
  process.env.NODE_ENV = 'test'; process.env.ACADEMY_DATA_FILE = join(dir, 'state.json'); process.env.ACADEMY_SETUP_KEY = 'k';
  const { server } = await import('../src/server.mjs'); t.after(() => server.close());
  const call = (url, method = 'GET', body, headers = {}) => new Promise((resolve, reject) => {
    const req = Readable.from(body ? [JSON.stringify(body)] : []); req.method = method; req.url = url; req.headers = headers;
    const res = { status: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, writeHead(s, h) { this.status = s; for (const [k, v] of Object.entries(h)) this.setHeader(k, v); },
      end(text) { try { resolve({ status: this.status, headers: this.headers, body: JSON.parse(text) }); } catch (e) { reject(e); } } };
    server.emit('request', req, res);
  });
  await call('/api/setup', 'POST', { email: 'admin@example.org', password: PW }, { 'x-setup-key': 'k' });
  await call('/api/register', 'POST', { email: 'learner@example.org', password: PW });
  let r = await call('/api/login', 'POST', { email: 'admin@example.org', password: PW });
  const admin = { cookie: r.headers['set-cookie'].split(';')[0], 'x-csrf-token': r.body.csrf };
  r = await call('/api/users/reset-password', 'POST', { email: 'learner@example.org' }, { cookie: admin.cookie });
  assert.equal(r.status, 401);
  r = await call('/api/users/reset-password', 'POST', { email: 'learner@example.org' }, admin);
  assert.equal(r.status, 200); const temp = r.body.temporaryPassword; assert.ok(temp);
  r = await call('/api/login', 'POST', { email: 'learner@example.org', password: temp });
  assert.equal(r.body.user.mustChangePassword, true);
  const learner = { cookie: r.headers['set-cookie'].split(';')[0], 'x-csrf-token': r.body.csrf };
  r = await call('/api/change-password', 'POST', { current: temp, next: 'neues-passwort-456' }, learner);
  assert.equal(r.status, 200);
  r = await call('/api/login', 'POST', { email: 'learner@example.org', password: 'neues-passwort-456' });
  assert.equal(r.body.user.mustChangePassword, false);
});
