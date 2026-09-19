#!/usr/bin/env node
/**
 * Self-test for the Ad Library grid extractor.  node tools/ad-library/selftest.mjs
 * META-ADS-HANDOFF.md §25.2.
 *
 * WHY THIS EXISTS RATHER THAN A CHECKSUM OF THE REAL OUTPUT.
 * The first version of this tool attributed one competitor's video to three
 * different ads and reported success. The check proposed at the time — "the
 * captured files must have different hashes" — is not a correctness test:
 *
 *   * it FALSE-ALARMS on legitimate reuse. Advertisers routinely run the same
 *     image across several ads; identical bytes are then correct;
 *   * it CANNOT FIRE on a page running a single ad, which is the common case
 *     for a small competitor — exactly when nobody would notice;
 *   * it only fails AFTER downloading, i.e. after the wrong thing is on disk.
 *
 * So correctness is asserted here instead, against fixed HTML where the right
 * answer is known, including the two cases the live site cannot produce on
 * demand: a broken layout that MUST be rejected, and honest creative reuse that
 * MUST be accepted.
 */

import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Browser } from './chrome.mjs';
import { gridExtractor } from './extractor.mjs';

// URL-encoded, because raw double quotes inside the SVG would terminate the
// enclosing src="…" attribute and the image would never load — which shows up
// as `card_not_resolved` and looks exactly like an extractor bug.
const img = (w, h, colour) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
  + `<rect width="${w}" height="${h}" fill="${colour}"/></svg>`,
);

const card = (id, started, mediaHtml) => `
  <div class="card">
    <div><span>Active</span></div>
    <div>Library ID: ${id}</div>
    <div>Started running on ${started}</div>
    ${mediaHtml}
    <div>some ad copy for ${id}</div>
  </div>`;

const page = (body) => `<!doctype html><html><body style="font-family:sans-serif">${body}</body></html>`;

// ── Fixtures ────────────────────────────────────────────────────────────────
const FIXTURES = [
  {
    name: 'healthy: two ads, each with its own media',
    html: page(
      card('1001', '11 Aug 2026', `<img src="${img(600, 600, 'red')}">`)
      + card('1002', '18 Sep 2026', `<video src="https://example.test/b.mp4"></video>`),
    ),
    expect: (r) => {
      if (r.problems.length) return `expected no problems, got ${JSON.stringify(r.problems)}`;
      if (r.ads.length !== 2) return `expected 2 ads, got ${r.ads.length}`;
      const a = r.ads.find((x) => x.libraryId === '1001');
      const b = r.ads.find((x) => x.libraryId === '1002');
      if (!a?.image) return '1001 should have an image';
      if (!b?.video) return '1002 should have a video';
      if (a.video) return '1001 must NOT pick up 1002\'s video';
      if (!a.idFoundInCard || !b.idFoundInCard) return 'id must appear in its own card';
      if (a.started !== '11 Aug 2026' || b.started !== '18 Sep 2026') return 'start dates crossed over';
      return null;
    },
  },
  {
    name: 'THE BUG: two ids sharing one media element must be REJECTED, not guessed',
    // Both ids sit in text-only divs; the only media lives on a common
    // ancestor. This is the shape that produced three identical videos.
    html: page(`
      <div class="shared">
        <video src="https://example.test/shared.mp4"></video>
        <div><div>Library ID: 2001</div><div>Started running on 1 Jan 2026</div></div>
        <div><div>Library ID: 2002</div><div>Started running on 2 Jan 2026</div></div>
      </div>`),
    expect: (r) => {
      if (r.ads.length !== 0) {
        return `expected 0 ads emitted, got ${r.ads.length} — a wrong answer would have been produced`;
      }
      if (r.problems.length !== 2) return `expected 2 problems, got ${JSON.stringify(r.problems)}`;
      return null;
    },
  },
  {
    name: 'legitimate reuse: two ads sharing the same creative URL must be ACCEPTED',
    // The case a checksum test would wrongly flag as a bug.
    html: page(
      card('3001', '1 Mar 2026', `<img src="${img(600, 600, 'blue')}">`)
      + card('3002', '2 Mar 2026', `<img src="${img(600, 600, 'blue')}">`),
    ),
    expect: (r) => {
      if (r.problems.length) return `expected no problems, got ${JSON.stringify(r.problems)}`;
      if (r.ads.length !== 2) return `expected 2 ads, got ${r.ads.length}`;
      const [a, b] = r.ads;
      if (a.image?.src !== b.image?.src) return 'fixture error: the two images should share a URL';
      return null;
    },
  },
  {
    name: 'single ad: the case a checksum test can never exercise',
    html: page(card('4001', '9 Sep 2026', `<img src="${img(600, 600, 'green')}">`)),
    expect: (r) => {
      if (r.problems.length) return `expected no problems, got ${JSON.stringify(r.problems)}`;
      if (r.ads.length !== 1) return `expected 1 ad, got ${r.ads.length}`;
      if (!r.ads[0].image) return 'the single ad should have its image';
      return null;
    },
  },
  {
    name: 'card with no media at all is reported, never silently dropped',
    html: page(`<div><div>Library ID: 5001</div><div>Started running on 3 Mar 2026</div></div>`),
    expect: (r) => {
      if (r.ads.length !== 0) return `expected 0 ads, got ${r.ads.length}`;
      if (!r.problems.some((p) => p.libId === '5001')) return 'the unresolvable id must be reported';
      return null;
    },
  },
];

// ── Runner ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adlib-test-'));
  const browser = new Browser();
  browser.installExitHandlers();
  await browser.start();

  let failed = 0;
  for (const f of FIXTURES) {
    const file = join(dir, `${f.name.replace(/[^\w]+/g, '_').slice(0, 40)}.html`);
    writeFileSync(file, f.html);
    const tab = await browser.open(`file://${file}`);
    try {
      // Let the SVG data URIs decode so naturalWidth is populated.
      await sleep(600);
      await tab.eval(() => Promise.all([...document.images].map(
        (i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })),
      )).then(() => 1));
      const result = await tab.eval(gridExtractor);
      const err = f.expect(result);
      if (err) { failed++; console.log(`  FAIL  ${f.name}\n        ${err}`); }
      else console.log(`  pass  ${f.name}`);
    } finally { await tab.close(); }
  }

  browser.cleanup();
  console.log(failed ? `\n${failed} of ${FIXTURES.length} FAILED` : `\nall ${FIXTURES.length} passed`);
  process.exit(failed ? 1 : 0);
})();
