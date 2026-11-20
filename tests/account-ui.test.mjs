import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers/app-harness.mjs';

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
