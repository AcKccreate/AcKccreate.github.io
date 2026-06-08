# Revenue Pause — Audit Log

**Date paused:** 2026-06-15
**Reason:** Long-term disability application — no income may be earned during application period.
**Property affected:** Entire `ackccreate.github.io` site.
**Scope:** All purchase, subscription, and trial-signup mechanisms.

This document is the authoritative record of every change made to disable revenue-earning capability on AnchorWithin's public surface. It is intentionally explicit so that a disability assessor, attorney, or future operator can verify that no commercial transaction can be completed via the site as it stands.

---

## What was disabled

### 1. Stripe payment links — 14 distinct payment URLs across 9 product pages

Every `https://buy.stripe.com/...` URL in the repository was replaced with the relative path `/paused/`. Clicking any purchase or subscription button on any product page now redirects the visitor to a notice page explaining the pause, rather than initiating a Stripe checkout.

Specific files modified:

| File | URLs replaced |
|---|---|
| `forever-paws/index.html` | 3 (Memorial $14.99, Animated $29.99, Keepsake $59.99) |
| `dreamwalk/index.html` | 2 occurrences of the same Stripe URL |
| `thennow/index.html` | 1 |
| `depthclick/index.html` | 2 occurrences of the same Stripe URL |
| `sanctuary-bell/index.html` | 1 |
| `kidspark/index.html` | 1 |
| `nervous-system-reset/index.html` | 3 occurrences of the same Stripe URL |
| `echowalk/index.html` | 4 (3 distinct URLs across The Wanderer, The Keeper, The Legacy tiers) |
| `api-docs/index.html` | 3 (Starter $9/mo, Pro $29/mo, Unlimited $79/mo) |
| `api-docs/quickstart.html` | 3 (same URLs as `api-docs/index.html`) |

In addition, the visible button text was changed from "Choose Memorial" / "Start Pro" / etc. to **"Currently Unavailable"** wherever the Stripe link was the underlying target.

### 2. Resonance Pack Founding Member subscription

The `STRIPE_LINK_TODO` placeholder in `resonance-pack/index.html` was never wired to a real Stripe Payment Link — but the page was actively marketing a $19/month subscription. The "Become a Founding Member" CTA was replaced with a "Currently Unavailable" link pointing to `/paused/`. The waitlist form (lower on the page) remains visible but no longer represents an active commercial offering.

### 3. API trial signup form

The `trial/index.html` form previously opened a `mailto:` link to request a free API key. The form's submit handler was replaced with a redirect to `/paused/`, and the submit button text was changed from "Get Free Trial Key →" to **"Currently Unavailable"**. No emails can be triggered through the trial flow.

### 4. Search-engine de-listing — `noindex` meta on every product page

`<meta name="robots" content="noindex,nofollow">` was added to the `<head>` of every product page so that Google, Bing, and other crawlers will remove these URLs from search results. Pages affected:

- `breatheworld/index.html`
- `depthclick/index.html`
- `dreamwalk/index.html`
- `echowalk/index.html`
- `forever-paws/index.html`
- `kidspark/index.html`
- `nervous-system-reset/index.html`
- `resonance-pack/index.html`
- `sanctuary-bell/index.html`
- `thennow/index.html`
- `trial/index.html`
- `veritswarm/index.html`
- `verity/index.html`
- `api-docs/index.html`

The pause notice page (`paused/index.html`) is also `noindex`'d.

### 5. `robots.txt` — explicit disallow on all product paths

The site's `robots.txt` was updated to explicitly `Disallow:` every product directory. This is a belt-and-suspenders addition on top of the meta tag; well-behaved crawlers will not even attempt to fetch product pages.

### 6. `sitemap.xml` — product entries removed

The site's `sitemap.xml` previously listed 15 product URLs. It has been pared down to four:
- `/anchorwithin-home/`
- `/paused/`
- `/anchorwithin-privacy/` (legal)
- `/anchorwithin-tos/` (legal)

All product entries are gone from the sitemap and will be dropped from search indexes accordingly.

### 7. Home page pause banner

A persistent banner has been added to the top of `anchorwithin-home/index.html`, above the navigation:

> *"All AnchorWithin products are currently paused — purchases and signups are not being processed. Learn more →"*

The "Learn more →" link points to `/paused/`. This makes the pause status the first visible element on the site's primary entry page.

### 8. New `/paused/` notice page

A new page was created at `paused/index.html` containing the canonical pause notice that every disabled CTA now points to. The page is `noindex`'d, contains no commercial content, and serves only as a clear statement to any visitor that the property is not currently transacting.

---

## What was *not* changed

The following items were deliberately left in place because they do not constitute systems that earn money:

- **Email capture forms** on Resonance Pack and BreatheWorld waitlists. These collect email addresses but do not process payments or initiate any commercial transaction. The Buttondown subscribe endpoint (`https://buttondown.email/api/emails/embed-subscribe/AnchorWithin`) remains as-is in the JavaScript module. If a stricter standard is required, those forms can be neutralized by reverting the `aw-email-capture.js` endpoint to its placeholder value.
- **Plausible analytics** (`https://plausible.io/js/script.js` and `/assets/js/analytics.js`). This tracks pageviews and is not a revenue mechanism.
- **Privacy and Terms-of-Service pages** (`anchorwithin-privacy/`, `anchorwithin-tos/`). Required for legal compliance and contain no commercial offerings.
- **Educational marketing copy** describing what the products *were*. This is informational, not transactional. Visitors arriving via direct URL can read what the products do but cannot purchase, subscribe, or sign up for anything.
- **The repository's design system, documentation, and dev artifacts** (`assets/`, `docs/`). These are non-public infrastructure.

---

## What you (Casey) should also do manually

The site-side disable above is complete. The following are external systems that may still hold active commercial state and should be addressed by you directly:

1. **Stripe Dashboard:** confirm no active subscriptions exist. If any subscriptions were ever activated, cancel them at the end of the current billing period (or refund and cancel immediately, depending on your accountant's guidance). Pause or archive the Stripe products themselves so they cannot be reactivated by accident.
2. **Stripe Payment Links:** in the Stripe Dashboard → Payment Links, set each existing Payment Link to **inactive**. They are already orphaned from the site, but inactivating them in Stripe is the cleanest belt-and-suspenders move.
3. **Buttondown account:** decide whether to pause / archive. The email list itself is not revenue, but if you want to be maximally cautious, pause the Buttondown account so no scheduled or automation emails fire while your claim is being assessed.
4. **Zapier or other automation:** if you ever set up a Zapier zap connecting Stripe → Buttondown, disable it.
5. **Google Search Console / Bing Webmaster:** consider submitting a removal request for the product URLs to accelerate their de-listing beyond what `noindex` alone provides.

---

## How to restore everything later

Every change above is reversible. The Stripe URLs were replaced, not deleted — they're recorded above. The visible CTA text changes are simple text reversions. The `noindex` meta tags, `robots.txt` disallows, and sitemap entries can all be reverted with straightforward edits.

When you're ready to re-enable revenue:
1. Revert this commit (or undo each piece selectively).
2. Reactivate the Stripe products and Payment Links in the Stripe Dashboard.
3. Re-enable any automation (Buttondown, Zapier).
4. Resubmit the sitemap to Google Search Console.

The commit hash for this revenue-pause action is recorded in `git log` and can be located by searching for the message `chore: pause all revenue-earning surfaces`.

---

*This document is itself published at* `/docs/revenue-pause-log.md` *and is publicly accessible if needed as evidence that the pause was implemented in good faith on the date listed above.*
