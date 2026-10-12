// The poster pictures, as the site serves them.
//
// Each one is a WebP copy of a large PNG kept in public/, made by
// scripts/poster-to-webp.cjs (run it again after changing any poster PNG).
// Every layer is 874×1330 with its element already in place on a clear
// canvas, so stacking them at inset:0 rebuilds the poster exactly while each
// layer can still move by itself.
//
// They are imported, not written as addresses, on purpose: the build names
// each file after its contents, so a changed picture gets a new address by
// itself. That is what makes it safe for phones to keep them for a year
// (vercel.json, "/assets/") with no version tag to remember to bump.
//
// index.html asks for the poster a guest lands on before this script has
// arrived (search it for "poster-layer"). That list must name the same files
// as the lists below: add or remove a picture here and the same line changes
// there.

import lifestyleFrame from './assets/poster/lifestyle/frame.webp';
import lifestyleBorderTop from './assets/poster/lifestyle/border-top.webp';
import lifestyleBorderLeft from './assets/poster/lifestyle/border-left.webp';
import lifestyleBorderRight from './assets/poster/lifestyle/border-right.webp';
import lifestyleFlowerLeft from './assets/poster/lifestyle/flower-left.webp';
import lifestyleFlowerRight from './assets/poster/lifestyle/flower-right.webp';
import lifestylePalm from './assets/poster/lifestyle/palm.webp';
import lifestyleLighthouse from './assets/poster/lifestyle/lighthouse.webp';
import lifestyleBeach from './assets/poster/lifestyle/beach.webp';

import galcodeFrame from './assets/poster/galcode/frame.webp';
import galcodeBorderTop from './assets/poster/galcode/border-top.webp';
import galcodeBorderLeft from './assets/poster/galcode/border-left.webp';
import galcodeBorderRight from './assets/poster/galcode/border-right.webp';
import galcodeFlowerLeft from './assets/poster/galcode/flower-left.webp';
import galcodeFlowerRight from './assets/poster/galcode/flower-right.webp';
import galcodePalm from './assets/poster/galcode/palm.webp';
import galcodeLighthouse from './assets/poster/galcode/lighthouse.webp';
import galcodeBeach from './assets/poster/galcode/beach.webp';

import inviteFrame from './assets/poster/invite/frame.webp';
import inviteVerificationFrame from './assets/poster/invite/verification-frame.webp';
// "?no-inline": the build tucks any picture under 4 KB inside the app's script,
// and these two sit right at that line. They are only shown on the invite
// page, so they stay files of their own instead of riding in every guest's
// download.
import tcAgreeText from './assets/poster/invite/tc-agree-text.webp?no-inline';
import tcLinkText from './assets/poster/invite/tc-link-text.webp?no-inline';

export type PosterLayerSrc = { frame: string; borderTop: string; borderLeft: string; borderRight: string; flowerLeft: string; flowerRight: string; palm: string; lighthouse: string; beach: string };

export const POSTER_LAYER_SRC: PosterLayerSrc = {
  // The frame has the letter text baked in — no separate text layer needed.
  frame: lifestyleFrame,
  borderTop: lifestyleBorderTop,
  borderLeft: lifestyleBorderLeft,
  borderRight: lifestyleBorderRight,
  flowerLeft: lifestyleFlowerLeft,
  flowerRight: lifestyleFlowerRight,
  palm: lifestylePalm,
  lighthouse: lifestyleLighthouse,
  beach: lifestyleBeach,
};

export const GALCODE_POSTER_LAYER_SRC: PosterLayerSrc = {
  frame: galcodeFrame,
  borderTop: galcodeBorderTop,
  borderLeft: galcodeBorderLeft,
  borderRight: galcodeBorderRight,
  flowerLeft: galcodeFlowerLeft,
  flowerRight: galcodeFlowerRight,
  palm: galcodePalm,
  lighthouse: galcodeLighthouse,
  beach: galcodeBeach,
};

// The invite poster is the lifestyle one with its own frame.
export const INVITE_LAYER_SRC: PosterLayerSrc = {
  ...POSTER_LAYER_SRC,
  frame: inviteFrame,
};

export const INVITE_VERIFICATION_FRAME_SRC = inviteVerificationFrame;
export const TC_AGREE_TEXT_SRC = tcAgreeText;
export const TC_LINK_TEXT_SRC = tcLinkText;
