// One line per request a tool tried to send: which event, and which address it reported.
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const pick = (u, body, k) => { const all = []; for (const src of [u.split('?')[1] ?? '', ...(body ?? '').split('\n')]) { try { for (const [kk, v] of new URLSearchParams(src)) if (kk === k) all.push(v); } catch {} } return all; };
for (const r of d.log) {
  if (r.method === 'OPTIONS') continue;
  if (r.tool === 'ga') { const lines = (r.body || '').split('\n').filter(Boolean); const ens = pick(r.url, r.body, 'en'); console.log(`GA   [${r.phase}] events=${ens.join(',')}  dl=${pick(r.url, '', 'dl')[0]}  dr=${pick(r.url, '', 'dr')[0] ?? ''}${lines.some(l=>/dl=|dr=/.test(l)) ? '  (body overrides: ' + lines.map(l => (new URLSearchParams(l).get('en')||'') + ' dl=' + (new URLSearchParams(l).get('dl')||'-') + ' dr=' + (new URLSearchParams(l).get('dr')||'-')).join(' | ') + ')' : ''}`); }
  else if (r.tool === 'meta') console.log(`META [${r.phase}] ev=${pick(r.url, r.body, 'ev')[0]}  dl=${pick(r.url, r.body, 'dl')[0]}  rl=${pick(r.url, r.body, 'rl')[0] ?? ''}  dlc=${pick(r.url, r.body, 'dlc')[0] ?? '-'}`);
  else if (r.tool === 'contentsquare') { const u = new URL(r.url); console.log(`CS   [${r.phase}] ${u.host}${u.pathname}  url=${u.searchParams.get('url') ?? ''}  dr=${u.searchParams.get('dr') ?? ''}  pvt=${u.searchParams.get('pvt') ?? ''}  bodyLen=${(r.body || '').length}`); }
  else if (r.tool === 'sentry') { const types = [...(r.body || '').matchAll(/"type":"(event|transaction|session|client_report|replay_event)"/g)].map(m => m[1]); console.log(`SENT [${r.phase}] items=${[...new Set(types)].join(',')}  bodyLen=${(r.body||'').length}`); }
  else if (r.tool === 'vercel') console.log(`VRCL [${r.phase}] ${new URL(r.url).pathname}  ${(r.body || '').slice(0, 420)}`);
  else if (r.tool === 'other') console.log(`OTHER[${r.phase}] ${r.method} ${r.url.slice(0, 200)}`);
  else if (r.tool === 'own-supabase' || r.tool === 'own-funnel') console.log(`OWN  [${r.phase}] ${new URL(r.url).pathname}  ${(r.body || '').slice(0, 230)}`);
}
console.log('PROBES', JSON.stringify(d.probes));
