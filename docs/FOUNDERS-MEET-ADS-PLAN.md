# Founders Meet — Meta ads plan (revision 4.1, 2026-10-08)

**Status: the settings below are a plan. Since 2026-10-10 the campaign and its ad set are PUBLISHED and switched off, with the owner's 10 Oct choices where they differ from this plan; no ad is published yet. The live state and every difference are in section 5, "Published 2026-10-10".**

**Revision 4 rewrites this plan around two things:**

1. **The owner's new shape (2026-10-08):** Founders Meet becomes a repeating product. Two dates of the same plan are open on the website at once, and the ads run **every day with no date in them**. Revision 3 planned one event on one date with a countdown.
2. **The 91-lesson digest** (`docs/LESSONS-DIGEST-2026-10-04.md`, OpenClaw job `lessons-digest`, finished 2026-10-08). Every setting below is marked with what the lessons say. Claim codes in square brackets, such as [EV11], point into that file.

**Revision 3 is kept whole as `docs/FOUNDERS-MEET-ADS-PLAN-rev3-archive.md`.** It holds the long price discussion with the measured conversion table, the minute-by-minute measurement of how fast people book, the history of the alarm changes, and the full "what to retire" audit. Other documents that cite this plan by section name mean that file where the section no longer exists here.

**How to read the lesson marks:**

| Mark | Meaning |
|---|---|
| SUPPORTED | The lessons back the principle. It does not mean the exact number is proven |
| CONTESTED | Experts take opposing positions |
| AGAINST | The lessons point the other way. Stated as evidence, not as an instruction |
| SILENT | The lessons say nothing specific. The setting is our own policy |

Only seven patterns in the digest had four or more different channels behind them. Almost every exact number in this plan is SILENT, so the numbers are ours to learn, not rules to obey.

**Revision 4.1, later the same day — the owner simplified the first run.** His words, condensed: "let's keep things simple for now and change one thing at a time to learn." The first run is **one Founders Meet on one fixed date**, ads starting two or three weeks before, a **fixed budget per day**, and **no date on the creative**. A second date is added only after that run gives a good reading of cost per booking, days and money spent, and return. Sections 1, 4, 8, 11 and 13 below are written for that first run.

**The owner still has to fill in:** the date, the number of seats, and the venue area.

---

## 1. The shape

- **First run: one Founders Meet, one fixed date.** Kept simple on purpose.
- **Ads never show a date.** The creatives carry only the idea and the place. The website shows the date.
- **Ads start two or three weeks before the date**, on a fixed budget per day, and stop when bookings close.
- **Then one change at a time.** Once the first run gives a good reading, the next change is a second date of the same plan, open on the same calendar, so a visitor who cannot make one date can pick the other. That is the step towards a repeating product with ads that run all the time. SUPPORTED, thinly: change one meaningful thing when the purpose is learning [TE1, 2 channels].
- **New people at every run.** A guest who has been to a Founders Meet is not meant to come to another one: the games, the session and the venue repeat. The website already refuses a second booking for the same event from a phone that has paid (`create-payu-order` answers 409, the site shows "You've already booked"). **That rule is deliberate. Never propose removing it.**
- **Repeat business means a different plan.** The hope is that a Founders Meet guest later comes to a Sunday meetup or a Pondicherry beach-house party. Lifetime value is counted across chapter அ events. It has not been measured yet.
- **No organic reels while the ads run.** The owner's choice, so that sales in that period can be read as coming from the ads.
- **The goal of the first run is to learn**, by trial and error: what a booking costs, how many days and how much money it takes to fill the room, and what the return is.

**Where the idea came from.** A Chennai trips-and-meetups brand, about four years old and thriving by the owner's read, runs many events at once. Every ad in its Meta Ad Library is a reel and none shows a date. The difference from us: their ads open a chat where a person makes the sale. On our site the plan page and the calendar have to do that job alone.

**What the lessons say about a date-less ad: AGAINST, with a caveat.** "Make the event, place and date unmistakable" is one of the seven consensus patterns [EV11, 4 event channels]. Those channels sell one-off events: concerts, races, shows. A repeating plan with a calendar is closer to selling a product, which they do not cover. The digest also warns that "an interesting competitor ad is not proof its economics transfer" [CF1]. So this is a reasoned bet, and the first run is the test of it.

---

## 2. Settled decisions

| Decision | Source | Lessons |
|---|---|---|
| No date in any ad | owner, 2026-10-08 | AGAINST [EV11], see section 1 |
| First run: one date, fixed daily budget, ads start 2–3 weeks before; a second date only after the reading | owner, 2026-10-08 | SUPPORTED thinly: one change at a time [TE1]. Start time CONTESTED [EV5]: event channels say anything from three weeks to two months |
| New people each run; same-plan rebooking stays blocked | owner, 2026-10-08 | SILENT |
| Efficient ticket sales come before a fair test of every ad | owner, 2026-10-08 | CONTESTED [ST3, TE3]: both are valid goals, they answer different questions |
| City-wide Chennai, no venue pin | owner, 2026-10-08 | SUPPORTED in principle [TA1–3]; no universal radius exists |
| A fixed daily budget, not a lifetime one | owner, 2026-10-08 | CONTESTED [EV2]: event channels split one against one |
| ₹450 = ₹250 online + ₹200 at the venue; the whole ₹100 is the ad limit | owner, 2026-09-30 | SUPPORTED as economic discipline [OF1]; SILENT on the exact split |
| Every ad lands on `/lifestyle` | handoff §15 | SUPPORTED: the page should continue the ad's promise [LA1] |
| Purchase is the event Meta optimises for | handoff §29.4 | SUPPORTED for a checkout we can track [EV1]; CONTESTED only as "never test an earlier event" [OP1] |
| Attribution: 7-day click · 1-day engaged-view · 1-day view | handoff §29.5 | CONTESTED [AW1]: two channels prefer different settings. Not evidence ours is wrong |
| Instagram only | handoff §30 | CONTESTED as a general rule [PL1]. Ours is an owner choice |
| Broad audience, no interests, no lookalikes, no exclusions | owner, 2026-09-30 | CONTESTED if justified as "lookalikes are dead for everyone" [TA4]. It stays our choice |
| Meta is told the full ticket value at the advance | handoff §21.1 | SILENT. **Permanently off the table; do not reopen** |

---

## 3. Economics

| | |
|---|---|
| Ticket | ₹450 = ₹250 advance online + ₹200 at the venue |
| Cost per attendee | ₹150 |
| Ad money per booking | ₹250 − ₹150 = **₹100** |

- **Why ₹100.** At or below ₹100 per booking, a no-show cannot lose money, because the advance is kept. Last Founders Meet, 18 of 28 did not come, at a ₹100 advance (handoff §21.4).
- **The ₹100 is clean.** The customer pays the gateway fee on top. Open events pay no marketer or manager commission (§21.8). Ad bookings pay no creator commission (§29.1).
- **Where a loss really starts.** A guest who shows up brings ₹450 against ₹150 of cost, so ₹300 in all.

| Ad cost per booking | What it means |
|---|---|
| Up to ₹100 | The advance alone covers the ad, even if the guest does not come |
| ₹100 to ₹300 | The ad is paid from the venue balance. It only works out if the guest shows up |
| Above ₹300 | A loss even when the guest comes |

- **Do not fund a loss from future visits yet.** The lessons say to count repeat value cautiously, over a fixed period, and only once it has been observed [OF2, 2 channels]. Ours has not been measured, and it is cross-plan by design.
- **No benchmark exists for Chennai.** The first ₹1,000 or so of spend shows whether ₹100 per booking is reachable.

**Still unread: the Girls-Only Meet of 2026-10-04.** It had 10 advances at ₹199, against ₹100 last time. How many of the 10 came is the first real reading of whether a bigger advance cuts no-shows. `applications.attended_count` is not filled in on split events, so venue balances paid (`fully_paid`) are the only attendance record.

---

## 4. Budget

**A fixed amount per day, on the campaign.** The same spend every day gives the cleanest read: what each day's money bought can be compared directly.

**The rule:** total ad money = ₹100 × the seats ads are meant to fill.

**The simple version: ₹100 a day.** At ₹100 a day and ₹100 a seat, **the number of days of ads equals the number of seats.**

| Seats ads should fill | Total ad money | Days of ads at ₹100 a day | So ads start |
|---|---|---|---|
| 10 | ₹1,000 | 10 | about a week and a half before |
| 15 | ₹1,500 | 15 | about two weeks before |
| 20 | ₹2,000 | 20 | about three weeks before |

- **₹100 a day is just above Meta's minimum.** This plan records that minimum as ₹94.91 a day (read from Ads Manager earlier; re-read it there, the lessons do not confirm it).
- **A higher daily amount shortens the run.** ₹150 a day uses ₹2,000 in about 13 days. The owner picks the daily amount; the total stays ₹100 × seats.
- **End date: when bookings close on the event day**, not the event morning. SUPPORTED: delivery ends on the event day [EV2, 2 channels]. With a 4-minute decision, same-day bookings are realistic.

**The hard stop: the campaign spending limit.** Set it to the total. Meta may spend up to about 75% over the daily budget on a single day, and our alarms run once a day (§8), so the limit is the only automatic stop. The side effect: overspending days can use up the limit a little before the end date.

**Topping up.** The owner's direction: if seats are still empty near the date, add money knowingly, because the lesson is worth it. No ceiling is set ("very hard to decide at the moment"). The table in section 3 shows where a real loss begins. Raising the spending limit is how a top-up is done.

**What the lessons say.** SILENT on every number here. One nightlife channel budgets 5–10% of sell-out revenue [EV9], which for 20 seats at ₹450 would be ₹450–900. That rests on a different basis from our advance-based ₹100 a seat, and neither should quietly replace the other.

**Later, when ads run all the time across several dates:** every day at Meta's minimum costs about ₹2,850 a month, so it stays inside ₹100 a seat only if ads fill about 29 seats a month.

---

## 5. Structure

**1 campaign → 1 ad set → 3 ads. Not rebuilt for the next date.**

- **The decision is quick and small.** Measured 2026-09-30: median 4.4 minutes from the first page of the paying visit to paid, and 83% within 10 minutes (detail in the archive). That covers the visit on which people buy. How long they knew of us before that visit is not measurable yet.
- **Nothing is reset for each date.** One campaign keeps its sales history, and each reel keeps its likes and comments.
- **Lessons: SUPPORTED, thinly.** The one example at a truly small budget favours one campaign and one ad set [TE4, 1 channel]. Larger accounts disagree with each other about separate test and scale structures [ST1–4]. No lesson settles the best design at our budget.
- **Meta chooses which ads get the money.** That is the owner's "efficient sales" decision. An ad Meta barely shows stays untested [ST3], and that is accepted. Do not add ad sets to give every idea a hearing.
- **No retargeting campaign.** "Website visitors – 180d" read 20 people on 2026-09-29. Most accounts need no separate visitor campaign [RT1, 2 channels]. Event channels keep exceptions near a deadline [RT2]; our ads carry no deadline to use.

### The existing paused campaign, re-edited (owner decision 2026-09-30)

It was only a test build and has never delivered. Campaign `120248398500750192`, ad set `120248398504180192`. Values as read on 2026-09-29.

| Setting | Now | Change to |
|---|---|---|
| Campaign name | Founders Meet · Aug 30 · first test | `Founders Meet`. It becomes `utm_campaign`, so rename before any ad runs. No date in it, so the same campaign serves the next date |
| Budget | ₹95.76 a day, on the campaign | The daily amount from section 4. Already a daily budget, so nothing to convert |
| Campaign spending limit | none | ₹100 × seats |
| Objective / event / bidding | Sales · Purchase · dataset `28370453785913523` · highest volume | already right |
| Attribution | 1-day click | 7-day click · 1-day engaged-view · 1-day view. If greyed out, duplicate the ad set and set it on the copy (§29.5) |
| Age | 18–65 | minimum 21; suggestion 22–40 |
| Location | Chennai 40 km, "living in or recently in" | keep; try "people living in", accept it if Meta widens it |
| Advantage+ audience | on | already right |
| Exclusions | none | already right |
| Placements | Facebook, Instagram, Messenger, Threads | untick Facebook, Messenger, Threads; keep all 6 Instagram spots |
| Audience Network | off | already right |
| Brand safety | Relaxed (a default) | Moderate |
| Schedule | none | start as many days before the event as section 4 gives; end when bookings close on the event day |
| Ads | none exist | create the 3 ads (section 7) |

**Every edit takes effect only on Publish. Publishing a paused campaign keeps it paused.** The next morning's sync should show `attribution_setting = 1d_engaged_view_1d_view_7d_click` and `publisher_platforms = [instagram]`.

**Re-read 2026-10-09 (live values, through the Meta ads connection).** One row of the table above is done; every other row still reads exactly as in the "Now" column.

- **Done:** the campaign is now named `Founders Meet` (renamed 2026-10-09 18:54 IST; Meta's history shows it came through the ads connection, not Ads Manager).
- **Unchanged:** ₹95.76 a day on the campaign, no spending limit, 1-day click, age 18–65, Chennai 40 km, Advantage+ audience on, no exclusions, Facebook + Instagram + Threads placements, brand safety Relaxed, start 2026-08-21 with no end date, both campaign and ad set paused, nothing ever spent.
- **Still no ads and no creatives** anywhere in the account.
- **Meta's minimum daily budget for this account now reads ₹96.73** (it was recorded as ₹94.91 in section 4). The campaign's ₹95.76 sits just under it, so Meta may refuse to save other edits until the budget is raised. ₹100 a day clears it. Not tested.
- **Messenger** is still ticked in the saved settings but Meta's own "where this will really run" list leaves it out, so it delivers nothing there. Audience Network and Messenger Stories were removed on 2026-09-18.
- **Not readable from here:** unpublished drafts sitting in Ads Manager (the draft reader is not switched on for this account yet), so an edit made there and not published would not show in this read.

**Read through Chrome, 2026-10-09 about 23:45 to 00:20 IST (Ads Manager itself, so the unpublished drafts are visible).** Nothing was published, discarded or edited during this read.

- **Ads Manager holds 6 unpublished items** ("Review and publish (6)"): 2 campaigns, 2 ad sets, 2 ads. Four of the six carry errors, so Meta refuses to publish them as they stand.
- **A second campaign exists, as a draft only: `Founders Meet 2`** (`120249436733210192`), made in Ads Manager on 2026-10-09 at about 21:31 IST. Sales · ₹100 a day on the campaign · highest volume · switched off.
  - Its ad set `founders meet ad set` (`120249436733200192`): Chennai +22 km, minimum age 18, suggestion 18–40, Instagram Stories + Reels only, starts Sat 24 Oct 2026 21:31, no end date, ad set toggle ON. Error: "To use catalogue ads, you need at least 2 placements (#1443440)". Estimated audience 12.6–14.8 million.
  - Its ad `New Sales ad and message` (`120249436733220192`): single image, **no website URL**, Instagram account `chapter.aaa`, multi-advertiser ads ON.
- **Unpublished edits are sitting on the real campaign** (`120248398500750192`): budget ₹95.76 → ₹100.00 a day. On its ad set (`120248398504180192`):
  - renamed to `Ad Set 1` (the live name is `Chennai +40km · broad · Purchase`);
  - audience swapped to the saved audience `chapter அ advertisement` (see the warning below);
  - placements cut to Instagram Stories + Reels;
  - end date Sat 24 Oct 2026 00:00;
  - "Ad set status" is also listed as changed (the toggle reads ON in the draft; live is paused).
  - Error: "IG Explore Home placement requires IG Feed placement (#2238294)".
- **A draft video ad exists under the real ad set: `Founder's Meet 01`** (`120248623200150192`). Single video, manual upload, Page "Join Chapter அ", **Instagram account `iamkrutesh`** (the other draft ad uses `chapter.aaa`), **no website URL**, no primary text, no headline, button "See details" (Meta's default), enhancement "Relevant comments" on, multi-advertiser ads off. So "no ads and no creatives anywhere" above is true only of what is published.
- **⚠ The saved audience `chapter அ advertisement` (`120249436533610192`, created 2026-10-09 21:15 IST) is not safe to use.** Its details read Chennai +22 km, "optimise locations" on, minimum age 18, suggestion 18–40. Meta shows the warning "contains a location targeting option that has been removed" and estimates **61.2–72.5 million people** (51.5–60.6 million when attached to the ad set). The draft ad set that names Chennai +22 km directly estimates 12.6–14.8 million. Publishing the ad-set edit would replace the Chennai pin with this audience. Why the estimate balloons was not established.
- **Live values moved after the re-read above.** Placements were cut to Instagram only at 23:43 IST, through the ads connection (Meta's history shows it). Live now: Feed, Stories, Reels, Explore home, profile feed, search. Still 1-day click, age 18–65, ₹95.76 a day, no end date, campaign and ad set paused, ₹0 spent.
- **Money in the ad account.** Meta's history shows one top-up: ₹500 by UPI on 2026-08-12. The account overview shows **₹423.72** as the account spending limit with ₹0.00 spent, which is ₹500 less 18% GST. That is about 4 days at ₹100 a day. The Billing page asks for the owner's authenticator code, so it was not opened and the figure was not cross-checked there.
- **Account-wide controls** (Advertising settings ▸ Account controls): minimum age 18; Audience Network (both kinds), Facebook Marketplace and Facebook right column are excluded for every campaign.
- **Purchase showing "No recent activity" is correct, not a fault.** Events Manager: Purchase last received 9 days ago, 24 events in 28 days (browser + server, so about 12 sales); every other event reads Active. `payu_payments`: the last new ticket was an advance on 2026-09-30 17:56 IST and Meta confirmed it. The 6 successful payments since (1 on 2 Oct, 5 on 4 Oct) are venue balances for `celebrate-birthday-with-girls`, which by design send no Purchase. Every advance from 26 Sep onward has `meta_purchase_sent_at` set. The status returns to Active with the next ticket.
- **One Events Manager diagnostic, open since 2026-08-21:** "All of your web Purchase events are sending the same price information." The values reported since 26 Sep were 299 (four times), 359 and 2, so they are real ticket prices and most tickets cost the same. Not investigated further; our reading is that it is expected for a single-price ticket.
- **Also checked, nothing wrong:** no delivery errors on any published object; the four daily Meta jobs and `verify-pending-payments` fired on schedule for 3 days (pg_cron status only, which does not prove the HTTP call succeeded); 4 Meta notifications, all about 4 weeks old, one saying the WhatsApp display name "chapter அ" was not approved.
- **Traps when driving Ads Manager through Chrome:** closing the editor raises a "Publish draft items?" box whose Publish button sits beside Close; hovering a row in the editor's left tree puts a Duplicate icon under the cursor; the edit pane's **Review** tab shows a whole object as plain text and is the fastest way to read a draft.

**Owner's answers, 2026-10-10 about 00:30 IST. These override sections 2, 6 and 7 where they differ.**

| Question | Owner's answer |
|---|---|
| `Founders Meet 2` draft | Leave it as a draft |
| The real ad set | "I want only Instagram reels & stories. And I want chennai only 22 km+. Whatever I have set up today with the founders meet 2 is the correct one." |
| Instagram account the ads run as | `iamkrutesh` |
| Date and seats | Not decided yet |

So, until he says otherwise: **Chennai +22 km** (not +40), **Instagram Stories + Reels only** (not all 6 spots), **minimum age 18 with suggestion 18–40** (as in Founders Meet 2, not minimum 21), ads run as **`iamkrutesh`**, **no end date and no spending limit**. Meta's own panel warns that fewer than 6 placements may raise cost per result; that was said to him once.

**What was then changed in the DRAFTS, 2026-10-10 about 00:26 to 00:50 IST. Nothing was published.** Re-read through the ads connection at the end: the campaign is still paused (last changed 18:54), the ad set still paused under its old name (last changed 23:43), ₹0 spent.

On the real ad set's draft (`120248398504180192`):

- **Saved audience removed; location set to Chennai (city) +22 km directly.** ⚠ Removing the saved audience first reset the location to **all of India**; it has to be re-entered.
- **End date removed** (it was 24 Oct 2026 00:00).
- **Placements are now truly Stories + Reels.** The two placement errors came from Instagram profile feed and Explore home still being ticked while hidden: they grey out when Instagram Feed is unticked. Ticking Feed reveals them; untick them, then untick Feed.
- ⚠ **Meta then ticked "Allow limited spending to excluded placements" by itself** (about 5% of budget to each of the 3 excluded spots). Unticked. Meta asked to confirm "Excluding Instagram Feed will exclude 2 additional placements".
- **The ad set draft now has no errors.** Its pending changes read: ad set name, ad set status, audience, placement.
- **Not done: age suggestion is still 18–65+** (Founders Meet 2 has 18–40). The maximum-age dropdown could not be driven through Chrome in six tries: the list opens slowly, ignores wheel and arrow keys, and closes when a script touches the page.
- **Not touched:** attribution (still 1-day click), the name `Ad Set 1`, the ad set toggle (ON in the draft; the campaign toggle is what holds everything off).

On the draft video ad (`120248623200150192`):

- **URL parameters set** to the section 7 string, checked character for character (168 characters). Meta's notice: the campaign, ad set and ad names are frozen into the parameters at publish, so rename before publishing, not after.
- ⚠ **The website link would not save.** `https://chaptera.in/lifestyle` (answers 200) was typed four times. The field shows it and the footer says "All edits saved", but the Review tab keeps reading "Please add Website URL" and the field is empty when the ad is reopened. **This still blocks publishing the ad.** Cause not established; pasting by hand is the next thing to try.
- **Unchanged:** no primary text, no headline, button "See details", multi-advertiser ads off. Enhancements on: Relevant comments, Enhance CTA, Add video effects. Off: Video touch-ups, Text improvements.
- **One slip, no effect found:** one batch typed the link while the Call-to-action dropdown had focus. The button still reads "See details" and the text fields are still empty.

**Update, 2026-10-10 about 01:45 IST: `Founders Meet 2` is gone.** The owner asked which campaign to keep; the answer was `Founders Meet` (it holds the video ad and the tracking tags, is already published, and now carries the same settings). He deleted the `Founders Meet 2` draft himself, because an agent may not permanently delete. Checked in Ads Manager afterwards: one campaign (`Founders Meet`, off, ₹100.00 daily pending, ₹0.00 spent), one ad set (`Ad Set 1`, unpublished edits), one ad (`Founder's Meet 01`, in draft), "Review and publish (3)". The paragraph below describes the state before that.

**State left in Ads Manager:** 6 unpublished items. Clean: the campaign (budget ₹95.76 → ₹100) and `Ad Set 1`. Errors: the video ad (no link), and both Founders Meet 2 items left alone at the owner's word. **Waiting on the owner's OK before anything is published.**

**Published 2026-10-10, 01:53 to 02:02 IST, on the owner's word ("okay publish them with off"), then read back through the ads connection.** Three publishes, all through Ads Manager in Chrome; Meta's history shows them as "Power Editor".

| Time (IST) | What was published |
|---|---|
| 01:53 | Ad set: name → `Ad Set 1`, audience → Chennai +22 km, placements → Instagram Stories + Reels. Status kept off |
| 01:55 | Campaign: budget ₹95.76 → ₹100.00 a day. Status kept off |
| 02:02 | Ad set again: location widening switched off (see the warning below) |

**Live now (read 02:03 IST):**

- **Campaign `120248398500750192`:** `Founders Meet`, PAUSED, Sales, ₹100 a day, highest volume, no spending limit, ₹0 spent.
- **Ad set `120248398504180192`:** `Ad Set 1`, PAUSED, Purchase on dataset `28370453785913523`, Chennai (city key 1021534) +22 km, age 18–65, Advantage+ audience on, Instagram `story` + `reels` on mobile, attribution 1-day click, no end date.
- **Ads:** none published. `Founder's Meet 01` is still a draft (its website link is missing).
- **Delivery errors:** none. Meta showed `IN_PROCESS` for about a minute after each publish, then `PAUSED`.

⚠ **Choosing a city ticks "Reach more people likely to respond" by default, and that sends ads beyond the city.** Meta's wording: "We'll also reach people interested in your selected towns/cities and regions, in those countries." The 01:53 publish went out with it ticked, because the box came back when Chennai was re-entered in the draft. Read back as `targeting_automation.individual_setting.geo = 1`, "Optimize locations: On" in Meta's history, and an estimated audience of **59.4–69.9 million**. Unticked and republished at 02:02: `geo = 0`, estimate **14.6–17.2 million**. It was live for 9 minutes on a paused ad set, so nothing was delivered. **This also explains the 61–72 million saved audience above:** it had the same box ticked. After any location edit, read `individual_setting.geo` back; it must be 0.

**Checked against this plan and the handoff (sections 24, 29.5, 30). In line:**

- Campaign and ad set both off; nothing spent.
- Sales objective, Purchase event, highest volume, no cost goal (section 6; handoff §24 item 2 is the owner's standing choice).
- ₹100 a day on the campaign (section 4).
- Chennai +22 km, widening off; Stories + Reels only (the owner's 10 Oct choices, which replace +40 km and "all 6 spots").
- Instagram only; Facebook, Messenger, Threads and Audience Network off (handoff §30).
- Advantage+ audience on; no interests, lookalikes or exclusions (section 2; handoff §24 item 3 is the owner's standing choice).
- No end date and no spending limit, because the date and seats are undecided.
- One campaign, one ad set (section 5).

**Not in line:**

1. **Attribution is 1-day click; the owner's decision is 7-day click · 1-day engaged-view · 1-day view (handoff §29.5).** ⚠ It cannot be fixed on this ad set. Ads Manager, on the setting itself: "The attribution setting cannot be changed once an ad set has been published. Create a new ad set to select a different attribution setting." This ad set was created published on 2026-08-21, so it was locked from the start. The only route is the one §29.5 names: duplicate the ad set, set the windows on the copy, publish it off, and move the ad across. Not done; it needs the owner's word because it replaces the ad set.
   **OWNER DECISION 2026-10-10: keep 1-day click. No new ad set.** His reasoning: no organic content runs during the test, so someone returning days later most likely returns through another ad tap, which restarts the clock. What he was told and accepted: people who return directly (saved link, history, profile) are not counted by Meta on this window, so Meta's own purchase count will read low and it learns from fewer sales; **the true cost per booking is unaffected, because it is ad spend divided by all Founders Meet bookings in the period, from our own data.** This replaces the 7-day decision in handoff §29.5 and in sections 2 and 6 here. Do not re-propose 7-day click or a new ad set unless he raises it.
2. **Age suggestion is 18–65**, not the 18–40 the owner set in Founders Meet 2. The dropdown could not be driven through Chrome.
3. **Brand safety is still Meta's Relaxed default**; section 5 and handoff §24 item 5 say Moderate. It is an account-level setting and was not touched. **OWNER DECISION 2026-10-10: keep it Relaxed.** This is no longer a gap; do not re-propose Moderate. The lessons are silent on it.
4. **No ad is published; section 7 wants three.** The one draft ad differs from section 7 in: no website link (will not save), no headline, button "See details" not "Book now", no caption or price line, and three enhancements on (Relevant comments, Enhance CTA, Add video effects). Its URL parameters are right.
5. **Location type reads "living in, frequently in or recently in"** (`frequently_in`, `home`, `recent`). Handoff §24 item 5 hoped for "people who live there" only. The Ads Manager screen offers no such choice now.

**Could not be checked through the connection:** the event-priority list and "track events automatically" (handoff §24 item 4, Events Manager only), and anything still in draft.

**Other things learned while publishing:**

- **Flipping an on/off switch in the table publishes straight away**, and if the item has draft edits Meta bundles them in ("Multiple updates will be published"). That is how the ad set went out at 01:53.
- **Orange "Fix error" does not disable the Publish button; red does.** Untick the item in the review box to leave it out.
- **The "pixel problem" message the owner saw** is on the ad set's Conversion section: "Your ad may not be optimised for conversions because we haven't received any activity from your pixel in more than seven days." It is the no-recent-Purchase state described above, not a fault.

**Checked against the 91-lesson digest, 2026-10-10 (owner asked: "is whatever we have in line with the learnings").** What is live plus the one draft ad, against `LESSONS-DIGEST-2026-10-04.md`. Codes point into that file.

| What we have | What the lessons say | Verdict |
|---|---|---|
| ₹100 of ad money per booking, from advance minus cost | Affordable acquisition comes from the customer's economics [OF1, 4 channels] | In line |
| One campaign, one ad set, budget on the campaign | The one truly small-budget example favours exactly this [TE4, 1 channel]; large accounts disagree with each other [ST1–4] | In line, thinly |
| Purchase as the goal | Fits a checkout we can track [EV1, 2 channels] | In line |
| Highest volume, no cost goal | Automatic bidding suits unproven ads [BI1–2] | In line |
| Chennai +22 km, broad, no interests | Start from feasible travel distance; no universal radius [TA1–3] | In line; the number is ours |
| Bookings judged on our own data | Money and purchases decide; credited is not caused [RR1, AT1, 4 channels each] | In line |
| Lands on `/lifestyle` | The page should continue the ad's promise [LA1, 4 channels] | In line in intent; the link is not on the ad yet and the section 8 page checks are not done |
| **1-day click window** | Both channels that name a setting use **7-day click**; they differ only on the view windows [AW1] | **Not in line** with either voice. **Kept by owner decision 2026-10-10** (see "Not in line", item 1) |
| **The draft ad has no headline and no caption** | Make the event and place unmistakable [EV11, 4 event channels]; write from real guest words [CF1, 4 channels] | **Not in line.** The date is left out on purpose (section 1); the event and place are missing only because the text is empty |
| **One ad** | Different reasons to buy, not one message [CR1, 4 channels]. No lesson fixes a number | **Not in line** until the other two ideas exist |
| Stories + Reels only | Start with broad placements, remove one after seeing its results [PL1, 3 channels, conditional] | The owner's choice. No lesson supports narrowing before any data |
| Enhancements on: Relevant comments, Enhance CTA, Add video effects | One channel accepts additions around the ad but rejects changes to the media [PL2] | "Add video effects" is against that view; section 7 says all off |
| Brand safety Relaxed, age 18–65, Instagram account `iamkrutesh` | Nothing | Lessons silent |

The draft video shows guests speaking on camera (captions seen in the preview: "a lot of ideas", "but not enough people to", "talk about them"), which is the kind of material CF1 favours. Not watched in full.

**Attribution, the numbers behind the decision** (handoff §28.7, 119 paid open-event bookings, time from starting a booking to paying): 72% paid within 1 day, 90% within 7 days. So a 1-day click window hides at least 28% of ad sales from Meta and a 7-day window about 10%. Best case, because the clock here starts at the booking, not at the ad tap.

**Fixes made after those decisions, 2026-10-10 about 02:26 to 02:35 IST.**

- **Age suggestion is now 18–40, set through the ads connection** (`ads_update_entity` on the ad set, 02:26 IST). Under Advantage+ audience the suggestion lives in `targeting.age_range`; `age_min` 18 and `age_max` 65 stay as they are. The whole targeting block has to be sent, so it was sent exactly as read with only `age_range` changed. Read back afterwards: `age_range [18, 40]`, location widening still off (`geo: 0`), Chennai +22 km, Stories + Reels, 1-day click, PAUSED. One field stopped being returned (`dt_consolidation_state`, was `v2`); nothing else moved. **This is the way to set it; the Ads Manager dropdown cannot be driven.**
- **Draft ad: headline `Founders Meet · Chennai` and button `Book now` are saved.** Both survived leaving and re-entering the editor. The button list takes about 4 seconds to open.
- **Enhancements: nothing left that Ads Manager lets us switch off.** Its panel has two switches, Video touch-ups and Text improvements, and both are off. Relevant comments, Enhance CTA and Add video effects sit under "Essential enhancements" ("enabled by default"), and neither Edit button offers a switch for them. So section 7's "all off" is not reachable from this screen. Expect the `ad_unwanted_enhancement` push once the ad is published (handoff §30). Through the connection they can be opted out when a creative is created.
- **Also seen on the ad, not changed:** "Optimise text per person: Enabled", which lets Meta move text between the headline and caption positions.
- ⚠ **The website link still will not save: 6 tries, three ways of committing it (Tab, clicking away, Enter).** The headline and the button, entered the same way in the same sitting, saved. Meta's "Build a URL parameter" box has no website field, so that is not a way round. The ad cannot be published until the link is in. Two routes remain: the owner pastes it by hand, or the ad is rebuilt through the connection. For the second, note that `ads_create_ad` only stages a draft in Ads Manager, and publishing through the connection makes things ACTIVE, so the publish step would still be done in Ads Manager with the switches off.
- **Caption: still empty.** The owner has not given the words.
- **URL parameters re-checked against the handoff, 2026-10-10 (owner asked).** The draft ad's string is identical to the paste-ready string in handoff §10 ("The one thing still outstanding, founder-side"), which is what §24 item 1 points to. Read on the same day from `origin/main`: the live site's `src/attribution.ts` keeps `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` and `fbclid`. It does **not** yet keep `placement` or `site_source_name`, and it does not yet drop an unsubstituted `{{macro}}`; both are in the local, unpushed version of that file. So the ad-id join works on the live site today, and the placement of each booking is not recorded until that file is pushed. The daily tag check reads published ads only, so it has not seen this draft.

**State at 02:35 IST:** campaign and ad set published and off, ₹0 spent. One draft left, the video ad: headline, button and tracking tags set; no link, no caption.

**Whole-setup check, 2026-10-10 about 03:10 to 03:40 IST (owner asked: "is there anything else left except the link, and is everything optimal with the learnings").** Read-only. Sources checked against: `LESSONS-DIGEST-2026-10-04.md`, `FOUNDERS-MEET-LESSONS-MATRIX-2026-10-09.md` (97 digest items against this plan, result "APPLY 0"), `META-EXPERT-SYNTHESIS-2026-10-08.md` §4 and §8, handoff §24, and sections 8 and 9 here.

*What "optimal" can and cannot mean.* The lessons do not give a best setup for a ₹100-a-day Chennai event; almost every number is marked SILENT. So the check is: nothing contradicts a consensus except where the owner chose to, and nothing required is missing.

**Live in Ads Manager (re-read through the connection, 03:10 IST): unchanged and as intended.** Campaign PAUSED, Sales, ₹100 a day, highest volume. Ad set PAUSED, Purchase, Chennai +22 km with `geo: 0`, age 18–65 with suggestion 18–40, Instagram Stories + Reels, 1-day click. No ad published. No errors. ₹0 spent.

**⚠ The event on the website is not ready for an ad, and this was not looked at until now.** Read from `events` / `event_dates`:

| What | On the site now | This plan says |
|---|---|---|
| Upcoming dates for `founders-meet` | **None.** Two dates exist, 2026-09-13 and 2026-09-30, both past (status still `available`) | One new date, added to this same event (section 9, item 3) |
| Price (`city_details.Chennai`) | ₹299 full, **₹100 advance** | ₹450 full, ₹250 advance |
| `cost_per_ticket` | **₹0** | ₹150 |
| Capacity | 28 | seats undecided |

With today's values the cost alarm still computes ₹100 of ad money a ticket (₹100 − ₹0), which matches the plan's figure only by coincidence: the real position is a ₹100 advance against a ₹150 cost. Price and cost have to be changed together, or the alarm's limit becomes wrong the other way.

**Tracking health (daily checks of 2026-10-09 09:11 IST): all ok.** Lead, AddToCart, ViewContent, token and test-mode checks `ok`; Purchase checks `too_few` (no sale in the window, expected). Match quality 9.3 on Purchase (last graded 1 Oct, coverage 100%) and 9.3 on Lead (8 Oct). **Six push devices are registered, and Meta ad alerts reach two of them** (corrected the same night; the first wording here said "six founder devices", which was wrong). `send-admin-push` sends the Meta alert type (`meta_ad_issue`) only to devices whose owner has role `admin`: "Krutesh" (iPhone) and "Rxa goat" (`rxaa08@gmail.com`, registered 2026-09-28). The three marketers' devices get only pings about their own leads, and "Desktop" has no owner recorded so it gets nothing. **Owner decision 2026-10-10: leave it as it is**; both founder devices keep getting Meta alerts. Handoff §24's "one founder device of five" is out of date. Seven alarm rules enabled, matching section 10. The daily sync last ran 2026-10-09 08:50, so it still holds the old ad set name, placements and 1-day click; the 2026-10-10 08:50 run is the first to read tonight's changes.

**Events Manager ▸ Settings, read through Chrome (first time these were read on screen):**

- **"Automatically include more detailed page and product info": ON.** Meta's wording: "uses AI to identify and send more website details such as basic page info, reviews and pricing in addition to your existing Meta pixel data". Nobody chose this. It is the item the expert synthesis lists under "things Meta may now add to our tracking by itself" (§8 item 4), and it matches the `SmartSetup`, `SmartSetupTotalPriceExtraction` and `Microdata*` features the watchdog sees switched on. Whether it is behind the "same price information" diagnostic was not established. The code-side block (`autoConfig` off) is still local, not pushed. Owner-side switch; not changed.
- **Automatic events: Off.** This is handoff §24 item 4, done.
- **Core setup: Off** (on would let Meta trim custom parameters and URL parts). **Automatic advanced matching: Off**, all eight fields. **First-party cookies: on.**
- **A "Conversions API · Web-only" connection shows "Connection pending"** with a "Connect now" button. Leave it unconnected: our own server sending is the sender, and a second one beside it is the duplicate risk §8 item 4 names.
- Dataset category: None. One diagnostic open (same price, since 21 Aug).

**From Advertising settings (read 2026-10-09 night): "Existing customers" and "Engaged audience" are both "Not defined".** The expert synthesis counts five voices for labelling customers so reports can show who the ads reach (§4 item 6). The list `chapter அ · customers (any payment)` exists and could be the definition. Not a decision made here.

**The ads connection can write, and has.** Expert synthesis §8 item 1 says to confirm in Business Suite whether it is held to view-only. Meta's history shows writes through it on 21 Aug, 18 Sep, 30 Sep, 9 Oct (twice) and 10 Oct 02:26 (the age suggestion). So it is not view-only today. Whether it should be is the owner's call.

**The video:** `Founder's meet ad.mov`, 28.5 seconds, uploaded 2026-10-09 18:15 IST, status ready. At 02:30 IST on 10 Oct Meta created a second library file by itself, `Auto_Cropped_AR_4_X_5_DCO_Founder's meet ad.mov` (a 4:5 crop), while the ad was open in the editor. Not attached to anything by us. **The video has not been watched end to end**, so "no old date or price on screen" (section 7) is unconfirmed.

**Against the expert synthesis's ten consensus points (§4):** in line on one campaign and one ad set, Purchase from day one, judging on our own numbers, a spend alarm on real spend and real tickets. Not yet in line on "start with two or three ads" (one exists) and on customer labels. **The owner's own choices that go the other way, recorded and not reopened:** placements cut to two (consensus 1 says leave placements alone when optimising for a sale; digest PL1 says start broad), no date in the ad (digest EV11), 1-day click (digest AW1).

**Research on the two open settings, 2026-10-10 about 03:45 to 04:10 IST (owner asked: "tell me what shall we do about this? Research the best course of action online").** Read-only; nothing was changed in Meta. Read: Meta's own announcement and help pages, Jon Loomer's write-ups, three trade articles, the pixel's public settings file, and Events Manager ▸ History, Diagnostics and Settings plus Ads Manager ▸ Advertising settings on screen.

*A. "Automatically include more detailed page and product info"*

- **What it is.** A pixel feature Meta announced in April 2026: AI reads the page and attaches page and product details to the events the pixel sends. Meta's own pitch is that this is "information many advertisers already share with Meta to run product-based ads", automated. It can be turned off at any time in Events Manager, and each data type has its own switch.
- **When it came on here (corrects "nobody chose this" above).** Events Manager ▸ History: "Automatic page and product detail turned on", changed by "User", **12 Aug 2026 20:08**, two minutes after the dataset was assigned to the ad account (20:06). So it came on in the setup screens that evening, where Meta's install steps show it as an optional toggle. It was not switched on by Meta later.
- **Nine data types, all On:** Basic page info · Media content · Business location and contact information · Event and travel · Content classification · Authorship · Product and entity identification · Product and entity attributes · Reviews, ratings and pricing.
- **The pixel's public settings file, read 2026-10-10** (`connect.facebook.net/signals/config/<pixel id>`, fires no event; main script was 2.9.415): switched on are `AutomaticParameters`, `InferredEvents`, `MicrodataCoverage`, `MicrodataFieldTransmission`, `SmartSetup`, `SmartSetupTotalPriceExtraction`; `AutomaticMatching` is still not. Gates that read "passed": `signals_auto_web_details_gateway` and **`enable_has_val_total_price_extraction`**, which means Meta's script is set to read a "total price" off the page even on events that already carry our own value. That price code checks `disableAutoConfig`, so the local `autoConfig` line (`5bcb721`, not pushed) does stop it. **Not established:** whether that code line also stops the AI feature; the main script has no reference to `signals_auto_web_details_gateway` by name. After the switch is turned off, re-read the settings file and record which of these changed.
- **Outside evidence that it helps or hurts: none found.** Jon Loomer calls it the "less interesting" half of the announcement and asks "Will it be a good thing or a detriment?" without answering. Every other article restates Meta's announcement. The "17.8% lower cost" figure quoted beside it is about the Conversions API, a different feature.
- **The open "same price" diagnostic is a separate matter.** Its internal name is `pixel_placeholder_value_single_event_actions`, it is flagged on both the Meta pixel and the Conversions API, first detected 21 Aug. The switch has been on the whole time and has not cleared it. That the switch causes it was not established.
- **It has done no visible harm in two months:** all daily checks pass and match quality is 9.3 with it on.
- **Recommendation: switch it off.** (1) Its use is product catalogues, and catalogue ads were retired on 30 Sep. (2) The site already sends the exact event, plan and value from both browser and server, so a guessed copy adds nothing, and the plan page shows two prices per plan (full and advance), which is where a guess goes wrong. (3) The project already decided on 19 Sep that Meta should not guess on this site; this is the same decision. (4) The first run is meant to be read cleanly. It is one switch and can be turned back on later as a single deliberate change. The honest limit: this is a case for control, not a measured gain.
- **Status: DONE.** The owner switched it off on 2026-10-10 at 05:10; read-back is further down ("The page-info switch: OFF").

*B. Customer labels ("Audience segments" in Advertising settings)*

- **What it is.** Two definitions, Engaged audience and Existing customers, each made from custom audiences. Meta's box says: "Define your audience segments using custom audiences to receive additional insights. These settings apply to all sales campaigns in this ad account."
- **What it changes: reports only.** It adds a breakdown that splits spend, views and purchases into New / Engaged / Existing. Loomer: "audience segments are only used for reporting purposes. They will not influence delivery." They matter to delivery only if a feature built on them is switched on (new-customers-only, or value rules that bid by audience). None is in use: Advertising settings reads "No rule sets created".
- **Not retroactive.** Loomer: definitions "take effect at the time you save them"; anything delivered before shows as "Unknown". It works for Sales campaigns only, which ours is.
- **Where the experts stand.** Loomer lists not defining them among the most common mistakes. The expert synthesis has five voices for it (§4 item 6), and its disagreement E (exclude customers, or "don't restrict; just label and watch") lands on the side the owner already chose on 30 Sep: no exclusion, watch whether ads bring repeat customers.
- **Seen on screen 2026-10-10:** both are "Not defined"; the box offers exactly two audiences, `chapter அ · customers (any payment)` (customer list) and `Website visitors - 180d` (website), both ready. Our registry holds 120 people in the customer list as of the 9 Oct 10:20 sync. Ads Manager shows "No label added" on both although our registry records label `CUSTOMERS` for the list; not investigated.
- **Recommendation: define both before any money is spent.** Existing customers = `chapter அ · customers (any payment)`. Engaged audience = `Website visitors - 180d`. The owner's own question for the first run (do the ads reach people who already came?) can only be answered from the day this is saved, and past Founders Meet guests cannot book the same plan again, so spend that reaches them cannot become a sale.
- **What to expect from it.** Meta can only label people it recognises (it matched about 1% of site visitors on 11 Sep: 20 people against 1,671 visits), so the Existing and Engaged rows will read low and New will read high. At ₹100 a day, read the share of spend, not the purchase count.
- **Not part of this:** excluding customers, a new-customers-only setting, value rules. Possible later addition: a website audience of people who fired Purchase, added to Existing customers alongside the list (Loomer uses both); needs a new audience, so not done.
- **Status: OWNER DECISION PENDING.** The box was opened and closed with the X; nothing saved.

**Lessons check on the customer labels, 2026-10-10 about 04:40 to 05:05 IST (owner asked: "is this in line with the 90 lessons from youtube, check the synthesis file from openclaw").**

- **The digest itself is silent, and that is a gap in the digest.** `LESSONS-DIGEST-2026-10-04.md` never mentions audience segments, and its line 119 marks "No exclusions; compare new/returning" as "Our decision. LESSONS SILENT". The lessons matrix copies that (row L4.19, SILENT, 0 channels). The lesson notes underneath are not silent, so the notes were read directly (`~/Downloads/meta yt lessons/`).
- **Defining both labels: 8 of the 91 lessons, 4 channels, none against.** Ben Heath (2026-02-17, 2026-04-03, 2026-08-12), Blue Sense Digital (2026-05-04, 2026-06-01), Antonio Ventre (2026-06-01, his "mistake 5"), Sam Piliero (2026-07-05 calls it a prerequisite; 2026-07-26). That meets the digest's own bar of four distinct channels. A ninth, Heath 2026-10-07, was added after the digest's 29 Sep cut-off and says the same: check the breakdown first, which needs both labels defined.
- **What goes into each label, per the lessons:**
  - Existing customers: real buyers only. Ventre: a list filtered to one or more orders. Piliero: all-time purchasers. Heath 2026-10-07: pixel purchase audiences can now look back 730 days. Our list (`customers_all_paid`, any payment, 120 people) meets Ventre's rule.
  - Engaged: website visitors is the one piece all four use. Heath and Ventre also add people who gave details and never bought; our `leads (never paid)` list (166 people) was deleted on 30 Sep with the retirement. Social followers and engagers: Heath includes them, Ventre says do not. Left out.
  - Ventre's warning: buyers must not sit inside Engaged. Meta counts a person found in both as Existing, but a buyer Meta cannot match from the phone list and can recognise by browser would be counted as Engaged. A website audience of people who fired Purchase, added to Existing, closes that.
- **So the recommendation changes in one place:** Existing customers = the list **plus** a new website audience of people who paid. Engaged = `Website visitors - 180d`, unchanged. The earlier note above called the purchasers audience a "possible later addition"; the lessons make it part of doing this properly.
- **Excluding customers is CONTESTED in the lessons, not silent.** For excluding them from cold campaigns: Blue Sense Digital (2026-05-11, 2026-06-01) and Ventre (2026-09-07); the old 70-lesson synthesis line 120 says the same. Against rigid exclusion: Andrew Faris (2026-07-15, may be unnecessary) and Heath (2026-10-07: leave the default unless the breakdown shows a problem; manual exclusions "wreck delivery" in his tests; use Meta's built-in "Acquire new customers" control if needed). The excluding side is mostly shops with frequent repeat buyers. **The owner's 30 Sep decision (no exclusion, watch) is not reopened**; the labels are the first step on either side.
- **One more caution from the lessons:** Heath says customer-list matching "may be only about half accurate". Read the Existing row as a floor.
- **Not established:** whether the labels affect delivery when nothing is built on them. Loomer says reports only; Ventre and Heath (2026-08-12) speak as if Meta also uses them. Meta's own box says "additional insights".

**The page-info switch: OFF since 2026-10-10 05:10 IST, switched by the owner, verified.** (At 05:00 the agent's own click was refused by the Claude app's safety check as an account-setting change; no other route was tried; the owner then clicked it.) Read back three ways:

- Events Manager ▸ Settings now reads "Automatically include more detailed page and product info: Off".
- Events Manager ▸ History: "Automatic page and product detail turned off", chaptera.in website, changed by "Chapter A.", today 05:10.
- The pixel's public settings file, re-read minutes later: **`SmartSetup`, `SmartSetupTotalPriceExtraction` and `RegexParamFilter` are gone** (file 391,045 → 349,355 bytes; 25 features → 22). So this switch was what carried Meta's price-reading. **Still switched on:** `AutomaticParameters`, `InferredEvents` (button-click guessing), `MicrodataCoverage`, `MicrodataFieldTransmission`. Those belong to the older automatic group, which only the local `autoConfig` line (`5bcb721`, not pushed) turns off. The two gate flags (`signals_auto_web_details_gateway`, `enable_has_val_total_price_extraction`) still read "passed"; they are account-level flags, not the switch.
- Not checked yet: whether the "same price" diagnostic clears. It was first flagged 21 Aug; look again after the next real sale.

**Custom audiences: every lesson note read for this, 2026-10-10 about 05:10 to 05:30 IST (owner asked: "what do you think is the best course of action in terms of the custom audience? research all the youtube lessons yourself").**

*How it was done.* The folder `~/Downloads/meta yt lessons/` holds 94 dated notes: 93 lessons (the digest's 91 plus two added in October) and one OpenClaw report (`2026-09-28-meta-strategy.md`). Every note was searched for custom audiences, audience segments, customer lists, exclusions, retargeting, warm audiences, lookalikes, new-versus-returning and value rules. 69 notes had passages (772 in all) and every passage was read. 25 had none; eight of those, including both event lessons among them, were searched again in wider words and had nothing on custom audiences. The digest was not relied on.

*Live facts read the same hour.*

| Fact | Value |
|---|---|
| `Website visitors - 180d`, Meta's own count | **20 people** |
| `chapter அ · customers (any payment)` | 120 in our registry; Meta shows its under-1,000 floor |
| Custom audiences on the account | those two only |
| Instagram accounts visible to the ads connection | none (so an Instagram audience must be made in Ads Manager) |
| Ad set `Ad Set 1`, Review tab | no custom audience, no exclusion, value rules off, no customer-lifecycle line; estimated audience 12.6 to 14.8 million |

*What the lessons say, by decision.*

1. **Define the two labels (Engaged audience, Existing customers): yes.** Nine lessons, four channels, none against: Ben Heath (2026-02-17, 04-03, 08-12, 10-07), Blue Sense Digital (05-04, 06-01), Antonio Ventre (06-01), Sam Piliero (07-05, 07-26). One caution, Charley T (07-18): Meta's new/engaged/existing split is not the same as measuring the cost of a new customer; that needs our own record.
2. **Existing customers = the list and the pixel's buyers, both.** Charley T (07-18: "back-end truth and pixel truth"), Sabri Suby (09-25: pixel purchasers plus lists uploaded at least monthly), Piliero (all-time purchasers), Ventre (people with one or more orders only), Heath (10-07: purchase audiences can now look back 730 days; a list may match only about half). Blue Sense (06-01) adds: watch that the list sync does not silently break. Ours syncs daily.
3. **Engaged = people who know us and have not paid.** Website visitors is the one piece everyone uses. Social engagers: Heath includes them (04-03, 10-07), Ventre says do not (06-01, because some are customers). Charley T's definition of a warm audience (09-29) is site visitors plus people who engaged with the Instagram account and Facebook Page, not followers.
4. **Excluding past buyers from the campaign: the lessons lean yes, for businesses unlike ours.** For: Blue Sense (05-11, 06-01, 07-28), Ventre (09-07), Piliero (07-05, 07-26), Danny Song (05-07), Suby (09-25), Mark Builds Brands (05-11), Charley T (07-18) — seven channels, all shops or lead sellers with repeat buyers and real spend. Against or wait: Charley T (09-29, never excludes buyers in his warm campaign), Andrew Faris (07-15), Heath (10-07: leave the default unless the breakdown shows a problem; the accounts affected are established names with many past customers and long ad histories; manual exclusions "wreck delivery" in his tests). **The advice sized to us:** Charley T (07-18), under $100 a day: set everything up, do not optimise for new customers yet, use it as a reporting column. Heath (08-12), tiny accounts: concentrate the data, one thing at a time. The OpenClaw report's own judgement: a past buyer of one experience may still buy another, so "exclude every previous customer" cannot be imported for events.
5. **Targeting with custom audiences (a warm ad set, retargeting, lookalikes): not at our size.** Depesh Mandalia (2025-12-09): local retargeting needs tens of thousands of people; put the closing ads in the same ad set instead. Andrew Southworth (2026-08-07): never below about 1,000 locally. Brandon Willington (2026-09-28): one cold campaign; explicit retargeting only for a defined exception. Blue Sense (06-01): about 90% of accounts need no separate site-visitor campaign. Heath (02-17, 04-03): combine; custom audiences are only suggestions to Meta now. Lookalikes: Blue Sense, Willington, Suby and Heath call them weak or out of date; Matt Shiver (07-21) would add two or three as suggestions below about 100 past purchases; Willington (2024) says a 100-person source is too small. **The counter-view, recorded:** Charley T (09-29) says the cheapest sales come from warm people and builds his base campaign on site visitors plus Instagram and Page engagers; Heath's beginner lesson (08-06) says use a warm audience for first wins if you have one. Our pools are 20 and 120 people, below every threshold named, and warm targeting would flatter the cost reading the first run exists to get.

*Conclusion: use custom audiences to measure, not to target.*

- **Set both labels before any money is spent** (they only count from the day saved):
  - Existing customers = `chapter அ · customers (any payment)` + a new website audience of people who fired Purchase (longest window Meta accepts; 730 days per Heath).
  - Engaged audience = `Website visitors - 180d` + a new audience of people who engaged with the Instagram account(s) the reels are on, 365 days. **This is the change from the earlier note.** With website visitors alone the Engaged label would hold about 20 people, and everyone who already knows chapter அ from Instagram would be reported as "new". That is the split the owner wants to see: sold to a stranger, or sold to someone who already knew us. It follows Heath and Charley T's definition and goes against Ventre's caution; Meta counts anyone found in both labels as a customer, which answers most of that caution.
- **Change nothing on the ad set.** No exclusion, no warm audience added as a target or a suggestion, no lookalike, no value rules. The 30 Sep decision stands and the lessons' advice for an account this size agrees with it.
- **Measure new-customer cost from our own bookings** (a phone never seen before), as the plan already says. Our database knows every past guest exactly; Meta's labels are the second view and read low.
- **When to look again at excluding:** if the breakdown or our own data shows a real share of spend or bookings going to past customers. Then use Meta's built-in "Acquire new customers" option with a list of that plan's past guests, not a manual exclusion, and not the all-customers list (it would block guests of other plans, who are the repeat customers the club wants).
- **To do on the owner's word:** create the two audiences (the Instagram one in Ads Manager, since the connection cannot see Instagram accounts; confirm there which accounts are offered), confirm the ad set still shows no exclusion, save both labels, read back. Whether the agent's clicks are allowed for this is not known; the page-info click was refused.
- **Status: OWNER DECISION PENDING.** Nothing created or saved.

**Everything still left, in one list:**

| Left | Whose |
|---|---|
| Website link on the ad | owner pastes |
| Caption | owner's words |
| Watch the video for an old date or price | owner |
| Ads 2 and 3, each a different idea, each with the same URL parameters | owner supplies, agent builds |
| Publish the ad, switched off | on the owner's word |
| A date for Founders Meet on the site; price ₹450/₹250; cost ₹150; seats | owner, in the admin panel |
| End date and campaign spending limit, once date and seats exist | agent, after the above |
| The three website checks in section 8 | not done |
| "Detailed page and product info" switch | **done**: off since 2026-10-10 05:10, verified |
| Customer labels: define both before any spend. Existing = list + new "people who paid" audience; Engaged = website visitors + new Instagram-engagers audience (all lesson notes read 2026-10-10) | owner's word, then agent or owner |
| Connection view-only or not | owner decision |
| Push of the local site changes (placement capture, `autoConfig`) | owner's call |
| Ad account money: ₹423.72, about 4 days at ₹100 a day | owner, when he wants |

---

## 6. Ad set settings

**Conversion**

| Setting | Value | Lessons |
|---|---|---|
| Conversion location | Website | |
| Performance goal | Maximise number of conversions | |
| Event | Purchase | SUPPORTED [EV1] |
| Cost per result goal | empty | SUPPORTED as a fit [BI1–2]: automatic bidding suits unproven ads |
| Bid strategy | Highest volume | same |
| Attribution | 7-day click · 1-day engaged-view · 1-day view | CONTESTED [AW1] |

- Do not explain the empty cost goal as "caps never work at low spend". One channel allows experienced buyers an exception [BI1]. It is simply the right start for ads with no history.
- **Expect one push once live:** "this ad set cannot reach ~50 conversions a week" (§29.4). At ₹100 a booking, ₹150 a day buys about 10 bookings a week if the cost holds. One channel says ads never stop learning and not to chase the label [OP2]. Do not spend to obtain a badge.

**Audience**

- **Location:** Chennai + 40 km. City-wide by owner decision; every event is in Chennai for now.
- **Minimum age:** 21, a hard limit. **Age suggestion:** 22–40, which Advantage+ treats as a hint.
- **Gender:** all. **Languages:** empty. **Interests and lookalikes:** none.
- **Advantage+ audience:** on. **Exclusions:** none.
- **Past Founders Meet guests will still see the ad** and land on "You've already booked". At about 28 past guests that is too few to matter, and too few for Meta to use as a list. It becomes a real cost only after many runs.

**Placements**

- All 6 Instagram spots: Feed, Stories, Reels, Explore, profile feed, search.
- Keep Feed ticked if Explore is on. Explore silently delivers nothing without it (§23).
- Off: Facebook, Messenger, Threads, Audience Network, and "Allow limited spend to excluded placements".

> **Heads-up, 2026-10-08 — this step may no longer be offered.** Meta is
> removing the option to exclude placements on an ad set, in phases, Sales and
> Leads campaigns first (Ads Manager notice from about 19–20 August 2026; found
> through Bram Van der Hallen's LinkedIn feed and cross-checked against trade
> write-ups). If our ad set has the change, the untick above will not be there
> and the next sync will not show `publisher_platforms = [instagram]`. What is
> reported to remain: an account-level switch for Audience Network, Marketplace
> and right column only; "value rules" that bid a placement down by at most 90%,
> never to zero; and per-creative placement choice at the ad level, where every
> placement must still be covered by some creative. **Not yet checked:** whether
> our account has the change, and what our placement watch reports once it does.
> Nothing in this plan was redesigned. Details and links:
> `META-FREE-LEARNING-SOURCES-2026-10-06.md` §9.

---

## 7. The ads

**Three ads, each a different idea.** SUPPORTED: change the reason to buy, not just the colour or the opening line [CR1, 4 channels]. The lessons give no proof that three is the most this budget can fund; three is our shortlist.

| Ad | What it is | Why |
|---|---|---|
| 1 | The proven reel (10K views, 25+ bookings), if it is eligible and shows no date | Our best evidence. An organic winner is a candidate, not proof of a paid winner |
| 2 | A different **reason** to come: what actually happened in the room, or a past guest talking | A different angle |
| 3 | A different **person or situation**: someone new to Chennai building alone. Or a plain static | A different persona or format. Flyers are allowed for events people already understand [EV12] |

**What every ad carries**

- **No date anywhere:** not in the video, the on-screen text, the caption or the headline.
- **The idea and the place.** For example: who it is for and what happens in the room, then `Chennai` and the area.
- **Words past guests used.** Work from real reasons, doubts and language, not invention [CF1, 4 channels].
- **Price line:** `₹250 to book your seat online, ₹200 at the venue.` Update it if the price changes; a price in a reel goes stale the same way a date does.
- **Headline:** `Founders Meet · Chennai`. **Button:** Book now.
- **Destination:** `/lifestyle`.
- **URL parameters, on every ad:**
  `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}&placement={{placement}}&site_source_name={{site_source_name}}`
- **Identity:** Page "Join Chapter அ" + the real Instagram account. Do not create a "Page-backed Instagram account" (§23).
- **Format:** one video or image per ad, because the true-ROAS join is per ad (§23). Multi-advertiser ads off.
- **Enhancements off.** Our reason is specific: text tools can rewrite a price. One channel allows additions around the ad while rejecting changes to the media itself [PL2], so "all off" is our constraint, not a universal rule. The OPP-1 guard (§30) pushes if any are left on.

**Dropped from revision 3**

- The copy line `Founders Meet · Sat <date> · <area>, Chennai`.
- The final-week `This Saturday · <n> seats left` ad. With no date in the ads, urgency lives only on the website. (Truthful deadline reminders are supported by two event channels [EV7]; leaving them out is part of what this run tests.)

**Later, on a winner only.** Once one ad is clearly taking the spend, new openings on that reel are the cheapest next test. This order is our choice; the lessons split on new ideas versus variations [CR2, CF2].

**Rules for the reels themselves** (Meta's requirements from the handoff; the lessons are SILENT on them)

- An existing post can be promoted only if it is under 90 seconds, 9:16, has **no third-party or trending music**, no filters or interactive stickers, and was not cross-posted to Facebook.
- Promoting an existing post keeps its likes and comments. Its caption cannot be edited. If the caption names an old date or an old price (₹299, ₹100 advance), use a new upload.
- A new upload needs licensed music (Meta's Sound Collection), original audio or voice only; 9:16 at 1080×1920; under 60 seconds; a 9:16 thumbnail; the bottom 35% of the frame clear of text.
- Check the video itself for an old date or price in on-screen text.

---

## 8. The website's job

The ad no longer says when. The website has to. SUPPORTED: the page should continue the ad's promise [LA1, 4 channels].

Check these before the ads run. They are checks, not build requests:

1. **How many taps from `/lifestyle` to seeing the date.** A visitor from a date-less ad arrives not knowing when the event is.
2. **What a visitor sees when the date is full.** The ads must be paused the same day, because nothing pauses them automatically (§20).
3. **What a past Founders Meet guest sees.** Today it is "You've already booked".

---

## 9. Before switching on

**Build everything PAUSED, let the morning checks run, then switch on.** The daily jobs read paused ads too (§8: sync 08:50, alerts 09:07, watchdog 09:11 IST).

| Push the next morning | Meaning |
|---|---|
| `{{ad.id}}` missing or wrong on a creative | Fix the URL parameters (§23) |
| An enhancement left on | Switch it off on that creative (§30) |
| Placements | Read before spend (§28.14). The Audience Network push fires only once the ad set is active |

No push suggests a clean build. It is not proof: the lessons are SILENT on how reliable our own checks are.

**Outside Ads Manager**

1. **Set the event's cost per ticket to ₹150:** Team ▸ Performance ▸ Per-Event Unit Economics ▸ "Your cost/ticket". At ₹0 the cost alarm thinks ₹250 a ticket is fine.
2. **Price:** ₹450 full / ₹250 advance in the event's city pricing. For open events `city_details` holds the real price, not `price_full` (§21.5).
3. **The new date goes on the SAME Founders Meet event (`founders-meet`). OWNER DECISION 2026-10-08.** His reason: once one event sells entirely through ads, the next step is running several events entirely through ads. Add a new date to that event; do not rename the old date (renaming is known to strand bookings, see the `invite-calendar-per-date-spots` memory). This replaces revision 3's advice to create a new event.
   **Checked the same day, by reading the code and the live rows (no test booking was made):**
   - **Paid phones are refused, as intended.** `create-payu-order` looks for an `advance_paid` or `fully_paid` row for this event + phone and answers 409. The live event holds **28 such rows: 10 `fully_paid` (came) and 18 `advance_paid` (paid ₹100 and did not come).**
   - **⚠ So the 18 no-shows are locked out too.** They never experienced a Founders Meet. Whether they should be allowed back is the owner's call; today the site would tell them "You've already booked". Not changed.
   - **Unpaid old leads can book normally.** The event has 5 `pending` rows. A returning lead hits the unique key, and `refresh_open_application` moves their row to the new date (it refuses to touch paid rows).
   - **One measurement gap, small.** A booking's traffic source is written only when its row is first created. If one of those 5 old leads comes back through an ad, the booking keeps its old source and will not count as an ad booking.
   - **Not verified:** how the calendar and the receipts look with one past date and one new date on the same event. Worth one look on the site before ads run.
4. **Events Manager → "Track events automatically without code" → off** (§24 item 4). If the event-priority list appears once the campaign exists, put Purchase at the top. Changing it later pauses delivery for 72 hours (§9).
5. **One founder push device.** Every alarm goes to that one phone. Keep its notifications on.
6. **Avoid test bookings while ads run.** The browser Pixel's test-phone guard is not live (§28.8), so a test booking reaches Meta as a real sale.

---

## 10. Reading results and acting

**Judge the campaign, not single ads.** Where Meta puts the money is its own verdict on the ads. Do not switch off the ad taking most of the spend because another looks cheaper on one or two tickets.

**Money and bookings decide. Clicks and views only explain.** SUPPORTED [RR1, 4 channels].

**Count bookings from our data** (bookings carrying an ad id), not Meta's Purchases. Revenue Meta credits to ads is not the same as revenue ads caused [AT1, 4 channels].

**Read after 09:11 IST.** Everything syncs once a day.

**Our decision table** (our own policy; the lessons are SILENT on these exact numbers)

| Campaign cost per booking | Action |
|---|---|
| ≤ ₹100 | Raise the daily budget about 20% every 2 days, **only while seats remain and the spending limit allows** |
| ₹100–150 | Hold |
| > ₹150 | Pause, then change the reel, the message or the offer, not the settings |

- **The 20% step is not expert consensus.** Four channels prescribe about 20–25%, each with different conditions, and two reject any fixed percentage [SC1–4].
- **The "10 tickets before judging" rule is ours.** It is AGAINST the lessons if read as "never act earlier": the channel behind it also uses an earlier stop-loss [TH2]. So keep three things apart: a stop-loss, a review window, and a rule for calling a winner.
- **How long to wait.** Channels give about 3 days for a signal, 7 or more to decide, and 48–72 hours of stillness after a change [RR2, TH5, SC3]. None is universal.
- **When many ads fail, look past the ad.** Diagnose where the journey breaks: the ad, the page or the checkout [RR3, 3 channels].

**The phone alarms that exist now** (handoff §33.6). All are heads-ups, not orders to pause. They use a rolling 7-day window.

| Alarm | Fires when |
|---|---|
| Campaign cost per ticket | Above ₹100 once the campaign has spent ₹500. With zero tickets, it fires once ₹500 is spent |
| Single ad without a sale | An ad spends ₹300 with no sale |
| Cost per Book now / Contact tap | Above ₹20 a tap, from ₹500 spent, including when nobody has tapped |
| Click-through, per ad | Under 1% of impressions become taps to the site, from 1,000 impressions |
| Frequency, per ad | Above 3, on Meta's own 7-day count |
| Missing tags, per ad | The `{{ad.id}}` tag is missing or wrong |

- The lessons are SILENT on this exact combination. For scale: channels put a stop-loss anywhere from 1.5–2× to 3–5× the target cost [TH1], which is ₹150–200 to ₹300–500 here.
- No lesson validates "7-day frequency above 3" [FQ1–2]. The published figures use other windows.
- **The ₹100 alarm will fire during a deliberate top-up.** That is expected then.
- **The 7-day alarm and the whole-run total are different numbers.** For a review, divide total spend since the first delivery by tagged paid tickets over the same period. A quiet recent alarm does not mean earlier losses were recovered.

**Not pushed to the live admin panel** (in local commits): the "too few tickets to judge" label and grey ROAS, the per-ad funnel, the `untagged_spend` alarm, and the placement-per-booking capture. Until then the live panel colours ROAS green or red on one or two tickets; do not act on those colours. Funnel steps from visits made before that code ships cannot be recovered later. Pushing is the owner's call.

---

## 11. What the first run is meant to teach

1. **Cost per booking**, for the whole run.
2. **Days and money to fill the room.** How many days of ads, and how much in total, before the seats were gone or bookings closed.
3. **Bookings by days-before-date.** With the same spend every day, this shows which days' money sold the most. The owner expects a curve. One nightlife channel reports about 70% of sales in the final phase [EV6, 1 channel]; that is not a Chennai forecast. This is what tells the next run whether one, two or three weeks is enough.
4. **New or returning.** Match each ad booking's phone against earlier paid bookings on other plans. This is a query Claude runs; no panel card exists for it.
5. **No-shows.** Compare how many ad bookers pay the venue balance against earlier organic bookers (§21.4).
6. **Which idea took the spend.**
7. **Return:** money from ad bookings against ad spend, on our own numbers.

**Once a second date is open,** lead time can also be read directly: compare the day of each ad booking with the date the person chose (`applications.selected_date`).

- **Read the curve week by week, not day by day.** At about one booking a day, single days are noise. Said once: a small sample widens the uncertainty, and it is still worth collecting.
- **With no organic reels running**, bookings in the period can be read as ad sales. Each booking also carries the ad it came from, so the two stay separable either way.

After each date, write the numbers down here or in the handoff, so the next run starts from measurements.

---

## 12. Kept, retired, and not for us yet

**Retired on 2026-09-30** (the recipe and reasons are in the archive and in handoff §24): the four draft website audiences, the lookalike plan with the `customers_completed` upload, the `leads_unpaid` upload, and catalog ads with `meta-catalog-feed`. The digest's view: these stay **our decisions**. The lessons do not show these methods are obsolete for everyone [RT2, TA4].

**Kept:**

- `customers_all_paid` and its daily sync, as a ready-made seed or exclusion if needed later.
- Pixel, Conversions API, match quality and the signal watchdog. Good tracking matters; better match quality is not a guaranteed lift in results [TR1–3].
- The `{{ad.id}}` join, true ROAS and the alarms.
- The enhancements guard, placement watch, learning-status capture and delivery history.

**Advice in the lessons that does not fit us yet, and what would change that** (digest §9):

| Leave aside for now | It becomes relevant when |
|---|---|
| Producing many ads on a quota | Each idea can get meaningful delivery |
| Separate testing and scaling campaigns | We need a distinct learning budget |
| Bid caps on proven ads | We have ads with a purchase history and a delivery limit |
| Sales calls and follow-up teams | The sale stops being self-serve |
| Spending today against future repeat visits | Cross-plan repeat value has been measured over a fixed period |
| US or ecommerce CTR and CPM targets | Only ever as a labelled comparison, never as pass or fail |

---

## 13. Open items

| Item | Whose | Note |
|---|---|---|
| The date, the number of seats, the venue area | owner | Sets the budget and the start day in section 4 |
| The daily amount | owner | ₹100 a day makes days of ads equal to seats |
| Top-up ceiling | owner | Undecided on purpose. Section 3 shows where a loss starts |
| Should the 18 past no-shows be allowed to book again | owner | They paid and did not come, and are blocked today (section 9, item 3) |
| One look at the calendar with a past date and a new date on the same event | before the ads run | Section 9, item 3 |
| Meta's minimum daily budget | re-read in Ads Manager | Recorded as ₹94.91 |
| Website checks | before the ads run | Section 8 |
| Girls-Only Meet show-up count | a query | Section 3 |

---

## 14. Record of the owner's decisions on 2026-10-08

Kept so a later session can see how this revision came about.

- **The digest's three questions.** (1) Efficient ticket sales over a fair test of each ad. (2) City-wide Chennai. (3) Daily or lifetime budget: unsure at first.
- **On question 3**, a session recommended a ₹2,000 lifetime budget over the last two weeks. The owner rejected a fixed window as a guess. His approach: the budget is ₹100 × the seats wanted, start about three weeks out, watch, and add money in the final week if seats are empty, knowingly at a loss, to learn whether one, one and a half or two weeks is enough.
- **He then moved to the always-on, date-less shape**, which settles question 3: a daily budget.
- **A session called the "already booked" rule a blocker** for running two dates of one plan. The owner corrected it: the rule is deliberate, because each run needs new people.
- **The older "three weeks of ads at ₹150 a day with a ₹2,000 limit" wording** did not add up (₹2,000 ÷ ₹150 is about 13 days; 21 days × ₹150 is ₹3,150). It is superseded by section 4.
- **Revision 4.1.** After reading revision 4, the owner simplified: one Founders Meet on one fixed date, ads from two or three weeks before on a fixed daily budget, no date on the creative; add a second date only after a good reading of cost per booking, days, spend and return. "Change one thing at a time to learn." The two-dates-at-once, ads-all-the-time shape is the next step, not the first.
- **The new date goes on the same `founders-meet` event** (owner, after revision 4.1), so past guests stay blocked. A read of the code and live rows found the block also covers the 18 people who paid and did not come.
