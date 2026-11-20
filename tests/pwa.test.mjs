import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const boot = async t => {
  const dir = await mkdtemp(join(tmpdir(), 'academy-pwa-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  process.env.NODE_ENV = 'test';
  process.env.ACADEMY_DATA_FILE = join(dir, 'state.json');
  const { server } = await import('../src/server.mjs');
  t.after(() => server.close());
  return (url, method = 'GET') => new Promise(resolve => {
    const req = Readable.from([]); req.method = method; req.url = url; req.headers = {};
    const res = { headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      writeHead(status, headers) { this.status = status; for (const [k, v] of Object.entries(headers)) this.setHeader(k, v); },
      end(body) { resolve({ status: this.status, headers: this.headers, body }); } };
    server.emit('request', req, res);
  });
};

test('PWA: Web-App-Manifest ist installierbar beschrieben', async t => {
  const get = await boot(t);
  const r = await get('/manifest.webmanifest');
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /^application\/manifest\+json/);
  const m = JSON.parse(r.body);
  assert.equal(m.name, 'HR Future Thinkers Academy');
  assert.ok(m.short_name && m.short_name.length <= 12);
  assert.equal(m.lang, 'de');
  assert.equal(m.start_url, '/');
  assert.equal(m.scope, '/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.theme_color, '#12295a');
  assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  const sizes = m.icons.map(i => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(m.icons.some(i => i.purpose === 'maskable'));
});

test('PWA: alle Manifest-Icons werden als echte PNG-Dateien ausgeliefert', async t => {
  const get = await boot(t);
  const m = JSON.parse((await get('/manifest.webmanifest')).body);
  for (const icon of m.icons) {
    const r = await get(icon.src);
    assert.equal(r.status, 200, icon.src);
    assert.equal(r.headers['content-type'], 'image/png');
    assert.equal(r.body.subarray(1, 4).toString(), 'PNG');
  }
  const apple = await get('/assets/icons/apple-touch-icon.png');
  assert.equal(apple.status, 200);
});

test('PWA: Startseite verweist auf Manifest und iOS-Icon', async t => {
  const get = await boot(t);
  const html = (await get('/')).body;
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/assets\/icons\/apple-touch-icon\.png">/);
  assert.match(html, /name="apple-mobile-web-app-capable"/);
});
