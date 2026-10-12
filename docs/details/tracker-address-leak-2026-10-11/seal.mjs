// Sealed tracker test. Zero dependencies: drives the installed Chrome over the
// DevTools protocol using Node's built-in WebSocket.
//
// The real third-party SCRIPTS load (gtag.js, fbevents.js, the Contentsquare
// tag, Sentry is bundled), so they behave exactly as they do for a customer.
// Everything they then try to SEND is caught, written to a log, and answered
// locally: nothing made-up reaches Google, Meta, Contentsquare or Sentry.
//
// usage: node seal.mjs <scenario.json> <out.json>
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { gunzipSync, inflateSync, inflateRawSync, brotliDecompressSync } from 'node:zlib';

const scenario = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const outFile = process.argv[3];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9300 + Math.floor(Math.random() * 400);
const SITE_HOSTS = ['chaptera.in', 'www.chaptera.in'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Where each tool SENDS data (as opposed to where its script is downloaded).
const SINKS = [
  { tool: 'ga', re: /^https:\/\/([a-z0-9-]+\.)?(google-analytics\.com|analytics\.google\.com)\/.*collect/i },
  { tool: 'ga', re: /^https:\/\/(www\.google\.[a-z.]+|stats\.g\.doubleclick\.net|[a-z0-9.-]*doubleclick\.net)\//i },
  { tool: 'ga', re: /^https:\/\/www\.googletagmanager\.com\/(a|td)\?/i },
  { tool: 'meta', re: /^https:\/\/(www\.)?facebook\.com\/(tr|privacy_sandbox)/i },
  { tool: 'contentsquare', re: /^https:\/\/(c|k|q|srm|r|l)\.(ba\.)?contentsquare\.net\//i },
  { tool: 'contentsquare', re: /^https:\/\/[a-z0-9.-]*contentsquare\.(net|com)\/(?!uxa\/)/i },
  { tool: 'sentry', re: /^https:\/\/[a-z0-9.-]*sentry\.io\//i },
  { tool: 'vercel', re: /^https:\/\/(www\.)?chaptera\.in\/_vercel\/[a-z-]+\/(vitals|event|view)/i },
  { tool: 'vercel', re: /^https:\/\/[a-z0-9.-]*vercel-(insights|scripts)\.com\/.*(vitals|event|view)/i },
  { tool: 'own-funnel', re: /\/rest\/v1\/flow_analytics/i },
];
// Script/config downloads that must reach the real server so the tool runs.
const ALLOW = [
  /^https:\/\/www\.googletagmanager\.com\/gtag\/js/i,
  /^https:\/\/connect\.facebook\.net\//i,
  /^https:\/\/t\.contentsquare\.net\//i,
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain' };

function decodeBody(b64) {
  if (!b64) return '';
  const buf = Buffer.from(b64, 'base64');
  const tries = [(b) => gunzipSync(b), (b) => inflateSync(b), (b) => inflateRawSync(b), (b) => brotliDecompressSync(b)];
  for (const t of tries) { try { return '[decompressed] ' + t(buf).toString('utf8'); } catch { /* next */ } }
  return buf.toString('utf8');
}

const profile = mkdtempSync(join(tmpdir(), 'ca-seal-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
  '--disable-background-networking', '--disable-component-update', 'about:blank',
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch { /* not up yet */ }
}
if (!wsUrl) { chrome.kill(); throw new Error('Chrome did not start'); }

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0; const pending = new Map(); const handlers = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); return; }
  for (const h of handlers) h(msg);
};
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, sessionId })); });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

const log = [];           // every request any tool tried to send
const consoleLog = [];
let phase = 'load';

await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable');
// The site's service worker would fetch pages by itself, outside this seal, and
// could hand back the LIVE build instead of the one under test.
await S('Network.setBypassServiceWorker', { bypass: true });
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
// Headless Chrome announces itself, and Meta's pixel refuses to send for bots.
// A customer's browser never says "Headless", so neither does this one.
await S('Emulation.setUserAgentOverride', scenario.userAgent
  ? { userAgent: scenario.userAgent }
  : { userAgent: DESKTOP_UA, userAgentMetadata: { brands: [{ brand: 'Google Chrome', version: '141' }, { brand: 'Chromium', version: '141' }, { brand: 'Not?A_Brand', version: '8' }], fullVersionList: [{ brand: 'Google Chrome', version: '141.0.0.0' }, { brand: 'Chromium', version: '141.0.0.0' }], platform: 'macOS', platformVersion: '15.6.0', architecture: 'arm', model: '', mobile: false } });
await S('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(navigator, 'webdriver', { get: () => false });" });
if (scenario.mobile) await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await S('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });

handlers.push(async (msg) => {
  if (msg.sessionId !== sessionId) return;
  if (msg.method === 'Runtime.consoleAPICalled') {
    consoleLog.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
    return;
  }
  if (msg.method !== 'Fetch.requestPaused') return;
  const { requestId, request, resourceType } = msg.params;
  const url = request.url;
  try {
    const host = new URL(url).hostname;
    const sink = ALLOW.some((re) => re.test(url)) ? null : SINKS.find((s) => s.re.test(url));
    if (sink && (scenario.passThrough || []).includes(sink.tool)) {
      // Recorded, then allowed to reach the real tool (used only with clean, made-up values).
      let body = request.postData ?? '';
      if (request.hasPostData) { try { const r = await S('Fetch.getRequestPostData', { requestId }); body = r.base64Encoded ? decodeBody(r.postData) : r.postData; } catch { /* keep */ } }
      log.push({ tool: sink.tool, phase, method: request.method, url, referer: request.headers.Referer ?? null, body });
      await S('Fetch.continueRequest', { requestId });
      return;
    }
    if (sink) {
      let body = request.postData ?? '';
      if (!body && request.hasPostData) {
        try { const r = await S('Fetch.getRequestPostData', { requestId }); body = r.base64Encoded ? decodeBody(r.postData) : r.postData; } catch { body = '[unreadable body]'; }
      } else if (body && /[\u0000-\u0008\u000e-\u001f]/.test(body.slice(0, 40))) {
        try { const r = await S('Fetch.getRequestPostData', { requestId }); body = r.base64Encoded ? decodeBody(r.postData) : r.postData; } catch { /* keep */ }
      }
      log.push({ tool: sink.tool, phase, method: request.method, url, referer: request.headers.Referer ?? request.headers.referer ?? null, body });
      const origin = request.headers.Origin ?? request.headers.origin ?? '*';
      const headers = [
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: '*, content-type, apikey, authorization, x-client-info, prefer, content-profile, sentry-trace, baggage' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        { name: 'Content-Type', value: sink.tool === 'sentry' || sink.tool === 'own-funnel' ? 'application/json' : 'text/plain' },
      ];
      const code = request.method === 'OPTIONS' ? 204 : (sink.tool === 'own-funnel' ? 201 : 200);
      await S('Fetch.fulfillRequest', { requestId, responseCode: code, responseHeaders: headers, body: Buffer.from(code === 204 ? '' : (sink.tool === 'sentry' ? '{}' : '')).toString('base64') });
      return;
    }
    // "Slow app, fast trackers": hold back the site's own script bundle so the
    // tools in the page head run first, as they do on a phone that already has
    // gtag.js / the Contentsquare tag cached from any other website.
    if (scenario.delayAppMs && SITE_HOSTS.includes(host) && /\/assets\/index-[^/]+\.js$/.test(url)) await sleep(scenario.delayAppMs);
    // Failure drill: serve a third-party script with one piece of text swapped,
    // to see how the site behaves the day a vendor renames something inside it.
    const swap = (scenario.mutate || []).find((m) => url.includes(m.urlIncludes));
    if (swap) {
      const real = await (await fetch(url)).text();
      await S('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(real.split(swap.from).join(swap.to)).toString('base64') });
      return;
    }
    // Vercel serves its speed-measurement script from our own domain; it is not
    // part of the build, so it has to come from the live site.
    if (SITE_HOSTS.includes(host) && new URL(url).pathname.startsWith('/_vercel/')) { await S('Fetch.continueRequest', { requestId }); return; }
    if (scenario.dist && SITE_HOSTS.includes(host)) {
      const path = decodeURIComponent(new URL(url).pathname);
      let file = join(scenario.dist, path);
      if (!existsSync(file) || statSync(file).isDirectory()) file = join(scenario.dist, 'index.html');
      const body = readFileSync(file);
      await S('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
        { name: 'Content-Type', value: MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ], body: body.toString('base64') });
      return;
    }
    // Anything else on the open web that is not a known script download gets
    // recorded too when it carries a query or a body, so an unexpected
    // destination cannot slip through unseen.
    if (!SITE_HOSTS.includes(host) && !/supabase\.co$/.test(host) && !ALLOW.some((re) => re.test(url)) && resourceType !== 'Font' && resourceType !== 'Stylesheet') {
      log.push({ tool: 'other', phase, method: request.method, url, referer: request.headers.Referer ?? null, body: request.postData ?? '' });
    }
    if (/supabase\.co$/.test(host)) {
      log.push({ tool: 'own-supabase', phase, method: request.method, url, referer: request.headers.Referer ?? null, body: request.postData ?? '' });
    }
    await S('Fetch.continueRequest', { requestId });
  } catch (e) {
    try { await S('Fetch.continueRequest', { requestId }); } catch { /* gone */ }
  }
});

const evalJs = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text };
  return r.result.value;
};

// Optional cookies set before the first page load (e.g. Contentsquare's own
// `_cs_inc=5`, which asks its tag to record this visitor instead of leaving it to chance).
for (const c of scenario.cookies || []) await S('Network.setCookie', { name: c.name, value: c.value, domain: 'chaptera.in', path: '/', secure: true });
const probes = {};
for (const step of scenario.steps) {
  if (step.phase) phase = step.phase;
  if (step.goto) await S('Page.navigate', { url: step.goto });
  if (step.wait) await sleep(step.wait);
  if (step.eval) { const v = await evalJs(step.eval); if (step.as) probes[step.as] = v; }
  if (step.scroll) { await S('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 200, y: 400, deltaX: 0, deltaY: step.scroll }); }
}

writeFileSync(outFile, JSON.stringify({ scenario: scenario.name, probes, consoleLog, log }, null, 1));
try { await send('Browser.close'); } catch { /* already closing */ }
ws.close(); chrome.kill();
console.log(`done: ${log.length} requests recorded -> ${outFile}`);
process.exit(0);
