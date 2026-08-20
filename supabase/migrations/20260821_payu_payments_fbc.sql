-- Meta Conversions API — send the click id the browser actually recorded.
--
-- WHY
-- fbc is the field that ties a sale to an ad, so it is the one worth getting
-- exactly right. The server can rebuild it from applications.attribution.fbclid
-- as fb.1.<landed_at>.<fbclid>, and still does when it has nothing better. But a
-- rebuild has to invent the timestamp portion: it uses when WE saw the landing,
-- while fbevents used when IT saw the click. Same click, two different strings —
-- one reported by the browser, the other by the server.
--
-- So capture the real _fbc cookie at checkout and replay it, exactly as we do
-- for _fbp. Reconstruction stays as the fallback for ad-blocked visitors, where
-- the fbclid in the URL is all anyone has and a rebuilt fbc still beats none.
--
-- Additive and nullable; existing rows untouched.
alter table public.payu_payments
  add column if not exists fbc text;

comment on column public.payu_payments.fbc is
  'Meta _fbc click-ID cookie captured at checkout. Preferred over reconstructing fb.1.<landed_at>.<fbclid> server-side, so the browser and server report the SAME click id for one sale. Raw, never hashed. Null when the pixel was blocked, in which case the server still reconstructs from applications.attribution.fbclid.';
