// The guided tour over the mock People ▸ Call panel.
//
// One continuous walk, not a lesson map: each step spotlights one element of
// TeamOnboardingPanel.tsx by its data-tour key and explains it in a bubble.
// Some steps carry a comprehension check; a few ask the trainee to actually
// press the thing before moving on.
//
// CORRECT_TEAM_ANSWERS MUST stay byte-identical to ANSWER_KEY in
// supabase/functions/marketer-signup/index.ts. The server copy is the only one
// that grants an account — this one just marks the bubble red or green.

export type TourOption = { key: string; label: string };

export type TourCheck = {
  id: string;
  question: string;
  options: TourOption[];
};

export type TourStep = {
  /** data-tour attribute on the element to spotlight; null centres the bubble. */
  target: string | null;
  title: string;
  body: string[];
  /**
   * Trainee must actually perform this interaction before Next unlocks.
   * Kept as a literal union rather than `keyof PanelState` so this file stays
   * free of component imports — AdminPanel pulls it in just for TOUR_STEPS.length.
   */
  requires?: 'approved' | 'dateShifted' | 'noteLogged' | 'detailsResent';
  requiresHint?: string;
  checks?: TourCheck[];
};

export const CORRECT_TEAM_ANSWERS: Record<string, string> = {
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

export const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'This is your desk',
    body: [
      'What you are looking at is the real admin panel — the same screen you will open every day, with practice leads in it instead of real people.',
      'Nothing here sends a message or touches a real customer. Press anything you like.',
      'We will walk it one piece at a time: the columns first, then every kind of lead you will meet.',
    ],
  },
  {
    target: 'pills',
    title: 'Five views. You live in Call.',
    body: [
      'Call is where your leads are and where almost all your work happens.',
      'Doubts holds questions from people who have not applied yet. Chat is where you read and answer WhatsApp replies. Approval and Payments are for the founders.',
    ],
  },
  {
    target: 'head-name',
    title: 'Name — and what is attached to it',
    body: [
      'The person, plus small marks worth knowing: ×2 means they booked two tickets, and a yellow 💬 means they have an unanswered question.',
      'The grey line underneath is what they wrote about why they want to come. Read it before you dial — it is your opening line.',
    ],
  },
  {
    target: 'phone-link',
    title: 'Phone — tap it to call',
    body: ['Tapping the blue number dials it. That is the whole job, really: this column is the work.'],
  },
  {
    target: 'head-event',
    title: 'Event, meeting point, date',
    body: [
      'Which plan they applied for, where the group meets, and the date they picked.',
      'When an event runs on more than one date, this date becomes a dropdown you can change. That matters a lot in a minute.',
    ],
  },
  {
    target: 'head-status',
    title: 'User Status — your notes and the message trail',
    body: [
      'The dropdown is yours: after a call you record what happened, so the next person to look at the row knows.',
      'Under it sit the delivery ticks and, when there is one, their question. This column is everything you know about the conversation.',
    ],
  },
  {
    target: 'head-action',
    title: 'Action — the one button, or the status',
    body: [
      'A lead waiting on you shows a button. Everything else shows a coloured status telling you where they are.',
      'Learning those colours is most of learning this job. That is what the rest of this tour is.',
    ],
  },
  {
    target: 'row-aarav',
    title: 'Pending — someone new',
    body: [
      'Orange Pending means they applied and nobody has looked at them yet. Every lead starts here.',
      'You do not call at this stage. Your move is to read: the grey line under their name is why they said they want to come. That is the whole decision — is this someone we want in the group?',
      'If yes, you invite them. If not, you leave the row alone and never press Approve. There is no reject button, and that is on purpose: not inviting is the decline.',
    ],
    checks: [{
      id: 'pending',
      question: 'A lead shows Pending. What is your job on it?',
      options: [
        { key: 'read_then_invite', label: 'Read why they want to come, and invite them if they are a fit — no call yet' },
        { key: 'call_first', label: 'Call them first, then invite them if the call goes well' },
        { key: 'paid_waiting', label: 'Nothing — they have paid and are waiting for event details' },
        { key: 'only_doubt', label: 'Answer their question — they asked something but never applied' },
      ],
    }],
  },
  {
    target: 'approve-btn',
    title: 'Press Approve',
    body: [
      'Go ahead — press it. Watch what happens to the row.',
      'The moment you approve, the system sends their invite and payment link on WhatsApp and email. You never send a payment link yourself, ever.',
      'This also starts a 24-hour clock, which is what decides when you pick up the phone. Next step explains it.',
    ],
    requires: 'approved',
    requiresHint: 'Press ✓ Approve on Aarav to continue.',
    checks: [{
      id: 'approve',
      question: 'Who sends the payment link when you approve a lead?',
      options: [
        { key: 'auto_whatsapp', label: 'The system sends it automatically — I never send payment links myself' },
        { key: 'personal_whatsapp', label: 'I copy the link and WhatsApp it from my own phone' },
        { key: 'founder_later', label: 'The founder sends them at the end of the day' },
        { key: 'email_request', label: 'The customer emails us to request it' },
      ],
    }],
  },
  {
    target: 'badge-aarav',
    title: 'Invited — now you leave them alone',
    body: [
      'Blue Invited means the invite and payment link are with them and they have not paid yet.',
      'This is the part new marketers get wrong: you do not chase them now. Give them room to decide. Someone who applied an hour ago does not want a phone call about it.',
      'Two things do deserve you straight away, though: if they write back, and if the message never reached them. Both are on the next two steps.',
    ],
    checks: [
      {
        id: 'invited',
        question: 'What does a blue Invited status tell you?',
        options: [
          { key: 'invited_awaiting_payment', label: 'The invite and payment link are with them, and they have not paid yet' },
          { key: 'invited_paid', label: 'They have paid and are confirmed' },
          { key: 'invited_waiting_me', label: 'They are waiting for me to approve them' },
          { key: 'invited_rejected', label: 'They were turned down for this event' },
        ],
      },
      {
        id: 'wait',
        question: 'You invited someone an hour ago and they have not paid. What now?',
        options: [
          { key: 'answer_replies_only', label: 'Leave them to decide — only step in if they write back or the message failed to reach them' },
          { key: 'call_now', label: 'Call them now to make sure they got it' },
          { key: 'resend_now', label: 'Send the invite again so it is at the top of their chat' },
          { key: 'call_daily', label: 'Call once a day until they either pay or say no' },
        ],
      },
    ],
  },
  {
    target: 'ticks',
    title: 'The ticks — did the message land?',
    body: [
      'Under a status you will see two small rows: the top one is WhatsApp, the bottom one is email.',
      'They read like WhatsApp does. One grey tick means sent, two grey means it arrived on their phone, two coloured means they read it. A red circle means it never got through — that is the one that needs you.',
      'This is how you tell "they are ignoring me" apart from "they never got it". Those need completely different phone calls.',
      'And it is the one reason to act before the 24 hours are up: never sit and wait on a message that plainly never landed. A red mark means pick up the phone now.',
    ],
  },
  {
    target: 'reply-chip',
    title: 'A green row means they wrote back',
    body: [
      'When a lead replies on WhatsApp, their row turns green and their latest message sits here until somebody answers it.',
      'This one you answer straight away, whatever the 24-hour rule says — someone who writes to you is the warmest lead you have.',
      'You reply in the Chat view, where the whole thread lives. One catch worth knowing now: Chat only works for people who have messaged our official number first. If someone sent a doubt through the website and never opened WhatsApp with us, we cannot start that chat — you reach them from your own phone.',
    ],
  },
  {
    target: 'row-rohan',
    title: 'Re-target — this is where calling starts',
    body: [
      'Purple Re-target means 24 hours have gone by since the invite and they have never even opened the payment page. Cold silence.',
      'This is the moment the phone becomes your job. Everything before this was reading and waiting; from here on you are talking to people.',
      'Call and find out what is actually in the way. Usually it is a real question — is it safe, will I know anyone, what if my plans change. Answer it properly. You are helping them decide, not pushing them.',
    ],
  },
  {
    target: 'call-note',
    title: 'Log what happened on the call',
    body: [
      'After you hang up, record the outcome in the User Status dropdown on their row.',
      'Do it before anything else — you will notice the Resend Details button below is faded until you do. That is deliberate: the note comes first, then the follow-through.',
    ],
    requires: 'noteLogged',
    requiresHint: 'Pick a User Status on Rohan to continue.',
  },
  {
    target: 'resend-btn',
    title: 'Resend Details — their next step, right after the call',
    body: [
      'Now press it. One tap sends the details again on WhatsApp and email together.',
      'Think of this as the end of the conversation, not a reminder: you have just answered their questions on the phone, and this puts the link back in their hand while it is all still fresh. "I have just sent it across — have a look and let me know."',
      'Sending it cold, before you have spoken to them, is the wrong way round.',
    ],
    requires: 'detailsResent',
    requiresHint: 'Press Resend Details on Rohan to continue.',
    checks: [{
      id: 'retarget',
      question: 'A lead hits Re-target. What order do you work in?',
      options: [
        { key: 'call_then_resend', label: 'Call and answer their doubts, log the outcome, then Resend Details as their next step' },
        { key: 'resend_then_call', label: 'Press Resend Details first, then call to check it arrived' },
        { key: 'resend_only', label: 'Just press Resend Details — no call needed' },
        { key: 'personal_link', label: 'Send them the payment link from my personal WhatsApp' },
      ],
    }],
  },
  {
    target: 'row-sneha',
    title: 'Cart abandoned — they got cold feet',
    body: [
      'The opposite problem: they did open the payment page, and stopped. Nerves about paying online, a UPI app that hung, a phone call that interrupted.',
      'The system nudges them automatically. Your job is the trust call — reassure them the page is genuinely ours, and stay on the line while they retry.',
      'And one rule with no exceptions: we never take cash and never a personal UPI. Every rupee goes through the official link, which is also their receipt. Taking money any other way is the fastest way off this team.',
    ],
    checks: [
      {
        id: 'cart',
        question: 'A lead shows Cart abandoned. What happened, and what is your move?',
        options: [
          { key: 'trust_call_official_link', label: 'They opened the payment page and did not finish — make the trust call and stay on the line' },
          { key: 'never_opened', label: 'They never opened the payment page, so resend the invite' },
          { key: 'refund_them', label: 'They paid and asked for a refund' },
          { key: 'leave_alone', label: 'They said no — close the lead and move on' },
        ],
      },
      {
        id: 'cash',
        question: 'A lead asks "can I just GPay you the money directly?"',
        options: [
          { key: 'official_link_only', label: 'A friendly no — every payment goes through the official link, no exceptions' },
          { key: 'screenshot_ok', label: 'Yes, as long as they send a screenshot as proof' },
          { key: 'under_500', label: 'Yes, but only for amounts under ₹500' },
          { key: 'ask_founder', label: 'Ask the founder for permission first' },
        ],
      },
    ],
  },
  {
    target: 'row-ananya',
    title: 'Payment failed — call this one now',
    body: [
      'Red Payment failed means they genuinely tried and it did not go through. A card declined, a UPI timeout.',
      'This is the strongest signal on the whole screen — they had their money out. Do not wait for any 24-hour window here; call as soon as you see it.',
      'The system sends a retry link; your call just needs to catch them at a better moment.',
    ],
  },
  {
    target: 'row-vikram',
    title: 'Waitlist — their date sold out',
    body: [
      'Spots are counted per date, not per event. The 2nd can sell out while the 16th still has room, and people who applied for the full date land on Waitlist.',
      'Most new marketers read "waitlist" as "dead". It is the opposite — these people already decided they want to come. This is your hottest list.',
    ],
  },
  {
    target: 'date-select',
    title: 'Move them to the open date',
    body: [
      'Call them, offer the other date — "the 2nd filled up fast, but I have room on the 16th, same meetup" — and if they are in, change the date right here.',
      'Change it to Sun 16 Aug. The system takes them off the waitlist by itself.',
    ],
    requires: 'dateShifted',
    requiresHint: 'Switch Vikram to Sun 16 Aug to continue.',
    checks: [{
      id: 'waitlist',
      question: 'Your lead is waitlisted because their date sold out. What is the play?',
      options: [
        { key: 'shift_date_unwaitlist', label: 'Call, offer the other date, and change it here — the system unwaitlists them' },
        { key: 'waitlist_closed', label: 'Nothing — waitlisted leads are closed' },
        { key: 'apply_again', label: 'Ask them to apply again from the website for the other date' },
        { key: 'refund_rebook', label: 'Refund them so they can rebook' },
      ],
    }],
  },
  {
    target: 'row-karthik',
    title: 'Advance paid — half done, not done',
    body: [
      'Some trips are paid in two parts. Lime Advance paid means the first part is in and their spot is held; the balance comes later.',
      'This lead is still yours and still work. Following up until that balance is paid is your job — and it is also your own interest, because commission only lands when the ticket reads Fully paid.',
      'One thing you can no longer do here: once money has moved, the date is locked. Changes to a paid booking go through the founder.',
    ],
    checks: [
      {
        id: 'balance',
        question: 'A lead has paid the advance and still owes the balance. Whose job is that?',
        options: [
          { key: 'marketer_chases', label: 'Mine — I follow up until the balance is paid and it reads Fully paid' },
          { key: 'auto_only', label: 'Nobody’s — automatic reminders handle it from here' },
          { key: 'founder_job', label: 'The founder’s, once the advance is in' },
          { key: 'nothing_owed', label: 'Nothing to do — the advance is the whole ticket' },
        ],
      },
      {
        id: 'paidlock',
        question: 'A lead who has already paid wants to switch to a different date. What happens?',
        options: [
          { key: 'paid_needs_founder', label: 'I cannot change it — once money has moved it goes through the founder' },
          { key: 'shift_anyway', label: 'I change the date from the row like any other lead' },
          { key: 'refund_first', label: 'I refund them and ask them to book again' },
          { key: 'never_allowed', label: 'Paid customers can never change dates, so I tell them no' },
        ],
      },
    ],
  },
  {
    target: 'row-meera',
    title: 'Fully paid — this is when you earn',
    body: [
      'Green Fully paid means the money is in and the spot is confirmed. Commission only ever starts here — a lead who never fully pays earns nothing.',
      'Two marks on this row: ×2 means she booked two tickets, and the little loop icon in the badge means Recovered — she abandoned her payment and someone brought her back. A save counts exactly like any other sale.',
      'Your active work on her is done — no more chasing. The one thing that stays yours is her messages: if she writes in before the trip, you are still the person who answers.',
    ],
  },
  {
    target: 'row-ishaan',
    title: 'Rejected — closed, respectfully',
    body: [
      'Rejected means this one is not going ahead. There is no reject button on your screen; a founder sets this.',
      'It is here so you recognise it and know to leave the row alone.',
    ],
  },
  {
    target: 'doubt-card',
    title: 'Doubts — questions pinned to a person',
    body: [
      'An amber row with a 💬 means this person asked something and nobody has answered. The question sits right on their row.',
      'Questions from people who have not applied yet live in the Doubts view instead. Either way: answer the same day, by message or phone, whichever suits the question. An unanswered doubt goes cold fast.',
      'Remember the catch from earlier — if they have never messaged our WhatsApp number, you cannot reach them from Chat. Use your own phone.',
      'And the question every new marketer asks: if you solve someone’s doubt and they then apply — they are yours. The person stays with whoever helped them.',
    ],
    checks: [{
      id: 'doubt',
      question: 'You answer someone’s doubt and they apply the next day. Whose lead are they?',
      options: [
        { key: 'stays_with_me', label: 'Mine — the person stays with the marketer who helped them' },
        { key: 'next_rotation', label: 'Whoever the rotation assigns next' },
        { key: 'founder_decides', label: 'The founder decides case by case' },
        { key: 'not_leads', label: 'Nobody’s — people who ask questions are not leads' },
      ],
    }],
  },
  {
    target: 'earnings',
    title: 'Your earnings',
    body: [
      'How many tickets you have sold and what you have earned this month, updating the moment a lead hits Fully paid.',
      'The money reaches your account a few days after the event actually happens — not at booking. The event runs, then you are paid for it.',
    ],
    checks: [{
      id: 'payout',
      question: 'When does your commission actually reach your account?',
      options: [
        { key: 'days_after_event', label: 'A few days after the event happens' },
        { key: 'instant', label: 'Instantly, the moment the lead pays' },
        { key: 'monthly_first', label: 'On the 1st of every month' },
        { key: 'withdraw', label: 'Whenever I request a withdrawal' },
      ],
    }],
  },
  {
    target: 'board',
    title: 'The team board',
    body: [
      'Everyone’s sales and earnings, visible to everyone. Nothing is hidden here.',
      'You always know where you stand — and if someone is ahead of you, you can go ask them what they are doing differently.',
    ],
    checks: [{
      id: 'board',
      question: 'What does the team board show you?',
      options: [
        { key: 'team_transparent', label: 'Every marketer’s tickets sold and earnings — fully transparent' },
        { key: 'only_mine', label: 'Only my own earnings, nobody else’s' },
        { key: 'all_customers', label: 'The customers belonging to every marketer' },
        { key: 'founder_profit', label: 'The founder’s profit on each event' },
      ],
    }],
  },
  {
    target: 'table',
    title: 'Last thing: how we sound, and the rules',
    body: [
      'Every lead on this screen is yours alone. Other marketers cannot see them, and you cannot see theirs. New applications are dealt out automatically in rotation, so the work is shared evenly.',
      'chapter அ is a club people want into, not a call centre chasing targets. No pressure lines, no fake urgency, no begging. Someone who says "not this time" should get a warm "no problem, next one then" and remember us kindly.',
      'Customer details never leave this panel. No personal contact lists, no adding people to groups, no sharing. You will confirm this in writing on the next screen.',
    ],
    checks: [
      {
        id: 'privacy',
        question: 'Whose leads can you see in the panel?',
        options: [
          { key: 'only_my_leads', label: 'Only my own — and other marketers cannot see mine' },
          { key: 'everyone', label: 'Everyone’s, so we can help each other out' },
          { key: 'mine_founder', label: 'My own plus the founder’s' },
          { key: 'ask_nicely', label: 'Anyone’s, if I ask nicely' },
        ],
      },
      {
        id: 'tone',
        question: 'A lead keeps hesitating on the call. What is our style?',
        options: [
          { key: 'never_pushy', label: 'Give them room, answer honestly, follow up warmly — never pressure' },
          { key: 'fake_urgency', label: 'Create urgency — say spots are almost gone even if they are not' },
          { key: 'secret_discount', label: 'Offer a secret discount to close them today' },
          { key: 'hand_off', label: 'Hand them to another marketer to try harder' },
        ],
      },
    ],
  },
];
