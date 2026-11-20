import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backupState } from '../src/backup.mjs';

const workspace = async t => {
  const dir = await mkdtemp(join(tmpdir(), 'academy-backup-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return { stateFile: join(dir, 'state.json'), dir: join(dir, 'backups') };
};
const day = (n) => new Date(Date.UTC(2026, 0, 1 + n, 12));

test('Backup: kopiert die Datendatei unter dem Tagesdatum', async t => {
  const w = await workspace(t); await writeFile(w.stateFile, '{"users":[1]}');
  const file = await backupState({ ...w, date: day(0) });
  assert.match(file, /academy-state-2026-01-01\.json$/);
  assert.equal(await readFile(file, 'utf8'), '{"users":[1]}');
});

test('Backup: ein zweites Backup am selben Tag ersetzt das erste durch den neueren Stand', async t => {
  const w = await workspace(t); await writeFile(w.stateFile, 'alt'); await backupState({ ...w, date: day(0) });
  await writeFile(w.stateFile, 'neu'); const file = await backupState({ ...w, date: day(0) });
  assert.equal((await readdir(w.dir)).length, 1); assert.equal(await readFile(file, 'utf8'), 'neu');
});

test('Backup: behält nur die neuesten 30 Tage', async t => {
  const w = await workspace(t); await writeFile(w.stateFile, '{}');
  for (let i = 0; i < 35; i++) await backupState({ ...w, date: day(i) });
  const names = (await readdir(w.dir)).sort();
  assert.equal(names.length, 30);
  assert.match(names[0], /2026-01-06/); assert.match(names.at(-1), /2026-02-04/);
});

test('Backup: ohne Datendatei (frische Installation) passiert nichts und es gibt keinen Fehler', async t => {
  const w = await workspace(t);
  assert.equal(await backupState({ ...w, date: day(0) }), null);
});

test('Backup: fremde Dateien im Backup-Ordner werden nie gelöscht', async t => {
  const w = await workspace(t); await writeFile(w.stateFile, '{}');
  await backupState({ ...w, date: day(0) }); await writeFile(join(w.dir, 'notiz.txt'), 'bleibt');
  for (let i = 1; i < 35; i++) await backupState({ ...w, date: day(i) });
  assert.ok((await readdir(w.dir)).includes('notiz.txt'));
});
