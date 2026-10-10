# Founders Meet — Meta Ads playbook

**Written 2026-08-12. First ever paid ads for chapter அ. Event: Founders Meet, Aug 30, Chennai.**

Capacity going to 30. 8 sold. **22 seats to fill in 18 days.**

---

## The number to hold in your head

Profit per ticket is **₹100**. That is your break-even cost per ticket.

Realistically you'll land at **₹200–350 per ticket** on a first campaign. So plan on roughly
**₹2,800 spent to sell 8–14 tickets.** You fill the room and you're modestly down on paper versus
doing nothing — and you walk out owning four numbers you've never had: your real CPM in Chennai,
your real cold click-through rate, your real cold conversion rate, and your real CAC.

That's the trade. It's a fair one for a first campaign.

---

## STEP 0 — Pre-flight. Do these before anything else.

### 0a. Check the music on your reel ⚠️

**This is the single most common way an organic-reel-to-ad plan dies.**

If your reel uses trending or licensed audio from Instagram's music library, **you cannot run it as
an ad.** Instagram's music licensing covers organic posts only. When you try to promote it, Meta
will either reject the ad or silently strip the audio — and a founders-meet reel with the sound
ripped out converts at roughly zero.

**How to check:** open the reel in Ads Manager when you get to Step 4. If it doesn't appear in the
eligible-posts list, or a music warning shows, that's your answer.

**If it's licensed music, your options:**
- Re-upload the same video with royalty-free audio from **Meta Sound Collection** (free, inside Ads
  Manager). You lose the 4,000 views and comments, but you keep the creative that works.
- Or re-cut with a voiceover — often *better* for a founders audience, since it lets you say the
  actual pitch.

Check this today. Everything downstream depends on it.

### 0b. Raise capacity to 30 *before* you launch

Right now `events.total_capacity` = 15 with 8 sold. If you launch ads against a page showing
7 seats, you'll sell out mid-campaign and spend the rest of your budget driving people to a dead
page. Raise it first.

---

## STEP 1 — Set up the Meta account structure *(you, ~90 min)*

Do this today. None of it depends on me.

1. Go to `business.facebook.com` → create a **Business Portfolio**, name it "chapter அ".
   Never run ads off a personal profile.
2. **Settings → Accounts → Instagram** → connect your IG account.
3. **Settings → Accounts → Pages** → connect your Facebook Page.
   ⚠️ You need one. Instagram ads require a linked FB Page even if you never post there. No Page,
   no ads. Create an empty one if needed — 2 minutes.
4. **Settings → Ad Accounts → Create.**
   ⚠️ **Currency (INR), timezone (Asia/Kolkata), country (India) are permanent.** They cannot be
   changed later without building a whole new ad account. Get them right.
5. **Billing → Payment Settings** → add a card.
   ⚠️ Do this now, not on launch day. Indian cards often need RBI e-mandate approval, which can take
   a day to clear.
6. **Set a campaign spending limit.** Meta bills on a rising credit threshold, not upfront. A
   spending limit is what stops a misconfiguration from running away with your money. This is the
   most common first-timer disaster.

---

## STEP 2 — Tracking *(me, ~1 day)*

Without this, Meta cannot optimize for ticket sales — it has no idea who bought — and you can't
retarget or attribute anything. There is currently no Pixel and no UTM capture in the codebase.

What I install:
- Meta Pixel + `PageView`
- `ViewContent` on the event page, `InitiateCheckout` when payment opens, `Purchase` on success,
  each with value and `currency: 'INR'`
- Domain verification meta-tag for `chaptera.in` (needed or iOS conversions degrade badly)

Then in **Events Manager → Aggregated Event Measurement → Configure Web Events**, rank
**Purchase #1**, InitiateCheckout #2, ViewContent #3. This is what keeps tracking alive under
Apple's privacy rules.

Before you spend a rupee: verify the Pixel is firing with the **Meta Pixel Helper** Chrome extension.

**Worth knowing:** because payment completes on PayU's domain and a lot of your traffic is
Instagram's in-app browser, browser-side purchase tracking will undercount. The fix is a server-side
purchase event from `payu-callback`. Not required to launch — but it's why your Ads Manager numbers
will read lower than your real sales. Compare against your own admin panel, not Meta's count.

---

## STEP 3 — Build your audiences *(you, ~10 min)*

**Ads Manager → Audiences → Create Audience → Custom Audience**

Build these two. Neither needs the Pixel — Meta already has this data from your own account.

1. **Video viewers** — source: your Instagram account → select the Founders Meet reel → people who
   watched **≥ 50%**. From 4,000 views this is a warm pool that already showed interest in this
   exact event.
2. **Instagram engagers** — everyone who engaged with your IG account in the last **365 days**.

Then: **Create Audience → Lookalike** → source: your video-viewers audience → **India → Chennai → 1%**.
This is how you reach strangers who resemble people who already liked this event.

---

## STEP 4 — Build the campaign *(you, ~30 min)*

### Campaign level
| Setting | Value |
|---|---|
| Objective | **Sales** |
| Advantage Campaign Budget | **ON** |
| Campaign spending limit | **₹3,000** |

Do **not** pick Traffic or Engagement. They buy people who like watching reels, not people who buy
tickets. You'll get a beautiful view count and no sales.

### Ad set level
| Setting | Value |
|---|---|
| Conversion location | Website |
| Conversion event | **Purchase** |
| Daily budget | **₹200** |
| Schedule | **Aug 14 → Aug 28** |
| Location | **Chennai + 25km** |
| Age | **24–40** |
| Custom audiences | Video viewers + IG engagers + 1% Lookalike |
| Detailed targeting | Entrepreneurship, Startup company, Small business owners |
| Advantage+ audience | **ON** |
| Placements | **Advantage+ (automatic)** |

Run **one ad set**, not five. At this budget, splitting your spend means every ad set starves and
none of them learn anything.

### Ad level
- **Use Existing Post → Instagram tab → select your Founders Meet reel.** This is the important
  click. It keeps the 4,000 views and all the comments on one post — people read comments before
  trusting a stranger's meetup, and that social proof is the strongest asset you have.
- Destination: your Founders Meet booking page + UTM
- CTA: **Book Now**

---

## STEP 5 — Launch, then leave it alone

**Do not touch the campaign for 72 hours.** Every edit resets Meta's learning and restarts the
algorithm from scratch. The urge to fiddle on day one is the most common way beginners burn budget.

**Expect "Learning Limited" and do not panic.** Meta wants ~50 conversions per ad set per week to
optimize fully. With 22 seats you'll never hit that. The warning is permanent and normal here.

---

## STEP 6 — Day 4 read *(Aug 18)*

Look at exactly three numbers.

| Metric | Healthy | If it's below |
|---|---|---|
| Link CTR | > 1% | Creative problem — the reel isn't earning the click |
| Cost per link click | < ₹15 | Audience too narrow — widen it, drop detailed targeting |
| Landing → purchase | > 3% | Page or checkout problem, not an ads problem |

**Diagnosing by where it breaks:**
- **Low CTR** → the ad isn't working. Swap creative, don't touch targeting.
- **Good CTR, low conversion** → ads did their job, the page didn't. Note that ~30% of people who
  start your open-event form never clear the WhatsApp OTP. On traffic you paid ₹10-a-click for,
  that's your most expensive leak.
- **Both fine, high CAC** → it's just an economics problem, not a fixable campaign problem.

---

## STEP 7 — Scale or kill *(Aug 20 onward)*

- **CAC under ₹250** → raise budget by **50% at a time, no more.** Doubling a budget resets learning.
- **CAC ₹250–400** → hold at ₹200/day and ride it out to fill the room.
- **CAC over ₹500 by day 6** → stop. You've bought the four numbers. That was the real purchase.

---

## The seven mistakes that cost first-timers the most

1. Editing the campaign in the first 72 hours and resetting learning. **Don't touch it.**
2. No campaign spending limit.
3. Choosing Traffic over Purchase because Traffic "looks better." It buys junk clicks.
4. Building a new ad creative and throwing away the social proof on the existing reel.
5. Judging results on day 2.
6. Narrow targeting at low budget — CPM goes through the roof.
7. Spending before the Pixel is verified firing.
