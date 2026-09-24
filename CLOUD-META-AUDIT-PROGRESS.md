# Cloud Meta audit — progress file

Started 2026-09-24 on branch `cloud/meta-audit`. Manager: one interactive cloud session.
If this session is resumed, read this file first.

Two jobs, kept strictly separate:
- **Part A — audit** of what is built, against Meta's own docs → `CLOUD-META-AUDIT.md`
- **Part B — opportunities** in Meta's docs we have not built → `CLOUD-META-OPPORTUNITIES.md`

## Doc sources (corrected 2026-09-24)
- ~~The Pixel and Conversions API doc sets are not in the repo.~~ **Corrected:** the owner pushed them in `3ca17f3`. Everything is under `docs/meta-marketing-api/`:
  - `guides/` (Marketing API, 300 pages) and `api-reference/` (469 pages)
  - `conversions-api/` (193 pages) — **primary source for the CAPI areas**
  - `pixel/` (21 pages) — **primary source for the Pixel area**
  - `developer-docs-html/` (62 saved developer pages: dedup, advanced matching, rate limits, Dataset Quality API, value optimisation, Parameter Builder…) and `extra-pages-html/` (33 saved pages: lead ads, click-to-WhatsApp, Threads/Instagram ads, URL tags, error codes, troubleshooting). Researchers read plain-text copies made in the session scratchpad but cite the original `.html` path plus the quoted passage.
- The container's network still refuses developers.facebook.com (proxy 403), so nothing is cited from outside the repo; with no in-repo passage a claim is marked "NO IN-REPO DOC".
- All of these folders feed the inventory's docs map, the Pixel/CAPI audit areas, and every Part B theme.

## Phase status
| Phase | Status |
|---|---|
| 1. Inventory | DONE 2026-09-24 — 1 researcher; code map (Pixel, CAPI, 7 API pins, webhooks, audiences, catalog, panel RPCs, 37 migrations, cron order) + docs map (~995 pages, [REQ] pages flagged, HTML duplicates mapped). Notable: `_shared/metaCapi` has 5 real importers — the CLAUDE.md grep also matches 2 comments in meta-signal-watchdog; `retarget-check` has no Meta touchpoint; `api/webhook.js` pins WhatsApp Cloud API v19.0 (not ads). |
| 2. Plan + plan review | plan drafted; plan reviewer running |
| 3. Progress file | this file |
| 4. Research (A + B) | not started |
| 5. Verify | not started |
| 6. Reports | not started |
