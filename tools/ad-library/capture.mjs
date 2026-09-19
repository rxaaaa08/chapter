#!/usr/bin/env node
/**
 * Competitor ad capture — Meta Ad Library.
 * META-ADS-HANDOFF.md §25. Phase 1: the capture engine.
 *
 *   node tools/ad-library/capture.mjs [--out <dir>] [--once <page_id> <label>]
 *
 * Defaults to every page in watchlist.txt, writing to ~/Desktop/ads.
 *
 * ZERO DEPENDENCIES BY DESIGN. Drives the Google Chrome already installed on
 * this Mac over the DevTools Protocol, using Node's built-in WebSocket and
 * fetch (Node 22+). No Playwright, no Puppeteer, no Chromium download.
 * `~/Library/Caches/ms-playwright` exists on this machine but is 0 B — an empty
 * marker, not an install.
 *
 * NO API TOKEN, ALSO BY DESIGN. The public /ads_archive API needs political-
 * advertiser identity verification and, for India, would return only political
 * ads — useless here. This reads the public Ad Library web pages instead.
 * Do not "improve" this by adding a token.
 *
 * CORRECTNESS: the extractor and its three invariants live in extractor.mjs,
 * and are asserted against fixed HTML by `node tools/ad-library/selftest.mjs`.
 * Run that after touching either file. Do NOT rely on comparing checksums of
 * the captured files: advertisers legitimately reuse one creative across
 * several ads, so identical bytes are often correct.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser } from './chrome.mjs';
import { gridExtractor } from './extractor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const COUNTRY = 'IN';

const INGEST_URL = 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/ad-library-ingest';
// The caller secret lives in the macOS keychain, never in this repo and never
// in a dotfile that could be committed or synced. It is a credential to nothing
// except this one endpoint — deliberately NOT the service-role key, which is
// the master credential for a production database with live customers.
const KEYCHAIN_ACCOUNT = 'chaptera';
const KEYCHAIN_SERVICE = 'chaptera-ad-library-ingest';

function ingestSecret() {
  try {
    return execFileSync('/usr/bin/security',
      ['find-generic-password', '-a', KEYCHAIN_ACCOUNT, '-s', KEYCHAIN_SERVICE, '-w'],
      { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function callIngest(payload) {
  const secret = ingestSecret();
  if (!secret) return { ok: false, error: `no keychain item ${KEYCHAIN_SERVICE}` };
  try {
    const r = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ad-library-secret': secret },
      body: JSON.stringify(payload),
    });
    const body = await r.json().catch(() => null);
    return r.ok || r.status === 207
      ? { ok: body?.ok !== false, body }
      : { ok: false, error: `HTTP ${r.status}`, body };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Meta permits downloading creative for INDIVIDUAL ads for analysis and
// prohibits bulk extraction of the Ad Library. This cap is what keeps a
// watchlist from quietly turning into the second thing. Raising it is a
// decision, not a tweak.
const MAX_WATCHLIST = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[ad-library]', ...a);

// ── Arguments and watchlist ─────────────────────────────────────────────────
const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const OUT_DIR = argOf('--out') || join(homedir(), 'Desktop', 'ads');

function loadWatchlist() {
  const onceIdx = argv.indexOf('--once');
  if (onceIdx >= 0) return [{ pageId: argv[onceIdx + 1], label: argv[onceIdx + 2] }];

  const file = join(HERE, 'watchlist.txt');
  if (!existsSync(file)) throw new Error(`watchlist not found: ${file}`);
  const rows = readFileSync(file, 'utf8').split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => { const [pageId, label] = l.split(/\s+/); return { pageId, label }; })
    .filter((r) => /^\d+$/.test(r.pageId || '') && r.label);

  if (!rows.length) throw new Error('watchlist.txt has no usable entries');
  if (rows.length > MAX_WATCHLIST) {
    throw new Error(`watchlist has ${rows.length} pages, cap is ${MAX_WATCHLIST} — see the note in watchlist.txt`);
  }
  return rows;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
async function download(url, dest) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
    if (!r.ok) return { ok: false, status: r.status };
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(dest, buf);
    return { ok: true, bytes: buf.length };
  } catch (e) {
    return { ok: false, status: e.message };
  }
}

// Meta embeds duration and asset age, base64, in its own video URL. An asset
// much older than the ad means a creative they have used before and brought
// back — the clearest available signal they believe it works.
function decodeEfg(url) {
  try {
    const m = url.match(/[?&]efg=([^&]+)/);
    if (!m) return null;
    return JSON.parse(Buffer.from(decodeURIComponent(m[1]), 'base64').toString());
  } catch { return null; }
}

const slugOf = (s) => (s || 'unknown').replace(/[^\w]+/g, '-').toLowerCase().replace(/^-+|-+$/g, '');

// A card's innerText begins with Ad Library chrome — "Active", "Library ID: N",
// "Started running on ...", "See ad details", the advertiser name, "Sponsored".
// The ad's actual message starts after "Sponsored". Without this the panel
// excerpt reads "Active Library ID: 1028535..." on every row, which is the
// least informative possible summary of an ad.
function adCopy(text) {
  if (!text) return null;
  const i = text.search(/\bSponsored\b/);
  const body = (i >= 0 ? text.slice(i + 'Sponsored'.length) : text);
  const clean = body.replace(/\u200b/g, '').replace(/\s+/g, ' ').trim();
  return clean || null;
}

// Idempotence: an ad already on disk is skipped without a render or a download.
// Returns the existing folder name, so the ledger's creative_path stays correct
// on days when nothing is downloaded.
function existingFolder(pageDir, libraryId) {
  if (!existsSync(pageDir)) return null;
  return readdirSync(pageDir).find((d) => d.endsWith(`__${libraryId}`)) ?? null;
}

// ── Capture one watchlist page ──────────────────────────────────────────────
async function capturePage(browser, { pageId, label }) {
  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all`
    + `&country=${COUNTRY}&view_all_page_id=${pageId}`;

  const tab = await browser.open(url);
  let grid = null;
  try {
    const start = Date.now();
    while (Date.now() - start < 60_000) {
      await sleep(1500);
      // Scroll so cards below the fold mount and load their media, then back up.
      await tab.eval(() => { window.scrollTo(0, document.body.scrollHeight); return 1; });
      await sleep(900);
      await tab.eval(() => { window.scrollTo(0, 0); return 1; });
      grid = await tab.eval(gridExtractor);
      if (grid?.ads.length && grid.ads.length === grid.ids.length) break;
    }
  } finally { await tab.close(); }

  // A page with no ads is only trustworthy if the Ad Library app demonstrably
  // rendered. Otherwise zero means "we could not look", not "they stopped
  // advertising", and reporting ok:true would mark their whole catalogue dead.
  if (!grid || !grid.ids.length) {
    const rendered = !!grid?.rendered;
    if (!rendered) log(`  ${label}: page did not render — reporting as an unreliable read`);
    else log(`  ${label}: rendered, genuinely 0 live ads (${grid.resultsLabel})`);
    return {
      label, pageId, live: 0, resolved: 0, captured: 0, skipped: 0,
      problems: [], ads: [], rendered, reliable: rendered,
    };
  }

  // An ad the extractor could not safely attribute is REPORTED, never guessed
  // at and never silently dropped. These are the invariant violations from
  // extractor.mjs; each one means a card whose media could not be proved to
  // belong to it. The run continues so good ads are still captured, but it
  // ends non-zero so the failure is visible rather than absorbed.
  for (const p of grid.problems) {
    log(`  ${label} ${p.libId}: NOT CAPTURED — ${p.problem}${p.claimedBy ? ` (media belongs to ${p.claimedBy})` : ''}`);
  }

  const pageDir = join(OUT_DIR, label);
  mkdirSync(pageDir, { recursive: true });

  let captured = 0;
  let skipped = 0;
  const records = [];

  for (const ad of grid.ads) {
    // Invariant 3, re-checked here: the id must have been found inside the card
    // the text and media came from.
    if (!ad.idFoundInCard) {
      log(`  ${label} ${ad.libraryId}: NOT CAPTURED — id not present in its own card`);
      grid.problems.push({ libId: ad.libraryId, problem: 'id_not_in_card' });
      continue;
    }
    const existing = existingFolder(pageDir, ad.libraryId);
    if (existing) {
      skipped++;
      // A skipped run does no download, so the video's asset age is not in
      // hand — but it was recorded the day the ad was first captured. Read it
      // back rather than reporting NULL and letting the ledger forget a signal
      // it already had.
      let prior = {};
      try { prior = JSON.parse(readFileSync(join(pageDir, existing, 'meta.json'), 'utf8')); } catch { /* fine */ }
      records.push({
        library_id: ad.libraryId,
        started_running: ad.started,
        media_type: ad.video ? 'video' : (ad.image ? 'image' : 'none'),
        video_duration_s: prior.video_duration_s ?? null,
        video_asset_age_days: prior.video_asset_age_days ?? null,
        folder: existing,
        ad_text: ad.text ?? null,
        skipped: true,
      });
      continue;
    }

    const folder = `${slugOf(ad.started)}__${ad.libraryId}`;
    const dir = join(pageDir, folder);
    mkdirSync(dir, { recursive: true });

    const meta = {
      library_id: ad.libraryId,
      page_id: pageId,
      page_label: label,
      folder,
      status: ad.status,
      started_running: ad.started,
      total_active_time_at_capture: ad.activeTime,
      media_type: ad.video ? 'video' : (ad.image ? 'image' : 'none'),
      // Recorded so that when two ads legitimately share one creative it reads
      // as the fact it is, rather than looking like the attribution bug.
      media_source_url: ad.video?.src ?? ad.image?.src ?? null,
      captured_at: new Date().toISOString(),
      files: {},
    };

    if (ad.video) {
      const efg = decodeEfg(ad.video.src);
      if (efg) {
        meta.video_duration_s = efg.duration_s ?? null;
        meta.video_asset_age_days = efg.asset_age_days ?? null;
        meta.video_encoding = efg.vencode_tag ?? null;
      }
      const v = await download(ad.video.src, join(dir, 'video.mp4'));
      if (v.ok) { meta.files['video.mp4'] = v.bytes; log(`  ${label} ${ad.libraryId}  video.mp4 ${(v.bytes / 1048576).toFixed(2)} MB`); }
      else meta.video_download_error = String(v.status);
      if (ad.video.poster) {
        const p = await download(ad.video.poster, join(dir, 'poster.jpg'));
        if (p.ok) meta.files['poster.jpg'] = p.bytes;
      }
    } else if (ad.image) {
      meta.image_dimensions = `${ad.image.w}x${ad.image.h}`;
      const i = await download(ad.image.src, join(dir, 'image.jpg'));
      if (i.ok) { meta.files['image.jpg'] = i.bytes; log(`  ${label} ${ad.libraryId}  image.jpg ${(i.bytes / 1024).toFixed(0)} KB (${meta.image_dimensions})`); }
      else meta.image_download_error = String(i.status);
    } else {
      log(`  ${label} ${ad.libraryId}  no media found on the card`);
    }

    writeFileSync(join(dir, 'ad.txt'), ad.text || '');
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
    captured++;
    records.push({ ...meta, ad_text: ad.text ?? null, skipped: false });
  }

  return {
    label, pageId,
    live: grid.ids.length, resolved: grid.ads.length,
    captured, skipped, problems: grid.problems, ads: records,
    rendered: !!grid.rendered,
    // RELIABLE means: this observation may be trusted to say what is NOT
    // running. Every invariant held, every id resolved to its own card, and the
    // page really rendered. Anything less and the ledger records sightings but
    // marks nothing as disappeared.
    reliable: grid.problems.length === 0 && grid.ads.length === grid.ids.length && !!grid.rendered,
  };
}

// ── --verify: prove the two halves of the system agree ──────────────────────
// The creative lives on this Mac and the metadata lives in Supabase, joined by
// library_id. This walks both sides and reports orphans in BOTH directions,
// so the join can be proved rather than assumed.
async function verify() {
  const watchlist = loadWatchlist();
  const local = new Map();
  for (const { label } of watchlist) {
    const dir = join(OUT_DIR, label);
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir)) {
      const id = d.split('__')[1];
      if (!id) continue;
      const files = existsSync(join(dir, d)) ? readdirSync(join(dir, d)) : [];
      local.set(id, { label, folder: d, hasMedia: files.some((f) => f === 'video.mp4' || f === 'image.jpg') });
    }
  }

  const res = await callIngest({ action: 'list' });
  if (!res.ok) { log(`verify: could not read the ledger — ${res.error ?? 'unknown'}`); return 1; }
  const remote = new Map((res.body?.rows ?? []).map((r) => [r.library_id, r]));

  const onlyLocal = [...local.keys()].filter((id) => !remote.has(id));
  const onlyRemote = [...remote.keys()].filter((id) => !local.has(id));
  const noMedia = [...local.entries()].filter(([, v]) => !v.hasMedia).map(([id]) => id);
  const claimedButAbsent = [...remote.entries()]
    .filter(([id, r]) => r.creative_captured && !local.has(id)).map(([id]) => id);

  log(`verify: ${local.size} local folder(s), ${remote.size} ledger row(s)`);
  if (onlyLocal.length)  log(`  on disk but NOT in the ledger : ${onlyLocal.join(', ')}`);
  if (onlyRemote.length) log(`  in the ledger but NOT on disk : ${onlyRemote.join(', ')}`);
  if (noMedia.length)    log(`  folder exists but no media    : ${noMedia.join(', ')}`);
  if (claimedButAbsent.length) log(`  ledger claims a creative we do not have: ${claimedButAbsent.join(', ')}`);
  const clean = !onlyLocal.length && !onlyRemote.length && !noMedia.length && !claimedButAbsent.length;
  log(clean ? 'verify: both halves agree' : 'verify: MISMATCH (listed above)');
  return clean ? 0 : 1;
}

// One line per run, INCLUDING a run that found nothing new. A silently dead
// scheduled job is the classic failure this project keeps meeting; a boring
// line proves the job ran, and the ABSENCE of a line is the alarm.
function appendRunLog(line) {
  try { appendFileSync(join(OUT_DIR, '_run.log'), line + '\n'); } catch { /* never fail a run over the log */ }
}

function previousRunAge() {
  try {
    const lines = readFileSync(join(OUT_DIR, '_run.log'), 'utf8').trim().split('\n');
    const last = lines[lines.length - 1];
    const ts = last?.slice(0, 24);
    const then = Date.parse(ts);
    if (!Number.isFinite(then)) return null;
    return Math.round((Date.now() - then) / 86400000);
  } catch { return null; }
}

// ── Main ────────────────────────────────────────────────────────────────────
// A HARD CEILING ON THE WHOLE RUN. Every individual step already has its own
// timeout, but an unattended daily job must not be able to outlive its own
// schedule under any combination of them. If this fires, something is wrong
// that is worth seeing in the log rather than silently occupying the machine.
const RUN_BUDGET_MS = 10 * 60 * 1000;
setTimeout(() => {
  console.error('[ad-library] ABORTING — run exceeded its 10 minute budget');
  process.exit(1);
}, RUN_BUDGET_MS).unref();

(async () => {
  const started = Date.now();

  if (argv.includes('--verify')) {
    mkdirSync(OUT_DIR, { recursive: true });
    process.exit(await verify());
  }

  const watchlist = loadWatchlist();
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = new Browser();
  browser.installExitHandlers();
  await browser.start();
  log(`watching ${watchlist.length} page(s) → ${OUT_DIR}`);

  const results = [];
  for (const entry of watchlist) {
    try {
      const r = await capturePage(browser, entry);
      const warn = r.problems.length ? `  PROBLEMS=${r.problems.length}` : '';
      log(`${r.label}: live=${r.live} new=${r.captured} already-had=${r.skipped}${warn}`);
      results.push(r);
    } catch (e) {
      log(`${entry.label}: FAILED — ${e.message}`);
      results.push({ label: entry.label, pageId: entry.pageId, error: e.message, live: 0, resolved: 0, captured: 0, skipped: 0, problems: [], ads: [] });
    }
  }

  browser.cleanup();

  // Report to Supabase. Each page carries its OWN reliability verdict, so one
  // broken page cannot cause another's ads to be marked as disappeared.
  const ingest = await callIngest({
    pages: results.map((r) => ({
      page_id: r.pageId,
      page_label: r.label,
      ok: r.reliable === true,
      ads: (r.ads ?? []).map((a) => ({
        library_id: a.library_id,
        started_running: a.started_running ?? null,
        media_type: a.media_type ?? null,
        video_duration_s: a.video_duration_s ?? null,
        video_asset_age_days: a.video_asset_age_days ?? null,
        // Skipped means "already on disk from a previous run", which IS captured.
        creative_captured: a.skipped === true || Object.keys(a.files ?? {}).length > 0,
        creative_path: a.folder ? `${r.label}/${a.folder}` : null,
        // The copy, so a panel row reads as something other than a bare number.
        ad_text: adCopy(a.ad_text)?.slice(0, 2000) ?? null,
      })),
    })),
  });
  if (ingest.ok) log(`ledger updated: ${JSON.stringify(ingest.body?.results ?? [])}`);
  else log(`LEDGER UPDATE FAILED — ${ingest.error ?? JSON.stringify(ingest.body)}`);

  const totalLive = results.reduce((n, r) => n + r.live, 0);
  const totalNew = results.reduce((n, r) => n + r.captured, 0);
  const totalProblems = results.reduce((n, r) => n + r.problems.length, 0);
  const anyFailed = results.some((r) => r.error) || totalProblems > 0;

  // Phase 1 emits a machine-readable result so Phases 2 and 3 (the ledger and
  // the run log) can consume it without re-rendering anything.
  writeFileSync(join(OUT_DIR, '_last_run.json'), JSON.stringify({
    ran_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    country: COUNTRY,
    ok: !anyFailed,
    pages: results,
  }, null, 2));

  // Age of the PREVIOUS run, read before this one's line is appended. Shown so
  // that a human opening the log sees "last ran 9 days ago" immediately rather
  // than having to subtract timestamps.
  const gapDays = previousRunAge();

  const totalGone = (ingest.body?.results ?? [])
    .reduce((n, r) => n + (Number(r?.disappeared) || 0), 0);
  const summary = results.map((r) =>
    `${r.label} live=${r.live} new=${r.captured} had=${r.skipped}`
    + (r.reliable ? '' : ' UNRELIABLE')
    + (r.problems.length ? ` problems=${r.problems.length}` : '')).join(' | ');

  appendRunLog(
    `${new Date().toISOString()}  ${summary}  vanished=${totalGone}  `
    + `ledger=${ingest.ok ? 'ok' : 'FAILED'}  ${anyFailed ? 'NOT-OK' : 'ok'}  `
    + `${((Date.now() - started) / 1000).toFixed(1)}s`,
  );

  log(`DONE in ${((Date.now() - started) / 1000).toFixed(1)}s — ${totalLive} live, ${totalNew} newly captured`
    + (totalGone ? `, ${totalGone} vanished` : '')
    + (totalProblems ? `, ${totalProblems} NOT captured (see above)` : ''));
  if (gapDays !== null && gapDays >= 2) log(`NOTE: the previous run was ${gapDays} days ago`);

  if (anyFailed || !ingest.ok) process.exit(1);
  process.exit(totalLive === 0 ? 2 : 0);
})();
