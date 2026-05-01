// WhatsApp auto-reply webhook
// Fires when someone sends "I need more details" via the wa.me link

const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WEBSITE_LINK    = 'https://chaptera.in';

export default async function handler(req, res) {

  // Meta one-time webhook verification
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // Incoming WhatsApp messages
  if (req.method === 'POST') {
    const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;

    if (messages?.length) {
      const msg  = messages[0];
      const from = msg.from;
      const text = (msg.text?.body ?? '').toLowerCase().trim();

      if (text.includes('i need more details')) {
        await sendWhatsAppMessage(
          from,
          `Hi! Here are all the details about Chaptera: ${WEBSITE_LINK}`
        );
      }
    }

    return res.status(200).send('OK');
  }

  res.status(405).send('Method not allowed');
}

async function sendWhatsAppMessage(to, message) {
  await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  );
}
