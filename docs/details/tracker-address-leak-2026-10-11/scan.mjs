// Reads a seal.mjs log and reports, per tool, whether any made-up value left
// the page — in the request address, its body, or its Referer header.
//
// usage: node scan.mjs <out.json> [--show tool]
import { readFileSync } from 'node:fs';

const NEEDLES = { phone: '9000000001', name: 'Zztest', email: 'zztest@example.com', wa: 'ZZZZsyntheticZZZZ', txnid: 'ZZTXN0001', fragment: 'ZZFRAG1' };
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const show = process.argv.includes('--show') ? process.argv[process.argv.indexOf('--show') + 1] : null;

const variants = (s) => { const out = [s]; try { out.push(decodeURIComponent(s)); } catch { /* raw */ } try { out.push(decodeURIComponent(decodeURIComponent(s))); } catch { /* raw */ } return out.join('\n'); };

const byTool = {};
for (const r of data.log) {
  const t = (byTool[r.tool] ??= { requests: 0, leaks: {}, examples: [] });
  t.requests++;
  const hay = { address: variants(r.url), body: variants(r.body ?? ''), referer: variants(r.referer ?? '') };
  for (const [label, needle] of Object.entries(NEEDLES)) {
    for (const [where, text] of Object.entries(hay)) {
      if (text.toLowerCase().includes(needle.toLowerCase())) {
        const k = `${label} in ${where}`;
        t.leaks[k] = (t.leaks[k] ?? 0) + 1;
        if (t.examples.length < 4) {
          const i = text.toLowerCase().indexOf(needle.toLowerCase());
          t.examples.push(`[${r.phase}] ${r.method} ${r.url.split('?')[0]} … ${text.slice(Math.max(0, i - 90), i + needle.length + 40).replace(/\s+/g, ' ')}`);
        }
      }
    }
  }
}
console.log(`SCENARIO: ${data.scenario}`);
for (const [tool, t] of Object.entries(byTool)) {
  const leaks = Object.entries(t.leaks);
  console.log(`\n${tool.toUpperCase()}: ${t.requests} request(s) — ${leaks.length ? 'LEAK' : 'clean'}`);
  for (const [k, n] of leaks) console.log(`   ${k}: ${n}`);
  for (const e of t.examples) console.log(`   e.g. ${e}`);
}
console.log('\nPROBES:', JSON.stringify(data.probes, null, 1));
if (show) for (const r of data.log.filter((x) => x.tool === show)) console.log(`\n[${r.phase}] ${r.method} ${r.url}\n   referer=${r.referer}\n   body=${(r.body ?? '').slice(0, 1500)}`);
