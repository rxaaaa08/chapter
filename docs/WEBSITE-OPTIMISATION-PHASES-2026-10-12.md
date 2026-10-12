# Website optimisations, in phases (2026-10-12)

A list of everything worth improving that the first full Google Analytics read
and a speed test turned up. Plain words, grouped so each phase can be done on
its own. Nothing here has been done unless it says **Done**.

The numbers behind every item are in
`docs/GOOGLE-ANALYTICS-BASELINE-2026-10-12.md`. Code facts were checked on
2026-10-12 and are cited where they matter.

How to read the tags:

- **Google setting**: a switch in Analytics Admin. No code, no push. Must be done
  from the Google account that owns Analytics.
- **Code**: a change to the site. Needs a push, so it needs the owner's OK.
- **Look first**: an investigation. Nothing changes until the answer is known.
- **Owner's call**: a business decision, not a technical one.

---

## Done on 2026-10-12

1. **Google keeps the fine detail for 14 months instead of 2.** (Analytics Admin,
   Data retention. Confirmed afterwards through the API.) Takes effect within 24
   hours. It cannot bring back detail already dropped, so Google's own funnel
   and exploration reports reach back only to about mid-August 2026.
2. **PayU and Google sign-in no longer count as places visitors come from.**
   (Data stream, tag settings, List unwanted referrals: `payu.in` and
   `accounts.google`, both "contains".) From now on a guest returning from
   payment stays part of the same visit, so the visit keeps its real source,
   such as Instagram. History is not rewritten.

---

## Phase 1: make the numbers trustworthy

**Status, night of 2026-10-12: all seven closed.**

1. **Stop guests' phone numbers and names reaching Google.** **DONE and live.**
   Another session finished and pushed this the same evening (commit `08b2a98`,
   7:39pm IST), and switched on Google's own "Redact data" for `phone`, `name`,
   `email`, `wa` as a backstop. When this list was first written, about ten
   minutes earlier, the live site did not have it yet. Checked again
   afterwards: it does. Write-up: `docs/TRACKER-ADDRESS-LEAK-2026-10-11.md`.
2. **Stop test visits being counted.** **DONE.** Commit `7571a50`, pushed on 2026-10-12 with the owner's OK.
   Google's tag and Contentsquare used to load on every copy of the page:
   `localhost`, preview sites, a local build. That was 7.3% of all page views
   Google ever recorded, and the reason Google flags the tag "Needs attention".
   Both are now started by one small script at the end of the tool block in
   `index.html`, and only on `chaptera.in` / `www.chaptera.in`, the same rule
   the Meta pixel already had.
3. **Keep the team out of the visitor numbers.** **DONE.** Same commit, `7571a50`. Google's tag no longer starts on `/admin` or `/team`, in the
   installed admin app, or on a plan preview opened from the admin panel (those
   links already carry `staff=1`, and the site's own counting already skips
   them). A browser tab that has once been any of those stays uncounted until
   it is closed: the first version missed that closing a staff preview reloads
   the page at `/lifestyle`, and the sealed test caught Google counting it.
   `/creator` is still counted: creators are outsiders signing up.
   Contentsquare was deliberately left running on the team's screens; whether
   it should record them is an owner's call (it would mean no recordings of the
   admin panel at all).
4. **Label SuperProfile DM visits as Instagram.** **DONE.** A channel group
   called "chapter channels" now exists in Analytics: Google's default groups,
   with one extra rule in Organic Social (source is exactly `sp_auto_dm`). It
   was made the property's primary channel group on 2026-10-12. Google applies a
   primary group **from that day on**; for older dates, pick "chapter channels"
   as the channel dimension in a report and the old visits are filed correctly
   too.
5. **The mistyped creator link.** **Closed, nothing to fix.** All 36 visitors on
   `?ref=mahathi` came from Meta data-centre towns (Luleå, Prineville, Dublin,
   Fort Worth, Forest City), one page each, about 30 seconds each, on a
   regular three-to-four-day rhythm since 13 August. They are Meta's
   link-checking robots, which read her link only up to the space in it. Real
   people arrive on the full link, `?ref=mahathi _stephen` (238 visitors since
   August), and the site already strips the space and credits her correctly.
   No creator lost a booking.
6. **The unfilled WhatsApp button.** **Closed, nothing to fix.** All 14 page
   views of `/{{1}}`, `/invite{{1}}` and `/invite/{{1}}` came from a desktop
   Safari in Chennai (one in Bengaluru), in visits that began at `localhost`, at
   Google sign-in, or on return from PayU: 5–6 May, 7–9 July, 29–31 August. That
   is the team testing templates. No phone ever opened one, so no guest received
   a broken link.
7. **Asking Google to delete the stored addresses.** **Closed.** The owner
   decided against a deletion request on 2026-10-12 (recorded in the leak
   write-up).

## Phase 2: make the site load faster

**Status, 2026-10-13: five of seven built, tested on this Mac and pushed the
same day with the owner's OK (he checked the poster's look himself on
`localhost:5175` first). One (the trackers) deliberately not started. One (real
visitors' speed) closed by the owner's decision, below.**

No change to what a guest sees. Measured on a copy of the site built on this
Mac, on Google's slow-phone test with the slowdown really applied (median of
three runs each):

| Page | Main content appears | Weight of the page |
|---|---|---|
| `/lifestyle`, before | 10.6 s | 2,762 KB |
| `/lifestyle`, after | **4.4 s** | **553 KB** |
| `/invite`, before | 12.2 s | 5,106 KB |
| `/invite`, after | **5.4 s** | **746 KB** |

These numbers leave out the three outside tools (they do not run on a local
copy, by design), so the live site will read a little slower than the "after"
row. The "before" row matches what Google's test said about the live site
(9.0 to 9.5 s).

**What the wait actually was.** The poster page shows nothing until all nine
poster pictures have arrived, and gives up waiting after 6 seconds. On a slow
phone 2.3 MB of pictures never arrives in 6 seconds, so every such guest sat
through the whole timer, after the script had already taken its 3 to 4 seconds.
That, not the script alone, was most of the 9 seconds.

1. **Stop sending the admin panel to every guest.** **Built and tested.** The
   admin panel, the creator dashboard and the team training are now three
   separate downloads, fetched only when their page is opened
   (`lazyScreen` in `src/App.tsx`). The script every guest waits for went from
   1,641 KB to 1,019 KB (455 KB to 294 KB as sent). If a team member's tab is
   open across a release and asks for a file the new build no longer has, the
   page reloads itself once; if that does not help it says so with a "Try
   again" button and reports the failure to Sentry. Checked in a browser:
   `/admin`, `/creator` and `/team` each open and fetch only their own part.
   *Not done, and worth doing next:* the plans screen (`AppFlow`, 160 KB of the
   remaining 1,019) also rides along on the poster page, where it is not needed
   until the guest taps through. Splitting it touches the main guest path, so
   it was left for its own sitting.
2. **Shrink the poster pictures.** **Built and tested.** 23 pictures, 6,942 KB
   to 620 KB (the nine `/lifestyle` layers: 2,281 KB to 230 KB). The first
   version of this list said they were "sized for a desktop"; they are not.
   They are 874×1330, which is right for a phone, and were left that size. The
   whole saving is the file format (PNG to WebP, quality 90, see-through parts
   kept exact). Compared with the originals at twice the size, on the letter's
   small text and on the see-through edges: no difference found. The owner
   compared it with the live site himself and approved it ("the posters are
   looking good").
   The site now serves copies in `src/assets/poster/`; the original PNG files
   stay in `public/` as the source. **After changing any poster PNG, run
   `scripts/poster-to-webp.cjs`** (instructions at the top of that file) or the
   site keeps showing the old picture.
3. **Let phones keep the pictures.** **Built, with a deliberate limit.**
   `vercel.json` now tells phones to keep pictures and fonts under `/assets/`
   for a year. That is safe because the build names each of those files after
   its contents, so a changed picture gets a new address by itself; no version
   tag to remember (the old `?v=20260424-2` tags are gone). *Scripts and
   styles were left out on purpose.* The live site applies our custom headers
   to "not found" answers too (checked: a made-up `/assets/` address came back
   404 carrying our `X-Frame-Options`). If a phone were ever told to keep a
   "not found" for a year, a missing picture costs one decoration, but a
   missing script costs the page. **One check after the push settles it:**
   `curl -I https://chaptera.in/assets/nope.webp`. If the 404 does *not* carry
   the year-long `cache-control`, the rule can safely be widened to scripts and
   styles (one line).
4. **Start fetching the poster early.** **Built and tested.** `index.html` now
   asks for the poster pictures while the page is still being read, so they
   download alongside the script instead of after it. Only on `/lifestyle`,
   `/galcode` and `/invite`, and each gets only its own pictures (9, 9 and 13).
   The early request for the UPI logo on every page is gone; the logo (3 KB)
   now travels inside the script, so the bill page shows it with no request.
5. **Load the three trackers after the page is usable.** **Not started, on
   purpose.** It changes the tool block in `index.html`, so it needs the sealed
   privacy test re-run, and it changes when Meta's page view fires, which
   needs checking against the Meta signal checks. It also cannot be measured
   on a local copy at all, because the tools only run on the real site. The
   sensible order: push items 1 to 4 and 6, run Google's test on the live site,
   and see how much of the remaining wait is the tools before touching them.
6. **Serve the fonts from the site itself.** **Built and tested.** Inter now
   comes from the site (two files, the same ones Google was serving, with
   Google's own rules copied exactly). The first version of this list said
   three font families; guests only ever loaded one. DM Sans and Instrument
   Serif are requested only by the old homepage, which nothing but a mistyped
   address reaches now, so that request was left alone. Do not "tidy" it by
   declaring those two site-wide: several screens name DM Sans without ever
   having been given it, and would change their look. The second Inter file
   holds the rupee sign; do not drop it.
7. **Read real visitors' speed.** **Closed by the owner's decision,
   2026-10-13:** do not switch speed measuring on for more pages, and do not
   add any tracking that could slow the site; what matters is that the site is
   fast, judged by Google's test on the live site. Nothing below needs doing.
   It is kept because it says what exists and how to read it if that changes.
   Two findings. First, Vercel Speed Insights is only switched on for the plans
   pages (it sits in the last branch of `App()` in `src/App.tsx`). The poster
   page and the invite page, the two pages this phase speeds up, have never
   been measured on real phones, so there is no real-visitor "before" for them
   to lose. Switching it on there is a small code change, but `/invite`
   addresses carry personal values, so it must go through the sealed test
   first. Second, the reading itself: Vercel's command-line tool can now pull
   these numbers (`vercel metrics`, added June 2026) and is on this Mac, but
   its sign-in has expired. After the owner runs `npx vercel login` once:
   `npx vercel metrics vercel.speed_insights.lcp_ms --aggregation p75 --group-by route --since 7d --prod`
   (and the same with `--aggregation count` to see how many readings sit behind
   each number). Vercel's connector for Claude exists too, but its listed tools
   cover deployments, logs and visitor counts, not these speed numbers, and it
   is given the whole account.

**Traps hit while measuring, so the next reading is not fooled:**

- **The service worker makes a throttled speed test lie.** `public/sw.js`
  passes every request through itself, and the test's slowdown does not apply
  to requests a service worker makes. The old build "loaded" 2.3 MB of pictures
  in under a second and looked *faster* than the new one. Test a copy with
  `sw.js` deleted (registration then fails harmlessly).
- **The quick ("simulated") mode of Google's test ignores the wait-for-all-nine
  rule**, so it reported the old page at 4.7 s when the real figure was 10.6.
  Use `--throttling-method=devtools`.
- **Opening the site on a local copy writes a `page_view` row to the live
  database** each time. Block `*supabase.co*` in the speed test; for browser
  checks, note the tab's `ca_session_id` and delete those rows afterwards
  (done for this session: 11 rows).
- A local preview of the *built* site is now one click: the `built-site` entry
  in `.claude/launch.json` (run `npx vite build` first; port 4174).

## Phase 3: see the whole journey

Google currently knows how many people came and nothing about what they booked.

1. **Tell Google about the booking moments.** *Code.* Opened a plan, picked a
   date, started their details, reached the bill, paid (with the amount). The
   site already has one function every step passes through (`trackEvent` in
   `src/supabase.ts`), so this is one place to change. Never include a phone
   number or name. The `purchase` key event already exists in Google and has
   simply never been fed. Honest framing: the site's own records already hold
   the source of every booking, so this is a second view, not the only one. Its
   value is that Google's ready-made reports (by source, by city, by device)
   start showing payers instead of just visitors.
2. **Finish the site half of the unified analytics.** *Code, already designed.*
   The backend has been live since 2026-10-11; the site is not yet sending to
   it. That system, not Google, is the authority on booking steps.
3. **Compare the two funnels once.** *Look first.* Google's step counts (from
   `?sheet=` addresses) against the site's own funnel table for the same 28
   days, to learn how far apart they are and which to trust for what.
4. **A weekly vital-signs read.** *Look first, can be automated.* The same short
   table each week: visitors, where from, engaged share, how many reached the
   bill, how many paid. Trends only show when the same numbers are read on a
   schedule.
5. **Leave the robots out when reading.** *Look first.* About 6% of recent
   "visitors" are Meta's link checkers in data-centre towns (Prineville, Luleå,
   Dublin, Forest City). Google has no switch for them; the weekly read should
   exclude those towns.

## Phase 4: lose fewer people on the way to paying

Needs Phase 3 first, so changes are judged on evidence. Last 28 days: 829
visitors, 570 saw the plan list, 371 opened a plan, 273 opened the date
calendar, about 53 took any further step, 15 reached the bill.

1. **Find out why four in five stop after the date calendar.** *Look first.*
   This is the largest drop on the site. Watch Contentsquare recordings of that
   exact step and read the site's own funnel for it. Possible reasons to test,
   not conclusions: no date suits them, the price is a surprise at that point,
   it is unclear what happens next, or they were only browsing.
2. **Then test one change at a time.** *Code, using the site's own A/B engine.*
   What to test depends on item 1. Candidates: show price and spots left before
   the calendar; make the next step after choosing a date unmistakable; offer a
   way to hear about new dates when none suits (that last one is an owner's
   call, since it means messaging people who have not booked).
3. **Test the poster page.** *Code, A/B.* Roughly three in ten visitors never
   reach the plan list (829 visitors, 570 saw it). Test a more obvious button on
   the poster, or sending Instagram visitors straight to the plan list.
4. **Learn from `/galcode`.** *Look first.* It was the best landing page of the
   last 28 days (297 visits, 88.6% engaged, 4.9 pages per visit, against 64.7%
   and 3.7 for `/lifestyle`). Find out whether that is the page, the audience
   or the reel that sent them, and reuse it.
5. **Check failed payments are being recovered.** *Look first.* 24 failed against
   171 successful since June, so about one attempt in eight fails. Confirm how
   many of those 24 came back and paid through the recovery link.

## Phase 5: more of the right visitors

The numbers above improve by percentages. Volume is the bigger lever: about 30
visitors a day now against about 600 a day in May, and it arrives almost
entirely from Instagram on the days a reel lands.

1. **Learn which reels and creators bring payers, not just visitors.** *Look
   first.* Visits jumped on 18 Sep, 20 Sep and 28 to 30 Sep. Match those days
   and each creator's link (`rat_roy_` 163 visitors, `mahathi_stephen` about
   152 in 90 days) against actual bookings in the site's own records.
2. **Post and remind in the evening.** *Owner's call.* Visitors peak 8pm to
   midnight, 10pm the top hour. Tuesday and Sunday are slightly ahead.
3. **Be findable on Google.** *Code.* 46 search visits in six months. Today every
   address on the site hands Google the same empty shell titled "chapter அ",
   with no description, no sitemap and no robots file. The cheap basics: a
   description, a sitemap, Google Search Console. The larger build: a readable
   page per plan. Honest note: for a club that grows through Instagram, search
   may stay small; the basics are cheap, the larger build is optional.
4. **Give each plan its own link preview.** *Code.* Any link shared on WhatsApp
   or Instagram shows the same picture and the same line ("plans we dream — by
   chapter அ"), whichever plan it points to. A preview showing the actual plan
   makes shared links work harder.
5. **Give people a reason to come back.** *Owner's call.* 1 to 5% of visitors
   return the following week. Past guests are the cheapest audience there is.
   Whether and how to tell them about new plans is a decision that touches the
   rule that selling happens on the website, not on WhatsApp.
6. **Observation, no action:** three in ten visitors are outside Chennai
   (Coimbatore, Bengaluru, Madurai, Salem, Mumbai: about 3,750 people so far).

---

## Suggested order

Phase 1 first, because every later decision leans on the numbers. (The leak it
was also meant to stop was closed the same evening.) Phases 2 and 3 are independent of each other and can run side by side.
Phase 4 waits for Phase 3. Phase 5 is ongoing and mostly not code.
