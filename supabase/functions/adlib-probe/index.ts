// THROWAWAY PROBE — delete after use. META-ADS-HANDOFF.md §25.
// Settles one question with the token we already hold: does /ads_archive return
// ORDINARY COMMERCIAL ads for India, or only political/issue ones?
//
// Meta's doc says commercial ads return only for the UK/EU. This project's §9
// records that Meta's docs and Meta's API disagree in both directions, so the
// doc is not evidence. This asks the API.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API = 'v26.0';

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: row } = await supabase.from('app_secrets').select('value')
    .eq('name', 'ad_library_ingest_secret_sha256').maybeSingle();
  if (!row?.value) return new Response('secret unavailable', { status: 503 });
  const presented = req.headers.get('x-ad-library-secret') ?? '';
  if (!presented || (await sha256Hex(presented)) !== row.value) {
    return new Response('unauthorized', { status: 401 });
  }

  // This token belongs to the founder's identity-verified Ad Library access.
  // Keep it separate from META_ADS_ACCESS_TOKEN, which is the production
  // reporting system-user credential used by several unrelated functions.
  const token = Deno.env.get('META_ADLIB_ACCESS_TOKEN');
  if (!token) return new Response('no META_ADLIB_ACCESS_TOKEN', { status: 500 });

  const fields = 'id,page_id,page_name,ad_active_status,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_snapshot_url,publisher_platforms';
  const call = async (label: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ ...params, fields, limit: '5', access_token: token });
    const r = await fetch(`https://graph.facebook.com/${API}/ads_archive?${qs}`);
    const body = await r.json().catch(() => null);
    return {
      label,
      http: r.status,
      error: body?.error ? {
        message: body.error.message, code: body.error.code,
        subcode: body.error.error_subcode, type: body.error.type,
      } : null,
      returned: Array.isArray(body?.data) ? body.data.length : null,
      sample: Array.isArray(body?.data)
        ? body.data.slice(0, 3).map((a: any) => ({
          id: a.id, page: a.page_name,
            status: a.ad_active_status,
            started: a.ad_delivery_start_time,
            stopped: a.ad_delivery_stop_time,
            body: (a.ad_creative_bodies?.[0] ?? '').slice(0, 90),
          }))
        : null,
    };
  };

  const results = [];
  // 1. The real question: commercial ads, India, by keyword.
  results.push(await call('IN commercial, keyword "meetup"',
    { ad_reached_countries: '["IN"]', ad_type: 'ALL', search_terms: 'meetup', ad_active_status: 'ACTIVE' }));
  // 2. The known competitor, by page id — the sharpest version of the question.
  results.push(await call('IN commercial, thirdspace page id',
    { ad_reached_countries: '["IN"]', ad_type: 'ALL', search_page_ids: '["1042347828962277"]', ad_active_status: 'ACTIVE' }));
  // 2b. If active is empty, this distinguishes "nothing running today" from
  //     "Meta has no archive for this Indian commercial page".
  results.push(await call('IN commercial, thirdspace page id, all statuses',
    { ad_reached_countries: '["IN"]', ad_type: 'ALL', search_page_ids: '["1042347828962277"]', ad_active_status: 'ALL' }));
  // 3. SECOND READ (§9): if this works and #1/#2 are empty, the endpoint is
  //    reachable and the gap is genuinely the commercial/India restriction —
  //    not a dead token or a missing permission.
  results.push(await call('IN political (control)',
    { ad_reached_countries: '["IN"]', ad_type: 'POLITICAL_AND_ISSUE_ADS', search_terms: 'election', ad_active_status: 'ALL' }));
  // 4. THIRD READ: the UK, where the doc says all ad types DO return. If this
  //    works while India does not, the restriction is confirmed as geographic.
  results.push(await call('GB commercial (control)',
    { ad_reached_countries: '["GB"]', ad_type: 'ALL', search_terms: 'meetup', ad_active_status: 'ACTIVE' }));

  return new Response(JSON.stringify({ api: API, results }, null, 2),
    { headers: { 'Content-Type': 'application/json' } });
});
