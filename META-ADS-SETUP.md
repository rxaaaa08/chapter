# Meta ads reporting — setup

Everything in code is built and live. What remains is three things only you can
do, all in Meta's own interfaces. This is the click-by-click.

Do them in this order. Step 1 has a deadline the others don't.

---

## 1. Set the URL parameters on every ad — BEFORE the first rupee

This is the whole join between Meta's spend and our bookings. Traffic that
arrives before this is set can never be matched to an ad, no matter what we
build later.

In Ads Manager, in each **ad** (not campaign, not ad set), scroll to
**Tracking → URL parameters** and paste exactly this:

```
utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}
```

Meta swaps `{{ad.id}}` for the real numeric ad ID at click time. Our site
already stores it — `src/attribution.ts` has been capturing `utm_content` since
13 August, so this needs no code change.

If you forget it on one ad, the panel's **Tracking health** strip will say so:
it counts visitors who arrived tagged as Meta traffic but carried no ad ID.

---

## 2. Domain verification + event priority — BEFORE the first campaign

This one is ordering-sensitive and the cost of getting it wrong is 72 hours of
paused ads (Meta error `3260008`).

**Events Manager → Aggregated Event Measurement:**

1. Verify the domain `chaptera.in` if it is not already verified
   (Business Settings → Brand Safety → Domains).
2. Configure the **event priority list** for that domain — up to 8 events,
   highest priority first. Ours should be:

   1. `Purchase`
   2. `Lead`

3. Save it and leave it alone.

**Why the order matters and why now:** changing this list later pauses every ad
using those events for **72 hours**. Set it before launching, not after you have
data and want to tune it. An ad set optimising for Purchase will also refuse to
publish at all if Purchase is not configured on the domain (error `3260007`).

---

## 3. The two Supabase secrets

The sync function is deployed and running on a 6-hourly cron, but it does
nothing until these exist. Until then it returns
`{"ok":false,"error":"missing_credentials"}` on purpose — a loud failure rather
than a silent one that looks like "no ads ran".

### 3a. The ad account ID (not secret — safe to run as-is)

```bash
npx supabase secrets set META_AD_ACCOUNT_ID=1580469137074269
```

That is **chapter அ advertisement** — the only one of your four ad accounts
with both a payment method and API access. No `act_` prefix; the code adds it.

### 3b. The access token (you generate this; never paste it into chat)

You need a **System User token**, not a personal one. Personal tokens expire and
are tied to your login; a system user token belongs to the business.

**Make a SECOND system user — do not reuse the Conversions API one.**

You already have `Conversions API System User` (ID 61593183602008), and the
`META_CAPI_ACCESS_TOKEN` that carries every Purchase and Lead to Meta was
generated from it. The **Revoke tokens** button in that screen is per system
user and revokes *all* of its tokens at once. If the reporting token ever shares
that user, a routine rotation takes conversion tracking down with it — payments
keep working, Meta just stops hearing about them, and nothing looks broken.

A read-only reporting token has no reason to share a lifecycle with the token
carrying our revenue events.

In **business.facebook.com → Business Settings**:

1. **Users → System Users → Add**. Name it `chaptera-reporting`.
   Role: **Employee** is enough.
2. **Add Assets → Apps** → **Conversions API Application** → enable
   **Develop app**. The existing app is fine; a second app is not needed.
3. **Add Assets → Ad accounts** → **chapter அ advertisement**
   (`1580469137074269`) → enable **View performance**.

   **This is the step that is missing today.** The Conversions API system user
   has Apps, Pixels and Datasets assigned but *no ad account at all*, which is
   why no token from it can read spend regardless of scopes.
4. **Generate New Token** → pick that app → tick **`ads_read`** only.
   Set expiry to **Never**. Copy it; it is shown once.

Do not give this user the pixels or datasets. It has no business touching them.

If `ads_read` is not offered in the scope list at step 4, add the
**Marketing API** product to the app in the App Dashboard, then retry.

Then set it — replace the placeholder with the real value, and run this in your
own terminal:

```bash
npx supabase secrets set META_ADS_ACCESS_TOKEN=PASTE_YOUR_TOKEN_HERE
```

### 3c. Check it worked

```bash
curl -s -X POST "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-sync" -H "Content-Type: application/json" -d '{}'
```

- `{"ok":true,"rows":0,...}` — working. Zero rows just means no ads have run.
- `"error":"missing_credentials"` — a secret did not save.
- `"meta_code":190` — token expired, revoked, or wrong. Regenerate it.
- `"meta_code":200` or `294` — the system user lacks access to the ad account.
  Redo step 3a-2.

---

## Do you need App Review?

Probably not, and it is worth understanding why before spending days on it.

App Review exists to let your app touch **other people's** business data. You are
reading **your own** ad account, and a System User token from your own Business
Manager grants that directly. `ads_read` on first-party assets is normally
available without review.

Meta's FAQ does say production use requires review, so this is not a guarantee.
**The test is free and takes one minute: do step 3 and run the curl.** If it
returns data, you are done. Only if it returns `190`, `200` or `294` — after you
have confirmed the system user really is assigned to the ad account — is review
actually the blocker.

### If it does turn out to be needed

In the App Dashboard → **App Review → Permissions and Features** → request
**Advanced Access** for `ads_read`.

Prerequisites, in the order they will block you:

1. **Business Verification** (Business Settings → Security Centre → Start
   Verification). Needs official documents showing the business name and
   address — GST certificate, a utility bill, or a bank statement. This takes
   days, not minutes, and is a prerequisite for a lot of Meta features. **Worth
   starting now regardless of whether review is needed**, because everything
   else waits on it.
2. **Privacy Policy URL** on a live page of `chaptera.in`.
3. App icon (1024×1024) and a category.
4. A **screencast** showing what the app does with the permission — for us that
   is the Growth ▸ Ads page in the admin panel, showing spend joined to
   bookings.
5. A written explanation of why the permission is needed. Ours is honest and
   simple: reading our own ad spend to compute a true cost per acquisition
   against our own payment records.

Note we request `ads_read` and **not** `ads_management`. Read-only is a much
lighter review, and the sync never writes to Meta.

---

## One thing to be aware of

Meta's Ads Insights docs ask that anyone storing insights data review the
[Meta Platform Terms](https://developers.facebook.com/terms) and the
[Developer Policies for Marketing API](https://developers.facebook.com/devpolicy/#marketingapi).
We store per-ad daily spend in `meta_ad_daily`, founder-only, and never expose
it publicly — but the terms are worth a read since this is your business
account.
