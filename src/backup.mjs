import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const PATTERN = /^academy-state-\d{4}-\d{2}-\d{2}\.json$/;

// Kopiert die Datendatei als Tagesbackup und behält nur die neuesten `keep` Tage.
// Gibt den Pfad des Backups zurück, oder null, wenn es noch keine Datendatei gibt.
export async function backupState({ stateFile, dir, date = new Date(), keep = 30 }) {
  await mkdir(dir, { recursive: true });
  const target = join(dir, `academy-state-${date.toISOString().slice(0, 10)}.json`);
  try { await copyFile(stateFile, target); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  const old = (await readdir(dir)).filter(name => PATTERN.test(name)).sort().slice(0, -keep);
  await Promise.all(old.map(name => rm(join(dir, name))));
  return target;
}
