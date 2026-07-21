// ─────────────────────────────────────────────────────────────────────────────
// creator-signup — self-serve creator onboarding (Phase 2)
// (proposal: creator-self-serve-onboarding-proposal.md §11)
//
// The trust boundary for self-serve creator signup. Everything a browser could
// lie about is re-checked here, server-side:
//   • WHO they are — the email is read from the verified Google auth token, never
//     from the request body. This is why "Continue with Google" comes first in the
//     flow: the login email IS the identity, so it can't be spoofed or typo'd.
//   • That they passed the quiz — the correct answers live here, not in the client.
//     A client-only quiz is trivially skippable via dev tools; this makes the pass
//     real (low stakes, but cheap to do right).
//   • That the handle is free + validly shaped, and this email isn't already a
//     creator. The affiliates UNIQUE constraints are the final race backstop.
//
// On success it inserts an affiliates row: active=true (auto-activate — link +
// dashboard work instantly; safe because commission only accrues on a real
// fully_paid booking on an affiliate_enabled event), reviewed_at=NULL (so the
// founder sees them as "NEW" in the admin Creators tray). No phone OTP — identity
// is the Google login; phone is an optional contact field.
//
// Deploy with default JWT verification ON: the caller is a signed-in Google user,
// so their token is a valid authenticated JWT. (Owner deploys — never from here.)
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;

// The quiz's correct answers, by stable token (order = question order). The client
// renders the questions (options shuffled for display) and submits the selected
// token per question; a pass requires this exact sequence. Keeping the answer key
// on the server is the whole point — the browser never decides who passed.
// Tokens map to the 5 questions in the onboarding quiz:
//   1 when you earn        → ticket booked through my link
//   2 how much             → up to 8% of the full ticket price
//   3 when paid            → monthly
//   4 creator dashboard    → chaptera.in/creator
//   5 where the link lands → the chapter அ website
const QUIZ_ANSWER_KEY = ['pay_through_link', 'eight_percent', 'monthly', 'creator_dashboard', 'experiences_page'];

// UPI VPA: an identifier, '@', then a handle/PSP. Deliberately loose — there are
// many valid PSP suffixes — but enough to reject obvious junk.
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN.test(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function reply(status: number, body: Record<string, unknown>, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// Normalise a handle exactly as the admin panel does, so what we validate is what
// an insert would accept (matches the affiliates_handle_format CHECK).
function normalizeHandle(value: unknown): string {
  return String(value ?? '').trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);
}

// Phone is required and follows the same rule as the invite-only application
// form: 10 digits, starts 6–9. Returns null for anything invalid/empty.
function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
    ?? req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  return forwarded.split(',')[0].trim();
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' }, cors);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return reply(401, { error: 'Please sign in with Google before creating your creator account.' }, cors);
  }

  // Two clients: one bound to the CALLER's token (to read their verified identity),
  // one with the service role (to write past RLS). The email only ever comes from
  // the first — the request body's "email", if any, is ignored.
  const authedClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  const email = userData?.user?.email?.trim().toLowerCase();
  if (userErr || !email) {
    return reply(401, { error: 'We could not verify your Google sign-in. Please sign in again.' }, cors);
  }

  // ── Parse + validate the submitted details ──
  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: 'invalid request' }, cors); }

  const name = String(body?.name ?? '').trim();
  const handle = normalizeHandle(body?.handle);
  const upi = String(body?.upi_id ?? '').trim();
  const phone = normalizePhone(body?.phone);
  const quiz = Array.isArray(body?.quiz_answers) ? body.quiz_answers.map((a: unknown) => String(a ?? '')) : [];

  if (name.length < 1 || name.length > 80) return reply(400, { error: 'Please enter your name.' }, cors);
  if (!/^[a-z0-9._]{1,40}$/.test(handle)) return reply(400, { error: 'Pick a handle using letters, numbers, dots or underscores.' }, cors);
  if (!UPI_RE.test(upi)) return reply(400, { error: 'Enter a valid UPI ID (looks like name@bank) so we can pay you.' }, cors);
  if (!phone) return reply(400, { error: 'Enter a valid 10-digit phone number.' }, cors);

  // Quiz: must match the server-held key exactly (all correct). This is the real
  // gate — the client-side check is only for UX.
  const passed = quiz.length === QUIZ_ANSWER_KEY.length && QUIZ_ANSWER_KEY.every((k, i) => quiz[i] === k);
  if (!passed) return reply(400, { error: 'QUIZ_FAILED', quiz_failed: true }, cors);

  // Light abuse guard: cap signups per IP so the endpoint can't be flooded with
  // junk creators. Reuses the shared rate-limit RPC. A limiter outage must not
  // block real signups, so a failed check is treated as "allowed".
  const { data: rl } = await admin.rpc('check_rate_limit', {
    p_kind: 'creator_signup_ip',
    p_key: clientIp(req),
    p_window_seconds: 600,
    p_max_requests: 5,
  });
  if (rl === false) return reply(429, { error: 'Too many signups from this network. Please try again in a few minutes.' }, cors);

  // ── Pre-checks for friendly messages (constraints are the real guarantee) ──
  // Already a creator with this Google email? Send them to sign in, don't dupe.
  const { data: existing } = await admin.from('affiliates').select('id').eq('email', email).maybeSingle();
  if (existing) {
    return reply(409, { error: 'ALREADY_CREATOR', already_creator: true }, cors);
  }
  // Handle taken (or malformed) — the SECURITY DEFINER RPC returns just a boolean.
  const { data: available } = await admin.rpc('handle_available', { p_handle: handle });
  if (available !== true) {
    return reply(409, { error: 'HANDLE_TAKEN', handle_taken: true }, cors);
  }

  // ── Insert. active=true (auto-activate), reviewed_at defaults NULL (= NEW). ──
  const { data: created, error: insertErr } = await admin
    .from('affiliates')
    .insert({ handle, name, email, upi_id: upi, phone, active: true })
    .select('id, handle')
    .single();

  if (insertErr) {
    // 23505 = a race lost the pre-check (someone grabbed the handle, or this email
    // signed up in a parallel request). Map to the same friendly errors.
    if ((insertErr as any).code === '23505') {
      const msg = String((insertErr as any).message ?? '').toLowerCase();
      if (msg.includes('email')) return reply(409, { error: 'ALREADY_CREATOR', already_creator: true }, cors);
      return reply(409, { error: 'HANDLE_TAKEN', handle_taken: true }, cors);
    }
    console.error('[creator-signup] insert failed', insertErr);
    return reply(500, { error: 'Could not create your creator account. Please try again.' }, cors);
  }

  return reply(200, { ok: true, handle: created.handle }, cors);
});
