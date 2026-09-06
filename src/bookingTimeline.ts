// ─── BOOKING TIMELINE — ONE CANONICAL DEFINITION ─────────────────────────────
//
// The booking timeline is authored in the admin panel (Flow ▸ Timelines) and
// rendered to customers in three places:
//
//   1. /plans details overlay      (AppFlow.tsx)  — before anyone has paid
//   2. /invite booking sheet       (App.tsx)      — after an invitation
//   3. the PayU receipt warm note  (App.tsx)      — after a payment
//
// Until now each of those carried its OWN copy of the row tables, its own
// regexes for "which row is the balance row", and its own rules for which rows
// show a date. They drifted, and the drift is invisible to the admin: the
// editor happily offered a date picker on rows the customer never sees a date
// on (the group-chat row, and the payment row of every invite event), so dates
// were typed in that did nothing at all.
//
// Everything about the SHAPE of a timeline now lives here. Payment-stage
// filtering (advance paid vs balance due) deliberately stays in the screens —
// that's about where the customer is, not about what kind of event this is.

export type BookingStep = { label: string; value: string; date?: string };

/** What kind of event this is, as far as the timeline is concerned. */
export type TimelineModel = {
  /** 'invite' = native-application · 'open' = payu-hosted · 'other' = community/external */
  flow: 'invite' | 'open' | 'other';
  /** payment_mode = 'full' — a single payment, so there is no balance row. */
  fullPay: boolean;
  /** pay_at_venue — the balance is settled in person, so there is no due date. */
  payAtVenue: boolean;
};

/**
 * The job a row does. Everything downstream (which pill it gets, whether its
 * date is ever shown, which row the WhatsApp templates read) keys off this
 * instead of a row index, because row indexes move between models — the
 * meeting-spot row is index 3 on an invite split event and index 2 on an
 * invite single-payment one, and that off-by-one silently blanked the
 * meeting date in the /invite chat greeting for every single-payment event.
 */
export type StepRole =
  | 'application'  // vibe check → Request Invitation
  | 'payment'      // the advance, or the whole price on a single-payment event
  | 'balance'      // remaining balance
  | 'groupchat'    // pay-at-venue: you'll receive the plan group-chat link
  | 'meeting'      // you'll receive exact meeting spot details
  | 'social'       // the gold event-date card ({application_count} …)
  | 'other';

/**
 * The badge on the right-hand side of a row. 'date' is the ONLY one that means
 * "this row's date is shown to the customer" — every other value is a fixed
 * pill, and a date stored on such a row is dead data.
 */
export type StepBadge = 'now' | 'after-invitation' | 'after-advance' | 'at-venue' | 'event-date' | 'date';

export function timelineModel(ev: {
  booking_url?: string | null;
  bookingUrl?: string | null;
  payment_mode?: string | null;
  paymentMode?: string | null;
  pay_at_venue?: boolean | null;
  payAtVenue?: boolean | null;
}): TimelineModel {
  const url = String(ev.booking_url ?? ev.bookingUrl ?? '');
  const mode = String(ev.payment_mode ?? ev.paymentMode ?? 'split');
  const fullPay = mode === 'full';
  return {
    flow: url === 'native-application' ? 'invite' : url === 'payu-hosted' ? 'open' : 'other',
    fullPay,
    // A single payment leaves nothing to settle at the venue, so pay-at-venue is
    // only ever meaningful on a split event. Normalising it here stops every
    // caller from having to remember the `&& !isFull` guard.
    payAtVenue: !fullPay && !!(ev.pay_at_venue ?? ev.payAtVenue),
  };
}

const hay = (s: BookingStep) => `${s?.label ?? ''} ${s?.value ?? ''}`;

/** The single regex table. Order matters: group-chat before meeting, because
 *  the group-chat row also reads "you'll receive". */
export function stepRole(step: BookingStep): StepRole {
  const h = hay(step);
  if (/\{application_count\}/i.test(h)) return 'social';
  if (/vibe.?check|request.?invitation/i.test(h)) return 'application';
  if (/group[\s-]?chat/i.test(h)) return 'groupchat';
  if (/\{balance\}|\bbalance\b/i.test(h)) return 'balance';
  if (/\{advance\}|\{price\}/i.test(h)) return 'payment';
  if (/meeting\s*(spot|point)|you'?ll receive/i.test(h)) return 'meeting';
  return 'other';
}

/** True for rows that carry no customer-facing content of their own — blank
 *  rows, and the gold event-date card, which is rendered separately. */
export function isMetaStep(step: BookingStep, eventTitle = ''): boolean {
  const label = String(step?.label ?? '').trim();
  const value = String(step?.value ?? '').trim();
  if (!label && !value) return true;
  if (/\{application_count\}/i.test(`${label} ${value}`)) return true;
  return !label && !!eventTitle.trim() && value.toLowerCase() === eventTitle.trim().toLowerCase();
}

// ─── THE SIX SHAPES ───────────────────────────────────────────────────────────
// These are the tables the editor renders, the tables an unsaved timeline falls
// back to on the live site, and the tables a mode switch regenerates. There used
// to be four near-copies of them across three files.

export function defaultBookingSteps(model: TimelineModel, title: string): BookingStep[] {
  const planName = title || 'Your Plan Name';

  if (model.flow === 'invite') {
    const socialRow = { label: '{application_count} ppl have requested invitation', value: planName, date: '' };
    if (model.fullPay) {
      return [
        { label: 'vibe check',           value: 'Request Invitation',      date: '' },
        { label: "if you're invited",    value: '{price}',                 date: '' },
        { label: "you'll receive exact", value: 'Meeting Spot Details 📍', date: '' },
        socialRow,
      ];
    }
    // Invite + pay at venue: keep the application step, then the advance holds
    // the spot → the group chat opens immediately (the trust step that makes
    // settling in person feel safe) → the balance is settled at the venue. The
    // meeting-spot row is dropped on purpose: those details now arrive through
    // the group chat the guest has already joined.
    if (model.payAtVenue) {
      return [
        { label: 'vibe check',                  value: 'Request Invitation',   date: '' },
        { label: "if you're invited (advance)", value: '{advance}',            date: '' },
        { label: "you'll receive",              value: 'plan group-chat link', date: '' },
        { label: 'remaining balance',           value: '{balance}',            date: '' },
        socialRow,
      ];
    }
    return [
      { label: 'vibe check',                  value: 'Request Invitation',      date: '' },
      { label: "if you're invited (advance)", value: '{advance}',               date: '' },
      { label: 'remaining balance',           value: '{balance}',               date: '' },
      { label: "you'll receive exact",        value: 'Meeting Spot Details 📍', date: '' },
      socialRow,
    ];
  }

  if (model.flow === 'open') {
    // Open events pay immediately, so there is no application step.
    const socialRow = { label: '{application_count} going', value: planName, date: '' };
    if (model.fullPay) {
      return [
        { label: 'settle payment',       value: '{price}',                 date: '' },
        { label: "you'll receive exact", value: 'Meeting Spot Details 📍', date: '' },
        socialRow,
      ];
    }
    if (model.payAtVenue) {
      return [
        { label: 'pay advance',       value: '{advance}',            date: '' },
        { label: "you'll receive",    value: 'plan group-chat link', date: '' },
        { label: 'remaining balance', value: '{balance}',            date: '' },
        socialRow,
      ];
    }
    return [
      { label: 'Advance',              value: '{advance}',                date: '' },
      { label: 'remaining balance',    value: '{balance}',                date: '' },
      { label: "you'll receive exact", value: 'Meeting Point Details 📍', date: '' },
      socialRow,
    ];
  }

  // Community / external — free-form timelines, no fixed row count.
  if (model.payAtVenue) {
    return [
      { label: 'Advance',           value: '{advance}',            date: '' },
      { label: "you'll receive",    value: 'plan group-chat link', date: '' },
      { label: 'Remaining Balance', value: '{balance}',            date: '' },
    ];
  }
  return [
    { label: 'Advance',           value: '{advance}',                  date: '' },
    { label: 'Remaining Balance', value: '{balance}',                  date: '' },
    { label: 'Receive',           value: 'Pickup, stay & trip details', date: '' },
  ];
}

/** Invite and open events have a fixed number of rows — the admin can edit the
 *  wording but never add or remove a step. */
export function isFixedTimeline(model: TimelineModel): boolean {
  return model.flow === 'invite' || model.flow === 'open';
}

// ─── HEALING STALE STEPS ──────────────────────────────────────────────────────

/**
 * Do these stored steps still describe this kind of event?
 *
 * Steps are stored per date and per event and are NOT rewritten when the event's
 * flow, payment mode or pay-at-venue toggle changes — so a switch leaves the old
 * shape behind, and a copied event carries the source event's shape across
 * flows. Both happened on production: an open pay-at-venue event is live right
 * now whose event-level steps still say "vibe check → Request Invitation →
 * Meeting Spot Details".
 */
export function stepsMatchModel(steps: BookingStep[] | undefined | null, model: TimelineModel): boolean {
  if (!steps?.length) return false;
  if (!isFixedTimeline(model)) return true;   // free-form: whatever is stored is intended

  const roles = steps.map(stepRole);
  // The application row is what separates the two fixed flows.
  const hasApplication = roles.includes('application');
  if (model.flow === 'invite' && !hasApplication) return false;
  if (model.flow === 'open'   &&  hasApplication) return false;

  const hasBalance = roles.includes('balance');
  if (model.fullPay) return !hasBalance;
  if (!hasBalance) return false;
  // Pay at venue swaps the meeting-spot promise for the group-chat one. Without
  // this check, steps saved before the toggle was switched on still pass the
  // balance test and get reused verbatim — leaving the guest looking at a
  // meeting-spot row with a date a pay-at-venue event doesn't have.
  if (model.payAtVenue) return roles.includes('groupchat');
  return true;
}

/**
 * Carry dates across a shape change, for the rows whose job survives it.
 * Payment rows reset — their old deadlines belong to the old shape.
 */
export function carryStepDates(previous: BookingStep[] | undefined, next: BookingStep[]): BookingStep[] {
  const prevDateFor = (role: StepRole) =>
    (previous ?? []).find(s => stepRole(s) === role)?.date ?? '';
  return next.map(step => {
    const role = stepRole(step);
    if (role === 'meeting' || role === 'application' || role === 'social') {
      return { ...step, date: prevDateFor(role) };
    }
    return step;
  });
}

/**
 * What the customer should actually be shown. Use the stored steps when they
 * still describe this event, otherwise fall back to the model's own table.
 *
 * The admin editor has always done this; the live screens did not, which is how
 * the editor could show a correct timeline while the customer saw a stale one.
 */
export function resolveBookingSteps(
  stored: BookingStep[] | undefined | null,
  model: TimelineModel,
  title: string,
): BookingStep[] {
  if (stepsMatchModel(stored, model)) return stored as BookingStep[];
  return defaultBookingSteps(model, title);
}

/** Per-date steps win over event-level steps, but only if they're usable. */
export function resolveBookingStepsForDate(
  perDate: BookingStep[] | undefined | null,
  eventLevel: BookingStep[] | undefined | null,
  model: TimelineModel,
  title: string,
): BookingStep[] {
  if (stepsMatchModel(perDate, model)) return perDate as BookingStep[];
  return resolveBookingSteps(eventLevel, model, title);
}

// ─── BADGES — THE EDITOR/DISPLAY CONTRACT ─────────────────────────────────────

/**
 * The pill shown on a row's right-hand side, for both the admin editor and the
 * customer timeline. This is the whole point of the module: if the editor and
 * the live screen ask the same function, they cannot disagree about whether a
 * row has a date.
 *
 * `index` matters only for row 0, which is always "Now" — it's the thing the
 * customer is being asked to do on this screen.
 */
export function stepBadge(step: BookingStep, index: number, model: TimelineModel): StepBadge {
  const role = stepRole(step);
  if (role === 'social') return 'event-date';
  if (index === 0) return 'now';
  // Invite events cannot be paid for until an invitation arrives, so the payment
  // row has no deadline to set — nothing about it is a date.
  if (role === 'payment' && model.flow === 'invite') return 'after-invitation';
  // The group chat opens the moment the advance lands, not on a date.
  if (role === 'groupchat' && model.payAtVenue) return 'after-advance';
  // The balance is collected in person at the door.
  if (role === 'balance' && model.payAtVenue) return 'at-venue';
  return 'date';
}

/** True when the customer will ever see this row's stored date. */
export function stepShowsDate(step: BookingStep, index: number, model: TimelineModel): boolean {
  return stepBadge(step, index, model) === 'date';
}

/** The words on each fixed pill, so the editor and the live timeline can't
 *  describe the same state differently. */
export const BADGE_LABEL: Record<Exclude<StepBadge, 'date' | 'event-date'>, string> = {
  'now': 'Now',
  'after-invitation': 'After Invitation',
  'after-advance': 'After Advance',
  'at-venue': 'At the Venue',
};

/**
 * Strip dates the customer will never see, so they can't linger in the database
 * and be picked up later by something that reads by role — the WhatsApp
 * "you'll get details by …" parameter matches on "you'll receive", which the
 * group-chat row also says.
 */
export function stripDeadStepDates(steps: BookingStep[], model: TimelineModel): BookingStep[] {
  // The last row of a fixed timeline is the gold event-date card whatever its
  // wording — the editor shows the date switcher there, never a date input — so
  // it is stripped by POSITION as well as by role. An old row that lost its
  // {application_count} marker would otherwise keep a date nothing reads.
  //
  // Guarded on the array being COMPLETE, and it has to be: a short array that
  // predates the event-date row ends in the meeting-spot row instead, whose date
  // is real and displayed. (One such row is stored today, on an old Pondy event.)
  // The editor always pads to the full model length before saving, so this holds
  // for everything it writes.
  const lastIsEventDate = isFixedTimeline(model)
    && steps.length === defaultBookingSteps(model, '').length;
  return steps.map((step, i) => {
    if (lastIsEventDate && i === steps.length - 1) return { ...step, date: '' };
    return stepShowsDate(step, i, model) ? step : { ...step, date: '' };
  });
}
