import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const blueprint = () => readFile(new URL('../render.yaml', import.meta.url), 'utf8');

test('Deployment: render.yaml beschreibt einen EU-Dienst mit dauerhaftem Datenträger und HTTPS-Cookies', async () => {
  const y = await blueprint();
  assert.match(y, /region:\s*frankfurt/);
  assert.match(y, /runtime:\s*node/);
  assert.match(y, /startCommand:\s*npm start/);
  assert.match(y, /healthCheckPath:\s*\/api\/status/);
  assert.match(y, /disk:[\s\S]*mountPath:\s*\/var\/data/);
  assert.match(y, /key:\s*ACADEMY_DATA_FILE[\s\S]*?value:\s*\/var\/data\/academy-state\.json/);
  assert.match(y, /key:\s*ACADEMY_BACKUP_DIR[\s\S]*?value:\s*\/var\/data\/backups/);
  assert.match(y, /key:\s*ACADEMY_HOST[\s\S]*?value:\s*0\.0\.0\.0/);
  assert.match(y, /key:\s*ACADEMY_SECURE_COOKIE[\s\S]*?value:\s*"1"/);
  assert.match(y, /key:\s*ACADEMY_SETUP_KEY[\s\S]*?generateValue:\s*true/);
});

test('Deployment: kein Geheimnis steht im Klartext in render.yaml', async () => {
  const y = await blueprint();
  assert.doesNotMatch(y, /(password|passwort|token)\s*:\s*\S+/i);
});

test('Deployment: Anleitung für Nicht-Techniker existiert und nennt Kosten, Domain, Backup und Datenschutz', async () => {
  const d = await readFile(new URL('../DEPLOY_ANLEITUNG.md', import.meta.url), 'utf8');
  for (const word of ['Render', 'Setup-Schlüssel', 'Kosten', 'Domain', 'Backup', 'Datenschutz', 'Impressum', 'Home-Bildschirm'])
    assert.ok(d.includes(word), `${word} fehlt in der Anleitung`);
});
