import React from 'react';

export type TeamAnswerOption = {
  key: string;
  label: string;
};

export type TeamCheck = {
  id: string;
  question: string;
  options: TeamAnswerOption[];
};

export type TeamLevel = {
  id: number;
  title: string;
  act: 1 | 2;
  content: React.ReactNode;
  whyLater: string;
  checks: TeamCheck[];
};

// MUST stay identical to ANSWER_KEY in
// supabase/functions/marketer-signup/index.ts. The server copy is authoritative.
export const CORRECT_TEAM_ANSWERS: Record<string, string> = {
  '1': 'ref_site',
  '2': 'apply_then_pay',
  '3': 'round_robin_even',
  '4': 'team_transparent',
  '5': 'pending_waiting',
  '6': 'auto_whatsapp',
  '7': 'spot_on_reveal_date',
  '8': 'resend_both_channels',
  '9': 'official_link_only',
  '10': 'stays_with_me',
  '11': 'pitch_other_date_shift',
  '12': 'days_after_event',
  '13a': 'never_pushy',
  '13b': 'only_my_leads',
};

const Copy = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 13, color: '#3f3f46', fontSize: 14.25, lineHeight: 1.65 }}>
    {children}
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => <p style={{ margin: 0 }}>{children}</p>;

export const TEAM_LEVELS: TeamLevel[] = [
  {
    id: 1,
    title: 'What does a customer see on chaptera.in?',
    act: 1,
    whyLater: "Anyone who redesigns this page needs to know where a first-time visitor gets confused. You're about to find out first-hand.",
    content: (
      <Copy>
        <P>Almost every lead you&apos;ll ever call found us the same way: they opened <strong>chaptera.in/plans</strong> from an Instagram link and browsed a plan.</P>
        <P>Take a look around the way a customer would. Open the <strong>Chill Sunday Meetup</strong> — the plan you&apos;ll most likely work first. Notice what they see — photos, what the meetup is like, who they&apos;ll meet, the meeting area (Nungambakkam), the dates, and the price (₹359).</P>
        <P>Two things to remember from this page:</P>
        <P><strong>1. The booking timeline.</strong> After booking, every customer gets a simple step-by-step timeline for their plan. One step on it matters a lot: the <strong>exact meeting spot is revealed on its own date</strong>, closer to the day — the page shows the area (Nungambakkam), but the exact spot arrives in the timeline. Customers ask about this constantly; now you know where they&apos;re looking.</P>
        <P><strong>2. This site is your reference manual too.</strong> When you&apos;re assigned to an event, chaptera.in/plans is where <em>you</em> check its details — dates, pickup points, pricing. If a lead asks something about the plan, the answer is on the same page they&apos;re looking at.</P>
      </Copy>
    ),
    checks: [{
      id: '1',
      question: "Where do you check the plan details of events you're assigned to?",
      options: [
        { key: 'ref_site', label: 'On chaptera.in/plans — the same page customers see' },
        { key: 'weekly_pdf', label: 'In a PDF the founder sends every week' },
        { key: 'admin_settings', label: 'In the admin panel settings tab' },
        { key: 'memorise', label: 'You memorise them during training' },
      ],
    }],
  },
  {
    id: 2,
    title: 'Apply for the meetup yourself',
    act: 1,
    whyLater: "You'll never design a booking flow well until you've been through one as the customer.",
    content: (
      <Copy>
        <P>Time to be the customer. Pick your Sunday and apply for the Chill Sunday Meetup — exactly the way a real customer would.</P>
        <P>Don&apos;t worry: <strong>this is practice.</strong> Your application isn&apos;t sent anywhere. It stays inside this training.</P>
      </Copy>
    ),
    checks: [{
      id: '2',
      question: 'What does a customer do to book a spot?',
      options: [
        { key: 'apply_then_pay', label: 'They apply on the website with their date and pickup point, then pay when invited' },
        { key: 'instagram_pay', label: 'They DM us on Instagram and pay there' },
        { key: 'phone_booking', label: 'They call a marketer to book over the phone' },
        { key: 'pay_then_date', label: 'They pay first and choose a date later' },
      ],
    }],
  },
  {
    id: 3,
    title: 'Who can see your leads?',
    act: 2,
    whyLater: 'Round-robin is a fairness rule. Anyone who manages a team here will one day have to decide how work gets shared out.',
    content: (
      <Copy>
        <P>This is <strong>My Leads</strong> — your side of the admin panel. Your application from Act 1 is sitting right there.</P>
        <P>How did it become <em>yours</em>? Automatically. Every new application is dealt to one of the event&apos;s marketers in strict rotation — an even split, no favourites, no grabbing. The system did it the second the application came in.</P>
        <P>And the other side of that coin: <strong>you only ever see your own leads.</strong> Other marketers can&apos;t see yours, and you can&apos;t see theirs. Your leads, your calls, your commission.</P>
      </Copy>
    ),
    checks: [{
      id: '3',
      question: 'How do new leads get distributed?',
      options: [
        { key: 'round_robin_even', label: "Automatically, split evenly between the event's marketers in rotation" },
        { key: 'founder_picks', label: 'The founder reads each one and picks a marketer' },
        { key: 'first_call', label: 'Whoever calls the lead first keeps them' },
        { key: 'everyone_sees', label: 'Everyone sees every lead and shares the work' },
      ],
    }],
  },
  {
    id: 4,
    title: 'What are all these tabs and cards?',
    act: 2,
    whyLater: "This page is our operations dashboard. Learn what's on it now; some of you will decide what goes on it next.",
    content: (
      <Copy>
        <P>Quick tour of the People page — you&apos;ll live here.</P>
        <P><strong>Call</strong> — your leads for the event, as cards. Everything you do starts here.<br /><strong>Doubts</strong> — questions from people who haven&apos;t applied yet (more on these in a later level).</P>
        <P>One more thing worth knowing: the <strong>team board</strong>. It shows every marketer&apos;s tickets sold and earnings. Nothing is hidden — you always know exactly where you stand, and what the person ahead of you is doing differently.</P>
      </Copy>
    ),
    checks: [{
      id: '4',
      question: 'What does the team board show?',
      options: [
        { key: 'team_transparent', label: "Every marketer's tickets sold and earnings — fully transparent" },
        { key: 'only_mine', label: "Only your own earnings, nobody else's" },
        { key: 'all_customers', label: 'The customers of every marketer' },
        { key: 'founder_profit', label: "The founder's profit on each event" },
      ],
    }],
  },
  {
    id: 5,
    title: 'What do the lead statuses mean?',
    act: 2,
    whyLater: "These eight words are the company's shared vocabulary. Every report, every meeting, every product decision uses them.",
    content: (
      <Copy>
        <P>Every lead card carries a status. The status tells you what&apos;s already happened — and what you should do next. Tap each one.</P>
      </Copy>
    ),
    checks: [{
      id: '5',
      question: 'A lead shows Pending. What does that mean?',
      options: [
        { key: 'pending_waiting', label: "They've applied and are waiting for you to call and approve them" },
        { key: 'paid_waiting', label: "They've paid and are waiting for event details" },
        { key: 'auto_rejected', label: 'The system rejected them automatically' },
        { key: 'only_doubt', label: 'They asked a question but never applied' },
      ],
    }],
  },
  {
    id: 6,
    title: 'What do you do with a new lead?',
    act: 2,
    whyLater: 'This is our core loop. Every improvement we ever make is a change to one step of it.',
    content: (
      <Copy>
        <P>Your lead — you, from Act 1 — is sitting at <code>Pending</code>. Here&apos;s the rhythm of the job:</P>
        <P><strong>Call first.</strong> Say hi, answer their questions, make sure the meetup fits them. Then, if it&apos;s a yes —</P>
        <P><strong>Press Approve.</strong> Watch what happens.</P>
      </Copy>
    ),
    checks: [{
      id: '6',
      question: 'Who sends the payment link when you approve a lead?',
      options: [
        { key: 'auto_whatsapp', label: 'The system sends it on WhatsApp automatically — I never send payment links' },
        { key: 'personal_whatsapp', label: 'I copy the link and WhatsApp it from my phone' },
        { key: 'founder_later', label: 'The founder sends it at the end of the day' },
        { key: 'email_request', label: 'The customer requests it by emailing us' },
      ],
    }],
  },
  {
    id: 7,
    title: 'What does the lead get after paying?',
    act: 2,
    whyLater: 'The messages and timeline they receive are our product too. When one confuses a customer, the person who notices is usually the one on the phone.',
    content: (
      <Copy>
        <P>The moment your lead pays, three things land on their side:</P>
        <P><strong>A WhatsApp confirmation</strong> — their booking is locked in.<br /><strong>A receipt</strong> — proof of payment, on the same page they paid on.<br /><strong>Their booking timeline</strong> — the step-by-step plan for the day.</P>
        <P>And remember the timeline&apos;s special step from Act 1: they know the area (Nungambakkam), but the exact <strong>meeting spot arrives on its own reveal date</strong>, closer to the day. So when a paid lead messages you asking <em>&ldquo;where exactly in Nungambakkam do we meet?&rdquo;</em> — you know the answer: <em>&ldquo;it&apos;ll appear in your timeline on the reveal date.&rdquo;</em> You&apos;ll get this question a lot. Now it&apos;s an easy one.</P>
      </Copy>
    ),
    checks: [{
      id: '7',
      question: 'A paid customer asks "where exactly do we meet?" What\'s the answer?',
      options: [
        { key: 'spot_on_reveal_date', label: 'The exact spot appears in their booking timeline on its reveal date' },
        { key: 'tell_on_call', label: 'You tell them the spot on the call — you always know it' },
        { key: 'email_support', label: 'They should email support to get the address' },
        { key: 'receipt_spot', label: 'The spot was in their payment receipt' },
      ],
    }],
  },
  {
    id: 8,
    title: "What if they don't pay after the invite?",
    act: 2,
    whyLater: 'Silence is data. A broken message or a confusing invite gets found here first.',
    content: (
      <Copy>
        <P>You approved them, the invite went out… and then: silence.</P>
        <P>Here&apos;s something important about automatic messages: <strong>they can fail.</strong> WhatsApp delivery isn&apos;t guaranteed — and some people see the message and simply drift. Either way, a silent lead is <em>not</em> a lost lead.</P>
        <P>The system watches for exactly this: if it&apos;s been <strong>24 hours since the invite</strong> and the lead has <strong>never even opened the payment page</strong>, the card gets a <code>Re-target</code> badge.</P>
        <P>Re-target leads unlock a button the others don&apos;t have: <strong>Resend details</strong>. One tap re-sends the full invite on <strong>WhatsApp and email both</strong>, with a tick for each channel once it&apos;s gone out. Two ways to reach them, so a delivery failure can&apos;t kill the deal.</P>
        <P>Then comes the part no system can do: <strong>your follow-up call.</strong> &ldquo;Hi! Just making sure the details reached you — anything I can clear up?&rdquo; That one call closes more silent leads than any reminder ever will.</P>
      </Copy>
    ),
    checks: [{
      id: '8',
      question: "A lead is flagged Re-target. What can you do that you can't do on other leads?",
      options: [
        { key: 'resend_both_channels', label: 'Use Resend details to re-send the invite on WhatsApp and email in one tap' },
        { key: 'personal_link', label: 'Send them the payment link from my personal WhatsApp' },
        { key: 'approve_twice', label: 'Approve them a second time' },
        { key: 'move_marketer', label: 'Move them to another marketer' },
      ],
    }],
  },
  {
    id: 9,
    title: 'What if they start paying… and stop? (or offer cash?)',
    act: 2,
    whyLater: 'Every abandoned payment is either a trust problem or a friction problem. Learning to tell which is a product skill.',
    content: (
      <Copy>
        <P>The opposite case: they <em>did</em> open the payment page — and then stopped. Cold feet about paying online. A UPI app that hung. A phone call that interrupted. It happens all the time.</P>
        <P>If a lead opens the payment page and doesn&apos;t finish, the card gets a <code>Cart abandoned</code> badge — and the system automatically sends them a WhatsApp nudge (and an email if we have one) with a link straight back to their payment.</P>
        <P>Your job is the <strong>trust call.</strong> Reassure them the payment page is our official one. Stay on the phone while they retry. When they complete it, the badge flips to <code>Recovered</code> — a save, and it counts just like any other paid ticket.</P>
        <P>One rule with no exceptions: <strong>we never take cash, and never personal UPI.</strong> Every rupee goes through the official payment link. If a lead says <em>&ldquo;can I just GPay you directly?&rdquo;</em> the answer is a friendly no — <em>&ldquo;our payment link is the only way, and it&apos;s also your booking confirmation and receipt.&rdquo;</em> Collecting money any other way is the fastest way off this team.</P>
      </Copy>
    ),
    checks: [{
      id: '9',
      question: 'A lead says "can I just GPay you the amount directly?" What do you say?',
      options: [
        { key: 'official_link_only', label: 'Friendly no — every payment goes through the official payment link, no exceptions' },
        { key: 'screenshot_ok', label: 'Yes, if they send a screenshot as proof' },
        { key: 'under_500', label: 'Yes, but only for amounts under ₹500' },
        { key: 'ask_founder', label: 'Ask the founder for permission first' },
      ],
    }],
  },
  {
    id: 10,
    title: 'The two kinds of doubts — and whose lead is it after?',
    act: 2,
    whyLater: "The Doubts tab is the rawest feed of what our website fails to explain. Read enough and you'll know exactly what to rewrite.",
    content: (
      <Copy>
        <P>People ask questions in two different places, and they land on your panel in two different ways:</P>
        <P><strong>Asked before applying</strong> → lands in the <strong>Doubts tab</strong>. They were browsing the website, had a question, and asked it without applying.</P>
        <P><strong>Asked after being invited</strong> (or after paying) → appears as an <strong>amber card pinned to their lead</strong> in the Call tab. The question travels with the person.</P>
        <P>Either way, you answer over WhatsApp or a call. And here&apos;s the question every new marketer asks: <em>&ldquo;if I solve someone&apos;s doubt and they then apply — whose lead are they?&rdquo;</em> <strong>Yours.</strong> The person stays with the marketer who helped them, from doubt to application to payment.</P>
        <P>One honest detail: a doubt shows <strong>Applied ✓</strong> only when the person actually submits an application. There&apos;s no &ldquo;mark as done&rdquo; button — the tick appears when the real thing happens.</P>
      </Copy>
    ),
    checks: [{
      id: '10',
      question: "You answer someone's doubt and they apply the next day. Whose lead are they?",
      options: [
        { key: 'stays_with_me', label: 'Mine — the person stays with the marketer who helped them' },
        { key: 'next_rotation', label: 'Whoever the rotation assigns next' },
        { key: 'founder_decides', label: 'The founder decides case by case' },
        { key: 'not_leads', label: "Nobody's — doubt-askers aren't leads" },
      ],
    }],
  },
  {
    id: 11,
    title: 'What if their date is full — or they want a different one?',
    act: 2,
    whyLater: "Which dates sell out and which don't is our demand data. It decides what we run next.",
    content: (
      <Copy>
        <P>Spots are counted <strong>per date</strong>, not per event. The meetup is a group of 25 — so the 2 Aug Sunday can sell out while 16 Aug still has room. It happens often.</P>
        <P>When a date fills up, people who applied for it land on the <strong>Waitlist</strong>. Most new marketers read &ldquo;waitlist&rdquo; as &ldquo;dead lead.&rdquo; It&apos;s the opposite — <strong>the waitlist is your hottest follow-up list.</strong> These people already decided they want to come. They&apos;re one phone call away from a booking.</P>
        <P>The play: call them, offer the other date — <em>&ldquo;the 2nd filled up fast, but I&apos;ve got spots on the 16th — same meetup, same spot&rdquo;</em> — and if they&apos;re in, <strong>shift their date right from the lead card.</strong> The system moves them off the waitlist automatically.</P>
        <P>Same tool works for anyone who just wants to switch dates. One limit: <strong>paid leads can&apos;t be shifted.</strong> Once money has moved, changes go through the founder.</P>
      </Copy>
    ),
    checks: [{
      id: '11',
      question: "Date A is sold out and your lead is on the waitlist. What's your play?",
      options: [
        { key: 'pitch_other_date_shift', label: 'Call them, offer date B, and shift their date — the system takes them off the waitlist' },
        { key: 'waitlist_closed', label: 'Nothing — waitlisted leads are closed' },
        { key: 'apply_again', label: 'Ask them to apply again from the website for date B' },
        { key: 'refund_rebook', label: 'Refund them so they can rebook' },
      ],
    }],
  },
  {
    id: 12,
    title: "Where's your money, and when does it arrive?",
    act: 2,
    whyLater: 'Commission per ticket, tickets per event — this is the unit economics of the business, seen from the inside.',
    content: (
      <Copy>
        <P>Every fully-paid ticket earns you a <strong>fixed amount per ticket</strong>. The default is ₹50 — some events set their own rate — and your dashboard always shows your exact number, so there&apos;s never a surprise.</P>
        <P>Your <strong>earnings banner</strong> sits right on top of My Leads: how much you&apos;ve earned this month and how many tickets you&apos;ve sold. It updates the moment a lead hits <code>Fully paid</code>.</P>
        <P>When does it reach your account? <strong>A few days after the event happens</strong> — not instantly at booking. The event runs, then you&apos;re paid for it. And your earnings history never changes after the fact: what you see is what you get.</P>
      </Copy>
    ),
    checks: [{
      id: '12',
      question: 'When does your commission reach your account?',
      options: [
        { key: 'days_after_event', label: 'A few days after the event happens' },
        { key: 'instant', label: 'Instantly, the moment the lead pays' },
        { key: 'monthly_first', label: 'On the 1st of every month' },
        { key: 'withdraw', label: 'Whenever I request a withdrawal' },
      ],
    }],
  },
  {
    id: 13,
    title: 'How we sound — and the rules',
    act: 2,
    whyLater: "How we sound on a call is the brand. Whatever you go on to do here, you'll be protecting it.",
    content: (
      <Copy>
        <P>Last level. This one&apos;s about who we are on the phone.</P>
        <P>chapter அ is a club people <em>want</em> into — not a call center chasing targets. So we never sound pushy, and we never sound desperate. No pressure lines, no fake urgency, no begging. We help people decide; we don&apos;t corner them. A lead who says &ldquo;not this time&rdquo; gets a warm &ldquo;no problem — next one, then,&rdquo; and remembers us kindly.</P>
        <P>And the rules that keep this whole thing trustworthy:</P>
        <P><strong>Customer details are confidential.</strong> Names and numbers never leave the panel — no personal contact lists, no adding leads to groups, no sharing.<br /><strong>Contact only through the booking process.</strong> Calls and messages about their booking — nothing else.<br /><strong>Only your own leads, ever.</strong></P>
        <P>You&apos;ll confirm this in writing on the next screen. Break these and the seat goes to someone on the bench — simple as that.</P>
      </Copy>
    ),
    checks: [
      {
        id: '13a',
        question: "A lead keeps hesitating on the call. What's our style?",
        options: [
          { key: 'never_pushy', label: 'Give them room, answer honestly, follow up warmly — never pressure' },
          { key: 'fake_urgency', label: "Create urgency: say spots are almost gone even if they aren't" },
          { key: 'secret_discount', label: 'Offer a secret discount to close them today' },
          { key: 'hand_off', label: 'Hand them to another marketer to try harder' },
        ],
      },
      {
        id: '13b',
        question: 'Whose leads can you see in the panel?',
        options: [
          { key: 'only_my_leads', label: "Only my own — and other marketers can't see mine" },
          { key: 'everyone', label: "Everyone's, so we can help each other" },
          { key: 'mine_founder', label: "My own plus the founder's" },
          { key: 'ask_nicely', label: "Anyone's, if I ask nicely" },
        ],
      },
    ],
  },
];
