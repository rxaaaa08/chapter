# Personal details reaching outside tools through the page address

Measured 2026-10-11 and 2026-10-12. Written for the owner; plain language first,
the technical detail is in the last sections.

**Status on 2026-10-12: fixed and live.** The owner approved the fix, then the
commit and the push, in that order. Commit `08b2a98` (five files) went to `main`
and is deployed. The same day Google Analytics' own "Redact data" switch was
turned on for `phone`, `name`, `email`, `wa` (section 7). The owner decided
**not** to file a deletion request for past data (section 6). The exact code
change is also kept as
`docs/details/tracker-address-leak-2026-10-11/applied-fix.patch`.

This write-up and the test tools next to it were committed separately the same
day, as a docs-only commit, at the owner's request. The matching note in
`CLAUDE.md` is not committed yet, because that file carries other unfinished
edits.

---

## 1. The problem in one paragraph

Every booking message we send links to an address like
`chaptera.in/invite?phone=<number>&name=<name>&wa=<code>`. The site uses those
three values to open the guest's booking without making them type. But the page
also loads outside tools, and each of them reads the address on its own and
sends it to its maker. So the guest's phone number and name, and a link code
that can skip the booking code for 14 days, were being sent to Google,
Contentsquare, Meta and Sentry. Google's own terms forbid sending it personal
details.

## 2. What each tool received before the fix (proved)

Tested with made-up values only (`9000000001`, `Zztest`, `ZZZZsyntheticZZZZ`),
on the live site, inside a sealed browser: the tools' real scripts ran, but
everything they tried to send was caught and read instead of delivered.

| Tool | Receives the phone, name, code? | When |
|---|---|---|
| **Google Analytics** | **Yes** | Its first report of the page, its scroll report, and every report it sends when a sheet or step opens. It also sends the previous address as "came from". |
| **Contentsquare** | **Yes, twice over** | Its first page view and every page view it adds when a sheet or step opens; the address attached to error reports; and, separately, every **session recording** writes down the real address when it starts. |
| **Meta Pixel** | **Yes, on some links** | Every pixel event carries the address at that moment. On the usual booking link the site happens to tidy the address just before the pixel's first event, so Meta got nothing there. On a link without a name, and on a chat-reply link (`/lifestyle?…&wa=`), Meta got the phone and the code on every event. |
| **Sentry** | **Yes, inside error reports** | Only when an error happens. The report carries the page address, the address before it, a trail of every in-page move, and the addresses of requests the other tools made (which contain our address again). |
| **Vercel Speed Insights** (found during testing) | **Yes, on the plans pages only** | It loads only on `/plans` and direct plan links. Each speed reading carries the address. |

Full table, one row per link shape:
`docs/details/tracker-address-leak-2026-10-11/results-before.txt`.

Three things about *how* it leaks, because they decided the fix:

1. **It is a race, not a constant.** The invite page removes the phone and name
   from the address about a second after it opens. Google and Contentsquare
   start earlier, in the page head. On a phone that already has their scripts
   stored (most phones) they win the race and read the full address. In one
   test run Google lost the race and got nothing; in the next it got everything.
2. **Tidying the address later made Google leak again.** When the site removed
   the phone and name, Google noticed the address change and sent a new report
   whose "came from" field was the full original link.
3. **Some links are never tidied.** A link with a phone but no usable name, and
   every chat-reply link, keep their values in the address for the whole visit,
   so every later report from every tool carried them.

## 3. Other things found on the way

- **The Contentsquare "privacy" line in `index.html` does nothing.** It sends a
  command called `setPrivacyAttributes` (with `ipHashing` and
  `denyAdvertising`). That command does not exist anywhere in Contentsquare's
  script (checked in the script itself, version 15.263.3). The comment above it
  said IP addresses were being hashed; that was never true because of this line.
  Whether Contentsquare hashes IPs is a setting inside their dashboard, not
  checked here.
- **Google already hides email addresses, and drops the part after `#`.** Its
  script ships with email redaction on. A made-up `email=` value reached Google
  as "(redacted)". Meta and Sentry received it in full.
- **Google Analytics and Contentsquare also run on the staff pages** (`/admin`,
  `/creator`, `/team`). The Meta Pixel deliberately does not. Not changed here;
  worth a separate decision.
- **Contentsquare repeats error messages word for word.** If an error's own
  message contains a link with personal values, Contentsquare gets that text.
  This is not the page address and the fix cannot reach it. It can be switched
  off in Contentsquare's dashboard (JavaScript error collection).
- **Contentsquare's session recording is a second, separate channel.** On
  2026-10-11 no recording ever started in the test browser, so this was written
  down as "not measured". On 2026-10-12 recordings did start (most likely a
  daily allowance had reset), and each one carried the real address in full:
  phone, name and code. Contentsquare's command for changing the reported
  address does not reach recordings, and no other command does. This was found
  only because the whole test was run again after the fix went in. See
  section 4 for what was done about it.
- **The web host always sees the address.** Vercel serves the site, so every
  page request arrives there with its full address, as with any website. No
  script can change that. Only links that do not carry the values could (see
  section 9).

## 4. The fix

One small script at the very top of the page works out a **cleaned copy of the
address** and every tool is given that copy instead of the real one.

**The rule is a list of what may be seen, not a list of what to hide.** Anything
not on the list is removed: `phone`, `name`, `email`, `wa`, and any parameter
someone adds to a link in future. Kept: everything starting `utm_`, Meta's and
Google's click markers (`fbclid`, `gclid` and relatives, `placement`,
`site_source_name`), a creator's public handle (`ref`), which plan and which
sheet or step is open, and the payment-return values (`payment_status`,
`payment_type`, `txnid`). The part after `#` is always dropped, because a staff
login returns its key there. The page a visitor came from keeps only its site
and path when it is someone else's site.

`txnid` (the payment reference) is kept on purpose: it is not personal, it
cannot open a receipt without the phone number, and Meta is given it
deliberately as the order id. Dropping it would also have put the browser's
purchase report at risk in the failure case described below.

**The address bar and the history are never changed.** The app still reads
`phone`, `name`, `wa` and the `utm` tags from the real address exactly as
before. This matters because the back button inside Instagram's browser is
fragile.

How each tool is given the cleaned copy:

| Tool | How | Is that an official feature of the tool? |
|---|---|---|
| Google Analytics | The cleaned address is passed when it starts. Its later "page changed" reports are cleaned as they pass through the queue Google's script reads. | First part yes. Second part relies on how Google's script works inside. |
| Contentsquare, page views | Its own commands `setQuery` and `referrer:removeQueryString`, refreshed each time a sheet or step opens. | Yes. |
| Contentsquare, recordings | Recordings cannot be given a cleaned address, so **recording is switched off while the real address holds anything a tool may not see** (its own command `excludeURLforReplay`), and comes back by itself once the address is clean. | Yes. |
| Meta Pixel | Meta has **no setting** for this. The fix uses the same internal hook Meta's own privacy plug-in uses to blank address values. | No. Undocumented, so it is guarded (below). |
| Sentry | Its own `beforeSend` and `beforeBreadcrumb` hooks clean every address in a report before it leaves. | Yes. |
| Vercel Speed Insights | Its own `beforeSend` option. | Yes. |

**What the recording rule costs.** Page views are still counted for everyone.
What is given up is the *recording* of the stretch during which the address
holds personal values:

- Usual booking link: about the first second, until the invite page tidies the
  address. The rest of the visit is recorded as before.
- A link without a name, and every chat-reply link (`/lifestyle?…&wa=`): the
  whole visit, because that address is never tidied.
- An ordinary visitor from a reel or a creator link: nothing changes.

If recordings of chat-reply visits matter later, the only way to get them back
is for the app to drop the code from the address after it has read it. That is
the Instagram back-button question again and needs a real phone to test; it is
not part of this change.

**The guard on the Meta part.** Because that hook is not a promised feature:

- Nothing is sent to Meta until the hook is confirmed in place.
- After each event, the fix checks what actually left. If an address was not
  cleaned, the guard switches off.
- With the guard off, pixel events are sent only while the address is already
  clean, and dropped otherwise. An ordinary visitor from a reel has a clean
  address and is unaffected. A visitor from a WhatsApp link loses pixel events
  until we repair it.
- Switching off sends one warning to Sentry, so it cannot happen silently.

Also in the change: the Contentsquare line that did nothing is removed and the
comment corrected.

Files touched: `index.html`, `src/main.tsx`, `src/metaPixel.ts`, `src/App.tsx`
(a few lines), and one new small file `src/trackerUrl.ts`. No database change, no
edge function, no change to any link or message template.

## 5. Proof that the fix works

Same sealed test, same made-up values, against the real project files, built and
served as if they were `chaptera.in`. Full table:
`docs/details/tracker-address-leak-2026-10-11/results-after.txt`.

The fix was first built in a scratch copy and tested there, then put into the
project files and the whole test was run again from those. That second run is
what caught the recording channel (section 3): the first version of the fix
passed every row on 2026-10-11 only because no recording happened to start.

| Link shape | Before | After |
|---|---|---|
| Booking message `/invite?phone&name&wa` | Google, Contentsquare, Sentry got all three | all clean |
| Chat reply `/lifestyle?utm…&wa` | all four got the code | all clean, `utm` tags still delivered |
| `/invite?phone&wa` without a name | all four got phone and code | all clean |
| Reload to `/plans` after such a link ("came from") | all four got the code | all clean |
| Plans page with the values in the address | all five | all clean |
| Contentsquare session recording, booking link | began with the full link | no recording until the address is tidy, then clean |
| Instagram iPhone browser, both links | same leaks as above | all clean |
| WhatsApp Android browser, booking link | not run before | all clean |
| Payment return, failed and success | nothing personal | unchanged |
| Ordinary reel visitor (`utm_source=sp_auto_dm&fbclid`) | nothing personal | unchanged, same address reported, Meta click cookie still written |
| Creator link (`?ref=`) | nothing personal | unchanged, creator click still recorded |

**The live site, after the push (2026-10-12).** Once `chaptera.in` was serving
the new version, the sealed test was run against the live site itself: eleven
link shapes, every tool clean on every one
(`docs/details/tracker-address-leak-2026-10-11/results-live-after-push.txt`).

**Google's own redaction, tested by itself.** To check that the Analytics
switch works without our code helping, an early prototype with no page-change
cleaner was run against Google's live script after the switch went on. Where
that prototype used to leak, Google's script now sent `phone=(redacted)` and
`wa=(redacted)`. So the two layers each hold on their own.

Session recordings, after the fix:

- Contentsquare tells its server with each page view whether recording is
  excluded. Read from the captured requests: excluded on every page view whose
  real address held personal values, not excluded on the clean ones.
- On the usual booking link (Instagram iPhone run) the first page view was
  excluded, the invite page tidied the address, and a recording then started and
  ran for 11 requests carrying nothing personal. Before the safeguard the same
  run's recording began with the full link.
- On the chat-reply link, the name-less link and the plans page with values in
  the address, no recording started at all.
- Checked again, and not proved further: 16 more runs (four link shapes, four
  times each) were all clean for every tool, but no recording started in any of
  them, clean address or not. Asking Contentsquare to record through its own
  `_cs_inc=5` cookie did not start one either inside the seal. So the recording
  evidence is the exclusion flag on every dirty page view, Contentsquare's code,
  and one matched pair of runs (same link, recording began with the full link
  before the safeguard, and began later and clean after it).
- The always-on local preview (`localhost:5175`) was checked too: the page
  opens, the form fills, no console errors, and Google and Contentsquare get the
  cleaned address there as well.

What the app itself still does, compared before and after on each run:

- Address bar: identical. Number of history entries: identical (2, then 3 after
  opening a sheet, 3 after going back).
- Invite link still fills the name and phone and looks the guest up.
- The tap is still reported (`log_whatsapp_click` sent with the code).
- The link code is still remembered for the visit.
- The traffic source is still captured and written on the funnel row.
- The pixel still sends `PageView` and `ViewContent`, with the Meta click id.
- `npx tsc --noEmit` passes. A production build succeeds.

Two failure drills, by altering Meta's script inside the test:

- *Meta renames the part the guard looks up.* Result: no pixel event left while
  the address held a code, Sentry was told, and events flowed normally on a
  clean address.
- *Meta keeps the hook but stops obeying it.* Result: the events already queued
  on that first page load (two in the test) left uncleaned, the check caught
  it, Sentry was told, and nothing more left in that tab. This is the one case
  where something leaks before the guard reacts.

**Limits of this proof, stated plainly.**
- Whether a recording starts at all is Contentsquare's decision and it varied
  from run to run. The claim "no recording starts on a dirty address" rests on
  the exclusion flag it sends, on its code, and on repeated runs, not on a way
  to force a recording.
- Instagram's and WhatsApp's browsers were imitated (their identity string and a
  phone-sized screen). No real phone was used. The fix never touches the address
  or history, which is the part that is fragile on a real phone, and the test
  confirms both are unchanged, but a tap on a real booking message on the
  owner's phone after release is still worth doing.
- The payment return was tested with made-up return addresses, not a real
  payment.
- The found-a-booking path was not exercised: the made-up phone has no booking,
  so the page showed "not found" with the form filled. The code that reads the
  link is not changed by the fix.

## 6. What may already sit in each tool

Dates, from the project history:

- Google Analytics, Contentsquare and Sentry have been on the site since
  **2026-04-19**; Vercel Speed Insights since 2026-06-10; the Meta Pixel since
  2026-08-12.
- Links carrying phone and name were first sent on **2026-07-09**.
- Links carrying the `wa` code: since **2026-10-10** (8 messages so far).

So the window is **2026-07-09 to today**, about three months.

Scale, measured in the database on 2026-10-12:

- 290 different phone numbers have ever applied or booked. That is the hard
  ceiling on who could have been sent such a link.
- Since message logging began (WhatsApp 2026-08-28, email 2026-09-01): 93
  WhatsApp messages with a link went to 16 different numbers, and 125 emails
  were sent. Before that, sends were not logged.
- Recorded taps: 7 on WhatsApp, 2 on email. Tap recording is new and partial, so
  the true number of taps is higher but unknown.

A realistic reading: tens of people, not hundreds.

| Tool | What it likely holds | Options |
|---|---|---|
| **Google Analytics** | Page addresses with `phone=` and `name=`, in page reports and as "came from" values. Google's standard reports keep these indefinitely; the retention setting (2 or 14 months) only covers the detailed explorations. | **(a) A data-deletion request** inside GA (Admin). It can target chosen fields and only values containing given text (for example `phone=`), over a date range. Deleted text shows as "(data deleted)". Data must be more than 12 days old; there is a 7-day period in which the request can be cancelled, then it takes 7 to 63 days and cannot be undone. Google warns that campaign information for the deleted range stops being available. Needs the Editor role. **(b) Leave it.** |
| **Contentsquare** | Page-view records with the same addresses. | Ask Contentsquare's support to delete page views whose address contains `phone=`, or let it expire with their retention period (depends on the plan; not checked). |
| **Meta** | Addresses on pixel events, only for the narrower cases in section 2, since 2026-08-12. | Meta gives advertisers no tool to delete addresses already received. Events Manager would show a warning if Meta itself noticed personal data in addresses; worth one look. |
| **Sentry** | Addresses inside individual error reports. | Sentry deletes reports on its own after its retention period (plan-dependent). Individual issues can be deleted by hand sooner. |
| **Vercel** | Speed readings from the plans pages; ordinary request logs. | Request logs are short-lived. Nothing to do unless the owner wants to ask. |

About the leaked link codes: 8 exist, each is only accepted for 14 days and only
together with the phone it was sent to, and they sit inside the owner's own
Google and Contentsquare accounts, not in public. No action is suggested. They
could be cancelled in the database if the owner prefers; those 8 guests would
then be asked for a booking code as usual.

**Decided 2026-10-12: no deletion request.** The owner chose to leave the past
data where it is. Nothing has been deleted in any tool and no request has been
filed. The options above stay on record in case that changes.

## 7. Two settings inside Google Analytics

These are inside Google Analytics, not in our code. Both are backstops.

1. **Redact data: ON since 2026-10-12** (Admin ▸ Data collection and
   modification ▸ Data streams ▸ the web stream ▸ Redact data), with the keys
   `phone`, `name`, `email`, `wa`, switched on with the owner's OK. Google's
   script now removes those values itself before anything is sent, in every
   report. It is the safety net for the one part of the Google fix that relies
   on how Google's script works inside. Confirmed two ways: the stream screen
   reads "Email active · 4 URL query parameter keys"
   (`docs/details/tracker-address-leak-2026-10-11/ga-redact-data-on-2026-10-12.png`),
   and Google's public script for the stream now carries
   `redactQueryParams: "phone,name,email,wa"`. **This list is separate from our
   own: a new personal parameter on a link must be added here by hand** (our
   own rule hides it automatically; Google's backstop does not).

   Where it lives, because finding it cost time: the property is called
   **chapter**, account `391884328`, property `533625884`, stream
   `14394564283` ("chapter website", `https://chaptera.in`, `G-3MLZ9S6M2S`).
   It sits under one of several Google accounts signed in to the owner's
   Chrome. The first account opens Google's demo property and an old
   `chaptera.carrd.co` property that receives no data: **check the measurement
   ID before changing anything.**
2. Optional: in the same stream, enhanced measurement ▸ page views ▸ advanced,
   untick "page changes based on browser history events". Google would then
   count real page loads only, and never build a report from a changed address.
   It changes Google's page-view numbers, so it is a choice, not a fix.

## 8. Rules for whoever touches this next

- **One list.** The allowed parameters live only in the first script of
  `index.html`. `src/trackerUrl.ts` reads that list for the Meta Pixel, Sentry
  and Speed Insights. Never write a second list.
- **Adding a parameter to a link?** It is hidden from outside tools by default.
  Add it to the list only if it says nothing about a person and unlocks nothing.
- **Adding a new outside tool?** It must be given the cleaned address before it
  starts, and a row must be added to the sealed test.
- **Do not "simplify" the Meta guard away.** It exists because that hook is not
  a promised feature.
- **Do not fix this by rewriting the address early.** It was considered and
  rejected: the back button inside Instagram's browser is fragile, and the app
  must read the values first.
- **Re-run the sealed test** after changing `index.html`'s tool block,
  `src/metaPixel.ts`, or the Sentry setup, and every few months regardless,
  because the tools change their scripts without telling anyone.
- **Run it more than once, and on more than one day.** A tool can have a channel
  that simply does not fire in a given run. Contentsquare's recordings did not
  start at all on 2026-10-11 and did on 2026-10-12. A clean row means "nothing
  personal in what was sent", not "everything the tool can send was seen".

## 9. A stronger option for later (not proposed now)

The cleanest cure is for the address never to hold the values while any tool is
running: for example a tiny tool-free page that receives the link, keeps the
values for the visit, and moves on to the clean address; or a link that carries
one short code and nothing personal. Either would also keep the values out of
the web host's logs. Both change how every message link works and how the back
button behaves on first arrival, so they need testing on real phones. The fix
above does not block either.

## 10. Running the sealed test

Needs only Node and the installed Chrome. Nothing is installed.

```bash
cd docs/details/tracker-address-leak-2026-10-11
python3 gen.py LIVE live            # scenario files for the live site
node seal.mjs live-A.json live-A.out.json
node verdict.mjs live-A.out.json    # one line: which tools got what
```

To test a build instead of the live site: `npx vite build --outDir /tmp/x`,
then `python3 gen.py /tmp/x after` and run the `after-*.json` files the same
way. The build is served to the browser as if it were `chaptera.in`, which is
what makes the Meta Pixel and Sentry switch on.

What "sealed" means: requests to Google, Meta, Contentsquare, Sentry and
Vercel's collectors are recorded and answered locally. The site's own funnel
insert is sealed too. Calls to our own database are let through, and with the
made-up values they change nothing (checked 2026-10-12: no row for the made-up
phone, code, handle or payment reference).

Traps hit while building it:

- **A headless browser announces itself and Meta's pixel refuses to send.** The
  test pretends to be an ordinary Chrome. Without that the pixel looks silent
  and "clean" for the wrong reason.
- **The site's service worker fetches pages by itself, outside the seal,** and
  handed back the live build in the middle of a test of the new one. The test
  now bypasses it.
- **Calling `fbq` directly from the test skips the site's own guard.** Use the
  site's own events (a direct plan link fires two) to test the guard.
- **Speed Insights only loads on the plans pages,** and only reports when the
  page is hidden.
- Use the scenario letters as written; `A` deliberately slows the app so the
  tools in the page head run first, which is the normal case on a real phone.
- **Rows P1 to P5 are read the other way round** (added 2026-10-12, see §12).
  In them silence is the right answer. P1 needs the local dev server running
  on port 5175.
- **When Google, Contentsquare and Meta all show a dash in one row, re-run that
  row before believing it.** Their scripts are downloaded from the real
  servers; if that download fails in a run, all three go silent together while
  the page itself works. Seen once on row F1 on 2026-10-12.

## 11. Technical notes

- GA4 history page views are built from the data-layer entry
  `gtm.historyChange-v2` (`gtm.oldUrl`, `gtm.newUrl`), which ignores the
  `page_location` given in `config`. `gtag.js` pushes that entry through
  `window.dataLayer.push`, and its own override calls the previous `push`
  before it processes the queue, so a wrapper installed before `gtag.js` loads
  can clean the two addresses in place. When old and new are equal after
  cleaning, GA sends no page view, which also removes the bogus one that the
  invite page's own tidy-up used to cause.
- GA stream settings read from `gtag.js` on 2026-10-12: `redactEmail: true`, no
  `redactQueryParams`; history events on; automatic user-provided-data
  detection flags present. No hashed user data was seen in any captured request.
- Contentsquare recordings: `hashChangeListener()` runs when a recording starts
  and on `hashchange`, and emits a `HASH_CHANGE` (type 13) entry holding
  `anonymizeUrl(window.location.href)`. That anonymiser only hides emails, card
  numbers, JWTs and `*_token` values, so a phone, a name and our code pass
  through. `excludeURLforReplay` is tested against the address AFTER `setQuery`
  has been applied, so a pattern can never "see" the personal values; the rule
  is therefore switched between `.*` and `.^` from our side, decided on the real
  address. It is re-evaluated at every natural and artificial page view.
- Contentsquare: `overrideQuery` persists until set again; an empty string is a
  valid override. Its `ArtificialPageview` on `HistoryChange` reads the override,
  so the wrapper around `pushState` / `replaceState` (innermost, installed
  first) refreshes it before Contentsquare looks. The wrappers call the real
  function first and return its result unchanged.
- Meta: `fbevents.js` 2.9.415. `SignalsFBEventsEvents.validateUrlParameters` is
  triggered with `{dl, rl}` and listeners may rewrite them; Meta's own
  `unwanteddata` plug-in does exactly that. A changed `dl` is sent with
  `dlc=1`. This pixel's settings file opts it into `UnwantedData` and
  `UnwantedParams` but sets no keys, so Meta itself strips nothing today.
  `fbevents` also contains an unfinished `URLManager` with address "providers"
  behind a rollout flag; not used.
- Meta `init` is now sent after `fbevents.js` has loaded instead of being queued
  before. `set autoConfig false` is still queued first, as it must be.
- Sentry sends only error events here (no tracing integration is installed, so
  `tracesSampleRate` produces nothing). Requests to other sites lose their query
  string in the breadcrumb trail; the path and status remain.
- Cross-site requests carry only `https://chaptera.in/` as Referer, because of
  the site's `strict-origin-when-cross-origin` policy. Same-site requests carry
  the full address, which is the host seeing its own traffic.

## 12. Who gets counted (added later on 2026-10-12)

A second rule now lives in the same tool block, in its last script (commit
`7571a50`). It is about
who is counted, not about what is sent, but it changes how two of the tools
start, so it belongs to this write-up and to this test.

- **Contentsquare and Google Analytics no longer have a `<script src>` of their
  own.** One small script starts them. Both only on `chaptera.in` /
  `www.chaptera.in`. Google's additionally never for the team: `/admin`,
  `/team`, the installed admin app, a `staff=1` plan preview, and any tab that
  has once been one of those (`sessionStorage` key `ca_team_tab`).
- **Why:** 7.3% of all page views Google had ever recorded came from
  `localhost` and preview sites, and `/admin` alone was 1,894 page views from
  51 team browsers. Numbers: `docs/GOOGLE-ANALYTICS-BASELINE-2026-10-12.md`.
- **It sits after both queues on purpose.** The address cleaner for Google's
  page-change entries (§11) has to be installed before Google's script can
  run. Starting the script from below the cleaner guarantees the order, which
  the old side-by-side `<script async>` tags only made very likely.
- **Nothing about the cleaning changed.** The cleaner and both queues are
  byte-for-byte what §4 describes.
- **Test rows:** `P1` local dev server, `P2` a made-up preview address, `P3`
  `/admin`, `P4` `/team`, `P5` a staff plan preview. `seal.mjs` accepts
  `extraSiteHosts` so a build can be served under a host that is not the real
  site. Results of the first full run with the rule:
  `docs/details/tracker-address-leak-2026-10-11/results-who-gets-counted-2026-10-12.txt`.
- **The test earned its keep the same evening.** The first version passed four
  of the five new rows and failed `P5`: the preview page was silent, but closing
  a preview reloads the page at `/lifestyle`, and Google counted that. Reading
  the code had not shown it. The tab memory is the fix.
- **Left alone on purpose:** Contentsquare still runs on the team's screens,
  and the Meta Pixel still reports on a staff plan preview. Both are the
  owner's call.

