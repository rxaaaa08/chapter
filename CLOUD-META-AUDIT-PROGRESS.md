# Cloud Meta audit — progress file

Started 2026-09-24 on branch `cloud/meta-audit`. Manager: one interactive cloud session.
If this session is resumed, read this file first.

Two jobs, kept strictly separate:
- **Part A — audit** of what is built, against Meta's own docs → `CLOUD-META-AUDIT.md`
- **Part B — opportunities** in Meta's docs we have not built → `CLOUD-META-OPPORTUNITIES.md`

## Constraints found before planning
- The repo holds only the **Marketing API** docs (`docs/meta-marketing-api/`, 300 guide pages + 469 reference pages). The dedicated **Meta Pixel and Conversions API doc sets are not in the repo**, and this container's network refuses developers.facebook.com (proxy 403, checked 2026-09-24). Pixel/CAPI findings therefore cite in-repo passages where they exist, or doc passages already quoted in `META-ADS-HANDOFF.md` §23, and say "NO IN-REPO DOC" otherwise.

## Phase status
| Phase | Status |
|---|---|
| 1. Inventory | in progress |
| 2. Plan + plan review | not started |
| 3. Progress file | this file |
| 4. Research (A + B) | not started |
| 5. Verify | not started |
| 6. Reports | not started |
