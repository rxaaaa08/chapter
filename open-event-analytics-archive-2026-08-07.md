# Open-event analytics — archive before reset (7 Aug 2026)

Snapshot of every `flow_analytics` funnel row attributed to an open (payu-hosted)
event, taken immediately before the tracking data was cleared for a fresh start.
The raw rows were deleted; these totals are the only surviving record.

**Not touched by the reset:** `applications` (7 open-event leads, 3 paying
customers), `payu_payments` (5 rows), `bill_opens` (18 rows). Payment Rate, Cart
Abandonment, Recovery and Retargeted Recovery are computed from those tables and
therefore kept their history.

## Sunrise at Kovalam (live event)

| Stage | Sessions | Raw rows | First seen | Last seen |
|---|---|---|---|---|
| event_selected | 120 | 146 | 2026-07-20 | 2026-08-07 |
| calendar_opened | 105 | 153 | 2026-07-20 | 2026-08-07 |
| date_selected | 86 | 104 | 2026-07-20 | 2026-08-07 |
| reached_pricing | 76 | 93 | 2026-07-20 | 2026-08-07 |
| book_cta_clicked | 46 | 59 | 2026-07-21 | 2026-08-07 |
| contact_cta_clicked | 5 | 5 | 2026-07-22 | 2026-08-07 |
| details_form_opened | 36 | 76 | 2026-07-21 | 2026-08-07 |
| external_redirect_initiated | 9 | 11 | 2026-07-21 | 2026-08-07 |

Last-week rates at the moment of the reset (the only window where every stage was
actually recording): Pricing Conversion **77%** (44/57), Form Open Rate **77%**
(34/44), Verification Rate **46%** (6/13), Payment Rate **0%** (0/3).

## Chill-pill in Himalayas (inactive draft, never sold a ticket)

| Stage | Sessions | Raw rows | First seen | Last seen |
|---|---|---|---|---|
| event_selected | 52 | 59 | 2026-06-04 | 2026-08-06 |
| calendar_opened | 61 | 77 | 2026-06-03 | 2026-08-06 |
| date_selected | 42 | 49 | 2026-06-03 | 2026-08-06 |
| reached_pricing | 42 | 49 | 2026-06-03 | 2026-08-06 |
| book_cta_clicked | 14 | 19 | 2026-06-10 | 2026-08-06 |
| contact_cta_clicked | 1 | 1 | 2026-06-11 | 2026-06-11 |
| details_form_opened | 5 | 9 | 2026-08-04 | 2026-08-06 |
| application_started / submitted | 5 / 5 | 6 / 6 | 2026-06-20 | 2026-07-09 |

This event carried 42 price views and zero bookings for its whole life, which is
what was quietly dragging the pooled open-funnel rates down.

## analytics_daily (Growth ▸ Experiments) — also cleared

212 daily browsing snapshots were deleted (Chill-pill 107, Kovalam 105) covering
the same stages as above. Daily totals at the time of deletion:

| Event | event_selected | calendar_opened | date_selected | reached_pricing | converted_any | details_form_opened |
|---|---|---|---|---|---|---|
| Sunrise at Kovalam | 78 | 77 | 59 | 54 | 32 | 18 |
| Chill-pill in Himalayas | 52 | 61 | 42 | 42 | 15 | 5 |

**Kept:** the 14 DB-truth rows on Kovalam — `apps_created` 6, `pay_clicked` 4,
`payments_success` 3, `recovered` 1 (20 Jul – 6 Aug). These mirror real bookings
and revenue that still exist in `applications` / `payu_payments`, so they were
treated the same way as the customer rows: kept.

## Known contamination in the deleted data

- `details_form_opened` averaged **2.1 raw rows per session** on Kovalam (76/36) —
  the duplicate-write bug fixed on 2026-08-07. Session counts were always correct.
- `details_form_opened` only started recording **2026-07-21**, so any window
  reaching further back under-read Form Open Rate.
- The 9–11 July OTP burst was build-testing with ad-hoc numbers (8888888888,
  9999999990, 7777777778…) rather than the documented `90000000xx` range, so it
  could not be filtered automatically.
