import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { catalog } from '../src/content.mjs';

// Lädt src/app.js im Server-Modus (kein Demo-Modus) in einer simulierten Seite.
const boot = (user, campuses = []) => {
  const raw = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const script = raw.slice(0, raw.lastIndexOf('try{state.catalog=await api'));
  const elements = {}; const listeners = {}; const calls = [];
  const el = sel => elements[sel] ??= { value: '', innerHTML: '', textContent: '', style: {}, classList: { remove() {}, toggle() {} }, addEventListener() {} };
  const me = () => ({ user: { ...user, mustChangePassword: false }, csrf: 'c', campuses });
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method, body: init.body && JSON.parse(init.body) });
    const data = url === '/api/me' ? me() : url === '/api/learning' ? [] : url === '/api/users/reset-password' ? { email: 'x@example.org', temporaryPassword: 'Einmal-Pass-123' } : { ok: true };
    return { ok: true, json: async () => data };
  };
  const context = { catalog, fetch, document: { documentElement: { dataset: { staticPreview: 'false' } }, querySelector: el, addEventListener: (n, f) => { listeners[n] = f; } },
    localStorage: { getItem() { return null; } }, setTimeout() {}, window: { scrollTo() {} }, confirm: () => true };
  runInNewContext(`${script}\nstate.catalog=catalog; state.user=${JSON.stringify(user)}; state.campuses=${JSON.stringify(campuses)}; state.csrf='c';`, context);
  const page = () => runInNewContext('state.page="account"; accountPage()', context);
  const click = (action, id) => listeners.click({ target: { closest: () => ({ dataset: { action, id } }) } });
  return { page, click, el, calls };
};
const member = { id: '1', email: 'lernende@example.org', role: 'member' };

test('Konto-Seite: angemeldete Person kann ihr Passwort ändern, ohne Admin-Werkzeug', () => {
  const html = boot(member).page();
  assert.match(html, /id="pw-current"/); assert.match(html, /id="pw-new"/);
  assert.match(html, /data-action="change-password"/);
  assert.doesNotMatch(html, /data-action="reset-password"/);
});

test('Konto-Seite: Einmal-Passwort führt zu einem deutlichen Hinweis auf das eigene Passwort', () => {
  const html = boot({ ...member, mustChangePassword: true }).page();
  assert.match(html, /eigenes Passwort/);
});

test('Konto-Seite: Plattform-Admin und Campus-Leitung sehen „Passwort zurücksetzen“', () => {
  for (const [user, campuses] of [[{ ...member, role: 'platform-admin' }, []], [member, [{ id: 'c1', name: 'Campus', role: 'campus-admin' }]]]) {
    const html = boot(user, campuses).page();
    assert.match(html, /id="reset-email"/); assert.match(html, /data-action="reset-password"/);
    assert.match(html, /id="reset-result"/);
  }
});

test('Klick „Passwort ändern“ sendet beide Passwörter an den Server', async () => {
  const ui = boot(member); ui.el('#pw-current').value = 'altes-passwort-123'; ui.el('#pw-new').value = 'neues-passwort-456';
  await ui.click('change-password');
  const call = ui.calls.find(c => c.url === '/api/change-password');
  assert.deepEqual(call.body, { current: 'altes-passwort-123', next: 'neues-passwort-456' });
});

test('Klick „Passwort zurücksetzen“ zeigt das Einmal-Passwort zum Weitergeben an', async () => {
  const ui = boot({ ...member, role: 'platform-admin' }); ui.el('#reset-email').value = 'x@example.org';
  await ui.click('reset-password');
  assert.deepEqual(ui.calls.find(c => c.url === '/api/users/reset-password').body, { email: 'x@example.org' });
  assert.match(ui.el('#reset-result').innerHTML, /Einmal-Pass-123/);
});
