# Tracking: GTM, server-side GTM, GA4, Meta

How the storefront's tracking works and how to set up the parts that live outside this repo.

## Environment

| Variable | Purpose |
|---|---|
| `GTM_ID` | Web container id (`GTM-XXXX`). Empty = GTM off. |
| `GTM_SERVER_URL` | Server-side GTM (sGTM) origin, e.g. `https://sgtm.shinomart.com`. Serves `gtm.js` first-party and receives server-side GA4 hits. Optional. |
| `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` | Server-side GA4 purchases/refunds via Measurement Protocol (to `GTM_SERVER_URL/mp/collect`, else Google). Both required. |
| `GTM_CONSENT_DEFAULT` | `granted` (default) or `denied`. |
| `GTM_CONSENT_DENIED_REGIONS` | Regions denied by default, e.g. `EEA` (EU/EEA + UK + CH) or `GB,US-CA`. |
| `CONSENT_BANNER` | `off` (default), `required` (only visitors whose default is denied), `all`. |
| `GEO_COUNTRY_HEADER` | Request header carrying the visitor's ISO country (see Consent). |
| `META_VIA_SGTM` | `true` once Meta CAPI runs as an sGTM tag. The app then stops its own CAPI sends. |
| `TRACKING_DATA_DIR` | Where gateway purchases are parked until paid. Default `.data/pending-purchases`. Must persist across deploys and be shared by all app instances. |
| `TRACKING_WEBHOOK_SECRET` | Bearer secret for the refund webhook. |
| `CSP_MODE`, `CSP_EXTRA_SOURCES`, `CSP_REPORT_URI` | Content-Security-Policy (build time). See CSP. |

GTM, GA4, consent and Meta variables are read at request time, so restart the app to apply them. The CSP variables are read by `next build`, so rebuild to apply them.

## Events

The app pushes these to `dataLayer`. Each carries an `event_id` that is shared with the matching Meta event.

| dataLayer event | When | Meta |
|---|---|---|
| `page_view` | Every route change. Waits up to 1s for the new `<title>`. | PageView |
| `view_item_list` | A product grid/carousel scrolls into view | — |
| `select_item` | Product link clicked inside a list | — |
| `view_item` | Product page | ViewContent |
| `add_to_cart` / `remove_from_cart` | Add, qty change, remove, clear cart | AddToCart |
| `view_cart` | `/cart` page, cart drawer opened | — |
| `add_to_wishlist` | Wishlist add | AddToWishlist |
| `begin_checkout` | Checkout with items | InitiateCheckout |
| `add_payment_info` | Checkout submit (`payment_type`) | AddPaymentInfo |
| `purchase` | Cash on delivery: order placed. SSLCommerz/bKash: payment succeeded (`/payment/result`). | Purchase |
| `search` | `/products?search=` | Search |
| `login` / `sign_up` | `method`: `email` or `otp` | CompleteRegistration (sign_up) |
| `generate_lead` | Newsletter / contact form (`lead_source`) | Lead / Contact |
| `consent_update` | Banner choice | — |

Other dataLayer keys: `user_data` / `user_id` hold the customer's details for enhanced conversions. `ga4_server_purchase: true` is set when the server sends GA4 purchases.

### Purchases
- **Cash on delivery:** the server sends Purchase to Meta CAPI and GA4 when `/api/orders` succeeds, and the browser sends its copy.
- **SSLCommerz / bKash:** nothing counts until the gateway confirms payment. `/api/orders` parks the purchase in `TRACKING_DATA_DIR`. The SSLCommerz success redirect, the SSLCommerz IPN and the bKash callback send it once payment is valid. Whichever of those arrives first wins. An atomic file rename means it is sent once, even if the shopper closes the tab. The browser copy fires on `/payment/result`.
- **Deduplication:** Meta dedupes the browser and server copies on `purchase.<orderId>`. GA4 takes purchases from the server only when `GA4_*` is set. The web container's purchase trigger skips the browser copy in that case.

## Web container

1. GTM → Admin → **Import container** → `docs/gtm/web-container.json` → choose **Merge** (rename conflicts).
2. Edit the variables **GA4 Measurement ID** and **sGTM URL**. Without sGTM, remove the `server_container_url` row from **GA4 - Google tag**.
3. Preview on the site, then publish.

The import creates these:
- **Google tag:** automatic `page_view` is off.
- **GA4 event tags:** page_view, ecommerce (`{{Event}}` as the event name, ecommerce read from the dataLayer), search, login/sign_up, generate_lead. Each sends `event_id`, `user_id` and `user_data`.
- **Purchase trigger:** "CE - purchase (browser)" only fires when `ga4_server_purchase` is not `true`.

Add Google Ads conversion tags yourself if you need them. They can use `CE - purchase (browser)`, or a separate purchase trigger without the server filter.

## Server container (sGTM)

Hosting options are Cloud Run, Docker (`gcr.io/cloud-tagging-10302018/gtm-cloud-image`, a tagging server plus a preview server) or Stape. Map it to `GTM_SERVER_URL`: a subdomain, or a same-origin path proxied by nginx with `X-Forwarded-For`.

**Clients** (Clients → New):
1. **Google Analytics: GA4 (Web)**: default settings. Turn on "Server managed" cookies if you want an HttpOnly `FPID`.
2. **Google Tag Manager: Web Container**: add your `GTM_ID` to the allowed containers, so `gtm.js` and `ns.html` are served first-party.
3. **Measurement Protocol (GA4)**: path `/mp/collect`. Receives the server-side purchase and refund. Without it those requests return 400.

**Tags**:
- **Google Analytics: GA4**: trigger "Client Name equals GA4" or "Client Name equals Measurement Protocol (GA4)". The measurement id is inherited from the event.

**Meta through sGTM** (optional; do this after sGTM has run stably):
1. Add a Meta Conversions API tag template (e.g. Stape's "Facebook Conversion API") with your pixel id and access token. Trigger it on the GA4 and Measurement Protocol clients.
2. Map GA4 events to Meta events. The template's "inherit from client" option does this. `event_id` is already the same id the browser Pixel uses, so Meta dedupes.
3. Set `META_VIA_SGTM=true` and restart. The Pixel stays in the page, and the app stops `/api/ev` and its own server-side Purchase to Meta.

## Consent

- **Defaults:** the head snippet sets Consent Mode v2 defaults from `GTM_CONSENT_*`. A saved choice (`sm_consent` cookie) is applied before `gtm.js` loads.
- **Banner:** with `CONSENT_BANNER` on, the banner saves the choice and updates Google Consent Mode, `fbq('consent', …)` and the dataLayer (`consent_update`). The footer shows a **Cookie settings** link to reopen it.
- **What each choice controls:**
  - *Analytics* → `analytics_storage` and server-side GA4.
  - *Marketing* → `ad_*` signals, the Meta Pixel, the `/api/ev` relay, server-side Meta CAPI, and the `user_data` sent to GA4.
- **Region detection:** Google applies regional defaults by IP on its side. The Meta Pixel, the banner's `required` mode and the server senders need the visitor's country from a header. They check `GEO_COUNTRY_HEADER`, then `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country` and `x-country-code`. On a plain VPS, add nginx GeoIP2, for example:
  ```nginx
  proxy_set_header X-Country-Code $geoip2_data_country_code;
  ```
  Without a country header, the global `GTM_CONSENT_DEFAULT` applies to everyone.
- **Admin scripts:** scripts pasted into the admin header/footer are not consent-gated. Put consent-sensitive tags in GTM instead.

## Refunds (backend → GA4)

When a return or refund is approved, the backend calls:

```
POST https://<store>/api/tracking/refund
Authorization: Bearer <TRACKING_WEBHOOK_SECRET>
Content-Type: application/json

{ "transaction_id": "INV-00123", "value": 1500, "items": [{ "item_id": 456, "quantity": 1, "price": 1500 }] }
```

- `transaction_id` must be the order's invoice number, which is the purchase's `transaction_id`.
- Leave out `items` for a full refund.
- `item_id` is the product barcode id.

Laravel example:

```php
Http::withToken(config('services.storefront.tracking_secret'))
    ->timeout(5)
    ->post(config('services.storefront.url').'/api/tracking/refund', [
        'transaction_id' => $sale->invoice_number,
        'value' => (float) $refundAmount,
        'items' => $returnedLines->map(fn ($l) => [
            'item_id' => $l->product_barcode_id,
            'quantity' => (int) $l->qty,
            'price' => (float) $l->price,
        ])->values(),
    ]);
```

Meta has no refund event, so refunds only reach GA4.

## Admin header/footer scripts

If the standard GTM snippet for `GTM_ID` is pasted there, the app strips it so the container doesn't load twice. Snippets for other container ids are left as they are.

## CSP

`CSP_MODE=report-only` adds `Content-Security-Policy-Report-Only`. Watch the browser console, or point `CSP_REPORT_URI` at a collector, then switch to `enforce`.

The policy allows:
- self and the API origin
- Google Tag Manager, Analytics, Ads and gstatic
- Meta
- the sGTM origin
- YouTube, Vimeo and Twitter embeds
- any image host

`'unsafe-inline'` stays on for scripts because the tracking snippets and admin scripts are inline. Add hosts used by admin scripts or GTM Custom HTML tags to `CSP_EXTRA_SOURCES`. Rebuild after any change.

## Test checklist

- [ ] GTM Preview: `page_view` on navigation with the right title, and list/cart/checkout events carry `ecommerce`.
- [ ] GA4 DebugView: ecommerce events and `purchase` (from sGTM when `GA4_*` is set).
- [ ] Meta Events Manager → Test events: browser and server events deduplicated.
- [ ] SSLCommerz sandbox: pay → one purchase. Cancel/fail → none. Pay and close the tab before the redirect → the IPN still sends the purchase.
- [ ] bKash sandbox: pay → one purchase.
- [ ] Consent: reject → no Pixel requests, no `/api/ev` relay. Accept → events resume.
- [ ] Refund webhook: `curl` with the secret → `refund` in GA4.
