# Google Analytics: connection and first full read (2026-10-12)

What this is: how Claude Code was connected to the site's Google Analytics, every
number read on the day, what the numbers say, and what is wrong with the data.
Written the same day so a later session can tell what has gone stale.

All figures were read on **2026-10-12, about 7pm IST**, covering **2026-04-19**
(first day of data) to that moment. Unless a line says otherwise, figures are for
the live site only (`hostName = chaptera.in`).

---

## 1. How the connection works

| Piece | Value |
|---|---|
| Analytics account / property | "chapter A" (`391884328`) / "chapter" (`533625884`) |
| Web stream | "chapter website", `https://chaptera.in`, tag `G-3MLZ9S6M2S`, stream `14394564283` |
| Property created | 2026-04-18, time zone Asia/Calcutta, currency INR |
| Google Cloud project | `chapter-a` (the same one behind the site's Google login) |
| Services switched on there | Google Analytics Data API, Google Analytics Admin API |
| Reader | `ga-reader@chapter-a.iam.gserviceaccount.com`, no roles on the Cloud project |
| Its access | **Viewer** on the property (read reports and settings, change nothing) |
| Key file | `~/.config/chaptera/ga-reader-key.json`, mode 600, outside every repo |
| MCP server | `analytics-mcp` 0.7.0 (Google's own), installed with `pipx` |
| Registered | Claude Code **local scope** for this folder only; nothing in the repo |

Two different Google accounts are involved, which is the trap to remember: the
Cloud project `chapter-a` belongs to one Google account, and the Analytics
property belongs to another. That is fine. The reader lives in the Cloud project
and is simply listed as a Viewer in Analytics. Anything done in Analytics Admin
has to be done while signed in to the Analytics account.

The MCP's tools: `get_account_summaries`, `get_property_details`,
`list_google_ads_links`, `list_property_annotations`,
`get_custom_dimensions_and_metrics`, `run_report`, `run_realtime_report`,
`run_funnel_report`, `run_conversions_report`.

To remove everything: `claude mcp remove analytics-mcp -s local`, delete the key
file, delete the reader in Cloud Console (IAM, Service accounts), and remove it
from Analytics Admin, Property access management.

### Traps hit while setting it up

- **Tools added mid-session do not appear in that session.** The first read was
  done by calling the same Google API with the same key from Python (the pipx
  environment at `~/Library/Application Support/pipx/venvs/analytics-mcp/`).
- **Inside Claude Code's sandboxed shell the Google client cannot look up
  addresses** ("Could not contact DNS servers"). Setting
  `GRPC_DNS_RESOLVER=native` fixes it. It is also set on the MCP entry.
- Occasional "502 Bad Gateway" from inside the sandbox; a retry clears it.
- The key must never enter the repo: the repo is public and Google
  automatically disables keys it finds in public repositories.
- Google's no-login PageSpeed API was out of free daily quota, and the public
  PageSpeed page does not draw results in a hidden browser pane. Lighthouse run
  locally (`npx lighthouse@12`) gives the same test.
- **Always filter to `hostName = chaptera.in`.** See section 5.
- The Google tag settings panel in Analytics Admin is an embedded frame: it does
  not scroll with the mouse wheel through browser automation and its contents
  are invisible to element search. Click inside it, then press Tab to move down
  (Shift+Tab to move up) and click by position.
- Google flags the tag "Needs attention: additional domains detected". That is
  the tag firing on `localhost` and preview sites. The cure is to stop it
  loading there, not to add those addresses in Google.

---

## 2. Traffic

Since 2026-04-19: **29,544 visitors, 40,407 visits, 78,154 page views.**

| Month | Visitors | Visits | Engaged visits | Avg visit |
|---|---|---|---|---|
| Apr (from 19th) | 3,479 | 4,391 | 50.1% | 1:55 |
| May | 18,103 | 22,653 | 48.8% | 1:27 |
| Jun | 3,986 | 5,409 | 56.9% | 3:04 |
| Jul | 2,330 | 4,026 | 59.7% | 4:29 |
| Aug | 1,854 | 3,168 | 67.4% | 3:40 |
| Sep | 737 | 1,034 | 64.5% | 3:28 |
| Oct (to 12th) | 321 | 376 | 64.1% | 2:45 |

(Monthly rows include the small amount of test traffic described in section 5.)

- The wave ran from 25 April to 17 May: 24,700 visits. Peak day 26 April, 1,538
  visitors. It was real: 16,722 of those visits were from Chennai, arriving from
  the Instagram bio link (14,347) and SuperProfile auto-DMs (6,755), landing on
  `/lifestyle`.
- Last 28 days: **829 visitors, 1,050 visits**, 65.9% engaged, average 2:17.
  The 28 days before: 778 visitors, 1,117 visits. Flat, about 30 visitors a day,
  with bumps on days a reel lands (18 Sep: 57, 20 Sep: 89, 28 to 30 Sep: about 60).
- "Engaged" is Google's term for a visit that lasted over 10 seconds or saw 2+
  pages. It rose from 49% in May to 64 to 67% since August: fewer, better visitors.
- Come-back rate is tiny. Of people first seen in a given week (Aug to Sep), 1 to
  5% returned the following week and under 2% after that. 3,642 returning
  visitors all-time, about 12%.

## 3. Where visitors come from (all-time visits)

| Source | Visits | Share | Engaged |
|---|---|---|---|
| Instagram bio link (`ig / social`, `utm_content=link_in_bio`) | 18,235 | 45% | 49.3% |
| SuperProfile auto-DM (`sp_auto_dm`) | 11,369 | 28% | 58.7% |
| Direct / unknown | 6,384 | 16% | 57.8% |
| Google sign-in returning (`accounts.google.com`) | 1,193 | 3% | team logins, not customers |
| Other Instagram (`l.instagram.com`, `instagram.com`, ManyChat) | 1,319 | 3% | 20 to 37% |
| PayU returning (`secure.payu.in`, `test.payu.in`) | 545 | 1% | payers coming back |
| Facebook (`facebook.com`, `m.facebook.com`) | 252 | under 1% | mostly Meta's robots |
| YouTube | 74 | | |
| Google search | 46 | | |
| ChatGPT | 29 | | |
| Paid ads (`meta / paid`) | 3 | | tests only |

Instagram in all its forms is at least 76% of visits. Google search sent 46
visits in six months.

Last 28 days: bio link 364, direct 315, SuperProfile DM 161, `l.instagram.com`
45, PayU 40, Facebook 60.

Creator links, last 90 days (visitors, approximate): `rat_roy_` 163,
`mahathi_stephen` about 152, `its_keethi_diaries` 28, `_sunshadow` 22,
`jayasuryavlogs` 21, `varshaa_blessy` 17, `methun_methu` 10, `riyas.cann` 10.
A further 36 to 42 "visitors" arrived on `?ref=mahathi`, which matches no
creator. **They are not people.** Checked the same evening: every one came from
a Meta data-centre town (Luleå, Prineville, Dublin, Fort Worth, Forest City), one
page, about 30 seconds, every three to four days since 13 August. Meta's
link-checking robot reads her link only up to the space in it. Real people use
the full link (`?ref=mahathi%20_stephen`, 238 visitors since August), and
`normalizeHandle` in `src/affiliate.ts` strips the space, so she is credited
correctly.

## 4. Who they are and what they do

- **Phones: 94.5% of visits.** Android 61%, iPhone 32%. Desktop is 4.5%, and
  much of that is the team.
- **Chennai: 70% of visitors** (20,773). Then Coimbatore 1,009, Bengaluru 941,
  Madurai 659, Salem 596, Mumbai 549. India is 95%.
- Busiest hours are 8pm to midnight IST, 10pm the peak; quietest 3 to 5am.
  Tuesday and Sunday are slightly ahead; the week is otherwise flat.
- Instagram's Android in-app browser was 30.9% engaged all-time but **73.6% in
  the last 28 days**, which is the removal of the "open in your browser" wall
  showing up in the data.

Pages, all-time views: `/lifestyle` 35,197 · `/plans` 31,776 · `/invite` 2,490 ·
`/creator` 2,172 · `/admin` 1,894 · `/galcode` 1,827 · `/` 1,496 · `/aboutus` 707.
Time spent is almost all on `/plans` (158 hours, against 11 hours on
`/lifestyle`), as expected for a poster page that hands off to the plan list.
`/galcode` was the second-biggest landing page of the last 28 days (297 visits,
88.6% engaged).

### Booking steps, last 28 days, counted in people

The app has put each sheet in the address (`?sheet=…`) since August 2026, so
Google sees them as page views.

| Step | People | Of all visitors |
|---|---|---|
| Any page | 829 | 100% |
| Plan list (`/plans`) | 570 | 69% |
| Opened a plan (`event-details`) | 371 | 45% |
| Opened the date calendar (`details-calendar`) | 273 | 33% |
| Chat after details (`post-details-chat`) | 53 | 6% |
| Booking timeline | 31 | 4% |
| Details form | 23 | 3% |
| Bill page (`payment-checkout`) | 15 | 1.8% |
| Came back from PayU | 9 | 1.1% |

Last 90 days has the same shape: 3,520 visitors, 2,103 plan list, 1,272 opened a
plan, 977 calendar, 297 chat, 71 bill page (2.0%), 51 back from PayU. (The 90-day
middle rows are slightly undercounted because sheet addresses only began in
August.)

**The largest drop is right after the date calendar: about four in five people
who look at dates take no further step.** Treat this as Google's view only. The
order of the middle steps differs between invite and open events, and the
site's own `flow_analytics` is the better source for booking steps.

### Cross-check against real payments (from `payu_payments`, not Google)

People who paid, by month, test numbers excluded: Jun 30 · Jul 30 · Aug 61 ·
Sep 13 · Oct 7 (six of those were balance payments on earlier bookings). 171
successful payments and 24 failures in all. PayU rows start in June.

Very roughly, visitors to paying people: Aug 3.3%, Sep 1.8%. Different units
(browsers against phone numbers), so read it as a scale, not a rate.

## 5. What is wrong with the data

1. **Google knows nothing about bookings.** The site sends no events of its own.
   Google holds only its eight automatic ones (`page_view`, `scroll`,
   `session_start`, `first_visit`, `user_engagement`, `click`, `form_start`,
   `form_submit`). The one conversion defined, `purchase`, has never fired: 0
   key events, 0 transactions, 0 revenue. Google can say how many came. It
   cannot say which source produces paying guests.
2. **Test traffic is mixed in.** `localhost` 5,344 page views, preview sites
   about 780: 7.3% of all page views. On top of that, `/admin` is 1,894 views
   and 35 hours from 51 team browsers. **Fixed on 2026-10-12**, commit `7571a50`, pushed that night with the owner's
   OK: Google's tag and Contentsquare start only on the real site, and Google's
   tag never on the team's screens. It stops new pollution from then on.
   Everything already recorded stays, so reports covering dates before that
   push still need the `hostName` filter.
3. **PayU and Google sign-in were counted as traffic sources.** A guest returning
   from PayU started a new visit credited to PayU, which cut the trail from
   Instagram to payment. **Fixed 2026-10-12, about 7:45pm IST:** data stream,
   tag settings, "List unwanted referrals" now holds two rules, referral domain
   contains `payu.in` and contains `accounts.google`. Applies to visits from
   then on; everything before that date still shows the old behaviour.
4. **SuperProfile DMs were filed under "Unassigned"** (11,340 visits) because the
   link carries a source but no medium. It is Instagram. **Fixed 2026-10-12:** a
   channel group "chapter channels" (Google's defaults plus: source exactly
   `sp_auto_dm` counts as Organic Social) is now the property's primary channel
   group. Google applies a primary group from that day on. For older dates,
   choose "chapter channels" as the channel dimension. Through the API the
   default dimension `sessionDefaultChannelGroup` is unchanged and still says
   Unassigned; read `sessionSource` instead.
5. **Personal details reached Google in page addresses until 2026-10-12.**
   Page views whose address held a phone number and a name
   (`/invite?phone=…&name=…`): Jul 34, Aug 35, Sep 5, Oct 5, **79 in all**,
   the latest on 11 Oct. In October 16 page views also carried the private
   WhatsApp tap code (`wa=`). **Fixed and live since 7:39pm IST on 2026-10-12**
   (commit `08b2a98`, by another session), with Google's own "Redact data"
   switched on as a backstop. This document's first draft, written minutes
   before that push, said the fix was not live; it was true then and is not
   now. The owner decided against asking Google to delete what is already
   stored. Background: `docs/TRACKER-ADDRESS-LEAK-2026-10-11.md`.
6. **Meta's link-checking robots count as visitors.** About 53 of the last 28
   days' 829 "visitors" (6%) came from Meta data-centre towns (Prineville,
   Luleå, Dublin, Forest City). All-time it is under 1%.
7. **Detail was kept for 2 months only** (Google's default). Totals and the
   reports above are not affected; Google's own Explorations and funnel reports
   are. **Changed to 14 months on 2026-10-12** and confirmed through the API
   (`FOURTEEN_MONTHS`). Detail older than about mid-August 2026 had already
   been dropped and does not come back.
8. Small: 14 page views of `/{{1}}`, `/invite{{1}}` and `/invite/{{1}}`, a
   WhatsApp button link whose blank was never filled. Checked: every one was a
   desktop Safari in Chennai (one in Bengaluru) in a visit that began at
   `localhost`, Google sign-in or a PayU return. That is the team testing
   templates. No phone ever opened one.
   `scroll` fires for 96% of visitors because the poster page fits one screen,
   so it means nothing here.

Not wrong, just absent: no custom dimensions, no Google Ads link, no speed data
(the site does not send any to Google).

## 6. Speed (lab test, not Google Analytics)

Lighthouse 12.8.2, 2026-10-12, phone-sized, simulating a slow phone on slow 4G.

| | `/lifestyle` | `/plans` | Google's "good" |
|---|---|---|---|
| Score | 55 / 100 | 49 / 100 | 90+ |
| First thing painted | 5.3 s | 4.9 s | under 1.8 s |
| Main content visible | 9.5 s | 9.0 s | under 2.5 s |
| Page freezes while loading | 190 ms | 380 ms | under 200 ms |
| Layout jumping | 0 | 0.05 | under 0.1 |
| Server reply | 50 ms | 70 ms | under 800 ms |
| Download size | 3.3 MB | 1.1 MB | |

- Healthy: the server is fast, nothing jumps around, the page does not freeze.
- Slow: nothing appears until the 446 KB app script has downloaded and run. That
  wait is 7.5 to 8.3 of the 9 seconds. About 600 KB of script is not needed for
  the first screen.
- Trackers add about 530 KB: Meta 194, Google tag 176, Contentsquare 159.
- `/lifestyle` carries 2.3 MB of poster images; `frame.png` alone is 1.2 MB.
  Modern formats would save about 2.1 MB.
- This is a worst-case simulation. Real visitors' speed is in Vercel Speed
  Insights, which was not read.

Side effect of testing: three robot visits to the live site on 2026-10-12
around 7pm IST (one from Google's PageSpeed, two from local Lighthouse).

## 7. Not done, and whose call each is

The first two were done on 2026-10-12 at the owner's request. The rest are
unchanged, and each is a setting or a code change the owner decides. The full
phased list, in plain words, is `docs/WEBSITE-OPTIMISATION-PHASES-2026-10-12.md`.

- DONE: detail retention raised from 2 to 14 months.
- DONE: PayU and Google sign-in listed as unwanted referrals.
- DONE (commit `7571a50`): Google's tag and Contentsquare only on the real
  site; Google's tag never on the team's screens.
- DONE: SuperProfile DM visits counted as Organic Social ("chapter channels").
- Send booking steps and purchases to Google as events (code change).
- DONE by another session: the address-cleaning fix is live.
- Nothing to do: `?ref=mahathi` turned out to be Meta's robots.
- Shrink the poster images and split the app script (code change).
