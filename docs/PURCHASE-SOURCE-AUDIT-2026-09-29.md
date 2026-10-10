# Where our purchases come from: audit of every paid booking

**Run:** 2026-09-29 (IST), read-only, against the live database, by an interactive Claude Code session at the owner's request. Nothing was changed. Test phones (`90000000xx`) were excluded.

**Question asked:** "how much purchases we have in the whole from the Superprofile DM automation", and where every other purchase came from.

## What the data can and cannot see

- **The website booking system starts 2026-06-06.** Anything sold before then (the owner counts 60+ events in total) went through other channels and is not in these tables.
- **Traffic-source tracking starts 2026-08-13** (`applications.attribution`, written by `src/attribution.ts` when the booking row is created). Before that date, the only source on record is a **creator link** (`applications.affiliate_id`, tracked since 2026-07-04).
- **A source is recorded only when the link carries a tag.** `src/attribution.ts` ~line 117 returns early for an untagged visit and keeps no referrer. So "untagged" means *arrived on a link with no tag*, not "unknown because tracking broke".
- **The source is stamped once, when the booking row is first created.** A person who first opens the form on an untagged link is untagged for good, even if a DM brought them to us earlier.
- **`payu_payments.source_url` cannot fill the gap.** It holds only `https://chaptera.in/` with no tag, on 33 rows, all from 2026-08-21 onward.
- **Visits carry no source at all.** Only bookings do. The visit-level version is local commit `4172411` ("attribute booking funnel steps to ads"), never pushed. Live, `flow_analytics.attribution` is empty on all ~24,000 rows. So we cannot see how many DM taps happen; we can only see how many turn into bookings.
- **"Collected online" is money received through PayU** (successful payments, matched to each booking by event + phone). A balance paid at the venue does not appear in it.

## Superprofile tagging, confirmed by the owner 2026-09-29

- **The owner puts a plain `chaptera.in/lifestyle` in the auto-DM. Superprofile adds `?utm_source=sp_auto_dm` to it by itself.** The owner confirmed this by clicking one of his own test auto-DM links.
- **Creators' codes are added by hand.** A creator's auto-DM uses their own link, e.g. `chaptera.in/@rat_roy_`, which becomes `/lifestyle?ref=rat_roy_`. When that creator also uses Superprofile, the booking carries both the DM tag and the creator code.
- **No reel has been tagged yet** (owner, 2026-09-29). The system can record a per-reel tag (`utm_content`), but it has been used only once, as a test (`reel_test_001`, 2026-09-19). Few reels are being posted right now, because work is focused on the Meta systems.

## Result 1: every paid booking since the booking system began

| Source | Paid bookings | Tickets | Collected online |
|---|---|---|---|
| **Before 13 Aug** · came through a creator link | 30 | 30 | ₹16,523 |
| **Before 13 Aug** · source not recorded (tracking didn't exist yet) | 48 | 48 | ₹18,421 |
| **Superprofile DM** · our own account's link | 12 | 12 | ₹2,819 |
| **Superprofile DM** · a creator's link | 2 | 2 | ₹674 |
| Creator link, no DM tag | 1 | 1 | ₹368 |
| Instagram bio link, or an Instagram referrer | 6 | 6 | ₹1,491 |
| **Untagged** link (since 13 Aug) | 28 | 31 | ₹4,921 |
| **Total** | **127** | **130** | **₹45,217** |

**Reconciliation:** 166 successful PayU payments total **₹45,217**. Every rupee is matched to a paid booking except one ₹1 payment, which is a test. Every paid booking matched at least one payment. There are more payments than bookings because split-payment events take an advance and a balance.

## Result 2: the period we CAN see (2026-08-13 → 2026-09-28): 49 paid bookings

| Source | Paid | Share |
|---|---|---|
| Superprofile DM (ours 12 + creators' 2) | 14 | 29% |
| Instagram bio link / IG referrer | 6 | 12% |
| Creator link without DM tag | 1 | 2% |
| Untagged | 28 | 57% |

**By event, same period** (DM · bio · untagged / total paid):

| Event | Sales window | DM | Bio | Untagged | Total |
|---|---|---|---|---|---|
| Founders Meet | 13–27 Aug | 9 | 2 | 9 | 20 |
| Chill Sunday Meetup | 13–16 Aug | 2 | 1 | 5 | 9 |
| Girls-Only Meet | 16–28 Sep | 1 | 1 | 7 | 9 |
| Sunrise at Kovalam | 14–15 Aug | 2 | 1 | 1 | 4 |
| Chill-pill in Himalayas | 31 Aug | 0 | 0 | 3 | 3 |
| Weekend Creator's Meet | 6–26 Sep | 0 | 1 | 2 | 3 |
| Girls Gossip Eve | 6 Sep | 0 | 0 | 1 | 1 |

(Untagged here counts bookings with no source and no creator code, so rows can differ by one from Result 1.)

## What the untagged group is NOT (checked)

Among the 27 paid bookings with no source record at all:
- only **1** was a recovered abandoned cart, and only **2** had ever abandoned. So the cart-abandonment WhatsApp link is not the explanation;
- only **2** had another booking row, for a different event, that came through a Superprofile DM. So "same person, earlier DM" explains almost none of them;
- **4** were repeat customers returning directly.

What they **could** be: a DM link opened later in another browser (the tag lives only in the visit where the link was opened), a link forwarded between friends, the site typed or found by search, or a story or WhatsApp-community link with no tag. The data cannot tell these apart. The Girls-Only Meet's 7 of 9 untagged, in a month with few reels, suggests word of mouth or community sharing, but that is a guess, not a finding.

## Negative results (so nobody re-checks them)

- `payu_payments.source_url` never contains a tag. It cannot recover pre-August sources.
- `flow_analytics.attribution` is empty on every row. Nothing about visit sources is recoverable there until commit `4172411` ships.
- No tag other than `sp_auto_dm`, `ig`, and the one `reel_test_001` test has ever been seen on a paid booking.

## Re-running this

The queries group paid `applications` (status `advance_paid` or `fully_paid`) by `attribution->>'utm_source'`, `affiliate_id` and `created_at < '2026-08-13'`. They sum `payu_payments.amount` where `status='success'`, matched on `event_slug` and `right(phone,10)`. Re-run after tagged reels go out: the Superprofile rows should then carry a `utm_content` per reel, which is what makes "revenue per reel" possible.
