// Ad Library ingest — receives one day's competitor observation from the
// founder's Mac and records it. META-ADS-HANDOFF.md §25, Phase 3.
//
// WHY THIS FUNCTION EXISTS AT ALL, rather than the script writing to Postgres
// directly: writing directly would mean the service-role key living on a
// laptop, i.e. the master credential for a production database with live
// customers handed to a competitor-research tool. This endpoint instead accepts
// a caller secret that is a credential to nothing else — the worst case if it
// leaks is junk competitor rows, which is recoverable.
//
// Deploy: npx supabase functions deploy ad-library-ingest --no-verify-jwt
// (--no-verify-jwt because the caller is a local script with no Supabase JWT;
// the secret below is what actually authenticates it, and it fails closed.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The database stores the SHA-256 HASH of the caller secret, never the secret
// itself. The script holds the plaintext (in the macOS keychain) and this
// function hashes what it receives before comparing.
//
// Why hashed, where `meta_alerts_secret` is plaintext: that one is read by
// pg_cron, which is Postgres itself and therefore has to be able to send the
// real value. Nothing inside the database needs to send this one — only a
// laptop does — so there is no reason for the usable value to exist server
// side at all. A database dump, a backup, or anyone who can read app_secrets
// then learns nothing usable.
const SECRET_NAME = 'ad_library_ingest_secret_sha256';

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-independent, early-exit-free comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type AdRow = {
  library_id?: string;
  started_running?: string | null;
  media_type?: string | null;
  video_duration_s?: number | null;
  video_asset_age_days?: number | null;
  creative_captured?: boolean;
  creative_path?: string | null;
  ad_text?: string | null;
};

type PageObservation = {
  page_id?: string;
  page_label?: string;
  // The page's REAL outcome, extractor invariants included. A page with
  // unresolved cards must report false, so a partly-broken read can never mark
  // ads as disappeared. See record_competitor_ads().
  ok?: boolean;
  ads?: AdRow[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, x-ad-library-secret' },
    });
  }
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // FAIL CLOSED. A run that cannot establish who called it must not proceed to
  // write, and the function can do no useful work without the database anyway.
  const { data: secretRow, error: secretErr } = await supabase
    .from('app_secrets').select('value').eq('name', SECRET_NAME).maybeSingle();

  if (secretErr || !secretRow?.value) {
    console.error('[ad-library-ingest] secret unreadable', secretErr?.message ?? 'missing row');
    return json({ ok: false, error: 'secret_unavailable' }, 503);
  }

  const presented = req.headers.get('x-ad-library-secret') ?? '';
  if (!presented || !timingSafeEqual(await sha256Hex(presented), secretRow.value.trim().toLowerCase())) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  let body: { pages?: PageObservation[]; action?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  // Read-back, for `capture.mjs --verify`. Returns just enough to compare the
  // two halves of the system — which library ids the ledger holds, and whether
  // it believes the creative is on the Mac. No creative ever passes through
  // here in either direction.
  if ((body as { action?: string })?.action === 'list') {
    const { data, error } = await supabase
      .from('competitor_ads')
      .select('library_id, page_label, disappeared_on, creative_captured, creative_path')
      .order('page_label');
    if (error) return json({ ok: false, error: error.message.slice(0, 200) }, 500);
    return json({ ok: true, action: 'list', rows: data ?? [] });
  }

  const pages = Array.isArray(body?.pages) ? body.pages : [];
  if (!pages.length) return json({ ok: false, error: 'no_pages' }, 400);

  const results: unknown[] = [];
  let failed = 0;

  for (const p of pages) {
    const label = (p.page_label ?? '').trim();
    if (!label) { failed++; results.push({ error: 'missing_page_label' }); continue; }

    // `ok` defaults to FALSE on purpose. A malformed payload that omitted the
    // flag must be treated as an unreliable read, never as authority to mark a
    // competitor's whole catalogue as dead.
    const ok = p.ok === true;

    const { data, error } = await supabase.rpc('record_competitor_ads', {
      p_page_id: p.page_id ?? null,
      p_page_label: label,
      p_ok: ok,
      p_ads: Array.isArray(p.ads) ? p.ads : [],
    });

    if (error) {
      failed++;
      console.error('[ad-library-ingest] record failed', label, error.message);
      results.push({ page_label: label, error: error.message.slice(0, 200) });
      continue;
    }
    results.push(data);
  }

  const out = { ok: failed === 0, pages: results.length, failed, results };
  console.log('[ad-library-ingest]', JSON.stringify(out));
  return json(out, failed ? 207 : 200);
});
