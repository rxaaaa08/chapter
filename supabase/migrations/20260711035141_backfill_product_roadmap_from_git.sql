-- Curated roadmap backfill from git history (April–July 2026).
--
-- Individual polish, revert, merge, docs and redeploy commits are intentionally
-- excluded. Related commits are grouped into the product capability a founder
-- would recognise. Git proves these reached the live codebase, but it cannot
-- prove a live test happened, so every row starts at Live — needs testing.
--
-- The title check makes this safe to re-run without duplicating a manually
-- created feature with the same name.

WITH seeds (
  shipped_on, title, summary, area, feature_type, priority,
  representative_commit, source_commits
) AS (
  VALUES
    ('2026-04-16', 'Supabase-backed plans and admin panel',
     'Moved event content into Supabase and added the admin workspace for maintaining plans and live content.',
     'Admin', 'technical', 'normal', '16e782d', '16e782d, 5c45014'),
    ('2026-04-16', 'Editable plan content, media and reviews',
     'Added admin editors for videos, accommodation, inclusions, activities, itinerary, reviews and related plan content.',
     'Plans', 'feature', 'normal', 'd6990d2', 'd6990d2, 25e5c96, 8e8e6c1, 55c6544, 5db982d, d52d519'),
    ('2026-04-16', 'Multi-city meeting points and pricing',
     'Added city-specific meeting points, own-transport options, pickup routing and different advance/full prices.',
     'Booking', 'feature', 'normal', '333b59c', '333b59c, 25e3e10, d4c00db, 233c4ef'),
    ('2026-04-17', 'Plan publishing and shareable previews',
     'Added Live/Preview controls, shareable preview URLs and safer plan visibility management in admin.',
     'Admin', 'feature', 'normal', '9216fe7', '9216fe7, 99d54a9, 00bcf23'),
    ('2026-04-17', 'Dynamic bot messages, Q&A and doubt capture',
     'Made chat copy editable, added per-plan Q&A, template variables and stored guest doubts for follow-up.',
     'Support', 'feature', 'normal', '9dddc88', '9dddc88, 03afbef, 0982fda, 77e28e6, 90f3b27'),
    ('2026-04-17', 'Editable booking timelines',
     'Added per-plan booking timeline editing with calendar dates, price variables and a faster Timelines admin tab.',
     'Booking', 'feature', 'normal', '4c73892', '4c73892, 9edc461, a866de4'),
    ('2026-04-18', 'Plan image uploads',
     'Added Supabase Storage uploads for hero images, accommodation galleries and video thumbnails.',
     'Plans', 'feature', 'normal', '49cefa5', '49cefa5'),
    ('2026-04-20', 'Plan switcher and direct plans route',
     'Added the plan-switching sheet and a direct /plans entry point into the chat-led booking experience.',
     'Plans', 'feature', 'normal', '4b0532a', '6af8611, 3464c0d, 4b0532a'),
    ('2026-04-20', 'Booking funnel analytics',
     'Tracked pricing conversion, payment handoff and calendar drop-off with event-level analytics breakdowns.',
     'Analytics', 'feature', 'normal', 'ea60498', 'ea60498, 90fd04e, aa4d7a5, fbc0997, cd74645'),
    ('2026-04-24', 'Lifestyle poster entry experience',
     'Created the poster-led lifestyle entry page with preloading, animated artwork and a polished join CTA.',
     'Growth', 'feature', 'normal', 'a85052b', '735a78a, 51db8f1, a85052b'),
    ('2026-05-01', 'WhatsApp auto-reply webhook',
     'Added a webhook-driven WhatsApp auto-reply path for incoming customer conversations.',
     'Support', 'feature', 'normal', 'e306b8c', 'e306b8c'),
    ('2026-05-07', 'Invite-only application and poster verification',
     'Built the invite-only plan path with application verification, personalised timeline and poster-led entry.',
     'Booking', 'feature', 'normal', 'ac101c9', '30fe171, 0027b9e, ac101c9, 5d0b2ef'),
    ('2026-05-07', 'Split UPI payments with per-event QR codes',
     'Added manual advance/balance UPI collection, girls-only QR handling, payment admin tools and per-event QR images.',
     'Payments', 'feature', 'high', '06f0486', '06f0486, 5521daa, db15642'),
    ('2026-05-12', 'PayU checkout, receipt and group handoff',
     'Integrated PayU hosted checkout with a return receipt and a post-payment WhatsApp group join action.',
     'Payments', 'feature', 'high', '7d45737', '7d45737, 262c33f, f3b0a72, 1ffcef4'),
    ('2026-05-12', 'Google sign-in and My Plans',
     'Added Google authentication, the /myplans portal and existing-booking recognition.',
     'Account', 'feature', 'normal', 'e9ce07d', 'e9ce07d, 4129ad0'),
    ('2026-05-17', 'Native application and approval flow',
     'Added the native application path and connected approved applicants to invite verification.',
     'Booking', 'feature', 'normal', 'fa79f8c', 'fa79f8c, f67fd8d'),
    ('2026-05-25', 'Live chat and push notifications for replies',
     'Added live support threads, a direct chat screen and web-push notifications for new replies.',
     'Support', 'feature', 'normal', 'd541171', 'd541171, 2aaae59, 12c555b'),
    ('2026-05-26', 'Doubt approval creates an application',
     'Connected submitted doubts to admin review so an approved doubt can create the application automatically.',
     'Support', 'feature', 'normal', 'c891738', 'ba7ab21, c891738'),
    ('2026-05-31', 'Admin PWA and operational push notifications',
     'Turned the PWA into an admin tool and added push alerts for new operational events and customer activity.',
     'Notifications', 'feature', 'normal', '58d3db5', '58d3db5, 01c29fe, 6e0922b, 68fca38'),
    ('2026-06-01', 'Payment, privacy and admin security hardening',
     'Moved trusted payment checks server-side, locked customer/admin tables with RLS and hardened messaging secrets and sessions.',
     'Security', 'technical', 'high', 'ab185b8', 'ab185b8, 72425f7, 6caec7c, d36c1bf, a55f152, bc2c599, eb1abd0'),
    ('2026-06-04', 'Analytics journey funnel and database monitoring',
     'Added native application conversion metrics, a journey funnel, per-event completion/payment views and weekly storage monitoring.',
     'Analytics', 'feature', 'normal', '83f84a6', '83f84a6, bc81a0b, a1ed7d4, a18d767'),
    ('2026-06-06', 'Cart-abandonment tracking and recovery',
     'Recorded abandoned payment sessions, surfaced them in People and fixed the recovery trigger under RLS.',
     'Payments', 'feature', 'high', '5e26f8a', '5e26f8a, 12bcb5b'),
    ('2026-06-06', 'Shared terms and conditions across booking flows',
     'Replaced drifting copies with one complete terms component shared by every booking and payment surface.',
     'Legal', 'improvement', 'normal', 'b257765', 'f32f8d8, 8effcee, b257765'),
    ('2026-06-07', 'Founder audio note on plan details',
     'Added an optional per-plan voice note with a custom audio player and admin-managed audio URL.',
     'Plans', 'feature', 'normal', 'ea27304', 'ea27304, 5e4a772, caecf61'),
    ('2026-06-08', 'PayU reconciliation and go-live safeguards',
     'Added pending-payment handling, reconciliation, real email capture and safer retry/back-navigation behaviour.',
     'Payments', 'improvement', 'high', 'a00371e', '8096829, a00371e, fc174ee'),
    ('2026-06-20', 'Single-payment events',
     'Added full-payment event configuration, a shorter timeline and single-entry payment UI across admin and checkout.',
     'Payments', 'feature', 'high', '7a9341a', '7a9341a, fa4aba9, 8f3414a, a71bb7e'),
    ('2026-06-20', 'Community event booking mode',
     'Added community events with a WhatsApp-led booking path and cross-month calendar support.',
     'Events', 'feature', 'normal', '94d3e41', '94d3e41'),
    ('2026-06-20', 'Multi-marketer attribution and performance dashboard',
     'Added lead assignment, marketer ownership, per-ticket commission and founder-facing performance reporting.',
     'Performance', 'feature', 'normal', '621a2b2', '621a2b2, a85f735'),
    ('2026-06-22', 'Doubt-to-invite conversion flow',
     'Connected doubts to invite approval and refined application fields, timelines and pricing inputs around that journey.',
     'Booking', 'feature', 'normal', '2fb28f9', '2fb28f9'),
    ('2026-06-28', 'Single-page application and multi-date booking',
     'Simplified the application into one page and made calendars, invitations, messages and timelines respect the selected event date.',
     'Booking', 'feature', 'normal', '5588ac1', '5588ac1, 432c090, 07ed91d, e055a9d'),
    ('2026-07-04', 'Open-event direct booking flow',
     'Added open events that skip approval and move guests directly from booking details into payment.',
     'Booking', 'feature', 'high', 'fe27355', 'fe27355'),
    ('2026-07-04', 'Creator affiliate links and dashboard',
     'Added creator handles, attributed traffic and sales, a self-serve dashboard and creator-aware performance reporting.',
     'Creators', 'feature', 'normal', '7d0f4c8', 'fe27355, 7d0f4c8'),
    ('2026-07-09', 'Email capture, invites, abandonment and tracking',
     'Collected guest email, sent server-side Brevo invites and abandonment emails, and surfaced delivery tracking in admin.',
     'Email', 'feature', 'normal', '3b82e10', '3166070, 3b82e10, 0933837, cd87230, 68255bd'),
    ('2026-07-10', 'Open-event booking safeguards',
     'Added missing-application self-healing, per-date sold-out handling, stricter phone validation and duplicate-ticket prevention.',
     'Booking', 'improvement', 'high', '2ecb766', '05f6c57, e717256, c9da61e, b0c5d90, 2ecb766')
)
INSERT INTO public.roadmap_features (
  title, description, area, feature_type, priority, status,
  release_id, created_at, updated_at
)
SELECT
  s.title,
  s.summary || E'\n\nBackfilled from git: ' || s.source_commits,
  s.area,
  s.feature_type,
  s.priority,
  'live_test',
  fr.id,
  (s.shipped_on::date + time '12:00') AT TIME ZONE 'Asia/Kolkata',
  (s.shipped_on::date + time '12:00') AT TIME ZONE 'Asia/Kolkata'
FROM seeds s
LEFT JOIN public.feature_releases fr
  ON fr.commit_hash = s.representative_commit
WHERE NOT EXISTS (
  SELECT 1
  FROM public.roadmap_features existing
  WHERE lower(btrim(existing.title)) = lower(btrim(s.title))
);

-- Every historical feature starts with one clear next action. The test result
-- itself is recorded through the roadmap UI, which moves the feature to
-- Complete or Fix needed.
INSERT INTO public.roadmap_tasks (feature_id, title, kind, sort_order)
SELECT feature.id, 'Run a live test and record the result', 'test', 0
FROM public.roadmap_features feature
WHERE feature.description LIKE '%Backfilled from git:%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.roadmap_tasks task
    WHERE task.feature_id = feature.id
      AND task.title = 'Run a live test and record the result'
  );
