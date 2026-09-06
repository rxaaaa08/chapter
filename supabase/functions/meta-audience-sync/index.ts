import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sha256Hex, normaliseEmail, normalisePhone, normaliseNamePart } from '../_shared/metaCapi.ts';

// meta-audience-sync
//
// Keeps three Meta Custom Audiences in step with our own customer records:
//   customers_all_paid   — exclude from prospecting
//   customers_completed  — lookalike seed
//   leads_unpaid         — retargeting
//
// WHY DIFF RATHER THAN RE-UPLOAD
// Meta's /users edge adds people and dedupes, so re-sending everyone every day
// would "work". It would also never REMOVE anybody — a lead who finally pays
// would stay in the retargeting audience forever, and we would keep paying to
// chase a customer we already have. So we track what we actually uploaded and
// send only the difference in each direction.
//
// verify_jwt is false: pg_cron calls this without a JWT. Deploy with
//   supabase functions deploy meta-audience-sync --no-verify-jwt
//
// ENV
//   META_ADS_ACCESS_TOKEN — needs ads_management. Creating an audience and
//                           writing members are WRITES; ads_read cannot do it.
//   META_AD_ACCOUNT_ID    — numeric, no act_ prefix.

const API_VERSION = 'v25.0';

// Meta accepts up to 10,000 rows per call. Ours are in the hundreds, so this
// only ever matters if the business grows two orders of magnitude — which is
// exactly when nobody will remember to add it.
const UPLOAD_BATCH = 5000;

// The order here IS the contract: every data row must line up with it exactly.
const SCHEMA = ['EMAIL', 'PHONE', 'FN', 'LN', 'CT', 'COUNTRY'] as const;

type Person = { phone: string; email: string | null; name: string | null; city: string | null };

// "Krutesh A" -> ['krutesh','a']. Mirrors splitName() in _shared/metaCapi.ts.
function splitName(full: string | null): [string | null, string | null] {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return [null, null];
  if (parts.length === 1) return [normaliseNamePart(parts[0]), null];
  return [normaliseNamePart(parts[0]), normaliseNamePart(parts[parts.length - 1])];
}

// Meta wants an empty string, not null, for a field we do not have. A missing
// field is fine; a null in the array shifts every later column by one.
async function hashOrBlank(v: string | null): Promise<string> {
  return v ? await sha256Hex(v) : '';
}

async function toRow(p: Person): Promise<string[]> {
  const [fn, ln] = splitName(p.name);
  return [
    await hashOrBlank(normaliseEmail(p.email)),
    await hashOrBlank(normalisePhone(p.phone)),
    await hashOrBlank(fn),
    await hashOrBlank(ln),
    await hashOrBlank(normaliseNamePart(p.city)),
    // Every customer is Indian. Hashed like everything else.
    await sha256Hex('in'),
  ];
}

type GraphResult = { ok: true; body: any } | { ok: false; status: number; code: number | null; subcode: number | null; message: string };

async function graph(path: string, token: string, body?: unknown, override?: 'delete'): Promise<GraphResult> {
  const url = `https://graph.facebook.com/${API_VERSION}/${path}`
    + `?access_token=${encodeURIComponent(token)}`
    + (override ? `&method=${override}` : '');
  // POST with ?method=delete rather than a real DELETE: Graph supports the
  // override everywhere, while a DELETE carrying a body is stripped by some
  // intermediaries and then silently removes nobody.
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const parsed = await res.json().catch(() => null);
  if (res.ok && parsed && !parsed.error) return { ok: true, body: parsed };
  const e = parsed?.error ?? {};
  return {
    ok: false,
    status: res.status,
    code: e.code ?? null,
    subcode: e.error_subcode ?? null,
    message: e.message ?? `HTTP ${res.status}`,
  };
}

// The two failures worth naming, because the message alone does not tell a
// non-engineer what to do about them.
function explain(r: Extract<GraphResult, { ok: false }>, accountId: string): string {
  // Terms are accepted PER AD ACCOUNT, not per business. Accepting them on the
  // generic page signs for whichever account it happens to default to, which
  // with four accounts is usually not the one the token acts on — and the
  // second failure is identical to the first, so it reads as "it just doesn't
  // work". Naming the account in the link is the difference.
  if (r.code === 200 && (r.subcode === 1870034 || r.subcode === 1870090)) {
    return 'Custom Audience Terms are not accepted FOR THIS AD ACCOUNT (they are per-account, '
      + `not per-business). Accept at https://www.facebook.com/ads/manage/customaudiences/tos.php?act=${accountId}`;
  }
  if (r.code === 200 && r.subcode === 1870092) {
    return 'Meta Business Tools Terms have not been accepted for this business.';
  }
  if (r.code === 294 || r.code === 10) {
    return 'The access token lacks ads_management, or the system user lacks write access to the ad account.';
  }
  if (r.code === 200) {
    return 'Permission refused by Meta. Most likely the token is ads_read only — creating an audience is a write and needs ads_management.';
  }
  if (r.code === 190) return 'The access token is expired or revoked.';
  return r.message;
}

Deno.serve(async () => {
  const started = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const token = Deno.env.get('META_ADS_ACCESS_TOKEN');
  const accountId = Deno.env.get('META_AD_ACCOUNT_ID');
  if (!token || !accountId) {
    console.error('[meta-audience-sync] credentials not set');
    return new Response(JSON.stringify({ ok: false, error: 'missing_credentials' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: audiences, error: audErr } = await supabase
    .from('meta_audiences').select('*').order('key');
  if (audErr || !audiences) {
    return new Response(JSON.stringify({ ok: false, error: 'cannot_read_audiences', detail: audErr?.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const report: Record<string, unknown>[] = [];

  for (const aud of audiences) {
    const key = aud.key as string;
    let audienceId: string | null = aud.audience_id;
    // A translated message tells you what to do; the raw code tells you whether
    // the translation was right. Report both — the first run of this reported
    // "terms not accepted", the terms were accepted, and it said the same thing
    // again with nothing to distinguish a wrong diagnosis from a stale one.
    const fail = async (why: string, raw?: Extract<GraphResult, { ok: false }>) => {
      const detail = raw
        ? `${why} [meta code ${raw.code}${raw.subcode != null ? `/${raw.subcode}` : ''}: ${raw.message}]`
        : why;
      await supabase.from('meta_audiences')
        .update({ last_error: detail, last_synced_at: new Date().toISOString() }).eq('key', key);
      report.push({
        audience: key, ok: false, error: why,
        meta_code: raw?.code ?? null, meta_subcode: raw?.subcode ?? null, meta_message: raw?.message ?? null,
      });
    };

    try {
      // ── Create at Meta on first run ───────────────────────────────────────
      if (!audienceId) {
        const created = await graph(`act_${accountId}/customaudiences`, token, {
          name: aud.name,
          description: aud.description,
          subtype: 'CUSTOM',
          // We collected this ourselves from our own customers — which is both
          // true and the declaration Meta requires before it will accept a list.
          customer_file_source: 'USER_PROVIDED_ONLY',
        });
        if (!created.ok) { await fail(explain(created, accountId), created); continue; }
        audienceId = String(created.body.id);
        await supabase.from('meta_audiences').update({ audience_id: audienceId }).eq('key', key);
      }

      // ── What membership should be, versus what we uploaded ────────────────
      const { data: desiredRows, error: memErr } = await supabase
        .rpc('meta_audience_membership', { p_key: key });
      if (memErr) { await fail(`membership query failed: ${memErr.message}`); continue; }

      const desired = new Map<string, Person>();
      for (const p of (desiredRows ?? []) as Person[]) desired.set(p.phone, p);

      const { data: uploadedRows } = await supabase
        .from('meta_audience_members').select('phone')
        .eq('audience_key', key).is('removed_at', null);
      const uploaded = new Set((uploadedRows ?? []).map((r: any) => r.phone as string));

      const toAdd = [...desired.keys()].filter((ph) => !uploaded.has(ph));
      const toRemove = [...uploaded].filter((ph) => !desired.has(ph));

      // ── Additions ─────────────────────────────────────────────────────────
      let added = 0;
      for (let i = 0; i < toAdd.length; i += UPLOAD_BATCH) {
        const slice = toAdd.slice(i, i + UPLOAD_BATCH);
        const data = await Promise.all(slice.map((ph) => toRow(desired.get(ph)!)));
        const res = await graph(`${audienceId}/users`, token, { payload: { schema: SCHEMA, data } });
        if (!res.ok) { await fail(explain(res, accountId), res); throw new Error('add_failed'); }
        await supabase.from('meta_audience_members').upsert(
          slice.map((ph) => ({ audience_key: key, phone: ph, added_at: new Date().toISOString(), removed_at: null })),
          { onConflict: 'audience_key,phone' },
        );
        added += slice.length;
      }

      // ── Removals ──────────────────────────────────────────────────────────
      let removed = 0;
      for (let i = 0; i < toRemove.length; i += UPLOAD_BATCH) {
        const slice = toRemove.slice(i, i + UPLOAD_BATCH);
        // Removal only needs the key we match on, and phone is ours.
        const data = await Promise.all(slice.map(async (ph) => [
          '', await hashOrBlank(normalisePhone(ph)), '', '', '', await sha256Hex('in'),
        ]));
        const res = await graph(`${audienceId}/users`, token, { payload: { schema: SCHEMA, data } }, 'delete');
        if (!res.ok) { await fail(explain(res, accountId), res); throw new Error('remove_failed'); }
        for (const ph of slice) {
          await supabase.from('meta_audience_members')
            .update({ removed_at: new Date().toISOString() })
            .eq('audience_key', key).eq('phone', ph);
        }
        removed += slice.length;
      }

      await supabase.from('meta_audiences').update({
        member_count: desired.size,
        last_synced_at: new Date().toISOString(),
        last_error: null,
      }).eq('key', key);

      report.push({ audience: key, ok: true, audience_id: audienceId, members: desired.size, added, removed });
    } catch (e) {
      // fail() already recorded the reason; this only stops this audience from
      // taking the other two down with it.
      if (!(e instanceof Error && /_failed$/.test(e.message))) {
        await fail(e instanceof Error ? e.message : String(e));
      }
    }
  }

  const out = { ok: report.every((r) => r.ok), ms: Date.now() - started, audiences: report };
  console.log('[meta-audience-sync]', JSON.stringify(out));
  return new Response(JSON.stringify(out), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
});
