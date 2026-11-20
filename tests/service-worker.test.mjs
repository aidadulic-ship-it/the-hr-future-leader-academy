import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = 'https://academy.test';
const SW_PATH = fileURLToPath(new URL('../src/sw.js', import.meta.url));

// Simulierter Browser: Cache-Speicher, Netzwerk (online/offline) und Ereignisse.
const loadWorker = async () => {
  const code = await readFile(SW_PATH, 'utf8');
  const listeners = {}; const stores = new Map();
  const net = { online: true, version: 1, calls: [] };
  const key = r => new URL(typeof r === 'string' ? r : r.url, ORIGIN).href;
  const makeCache = name => ({
    async put(r, res) { stores.get(name).set(key(r), res.clone()); },
    async match(r) { const hit = stores.get(name).get(key(r)); return hit && hit.clone(); },
    async addAll(urls) { for (const u of urls) { const res = await fakeFetch(u); if (!res.ok) throw Error('addAll ' + u); await this.put(u, res); } },
  });
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, new Map()); return makeCache(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(r) { for (const n of stores.keys()) { const hit = await makeCache(n).match(r); if (hit) return hit; } },
  };
  const fakeFetch = async r => {
    const url = key(r); net.calls.push(url);
    if (!net.online) throw new TypeError('offline');
    return new Response(`v${net.version}:${new URL(url).pathname}`, { status: 200, headers: { 'content-type': 'text/plain' } });
  };
  const self = { addEventListener: (n, f) => { listeners[n] = f; }, skipWaiting: () => {}, clients: { claim: async () => {} }, location: { origin: ORIGIN } };
  vm.runInNewContext(code, { self, caches, fetch: fakeFetch, Response, Request, URL, Promise, console }, { filename: 'sw.js' });
  const waitFor = async fire => { let p; fire(x => { p = x; }); await p; };
  return {
    stores, net, listeners,
    install: () => waitFor(done => listeners.install({ waitUntil: done })),
    activate: () => waitFor(done => listeners.activate({ waitUntil: done })),
    request: async (path, { method = 'GET', mode = 'cors', origin = ORIGIN } = {}) => {
      const request = new Request(origin + path, { method }); Object.defineProperty(request, 'mode', { value: mode });
      let answer; let handled = false;
      listeners.fetch({ request, respondWith: p => { handled = true; answer = p; } });
      return handled ? { handled, response: await answer } : { handled };
    },
  };
};
const text = r => r.response.text();

test('Service Worker: Installation legt App-Hülle und Lerninhalte vorab in den Cache', async () => {
  const w = await loadWorker(); await w.install();
  const cached = [...w.stores.values()].flatMap(m => [...m.keys()]).map(u => new URL(u).pathname);
  for (const p of ['/', '/app.css', '/app.js', '/manifest.webmanifest', '/api/content', '/assets/icons/icon-192.png'])
    assert.ok(cached.includes(p), `${p} fehlt im Cache`);
});

test('Service Worker: Seitenaufruf offline liefert die zwischengespeicherte Startseite', async () => {
  const w = await loadWorker(); await w.install(); w.net.online = false;
  const r = await w.request('/irgendein-pfad', { mode: 'navigate' });
  assert.ok(r.handled); assert.equal(await text(r), 'v1:/');
});

test('Service Worker: Lerninhalte sind online aktuell und offline aus dem Cache lesbar', async () => {
  const w = await loadWorker(); await w.install();
  w.net.version = 2; let r = await w.request('/api/content');
  assert.equal(await text(r), 'v2:/api/content');
  w.net.online = false; r = await w.request('/api/content');
  assert.equal(await text(r), 'v2:/api/content');
});

test('Service Worker: App-Code ist online aktuell und offline aus dem Cache verfügbar', async () => {
  const w = await loadWorker(); await w.install();
  w.net.version = 2; assert.equal(await text(await w.request('/app.js')), 'v2:/app.js');
  w.net.online = false; assert.equal(await text(await w.request('/app.js')), 'v2:/app.js');
});

test('Service Worker: Bilder kommen zuerst aus dem Cache', async () => {
  const w = await loadWorker(); await w.install(); w.net.calls.length = 0;
  assert.equal(await text(await w.request('/assets/icons/icon-192.png')), 'v1:/assets/icons/icon-192.png');
  assert.equal(w.net.calls.length, 0);
});

test('Service Worker: Konto- und Schreibzugriffe sowie fremde Hosts bleiben unberührt', async () => {
  const w = await loadWorker(); await w.install();
  for (const p of ['/api/me', '/api/learning', '/api/export', '/api/status']) assert.equal((await w.request(p)).handled, false, p);
  assert.equal((await w.request('/api/content', { method: 'POST' })).handled, false);
  assert.equal((await w.request('/app.js', { origin: 'https://fremd.example' })).handled, false);
});

test('Service Worker: Aktivierung löscht alte Academy-Caches, aber keine fremden', async () => {
  const w = await loadWorker(); await w.install();
  w.stores.set('academy-alt', new Map()); w.stores.set('anderer-cache', new Map());
  await w.activate();
  assert.ok(!w.stores.has('academy-alt')); assert.ok(w.stores.has('anderer-cache'));
  assert.ok([...w.stores.keys()].some(n => n.startsWith('academy-')));
});

test('Service Worker: wird unter /sw.js ausgeliefert und von der App registriert', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'academy-sw-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  process.env.NODE_ENV = 'test'; process.env.ACADEMY_DATA_FILE = join(dir, 'state.json');
  const { server } = await import('../src/server.mjs'); t.after(() => server.close());
  const get = url => new Promise(resolve => {
    const req = Readable.from([]); req.method = 'GET'; req.url = url; req.headers = {};
    const res = { headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, writeHead(s, h) { this.status = s; for (const [k, v] of Object.entries(h)) this.setHeader(k, v); }, end(body) { resolve({ status: this.status, headers: this.headers, body }); } };
    server.emit('request', req, res);
  });
  const sw = await get('/sw.js');
  assert.equal(sw.status, 200); assert.match(sw.headers['content-type'], /javascript/); assert.equal(sw.headers['cache-control'], 'no-cache');
  assert.match((await get('/app.js')).body, /serviceWorker\?\.register\(\s*['"]\/sw\.js['"]/);
});
