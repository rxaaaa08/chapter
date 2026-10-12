#!/usr/bin/env node
// Makes the poster pictures the site actually serves.
//
// The originals are large PNG files in public/ (about 1.2 MB for a frame). The
// site shows a smaller copy of each, saved as WebP in src/assets/poster/, same
// width and height, about a tenth of the weight. The poster page waits for all
// nine layers before it shows anything, so their weight is the guest's wait.
// Measured 2026-10-12: docs/WEBSITE-OPTIMISATION-PHASES-2026-10-12.md, Phase 2.
//
// Run this after changing ANY poster PNG, or the site keeps showing the old
// picture:
//
//   npm install --no-save sharp
//   node scripts/poster-to-webp.cjs
//
// (`--no-save` keeps the picture tool out of package.json; it is only needed
// on the machine that runs this.) Then build as usual. Nothing else needs
// changing: the build names each file after its contents, so a changed picture
// gets a new address by itself and phones fetch it fresh.
//
// The originals stay in public/ on purpose. They are the source for this
// script, and a tab left open from before the change still asks for them.

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('The picture tool is missing. Run:  npm install --no-save sharp');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'src', 'assets', 'poster');

const LAYERS = ['frame', 'border-top', 'border-left', 'border-right', 'flower-left', 'flower-right', 'palm', 'lighthouse', 'beach'];

// [original in public/, copy in src/assets/poster/, optional 'exact']
const JOBS = [
  ...LAYERS.map((name) => [`poster-layers/${name}.png`, `lifestyle/${name}.webp`]),
  ...LAYERS.map((name) => [`galcode-poster-layers/${name}.png`, `galcode/${name}.webp`]),
  ['poster-layers/invite-frame.png', 'invite/frame.webp'],
  ['invite-verification-frame.png', 'invite/verification-frame.webp'],
  ['tc-agree-text.png', 'invite/tc-agree-text.webp'],
  ['tc-link-text.png', 'invite/tc-link-text.webp'],
  // Not a poster, but the same job. A logo is kept exact. At 3 KB it is
  // carried inside the app's script (src/PaymentOverlay.tsx), so the bill
  // page shows it with no request at all.
  ['upi-logo.png', '../upi-logo.webp', 'exact'],
];

// Quality 90 was chosen by eye on 2026-10-12: the letter's small text and the
// see-through edges were compared with the originals at twice the size and no
// difference could be found (86 and 92 were also indistinguishable). The
// see-through channel is kept exact.
const LOSSY = { quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true };

(async () => {
  let before = 0;
  let after = 0;
  for (const [from, to, keep] of JOBS) {
    const src = path.join(PUBLIC, from);
    const dest = path.join(OUT, to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const lossy = await sharp(src).webp(LOSSY).toBuffer();
    // Flat lettering on a clear background packs smaller as an exact copy
    // than as a near copy. When it does, the exact copy wins on both counts.
    const exact = await sharp(src).webp({ lossless: true, effort: 6 }).toBuffer();
    const best = keep === 'exact' || exact.length <= lossy.length ? exact : lossy;
    fs.writeFileSync(dest, best);
    const was = fs.statSync(src).size;
    before += was;
    after += best.length;
    const kb = (n) => `${String(Math.round(n / 1024)).padStart(5)} KB`;
    console.log(`${kb(was)} -> ${kb(best.length)}  ${best === exact ? 'exact' : 'q90  '}  ${to}`);
  }
  console.log(`\n${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB across ${JOBS.length} pictures`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
