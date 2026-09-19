/**
 * Headless Chrome over the DevTools Protocol, with no dependencies.
 * META-ADS-HANDOFF.md §25.
 *
 * Uses the Google Chrome already installed on this Mac plus Node's built-in
 * WebSocket and fetch (Node 22+). Shared by capture.mjs and selftest.mjs.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Browser {
  constructor() {
    this.port = 9333 + Math.floor(Math.random() * 400);
    // A throwaway profile means this can never read, lock or corrupt the
    // founder's real Chrome profile, and can run while he has Chrome open.
    this.profile = mkdtempSync(join(tmpdir(), 'adlib-'));
    this.proc = null;
    this.cleanedUp = false;
  }

  async start() {
    this.proc = spawn(CHROME_BIN, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--mute-audio', '--disable-extensions', '--disable-background-networking',
      // Fixtures are loaded from file:// during self-test.
      '--allow-file-access-from-files',
      `--user-data-dir=${this.profile}`, `--remote-debugging-port=${this.port}`, 'about:blank',
    ], { stdio: 'ignore' });

    for (let i = 0; i < 80; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        if (r.ok) return;
      } catch { /* not up yet */ }
      await sleep(250);
    }
    throw new Error('Chrome never exposed its debugging port');
  }

  // Cleanup must run on EVERY exit path: a leaked headless Chrome is invisible
  // and would accumulate one process per day under launchd.
  cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    try { this.proc?.kill('SIGKILL'); } catch { /* already gone */ }
    try { rmSync(this.profile, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  installExitHandlers() {
    process.on('exit', () => this.cleanup());
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
      process.on(sig, () => { this.cleanup(); process.exit(130); });
    }
    process.on('uncaughtException', (e) => {
      console.error('[ad-library] FAILED:', e.message);
      this.cleanup();
      process.exit(1);
    });
  }

  async open(url) {
    const t = await (await fetch(
      `http://127.0.0.1:${this.port}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT', signal: AbortSignal.timeout(20_000) },
    )).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    // A TIMEOUT IS MANDATORY HERE, not defensive padding. A socket that neither
    // opens nor errors leaves this promise pending forever, and an unattended
    // launchd job then hangs until somebody notices — which was exactly the
    // 2026-09-18 failure: the first scheduled run sat at "state = running" for
    // over four minutes with Chrome alive and no output. Nothing in a scheduled
    // job may be able to wait indefinitely.
    await new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error('CDP socket did not open within 20s')), 20_000);
      ws.onopen = () => { clearTimeout(timer); res(); };
      ws.onerror = () => { clearTimeout(timer); rej(new Error('CDP socket failed')); };
    });
    return new Tab(ws, t.id, this.port);
  }
}

export class Tab {
  constructor(ws, targetId, port) {
    this.ws = ws; this.targetId = targetId; this.port = port;
    this.seq = 0; this.pending = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (!m.id || !this.pending.has(m.id)) return;
      const { res, rej } = this.pending.get(m.id);
      this.pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    };
  }

  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); rej(new Error(`${method} timed out`)); }
      }, 45_000);
    });
  }

  /** Serialises `fn` and runs it in the page. `fn` must close over nothing. */
  async eval(fn) {
    const r = await this.send('Runtime.evaluate', {
      expression: `(${fn.toString()})()`, returnByValue: true, awaitPromise: true,
    });
    return r.result?.value;
  }

  async close() {
    try { this.ws.close(); } catch { /* fine */ }
    try { await fetch(`http://127.0.0.1:${this.port}/json/close/${this.targetId}`); } catch { /* fine */ }
  }
}
