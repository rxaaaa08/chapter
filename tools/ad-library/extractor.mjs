/**
 * The Ad Library grid extractor, and the invariants that keep it honest.
 * META-ADS-HANDOFF.md §25.2.
 *
 * Kept in its own module so `selftest.mjs` can run it against fixed HTML
 * fixtures. The live Ad Library is not a test environment: it changes without
 * notice, and on a day when a competitor happens to run one ad, a broken
 * extractor and a working one produce identical output.
 *
 * This function is serialised with .toString() and evaluated inside the page,
 * so it must not reference anything outside its own body.
 */
export const gridExtractor = () => {
  const ids = [...new Set(
    [...(document.body.innerText || '').matchAll(/Library ID:\s*(\d+)/g)].map((m) => m[1]),
  )];
  const all = [...document.querySelectorAll('*')];
  const ads = [];
  const problems = [];

  // INVARIANT 2 (see below): a media element belongs to exactly one ad.
  // Keyed on the DOM NODE, deliberately not on the URL — see the note in
  // capture.mjs about why URL equality is legitimate and node equality is not.
  const claimedBy = new Map();

  for (const libId of ids) {
    const holders = all.filter((e) => (e.innerText || '').includes(`Library ID: ${libId}`));
    const deepest = holders[holders.length - 1];
    if (!deepest) { problems.push({ libId, problem: 'no_element_contains_this_id' }); continue; }

    // INVARIANT 1: walk up to the smallest ancestor that contains exactly ONE
    // library id AND its own media. Exactly-one is what makes the card the
    // card: an ancestor holding two ids is a container of several ads, and
    // reading media from it would attribute one ad's creative to another.
    let node = deepest;
    let card = null;
    for (let hop = 0; hop < 25 && node; hop++) {
      const txt = node.innerText || '';
      const count = (txt.match(/Library ID:/g) || []).length;
      const hasMedia = node.querySelector('video')
        || [...node.querySelectorAll('img')].some((i) => i.naturalWidth >= 300);
      if (count === 1 && hasMedia) { card = node; break; }
      if (count > 1) break;              // walked past this card into its neighbours
      node = node.parentElement;
    }
    if (!card) { problems.push({ libId, problem: 'card_not_resolved' }); continue; }

    const v = card.querySelector('video');
    const img = [...card.querySelectorAll('img')]
      .filter((i) => i.naturalWidth >= 300)
      .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)[0];

    // INVARIANT 2: no DOM node may be claimed by two ads. Invariant 1 should
    // already make this impossible, so this is defence in depth — and it is the
    // assertion that would have caught the 2026-09-18 bug at its source, in the
    // page, before a single byte was downloaded.
    const mediaNode = v || img || null;
    if (mediaNode) {
      const owner = claimedBy.get(mediaNode);
      if (owner && owner !== libId) {
        problems.push({ libId, problem: 'media_already_claimed', claimedBy: owner });
        continue;                        // emit nothing rather than something wrong
      }
      claimedBy.set(mediaNode, libId);
    }

    const text = card.innerText || '';
    const pick = (re) => { const m = text.match(re); return m ? m[1].trim() : null; };

    ads.push({
      libraryId: libId,
      started: pick(/Started running on\s+([^\n·]+)/),
      activeTime: pick(/Total active time\s+([^\n]+)/),
      status: /\bActive\b/.test(text) ? 'active' : null,
      video: v && v.src ? { src: v.src, poster: v.poster || null } : null,
      image: img ? { src: img.src, w: img.naturalWidth, h: img.naturalHeight } : null,
      // INVARIANT 3: the id must appear in the card we actually read from.
      // Proves the text and the media came from the same subtree.
      idFoundInCard: text.includes(`Library ID: ${libId}`),
      text,
    });
  }

  // PROOF THE PAGE ACTUALLY RENDERED, and the reason it matters.
  // Zero ads is ambiguous: it means either "this competitor switched everything
  // off" or "the render failed / Meta throttled us". Those demand opposite
  // responses — the first should mark every ad disappeared, the second must
  // touch nothing. Meta's own results counter ("~3 results") is only present
  // once the app has really rendered, so its presence is the evidence that a
  // zero is a real zero. Without it the run reports ok:false and
  // record_competitor_ads() marks nothing as gone.
  const bodyText = document.body.innerText || '';
  const resultsMatch = bodyText.match(/~?\s*([\d,]+)\s+results?/i);

  return {
    ids,
    ads,
    problems,
    resultsLabel: resultsMatch ? resultsMatch[0].trim() : null,
    rendered: !!resultsMatch,
  };
};
