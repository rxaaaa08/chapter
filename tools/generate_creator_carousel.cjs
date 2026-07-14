const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const W = 1080;
const H = 1350;
const OUT = path.join(process.cwd(), 'creator-carousel');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  cream: '#F7F3EA',
  yellow: '#FFD700',
  black: '#101010',
  white: '#FFFFFF',
  muted: '#66625B',
  line: '#D8D1C3',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lines(items, x, y, size, gap, opts = {}) {
  const { family = 'Arial, sans-serif', weight = 700, fill = C.black, anchor = 'start', italic = false, letter = 0 } = opts;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-style="${italic ? 'italic' : 'normal'}" letter-spacing="${letter}">${items.map((t, i) => `<tspan x="${x}" dy="${i ? gap : 0}">${esc(t)}</tspan>`).join('')}</text>`;
}

function header(n, dark = false) {
  const fg = dark ? C.white : C.black;
  return `<text x="72" y="76" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="${fg}" letter-spacing="1.4">chapter அ</text>
  <text x="1008" y="76" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${fg}" text-anchor="end">0${n} / 07</text>`;
}

function footer(text, dark = false) {
  const fg = dark ? '#D8D8D8' : C.muted;
  return `<line x1="72" y1="1258" x2="1008" y2="1258" stroke="${dark ? '#343434' : C.line}" stroke-width="2"/>
  <text x="72" y="1300" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${fg}">${esc(text)}</text>
  <text x="1008" y="1300" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${fg}" text-anchor="end">swipe →</text>`;
}

function frame(bg, body, n, footerText, dark = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="1080" height="1350" fill="${bg}"/>
  ${header(n, dark)}
  ${body}
  ${footer(footerText, dark)}
  </svg>`;
}

const slides = [
  frame(C.yellow, `
    <circle cx="910" cy="250" r="126" fill="none" stroke="${C.black}" stroke-width="5"/>
    <circle cx="910" cy="250" r="86" fill="none" stroke="${C.black}" stroke-width="2"/>
    <path d="M70 284 H1010" stroke="${C.black}" stroke-width="4"/>
    ${lines(['HIRING'], 72, 420, 54, 0, { letter: 5 })}
    ${lines(['CONTENT', 'CREATORS'], 68, 586, 156, 142, { family: 'Georgia, serif', weight: 900, letter: -7 })}
    <rect x="72" y="924" width="936" height="172" rx="86" fill="${C.black}"/>
    ${lines(['Create stories. Share experiences.', 'Earn when your community books.'], 540, 985, 31, 44, { fill: C.white, anchor: 'middle', weight: 700 })}
    <path d="M882 1108 l58 0 -18 -18 m18 18 -18 18" fill="none" stroke="${C.black}" stroke-width="5"/>
  `, 1, 'chapter அ creator programme', false),

  frame(C.cream, `
    <rect x="72" y="178" width="936" height="164" rx="34" fill="${C.black}"/>
    <circle cx="145" cy="260" r="34" fill="${C.yellow}"/>
    <path d="M130 260 h30 M145 245 v30" stroke="${C.black}" stroke-width="5"/>
    <text x="205" y="276" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${C.white}">chaptera.in/@yourhandle</text>
    ${lines(['YOUR CONTENT', 'DESERVES A LINK', 'THAT WORKS.'], 72, 500, 82, 92, { family: 'Georgia, serif', weight: 900, letter: -2 })}
    <rect x="72" y="828" width="9" height="224" fill="${C.yellow}"/>
    ${lines(['Every approved creator gets a personal link.', 'Share it in your bio, stories, reels or DMs.'], 112, 876, 34, 54, { weight: 650 })}
    <circle cx="917" cy="1070" r="92" fill="${C.yellow}"/>
    <path d="M870 1070 h94 M930 1038 l34 32 -34 32" fill="none" stroke="${C.black}" stroke-width="8"/>
  `, 2, 'one creator • one trackable link', false),

  frame(C.black, `
    ${lines(['HOW', 'ATTRIBUTION', 'WORKS'], 72, 248, 88, 94, { family: 'Georgia, serif', weight: 900, fill: C.white, letter: -2 })}
    ${[
      ['01', 'SHARE YOUR LINK', 'Use it wherever your community finds you.'],
      ['02', 'THEY EXPLORE &amp; BOOK', 'The visit is tracked within that session.'],
      ['03', 'THE ACTIVE LINK WINS', 'The creator link at booking gets the credit.'],
    ].map((r, i) => {
      const y = 620 + i * 182;
      return `<circle cx="126" cy="${y}" r="54" fill="${i === 2 ? C.yellow : '#262626'}" stroke="${C.yellow}" stroke-width="3"/>
        <text x="126" y="${y + 10}" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="${i === 2 ? C.black : C.yellow}" text-anchor="middle">${r[0]}</text>
        <text x="214" y="${y - 5}" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="${C.white}" letter-spacing="1">${r[1]}</text>
        <text x="214" y="${y + 39}" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#BFBFBF">${r[2]}</text>`;
    }).join('')}
    <rect x="72" y="1142" width="520" height="58" rx="29" fill="${C.yellow}"/>
    <text x="332" y="1180" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${C.black}" text-anchor="middle">SESSION-BASED • LAST-CLICK</text>
  `, 3, 'clear credit, without stale attribution', true),

  frame(C.cream, `
    <text x="74" y="362" font-family="Georgia, serif" font-size="326" font-weight="900" fill="${C.yellow}" letter-spacing="-24">8%</text>
    <path d="M70 410 H1010" stroke="${C.black}" stroke-width="4"/>
    ${lines(['EARN ON ELIGIBLE', 'EXPERIENCES'], 72, 542, 74, 82, { family: 'Georgia, serif', weight: 900, letter: -2 })}
    ${lines(['When a booking through your link is paid in full,', 'your commission is added automatically.'], 72, 770, 33, 49, { weight: 650 })}
    <rect x="72" y="930" width="936" height="132" rx="24" fill="${C.black}"/>
    ${lines(['Standard rate: 8%', 'Rate can vary by event • Creator-enabled events only'], 106, 978, 29, 45, { fill: C.white, weight: 700 })}
    <circle cx="926" cy="1128" r="65" fill="${C.yellow}"/><text x="926" y="1142" font-family="Arial" font-size="38" font-weight="900" fill="${C.black}" text-anchor="middle">₹</text>
  `, 4, 'earnings accrue after full payment', false),

  frame(C.yellow, `
    ${lines(['NO GUESSING.', 'SEE YOUR IMPACT.'], 72, 245, 83, 91, { family: 'Georgia, serif', weight: 900, letter: -2 })}
    <rect x="72" y="468" width="936" height="524" rx="38" fill="${C.black}"/>
    ${[
      ['CLICKS', '—', 'people opened your link'],
      ['BOOKINGS', '—', 'attributed bookings'],
      ['EARNINGS', '₹—', 'your transparent ledger'],
    ].map((r, i) => {
      const y = 550 + i * 132;
      return `<text x="118" y="${y}" font-family="Arial" font-size="23" font-weight="800" fill="#9A9A9A" letter-spacing="2">${r[0]}</text>
      <text x="118" y="${y + 65}" font-family="Georgia, serif" font-size="62" font-weight="900" fill="${C.white}">${r[1]}</text>
      <text x="340" y="${y + 51}" font-family="Arial" font-size="25" font-weight="600" fill="${C.white}">${r[2]}</text>
      ${i < 2 ? `<line x1="118" y1="${y + 91}" x2="962" y2="${y + 91}" stroke="#343434" stroke-width="2"/>` : ''}`;
    }).join('')}
    <rect x="72" y="1050" width="936" height="92" rx="46" fill="${C.cream}"/>
    <text x="540" y="1108" font-family="Arial" font-size="28" font-weight="900" fill="${C.black}" text-anchor="middle">DASHBOARD + TRANSPARENT LEADERBOARD</text>
  `, 5, 'track it at chaptera.in/creator', false),

  frame(C.cream, `
    ${lines(['WE’RE LOOKING', 'FOR CREATORS WHO…'], 72, 238, 74, 82, { family: 'Georgia, serif', weight: 900, letter: -2 })}
    ${[
      ['01', 'MAKE LIFESTYLE, TRAVEL,', 'CULTURE OR COMMUNITY CONTENT'],
      ['02', 'TURN REAL MOMENTS', 'INTO STORIES'],
      ['03', 'CARE ABOUT TRUST—', 'NOT JUST REACH'],
      ['04', 'SPEAK TO A CHENNAI', 'AUDIENCE'],
    ].map((r, i) => {
      const y = 520 + i * 156;
      return `<text x="72" y="${y}" font-family="Georgia, serif" font-size="44" font-weight="900" fill="${C.yellow}">${r[0]}</text>
      <text x="154" y="${y - 6}" font-family="Arial" font-size="30" font-weight="900" fill="${C.black}">${r[1]}</text>
      <text x="154" y="${y + 36}" font-family="Arial" font-size="30" font-weight="900" fill="${C.black}">${r[2]}</text>
      <line x1="72" y1="${y + 76}" x2="1008" y2="${y + 76}" stroke="${C.line}" stroke-width="2"/>`;
    }).join('')}
    <rect x="72" y="1140" width="396" height="62" rx="31" fill="${C.yellow}"/>
    <text x="270" y="1181" font-family="Arial" font-size="25" font-weight="900" fill="${C.black}" text-anchor="middle">MICRO-CREATORS WELCOME</text>
  `, 6, 'voice and trust matter more than vanity metrics', false),

  frame(C.black, `
    <circle cx="884" cy="248" r="144" fill="${C.yellow}"/>
    <path d="M828 248 h118 M905 207 l41 41 -41 41" fill="none" stroke="${C.black}" stroke-width="10"/>
    ${lines(['LET’S MAKE', 'PLANS PEOPLE', 'WANT TO JOIN.'], 72, 422, 91, 98, { family: 'Georgia, serif', weight: 900, fill: C.white, letter: -3 })}
    ${lines(['Apply to become a chapter அ creator.', 'Bring your voice. We’ll bring the experiences.'], 72, 788, 31, 47, { fill: '#CACACA', weight: 600 })}
    <rect x="72" y="940" width="936" height="150" rx="75" fill="${C.yellow}"/>
    <text x="540" y="1034" font-family="Arial" font-size="35" font-weight="900" fill="${C.black}" text-anchor="middle" letter-spacing="1">APPLY AT CHAPTERA.IN/CREATOR</text>
    <text x="72" y="1160" font-family="Arial" font-size="23" font-weight="700" fill="#8C8C8C">Content creators • Chennai • Now hiring</text>
  `, 7, 'chaptera.in/creator', true),
];

(async () => {
  for (let i = 0; i < slides.length; i += 1) {
    const base = `creator-carousel-${String(i + 1).padStart(2, '0')}`;
    const svgPath = path.join(OUT, `${base}.svg`);
    const pngPath = path.join(OUT, `${base}.png`);
    fs.writeFileSync(svgPath, slides[i]);
    await sharp(Buffer.from(slides[i])).png().toFile(pngPath);
  }
  console.log(`Generated ${slides.length} slides in ${OUT}`);
})();
