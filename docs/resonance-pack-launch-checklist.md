# Resonance Pack Founding Member — 14-Day Launch Checklist

**Goal:** First successful Stripe subscription within 14 days.
**Sprint ends when:** one `customer.subscription.created` event fires in Stripe.

This checklist is the **manual** work that must happen alongside the code changes already committed. The code is in place; the configuration is not.

---

## Day 1–2 — Configure the pipes (≈ 4 hours of work)

### 1. Buttondown account

- [ ] Sign up at https://buttondown.email
  - Recommended plan: **Standard ($9/month, ~1,000 subscribers)** — gives you automations + Stripe integration
- [ ] Pick username (suggested: `anchorwithin` or `acaseymail`)
- [ ] In Buttondown → **Settings → API** → confirm API key exists (you don't paste it anywhere yet)
- [ ] Edit `/assets/js/aw-email-capture.js`, line ~71:
  ```
  'https://buttondown.email/api/emails/embed-subscribe/REPLACE_WITH_YOUR_BUTTONDOWN_USERNAME'
  ```
  Replace `REPLACE_WITH_YOUR_BUTTONDOWN_USERNAME` with your actual username.
- [ ] Commit + push that change separately so the waitlist form goes live immediately.

### 2. Buttondown welcome automation

- [ ] In Buttondown → **Automations → Create new**
- [ ] Trigger: `subscriber.created`
- [ ] Action: Send the welcome email below
- [ ] Subject line: **`Your seat is reserved · The Resonance Pack`**
- [ ] Email body (paste verbatim — text-only, no images):

```
Welcome.

You're now a Founding Member of the Resonance Pack — among the first
to receive the rotation as it's mastered.

What happens next:

· The first two tracks (432 Hz Ground, 528 Hz Restore) are being
  mastered now. You'll receive them as a private link within 2–3 weeks.

· After that, you'll receive one new track each month — Release (639 Hz),
  Focus (741 Hz), Dream (963 Hz), and on into the rotation as it grows.

· Delivery is by email. Quiet. No marketing. No promotional cadence.

A few honest notes:

· The rotation is intentionally slow. Don't expect dramatic claims or
  fast results. Frequency audio is something you live with, not
  something you take.

· Your founding rate is $19/month. It stays at $19 even if I raise
  the public rate. Cancel anytime in your Stripe portal:
  https://billing.stripe.com/p/login/[your-portal-link]

· If, after the first delivery, the rotation doesn't speak to you —
  reply to this note and I'll refund you in full.

Thank you for being among the first. The forge is real because of you.

— Andy

P.S. If you have particular frequencies, states, or rituals you'd
like to see in the rotation, hit reply. I read every note.
```

> ⚠️ Replace `[your-portal-link]` after Step 3 below — Stripe gives you the customer-portal URL once the product exists.

### 3. Stripe product

- [ ] In Stripe Dashboard → **Products → Add product**
- [ ] Name: **`Resonance Pack — Founding Member`**
- [ ] Description (visible at checkout):
  ```
  Founding access to the Resonance Pack — a private rotation of
  frequency audio for your nervous system. First two tracks within
  2–3 weeks, then one new track each month. Founding rate locks at
  $19/month permanently. Cancel anytime.
  ```
- [ ] Pricing model: **Recurring · Monthly · USD $19.00**
- [ ] Tax behavior: Inclusive (recommended for digital products) — or whatever your accountant tells you
- [ ] Save the product → note the price ID (`price_xxx`) for your records

### 4. Stripe Payment Link

- [ ] In Stripe Dashboard → **Payment Links → New**
- [ ] Add the Resonance Pack — Founding Member product
- [ ] Quantity adjustable by customer: **No**
- [ ] Collect customer phone: **No**
- [ ] **Collect customer email: Yes** (REQUIRED — this is how Buttondown gets the address)
- [ ] After payment redirect:
  ```
  https://ackccreate.github.io/resonance-pack/welcome/
  ```
- [ ] Save → **copy the Payment Link URL** (looks like `https://buy.stripe.com/...`)
- [ ] Edit `/resonance-pack/index.html` — find the marker `STRIPE_LINK_TODO` and replace with your actual Payment Link URL
- [ ] Commit + push

### 5. Stripe → Buttondown handoff

Pick ONE of the two options:

**Option A — Zapier (recommended, ~10 minutes)**
- [ ] Free Zapier account at https://zapier.com
- [ ] Create a Zap:
  - Trigger: **Stripe → New Customer**
  - Action: **Buttondown → Add Subscriber**
  - Map: Stripe `email` → Buttondown `email`
  - Add Buttondown tag: `founding-member`
- [ ] Test the Zap with Stripe's test mode (Stripe sends test events you can use)
- [ ] Turn the Zap ON

**Option B — Weekly manual export (~15 min/wk, fine for the first 10 buyers)**
- [ ] Each Sunday: Stripe Dashboard → Customers → export new ones to CSV
- [ ] Buttondown → Subscribers → Import CSV
- [ ] Tag imported subscribers `founding-member`
- [ ] Buttondown's automation will trigger welcome email automatically on import

Option A is the right move long-term. Option B is fine for the 14-day sprint.

---

## Day 3 — Test the end-to-end purchase (REQUIRED before any marketing)

### 6. End-to-end test purchase

- [ ] Open https://ackccreate.github.io/resonance-pack/ in a private browser window
- [ ] Verify the **Founding Member** block displays with the $19 / month price and gold CTA
- [ ] Click **Become a Founding Member** → should jump to Stripe Checkout
- [ ] Either:
  - Use a Stripe test mode card (`4242 4242 4242 4242` works) if your link is in test mode, OR
  - Pay the actual $19 with your own card and refund yourself afterward
- [ ] On payment success, you should be redirected to `/resonance-pack/welcome/`
- [ ] Check your email — Buttondown welcome should arrive within 5 minutes
- [ ] Refund yourself in Stripe if you used a real charge (Stripe Dashboard → Payments → Refund)

### 7. Analytics verification

- [ ] In DevTools Console while on `/resonance-pack/`:
  ```
  window.__awAnalytics
  ```
  Should return `{version: '5.1.0', domain: 'ackccreate.github.io', mode: 'active'}`
- [ ] DevTools → Network tab → filter "plausible"
- [ ] Click the Founding CTA → should see `commerce:stripe_click` Plausible event fire
- [ ] Complete a test purchase → on `/welcome/`, should see `commerce:subscription_confirmed` Plausible event fire
- [ ] In Plausible dashboard (~5-min delay): verify both events appear under Custom Events

---

## Day 4–14 — Drive traffic to the offer

### 8. Soft launch sequence

- [ ] Email any existing waitlist subscribers (manual, ~5 minutes):
  - Subject: "The Resonance Pack — Founding Members"
  - Body: 4 sentences. Direct link to /resonance-pack/. Mention founding rate locks at $19/mo.
- [ ] Post to your personal channels (LinkedIn, X/Twitter, whatever you actually use)
- [ ] DO NOT pay for ads in the first 14 days. You need conversion data first.

### 9. Audio production starts in parallel (target: tracks ready Day 21–28)

- [ ] Block 2 evening sessions per week for mastering
- [ ] Track 1: **432 Hz Ground** — pure tone + ambient bed, 15–20 min, light low-end warmth
- [ ] Track 2: **528 Hz Restore** — pure tone + ambient bed, 15–20 min, mid-warm
- [ ] Master to **−14 LUFS integrated, true peak −1 dB** (streaming standard)
- [ ] Export as **MP3 320kbps + WAV 44.1/16**
- [ ] Upload to private Cloudflare R2 bucket (or any S3-like storage)
- [ ] Generate signed URLs (1-year expiry is fine) for the first batch

### 10. First delivery (Day ~21)

- [ ] Buttondown → new broadcast email to `founding-member` tag
- [ ] Subject: `The Resonance Pack — Vol. 1`
- [ ] Include both signed download URLs
- [ ] Short note: "Two tracks. Live with them for a few days before reaching for the next."

---

## Day 14 — Sprint outcome decision

Run the following decision tree on Day 14:

```
Did at least one Stripe customer.subscription.created event fire?
├── YES → Sprint succeeded. Continue producing tracks. Hold price.
├── NO, but waitlist signups increasing
│       → Offer signal exists; conversion gap is the issue.
│         Likely fix: stronger CTA copy, urgency framing, or price test ($9 trial).
└── NO, and waitlist signups flat
        → Distribution gap. Need more traffic before iterating on offer.
          Likely fix: targeted outreach to adjacent communities (no paid ads yet).
```

---

## Rollback plan (if anything breaks during launch)

The PR is designed to be **fully reversible without affecting any other product**:

1. **To hide the Founding Member offer:** delete the `<div class="capture-block capture-block--founding">` block in `/resonance-pack/index.html`. The waitlist form below it continues working unchanged.
2. **To deactivate the Stripe Payment Link:** Stripe Dashboard → Payment Links → toggle inactive. No code change needed; new visitors clicking the CTA will see Stripe's "no longer available" page.
3. **To remove the welcome page:** delete `/resonance-pack/welcome/index.html`. Any in-flight Stripe redirects will 404 — but they'll only land there post-payment, and your Stripe receipt + Buttondown welcome email still cover the customer experience.
4. **To revert Buttondown wiring:** restore `REPLACE_WITH_YOUR_BUTTONDOWN_USERNAME` placeholder. Waitlist form goes back to validation-only mode (no email actually saved). No customer harm.

No analytics, distribution, or non-Resonance-Pack pages are touched by the launch PR.

---

## What this sprint does NOT include

- ❌ Audio production (must be done by Andy in parallel)
- ❌ Real Buttondown / Stripe account creation (Andy must do)
- ❌ Marketing / paid ads (deliberately deferred until conversion data exists)
- ❌ Cloudflare R2 setup for audio hosting (not needed until tracks are ready)
- ❌ Customer support workflow (handle reply-by-email manually for first 10)

These are explicitly out of scope for the 14-day sprint and accounted for in the timeline above.
