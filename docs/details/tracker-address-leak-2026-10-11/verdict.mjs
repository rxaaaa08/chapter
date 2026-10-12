// One row per scenario: did any made-up personal value reach any outside tool?
import { readFileSync } from 'node:fs';
const PERSONAL = { phone: '9000000001', name: 'Zztest', email: 'zztest@example.com', wa: 'ZZZZsyntheticZZZZ', fragment: 'ZZFRAG1' };
const TOOLS = ['ga', 'contentsquare', 'meta', 'sentry', 'vercel', 'other'];
const v = (s) => { const o = [s]; try { o.push(decodeURIComponent(s)); } catch {} try { o.push(decodeURIComponent(decodeURIComponent(s))); } catch {} return o.join('\n').toLowerCase(); };
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const row = {};
  for (const t of TOOLS) {
    const reqs = d.log.filter((r) => r.tool === t && r.method !== 'OPTIONS');
    const hits = new Set();
    // The speed tool posts to our OWN domain, so the browser attaches the full page
    // address as Referer exactly as it does for every image and script the page
    // loads. That is the web host seeing its own traffic, not something a page
    // script can change, so only what the tool itself put in the request counts.
    for (const r of reqs) { const hay = v(r.url) + '\n' + v(r.body ?? '') + (t === 'vercel' ? '' : '\n' + v(r.referer ?? '')); for (const [k, n] of Object.entries(PERSONAL)) if (hay.includes(n.toLowerCase())) hits.add(k); }
    row[t] = reqs.length === 0 ? '—' : (hits.size ? `LEAK(${[...hits].join(',')})` : `clean·${reqs.length}`);
  }
  // Contentsquare's session recording travels on its own channel; show whether one ran.
  const rec = d.log.filter((r) => r.tool === 'contentsquare' && /\/recording/.test(r.url));
  const recHit = rec.some((r) => Object.values(PERSONAL).some((n) => v(r.url + '\n' + (r.body ?? '')).includes(n.toLowerCase())));
  row.rec = rec.length ? (recHit ? `LEAK·${rec.length}` : `clean·${rec.length}`) : 'none';
  const p = d.probes.afterLanding || d.probes.onSecondPage || {};
  console.log(`${d.scenario.replace(/^(AFTER \(prototype build\)|BEFORE \(live site\)) — /, '').slice(0, 78).padEnd(78)} | GA ${row.ga.padEnd(16)} CS ${row.contentsquare.padEnd(22)} Meta ${row.meta.padEnd(14)} Sentry ${row.sentry.padEnd(20)} Vercel ${row.vercel.padEnd(16)} recording ${row.rec.padEnd(9)} other ${row.other}`);
}
