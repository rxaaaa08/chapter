// Generated user-journey maps for the admin Map tab.
//
// These are the "Reset to generated" baselines: what actually happens at every
// step of each flow, traced from the real code (AppFlow.tsx, App.tsx,
// PaymentOverlay.tsx and the supabase/functions/* edge functions). They seed
// the journey_maps table the first time the tab is opened and back the
// per-map "Reset" button afterwards — edits made in the UI live only in the
// DB row, so resetting restores this file's version.
//
// When a flow changes in code, update the matching nodes here (ask Claude to
// "refresh the journey map seeds") so Reset stays truthful.

export type JourneyKind = 'screen' | 'action' | 'system' | 'whatsapp' | 'email' | 'status' | 'issue';

export type JourneySeedNode = {
  id: string;
  type: 'journey';
  position: { x: number; y: number };
  data: { label: string; note?: string; kind: JourneyKind; verified?: boolean };
};

export type JourneySeedEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  // Lateral branches route out of a side handle so arrows don't loop
  // awkwardly: 'right' = source's right → target's left, 'left' = source's
  // left → target's right. Handle ids are defined in JourneyMap.tsx.
  sourceHandle?: string;
  targetHandle?: string;
};

export type JourneyMapSeed = {
  name: string;
  sort_order: number;
  nodes: JourneySeedNode[];
  edges: JourneySeedEdge[];
};

function n(
  id: string, x: number, y: number, kind: JourneyKind, label: string, note?: string,
): JourneySeedNode {
  return { id, type: 'journey', position: { x, y }, data: { label, note, kind, verified: false } };
}

function e(source: string, target: string, label?: string, side?: 'right' | 'left'): JourneySeedEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    label,
    ...(side === 'right' ? { sourceHandle: 'r', targetHandle: 'l' } : {}),
    ...(side === 'left' ? { sourceHandle: 'ls', targetHandle: 'rt' } : {}),
  };
}

// ── Map 1: Open event — booking, OTP & payment ───────────────────────────────

const openEventMap: JourneyMapSeed = {
  name: 'Open event — booking & OTP',
  sort_order: 1,
  nodes: [
    n('open-page', 420, 0, 'screen', 'Event page on /plans',
      'User lands via link or ad. Calendar shows per-date spots left.'),
    n('book-form', 420, 140, 'action', 'Fills booking form',
      'Name, phone, email, chosen date, city + pickup point. Phone is stored as its last 10 digits.'),
    n('tickets', 760, 140, 'action', 'Picks 1–5 tickets',
      'Pay-at-venue open events only. Every other event is always a single ticket. The server re-clamps the count to 1–5, so the browser cannot ask for more than five.'),
    n('dup-check', 420, 280, 'system', 'Duplicate check',
      'Has this phone already paid for this event? Pending and abandoned users are allowed to return.'),
    n('dup-blocked', 60, 280, 'screen', '“You’re already booked!”',
      'Another paid ticket is blocked when the existing application is advance_paid or fully_paid.'),
    n('otp-wa', 420, 420, 'whatsapp', 'OTP sent on WhatsApp',
      'open-event-otp function, sent through Wamafy with AiSensy as the fallback. 6-digit code, expires in 8 min. Limits: 2 per phone / 10 min, 5 per network / min.'),
    n('otp-email', 760, 420, 'email', 'Email code fallback',
      'Offered 30 s after the WhatsApp send, via Brevo, and only while that WhatsApp code is still valid. It has its own budget of 2 per email / 10 min, so the phone limit can never starve it.'),
    n('otp-enter', 420, 560, 'action', 'Enters the 6-digit code'),
    n('otp-wrong', 60, 560, 'issue', 'Wrong code',
      '5 wrong tries locks the code — user must request a fresh one.'),
    n('pending-app', 420, 700, 'status', 'Open application: pending / “In Progress”',
      'After OTP verification, the booking creates or updates an applications row before opening the bill.'),
    n('assign-open', 760, 700, 'system', 'Marketer auto-assigned',
      'The application row is dealt round-robin immediately. Every open-event lead has an owner when at least one active marketer is mapped.'),
    n('bill', 420, 840, 'screen', 'Bill page opens',
      'A bill_opens row is logged — this starts the 1-hour abandonment clock.'),
    n('abandon', 60, 980, 'system', 'No payment for 1 hour',
      'cart-abandonment cron (runs every 30 min) flags the booking cart_abandoned. Skips anyone who already paid.'),
    n('abandon-wa', 60, 1140, 'whatsapp', 'Cart-abandon WhatsApp',
      'car_abandon_deeplink2 template with name, event, chosen date + an /invite deeplink button.'),
    n('abandon-email', -280, 1140, 'email', 'Optional cart-abandon email',
      'Sent once if an email is on file. It is not required for the user to return or recover.'),
    n('recovered', 60, 1690, 'status', 'Pays later → “Recovered”',
      'recovered_at is set when someone pays after abandoning. Badge only — not a status.'),
    n('pay-click', 420, 980, 'action', 'Taps Pay',
      'create-payu-order recomputes the price on the server, so the browser can’t tamper with it.'),
    n('payu', 420, 1120, 'screen', 'PayU hosted checkout'),
    n('pay-success', 420, 1260, 'status', 'Payment success'),
    n('pay-fail', 760, 1260, 'status', 'Payment failed / cancelled'),
    n('pay-pending', 1060, 1260, 'status', 'Payment stuck “pending”',
      'Usually UPI: user approved late or PayU’s answer never arrived.'),
    n('callback', 420, 1400, 'system', 'payu-callback + payu-webhook',
      'Either or both may arrive, in any order. Whichever wins the claim flag sends the successful-payment WhatsApp exactly once.'),
    n('status-paid', 420, 1540, 'status', 'Status: advance_paid / fully_paid',
      'Single-payment events (payment_mode = full) jump straight to fully_paid.'),
    n('confirm-wa', 420, 1690, 'whatsapp', 'Confirmation WhatsApp',
      'advance_success_dpl / fullpaid_dpl / single_payment_sucess_dpl, by payment type. Pay-at-venue is the exception — its advance sends the single-payment template, because the advance template promises a balance deadline these events do not have.'),
    n('receipt', 760, 1540, 'screen', 'Success screen + receipt',
      'Browser is redirected to /plans?payment_status=success.'),
    n('fail-wa', 760, 1400, 'whatsapp', 'Payment-failed nudge',
      'payment_failure_dpl — sent once per application, not on every retry.'),
    n('retry', 1060, 1400, 'screen', 'Failed screen with retry bill',
      'Redirected to payment_status=failed; user can reopen the bill and try again.'),
    n('verify-cron', 1060, 1540, 'system', 'verify-pending-payments cron',
      'Every 15 min asks PayU directly about rows stuck pending 15 min–24 h, then resolves them exactly like the webhook would.'),
    n('fee-check', 760, 1690, 'system', 'Choose marketer fee tier',
      'Only at fully_paid. A doubt, cart abandonment, or failed payment means the sale needed help; the signals do not stack.'),
    n('fee-half', 760, 1830, 'status', 'Clean self-serve sale → half fee',
      'Half of the event’s full marketer fee, computed and rounded to the nearest rupee.'),
    n('fee-full', 1100, 1830, 'status', 'Friction sale → full fee',
      'Any doubt, cart abandonment, or failed payment pays the event’s full marketer fee, regardless of who recovered it.'),
    n('venue-balance', 420, 1830, 'action', 'Balance collected at the venue',
      'Pay-at-venue events take the rest on the day, online, and only for the guests who actually turned up. No balance reminder is sent and no balance step is unlocked.'),
    n('ask-doubt', 1160, 0, 'action', 'Asks a doubt about the open event',
      'The question is stored in doubt_submissions and appears under People ▸ Doubts.'),
    n('send-details', 1160, 140, 'action', 'Admin presses “Send Details”',
      'This follows the open-event path — it does not approve an invite-only lead or set re_target.'),
    n('doubt-lead', 1160, 280, 'status', 'Open-event lead: pending / “In Progress”',
      'Creates or repairs the open-event application as pending and retains the doubt’s marketer assignment.'),
    n('details-wa', 1040, 420, 'whatsapp', 'Details WhatsApp: resend_details',
      'Sends the user name and event name with the open-event reserve/contact deeplink buttons. resend_details on Wamafy; send_details_dpl if it falls back to AiSensy.'),
    n('details-email', 1360, 420, 'email', 'Open-event details email',
      'Sent alongside WhatsApp when an email address is available.'),
    n('doubt-answer', 1560, 140, 'whatsapp', 'Admin answers from the Chat view',
      'doubt_assisstance carries the question and the answer together, which is what lets us reply after WhatsApp’s 24-hour window has closed. It is a marketing-category template, so a guest who opted out will not receive it — that comes back as a failed status, not silence.'),
  ],
  edges: [
    e('open-page', 'book-form'),
    e('book-form', 'tickets', 'venue events', 'right'),
    e('book-form', 'dup-check'),
    e('dup-check', 'dup-blocked', 'already paid', 'left'),
    e('dup-check', 'otp-wa', 'eligible to continue'),
    e('otp-wa', 'otp-email', 'no code after 30 s?', 'right'),
    e('otp-wa', 'otp-enter'),
    e('otp-email', 'otp-enter'),
    e('otp-enter', 'otp-wrong', 'wrong (max 5)', 'left'),
    e('otp-enter', 'pending-app', 'verified ✓'),
    e('pending-app', 'assign-open', 'same insert', 'right'),
    e('pending-app', 'bill'),
    e('bill', 'abandon', 'closes / waits', 'left'),
    e('abandon', 'abandon-wa'),
    e('abandon', 'abandon-email', 'if email exists', 'left'),
    e('abandon-wa', 'pay-click', 'returns to pay'),
    e('abandon-email', 'pay-click', 'optional return', 'right'),
    e('bill', 'pay-click'),
    e('pay-click', 'payu'),
    e('payu', 'pay-success', 'success'),
    e('payu', 'pay-fail', 'failed', 'right'),
    e('payu', 'pay-pending', 'no answer', 'right'),
    e('pay-success', 'callback'),
    e('callback', 'status-paid'),
    e('callback', 'receipt', 'redirects browser', 'right'),
    e('status-paid', 'confirm-wa'),
    e('confirm-wa', 'venue-balance', 'pay at venue'),
    e('status-paid', 'recovered', 'if previously abandoned', 'left'),
    e('status-paid', 'fee-check', 'fully paid', 'right'),
    e('fee-check', 'fee-half', 'no friction'),
    e('fee-check', 'fee-full', 'any friction', 'right'),
    e('pay-fail', 'fail-wa'),
    e('pay-fail', 'retry', 'redirects', 'right'),
    e('pay-pending', 'verify-cron'),
    e('verify-cron', 'status-paid', 'if money moved', 'left'),
    e('verify-cron', 'fail-wa', 'if it failed', 'left'),
    e('open-page', 'ask-doubt', 'needs help', 'right'),
    e('ask-doubt', 'doubt-answer', 'answered in Chat', 'right'),
    e('ask-doubt', 'send-details'),
    e('send-details', 'doubt-lead'),
    e('send-details', 'details-wa', 'send WhatsApp'),
    e('send-details', 'details-email', 'if email exists', 'right'),
    e('details-wa', 'book-form', 'returns to /plans', 'left'),
    e('details-email', 'book-form', 'reserve CTA', 'left'),
  ],
};

// ── Map 2: Invite event — application to fully paid ──────────────────────────

const inviteEventMap: JourneyMapSeed = {
  name: 'Invite event — application to fully paid',
  sort_order: 2,
  nodes: [
    n('apply', 420, 0, 'screen', 'Application form on homepage',
      'Creates an applications row with status “pending”.'),
    n('assign', 780, 0, 'system', 'Marketer auto-assigned',
      'Round-robin at application time (by design — happens at pending, not on approval).'),
    n('review', 420, 140, 'action', 'Admin reviews in People tab'),
    n('waitlist', 60, 140, 'status', 'Status: waitlist'),
    n('rejected', 60, 280, 'status', 'Status: rejected'),
    n('invited', 420, 280, 'status', 'Status: invited'),
    n('invite-wa', 280, 430, 'whatsapp', 'WhatsApp invite (Wamafy)',
      'invitation_with_tracking, which counts who actually taps the button; while that template is still awaiting approval the send retries as invitation_with_contact instead. Deeplinks straight into /invite with phone + name prefilled. AiSensy is the fallback provider.'),
    n('invite-email', 600, 430, 'email', 'Email invite (Brevo)',
      'Sent alongside WhatsApp from info@chaptera.in.'),
    n('no-open', 60, 580, 'system', 'Ignored for 24 hours',
      'retarget-check cron (once daily, 7 pm IST): invited ≥ 24 h ago and never opened the bill → re_target flag, so marketers can call.'),
    n('invite-page', 420, 580, 'screen', '/invite — verify phone',
      'Poster/phone verification; the deeplink from WhatsApp/email skips it.'),
    n('bill2', 420, 720, 'screen', 'Bill page (advance)',
      'bill_opens row logged — invite events get a 2-hour abandonment clock.'),
    n('abandon2', 60, 860, 'system', 'Unpaid after 2 h → cart_abandoned',
      'Same cron as open events: WhatsApp + email re-engagement, once.'),
    n('recovered2', 60, 1010, 'status', 'Pays later → “Recovered”'),
    n('adv-paid', 420, 860, 'status', 'Status: advance_paid'),
    n('full-mode', 780, 860, 'system', 'Single-payment events',
      'payment_mode = “full”: one payment jumps straight to fully_paid with the paid-in-full WhatsApp.'),
    n('group-chat', 780, 1000, 'system', 'Group chat unlocks',
      'The WhatsApp group link appears once the ticket is fully paid — or as soon as the advance lands on a pay-at-venue event, since there is no online balance left to wait for.'),
    n('adv-wa', 420, 1000, 'whatsapp', 'Advance-paid WhatsApp',
      'advance_success_dpl — the amount plus the balance due date, taken from the BALANCE ROW of the chosen date’s timeline (found by what the row says, never by its position). Pay-at-venue events send the single-payment template instead, having no balance deadline to quote.'),
    n('timeline', 420, 1150, 'screen', 'Timeline on /invite',
      'Per-date booking_steps drive it, always the selected date’s. Rows are found by the JOB they do — balance, meeting spot — never by index: the row count and order change per event model (invite full=4/split=5, open full=3/split=4), so a fixed position reads the wrong row. src/bookingTimeline.ts defines the roles.'),
    n('balance', 420, 1300, 'action', 'Pays the balance',
      'Due date comes from the selected date’s timeline.'),
    n('fully2', 420, 1440, 'status', 'Status: fully_paid'),
    n('bal-wa', 420, 1580, 'whatsapp', 'Balance-paid WhatsApp (fullpaid_dpl)',
      'Split-payment events: fires when the balance payment completes the booking.'),
    n('full-wa', 700, 1580, 'whatsapp', 'Single-pay WhatsApp (single_payment_sucess_dpl)',
      'payment_mode = “full”: the one-payment confirmation — a different template from fullpaid_dpl.'),
    n('commission', 780, 1440, 'system', 'Marketer commission accrues',
      'Invite events always pay the event’s full marketer fee, once, when the ticket reaches fully_paid.'),
  ],
  edges: [
    e('apply', 'assign', 'on insert', 'right'),
    e('apply', 'review'),
    e('review', 'waitlist', 'waitlist', 'left'),
    e('review', 'invited', 'approve'),
    e('waitlist', 'rejected'),
    e('invited', 'invite-wa'),
    e('invited', 'invite-email'),
    e('invite-wa', 'no-open', 'never opens bill', 'left'),
    e('invite-wa', 'invite-page'),
    e('invite-email', 'invite-page'),
    e('invite-page', 'bill2'),
    e('bill2', 'abandon2', 'unpaid 2 h', 'left'),
    e('abandon2', 'recovered2', 'returns & pays'),
    e('bill2', 'adv-paid', 'pays advance'),
    e('bill2', 'full-mode', 'full events', 'right'),
    e('full-mode', 'fully2'),
    e('adv-paid', 'adv-wa'),
    e('adv-paid', 'group-chat', 'venue events unlock now', 'right'),
    e('adv-wa', 'timeline'),
    e('timeline', 'balance', 'balance step unlocks'),
    e('balance', 'fully2'),
    e('fully2', 'bal-wa', 'after balance'),
    e('fully2', 'full-wa', 'after single payment', 'right'),
    e('fully2', 'commission', '', 'right'),
  ],
};

// ── Map 3: Behind the scenes — crons & payment plumbing ──────────────────────

const backendMap: JourneyMapSeed = {
  name: 'Behind the scenes — crons & payments',
  sort_order: 3,
  nodes: [
    n('ladder', -60, 300, 'status', 'The status ladder',
      'pending → invited → advance_paid → fully_paid (+ waitlist / rejected). cart_abandoned, re_target and “Recovered” are display flags, never statuses.'),
    n('order', 420, 0, 'system', 'create-payu-order',
      'Recomputes the price on the server and writes a payu_payments row as “pending”.'),
    n('payu3', 420, 150, 'screen', 'PayU checkout'),
    n('cb', 260, 300, 'system', 'payu-callback',
      'The browser redirect after paying — flips the status and sends the user back to the site.'),
    n('wh', 580, 300, 'system', 'payu-webhook',
      'PayU’s server calls ours directly. Either can land first; a claim-flag makes sure exactly one WhatsApp is sent.'),
    n('flip', 420, 460, 'status', 'Application status flips',
      'advance → advance_paid · balance or full payment → fully_paid.'),
    n('msg', 420, 610, 'whatsapp', 'Confirmation WhatsApp',
      'One message only, no matter which path won the race.'),
    n('cron1', 940, 0, 'system', '⏱ verify-pending-payments · every 15 min',
      'Pulls the truth from PayU for payments stuck “pending” 15 min–24 h and resolves them exactly like the webhook — nothing gets silently lost.'),
    n('cron2', 940, 190, 'system', '⏱ cart-abandonment · every 30 min',
      'Bill opened, still unpaid past the window (open 1 h, invite 2 h) → cart_abandoned flag + WhatsApp (+ email if on file). Paid or already-nudged cases are skipped forever.'),
    n('cron3', 940, 400, 'system', '⏱ retarget-check · daily 7 pm IST',
      'Invite events only: invited ≥ 24 h ago and never opened the bill → re_target flag. Mutually exclusive with cart_abandoned by design.'),
    n('cron4', 940, 610, 'system', '⏱ capi-lead-sweep · every 15 min',
      'Re-reports to Meta any lead the browser failed to send, so ad reporting does not quietly lose sales it caused.'),
    n('bsp', 420, 760, 'whatsapp', 'Wamafy sends it, AiSensy backs it up',
      'Every WhatsApp message tries Wamafy first and falls back to AiSensy only if that is rejected. We own the WhatsApp number itself, so the templates and the quality rating survive a change of provider.'),
    n('sendlog', 420, 910, 'system', 'Every send is written down',
      'whatsapp_sends and email_sends record what went out and what came back — sent, delivered, read, clicked or failed. The email log doubles as the send guard: its row is claimed before the send, which is what stops a duplicate. Ticks show under People ▸ Call.'),
  ],
  edges: [
    e('order', 'payu3'),
    e('payu3', 'cb', 'browser redirect'),
    e('payu3', 'wh', 'server-to-server'),
    e('cb', 'flip'),
    e('wh', 'flip'),
    e('flip', 'msg', 'exactly once'),
    e('msg', 'bsp'),
    e('bsp', 'sendlog'),
    e('cron1', 'flip', 'resolves stuck payments', 'left'),
  ],
};

export const JOURNEY_MAP_SEEDS: JourneyMapSeed[] = [openEventMap, inviteEventMap, backendMap];
