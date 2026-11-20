import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers/app-harness.mjs';

test('Erststart: Ohne Konten zeigt die Konto-Seite das Formular für die erste Administration', async () => {
  const ui = boot(null, [], { setupRequired: true });
  await ui.run('refresh()');
  const html = ui.page();
  for (const id of ['setup-email', 'setup-password', 'setup-key']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-action="setup"/);
  assert.doesNotMatch(html, /data-action="register"/);
});

test('Normalbetrieb: Mit vorhandenen Konten gibt es kein Setup-Formular, aber Registrierung', async () => {
  const ui = boot(null, [], { setupRequired: false });
  await ui.run('refresh()');
  const html = ui.page();
  assert.doesNotMatch(html, /data-action="setup"/);
  assert.match(html, /data-action="register"/);
});

test('Klick „Administration einrichten“ sendet Zugangsdaten mit Setup-Schlüssel und schaltet auf Anmeldung um', async () => {
  const ui = boot(null, [], { setupRequired: true }); await ui.run('refresh()');
  ui.el('#setup-email').value = 'admin@example.org'; ui.el('#setup-password').value = 'a-long-password-123'; ui.el('#setup-key').value = 'geheim-123';
  await ui.click('setup');
  const call = ui.calls.find(c => c.url === '/api/setup');
  assert.deepEqual(call.body, { email: 'admin@example.org', password: 'a-long-password-123' });
  assert.equal(call.headers['x-setup-key'], 'geheim-123');
  assert.match(ui.page(), /data-action="login"/);
  assert.doesNotMatch(ui.page(), /data-action="setup"/);
});
