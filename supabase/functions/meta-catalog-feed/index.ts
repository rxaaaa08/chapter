import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// meta-catalog-feed
//
// Serves our live plans to Meta as a product feed (CSV) for an Advantage+
// catalog to fetch on a schedule. Every row comes from meta_catalog_items(), the
// same function behind the "Plans ready to advertise" card, so the catalog can
// never show a price, image or date the site does not.
//
// WHY A FEED URL AND NOT THE CATALOG BATCH API
// Meta pulls a feed URL itself, so we hold no catalog-management token and keep
// no Meta state: the catalog is a mirror of our database, refreshed on Meta's
// own schedule. The batch API would need a write-scoped token on our side, for
// no gain at ~10 items.
//
// PUBLIC BY DESIGN. It returns only what the site already shows anyone: title,
// description, price, photo, link, and in stock / out of stock. Never seats left
// and never anything about bookings. verify_jwt is false because Meta fetches it
// unauthenticated:
//   supabase functions deploy meta-catalog-feed --no-verify-jwt
//
// Only rows with no blocking problem are served (a price, an image, a
// description). A plan whose dates are all full is still served, as "out of
// stock": its Pixel events keep matching a catalog item, and Meta stops
// advertising it on its own.

const COLUMNS = [
  'id', 'title', 'description', 'availability', 'condition', 'price', 'link',
  'image_link', 'brand', 'google_product_category',
  // Custom labels let product sets be cut (open vs invite, by city, by next
  // date) without ever changing this feed again.
  'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4',
];

// RFC 4180: quote every field and double embedded quotes. Line breaks are
// flattened, because a newline inside a description would start a new product.
function cell(v: unknown): string {
  const s = String(v ?? '').replace(/[\r\n]+/g, ' ').trim();
  return `"${s.replace(/"/g, '""')}"`;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await supabase.rpc('meta_catalog_items');
  if (error) {
    console.error('[meta-catalog-feed] meta_catalog_items failed', error.message);
    // A failure, never an empty 200. A successful empty feed can be read as
    // "every product was removed"; a failed fetch leaves the last good copy.
    return new Response('feed temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '900' },
    });
  }

  const rows = (data ?? []).filter((r: any) => r.feedable === true);
  const lines = [COLUMNS.join(',')];
  for (const r of rows) {
    lines.push([
      r.id,
      r.title,
      r.description,
      r.availability,
      'new',
      `${Number(r.price).toFixed(2)} INR`,
      r.link,
      r.image_url,
      'chapter அ',
      'Arts & Entertainment > Event Tickets',
      r.category ?? '',
      r.city ?? '',
      r.booking ?? '',
      r.payment_mode ?? '',
      r.next_date ?? '',
    ].map(cell).join(','));
  }

  return new Response(req.method === 'HEAD' ? null : lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      // Meta fetches on its own schedule; this only spares the database from a
      // burst of repeat fetches.
      'Cache-Control': 'public, max-age=900',
    },
  });
});
