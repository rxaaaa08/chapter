// marketer-signup — self-serve call-marketer enrollment (Phase 2).
//
// The caller's Google session is the identity. The browser supplies training
// answers and contact details, but this function re-validates every field and
// every answer before invoking the atomic enroll_marketer database function.
//
// Deployed with JWT verification enabled. The handler also resolves the caller
// through auth.getUser before it touches service-role data.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.2';

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const FAILED_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Source of truth for the 15 comprehension checks in the panel tour. The client
// mirrors these stable tokens in src/TeamOnboardingTour.tsx, but only this copy
// grants entry. Changing either side REQUIRES redeploying this function, or a
// correct run-through is rejected as a failed quiz.
const ANSWER_KEY: Record<string, string> = {
  pending: 'read_then_invite',
  approve: 'auto_whatsapp',
  invited: 'invited_awaiting_payment',
  wait: 'answer_replies_only',
  retarget: 'call_then_resend',
  cart: 'trust_call_official_link',
  cash: 'official_link_only',
  waitlist: 'shift_date_unwaitlist',
  paidlock: 'paid_needs_founder',
  balance: 'marketer_chases',
  doubt: 'stays_with_me',
  board: 'team_transparent',
  payout: 'days_after_event',
  privacy: 'only_my_leads',
  tone: 'never_pushy',
};

type JsonObject = Record<string, unknown>;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN.test(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function reply(status: number, body: JsonObject, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '').slice(-10);
  return PHONE_RE.test(digits) ? digits : null;
}

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function recentAttemptTimestamps(value: unknown, nowMs: number): string[] {
  const attempts = Array.isArray(value) ? value : [];
  return attempts
    .map(value => String(value ?? ''))
    .filter(value => {
      const at = Date.parse(value);
      return Number.isFinite(at) && at >= nowMs - FAILED_WINDOW_MS && at <= nowMs + 60_000;
    });
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' }, cors);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return reply(401, { error: 'Please sign in with Google before creating your marketer account.' }, cors);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const authedClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: userData, error: userError } = await authedClient.auth.getUser(token);
  const email = userData?.user?.email?.trim().toLowerCase();
  if (userError || !email) {
    return reply(401, { error: 'We could not verify your Google sign-in. Please sign in again.' }, cors);
  }

  let body: JsonObject;
  try {
    body = asObject(await req.json());
  } catch {
    return reply(400, { error: 'invalid request' }, cors);
  }

  const name = String(body.name ?? '').trim();
  const phone = normalizePhone(body.phone);
  const upi = String(body.upi_id ?? '').trim();
  const answers = asObject(body.answers);

  if (name.length < 1 || name.length > 80) {
    return reply(400, { error: 'Please enter your name.' }, cors);
  }
  if (!phone) {
    return reply(400, { error: 'Enter a valid 10-digit phone number.' }, cors);
  }
  if (!UPI_RE.test(upi)) {
    return reply(400, { error: 'Enter a valid UPI ID (looks like name@bank) so we can pay you.' }, cors);
  }

  // Rate-limit state lives in a service-role-only table. The browser owns the
  // training progress JSON, so keeping attempts there would let any progress
  // save accidentally erase the counter.
  const { data: signup, error: signupReadError } = await admin
    .from('marketer_signups')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (signupReadError) {
    console.error('[marketer-signup] could not load signup', signupReadError);
    return reply(500, { error: 'Could not verify your training progress. Please try again.' }, cors);
  }

  const { data: attemptRow, error: attemptReadError } = await admin
    .from('marketer_signup_attempts')
    .select('attempts')
    .eq('email', email)
    .maybeSingle();

  if (attemptReadError) {
    console.error('[marketer-signup] could not load attempt history', attemptReadError);
    return reply(500, { error: 'Could not verify your training progress. Please try again.' }, cors);
  }

  const nowMs = Date.now();
  const recentAttempts = recentAttemptTimestamps(attemptRow?.attempts, nowMs);
  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    return reply(429, { error: 'Too many incorrect attempts. Please review the lessons and try again in 10 minutes.' }, cors);
  }

  const passed = Object.entries(ANSWER_KEY).every(
    ([checkId, tokenValue]) => String(answers[checkId] ?? '') === tokenValue,
  ) && Object.keys(answers).length >= Object.keys(ANSWER_KEY).length;

  if (!passed) {
    const nowIso = new Date(nowMs).toISOString();
    const { error: attemptError } = await admin
      .from('marketer_signup_attempts')
      .upsert({ email, attempts: [...recentAttempts, nowIso], updated_at: nowIso }, { onConflict: 'email' });
    if (attemptError) {
      console.error('[marketer-signup] could not record failed attempt', attemptError);
      return reply(500, { error: 'Could not record this attempt. Please try again.' }, cors);
    }
    return reply(400, { error: 'QUIZ_FAILED', quiz_failed: true }, cors);
  }

  const nowIso = new Date(nowMs).toISOString();
  const signupValues = {
    name,
    phone,
    upi_id: upi,
    quiz_passed_at: nowIso,
    agreed_at: nowIso,
    updated_at: nowIso,
  };
  const signupWrite = signup
    ? admin.from('marketer_signups').update(signupValues).eq('email', email)
    : admin.from('marketer_signups').insert({ email, ...signupValues });
  const { error: signupWriteError } = await signupWrite;
  if (signupWriteError) {
    console.error('[marketer-signup] could not save verified signup', signupWriteError);
    return reply(500, { error: 'Could not save your details. Please try again.' }, cors);
  }

  // The RPC is the only writer of the two panel-access rows. It creates the
  // call_marketers + admin_users pair in one Postgres transaction.
  const { data: enrollment, error: enrollmentError } = await admin.rpc('enroll_marketer', {
    p_email: email,
    p_name: name,
    p_phone: phone,
    p_upi: upi,
  });

  if (enrollmentError) {
    console.error('[marketer-signup] enrollment RPC failed', enrollmentError);
    return reply(500, { error: 'Could not create your marketer account. Please try again.' }, cors);
  }

  const result = asObject(enrollment);
  if (result.error === 'admin_email') {
    return reply(403, { error: 'This email is a founder account and cannot become a marketer.', admin_email: true }, cors);
  }
  if (result.error === 'inactive_marketer') {
    return reply(403, { error: 'This marketer account was previously paused. Please contact the founder.', inactive_marketer: true }, cors);
  }
  if (result.ok !== true) {
    console.error('[marketer-signup] unexpected enrollment response', result);
    return reply(500, { error: 'Could not create your marketer account. Please try again.' }, cors);
  }

  const { error: clearAttemptError } = await admin
    .from('marketer_signup_attempts')
    .delete()
    .eq('email', email);
  if (clearAttemptError) console.error('[marketer-signup] could not clear attempt history', clearAttemptError);

  return reply(200, { ok: true, already: result.already === true }, cors);
});
