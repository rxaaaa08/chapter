const endpoint = 'https://backend.aisensy.com/campaign/t1/api/v2';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

function normalizeDestination(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

const apiKey = requiredEnv('AISENSY_API_KEY');
const destination = normalizeDestination(requiredEnv('AISENSY_DESTINATION'));
const buttonParam = requiredEnv('AISENSY_BUTTON_PARAM');
const variant = optionalEnv('AISENSY_VARIANT', 'buttons');

const templateParams = [
  optionalEnv('AISENSY_PARAM_1', 'Test User'),
  optionalEnv('AISENSY_PARAM_2', 'Chill Sunday Meetup'),
  optionalEnv('AISENSY_PARAM_3', 'Sunday, July 19th'),
];

const payload = {
  apiKey,
  campaignName: 'cart_abandon_deeplink',
  destination,
  userName: templateParams[0],
  templateParams: [...templateParams],
  source: `manual-deeplink-test:${variant}`,
  media: {},
  buttons: [],
  carouselCards: [],
  location: {},
  attributes: {
    test: 'cart_abandon_deeplink',
    variant,
  },
  paramsFallbackValue: { FirstName: templateParams[0] },
};

if (variant === 'buttons') {
  payload.buttons = [
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        {
          type: 'text',
          text: buttonParam,
        },
      ],
    },
  ];
} else if (variant === 'flat') {
  payload.templateParams.push(buttonParam);
} else if (variant === 'buttonParams') {
  payload.buttonParams = [buttonParam];
} else {
  throw new Error(`Unknown AISENSY_VARIANT: ${variant}`);
}

const redactedPayload = {
  ...payload,
  apiKey: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
};

console.log('Sending AiSensy test payload:');
console.log(JSON.stringify(redactedPayload, null, 2));

if (process.env.AISENSY_DRY_RUN === '1') {
  console.log('AISENSY_DRY_RUN=1 set, not sending.');
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const responseBody = await response.text().catch(() => '');
console.log('AiSensy response:', response.status, response.statusText);
console.log(responseBody || '(empty body)');

if (!response.ok) {
  process.exitCode = 1;
}
