import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('alle deklarierten UI-Aktionen haben Handler', () => {
  const script=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const actions=new Set([...script.matchAll(/button\([^,]+,'([^']+)'|data-action="([a-z-]+)"/g)].map(m=>m[1]||m[2]));
  for(const action of actions) assert.ok(script.includes(`a==='${action}'`),`Handler fehlt: ${action}`);
});
