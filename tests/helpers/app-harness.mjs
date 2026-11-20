import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { catalog } from '../../src/content.mjs';

// Lädt src/app.js im Server-Modus (kein Demo-Modus) in einer simulierten Seite.
export const boot = (user, campuses = [], { setupRequired = false } = {}) => {
  const raw = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');
  const script = raw.slice(0, raw.lastIndexOf('try{state.catalog=await api'));
  const elements = {}; const listeners = {}; const calls = [];
  const el = sel => elements[sel] ??= { value: '', innerHTML: '', textContent: '', style: {}, classList: { remove() {}, toggle() {} }, addEventListener() {} };
  let needsSetup = setupRequired;
  const answer = url => {
    if (url === '/api/status') return { setupRequired: needsSetup, accountAvailable: !needsSetup };
    if (url === '/api/setup') { needsSetup = false; return { id: '9', email: 'admin@example.org', role: 'platform-admin' }; }
    if (url === '/api/me') { if (!user) throw Object.assign(new Error('unauthorized'), { status: 401 }); return { user: { ...user, mustChangePassword: false }, csrf: 'c', campuses }; }
    if (url === '/api/learning') return [];
    if (url === '/api/users/reset-password') return { email: 'x@example.org', temporaryPassword: 'Einmal-Pass-123' };
    return { ok: true };
  };
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body && JSON.parse(init.body) });
    try { return { ok: true, json: async () => answer(url) }; }
    catch (error) { return { ok: false, json: async () => ({ error: error.message }) }; }
  };
  const context = { catalog, fetch, document: { documentElement: { dataset: { staticPreview: 'false' } }, querySelector: el, addEventListener: (n, f) => { listeners[n] = f; } },
    localStorage: { getItem() { return null; } }, setTimeout() {}, window: { scrollTo() {} }, confirm: () => true };
  runInNewContext(`${script}\nstate.catalog=catalog; state.user=${JSON.stringify(user ?? null)}; state.campuses=${JSON.stringify(campuses)}; state.csrf=${user ? "'c'" : 'null'};`, context);
  return {
    page: () => runInNewContext('state.page="account"; accountPage()', context),
    run: code => runInNewContext(code, context),
    click: (action, id) => listeners.click({ target: { closest: () => ({ dataset: { action, id } }) } }),
    el, calls,
  };
};
