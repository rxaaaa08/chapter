// Every "message us on WhatsApp" link in the app — customers, creators and the
// core team alike.
//
// THE NUMBER IS THE WABA WAMAFY IS CONNECTED TO, and it is defined once here
// because getting it wrong is silent. A link pointing at any other number of
// ours lands on a phone nobody watches from the admin panel: the message never
// reaches whatsapp_inbound, never appears in People ▸ Chat, and never opens the
// 24-hour service window.
//
// That had happened to every link in the app, in two different ways. The
// booking flows pointed at 919940111564, the previous WhatsApp API number, long
// after the WABA moved. The contact card and the policy pages printed the
// founder's personal mobile — including one `tel:` link, a tap-to-call button
// on a number that is not answered. Both are retired; add nothing new by
// pasting a number, import from here.
export const BUSINESS_WHATSAPP_E164 = '918220888650';

// The same number as a reader sees it. Where it appears under a label that
// could be mistaken for a phone line, the copy says "(WhatsApp only)" — the
// number takes messages, not calls — and the link is always wa.me, never
// `tel:`.
export const BUSINESS_WHATSAPP_DISPLAY = '+91 8220888650';

// A wa.me link that opens WhatsApp with `text` already typed. The guest still
// has to press send — which is the point: their message is what opens the
// service window, so our reply can be a free-form message from People ▸ Chat
// instead of a paid template that a marketing opt-out would suppress.
export function businessWhatsAppUrl(text: string): string {
  return `https://wa.me/${BUSINESS_WHATSAPP_E164}?text=${encodeURIComponent(String(text ?? '').trim())}`;
}

// The doubt forms (/plans and /invite "Other Topic"). They still capture and
// store the question exactly as before — the row assigns the marketer on an
// open event, decides the full-vs-half marketer fee tier, and is one of the two
// accepted skips for the payment OTP gate. Only the handoff is new.
//
// A WhatsApp message carries no event — the Chat thread says so explicitly and
// refuses to guess one — so the plan name in the prefilled text is the only
// attribution the team gets, which is why it leads. The guest can edit it away
// before sending; the stored row keeps the real event either way.
export function doubtWhatsAppUrl(eventTitle: string, question: string): string {
  const plan = String(eventTitle ?? '').trim();
  const asked = String(question ?? '').trim();
  return businessWhatsAppUrl(plan
    ? `Hi! I have a doubt about ${plan}: ${asked}`
    : `Hi! I have a doubt: ${asked}`);
}
