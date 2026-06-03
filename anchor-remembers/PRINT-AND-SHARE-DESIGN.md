# AnchorRemembers — Print, Contribute & Share: Design Spec

Three connected features. They split by whether they need a backend:

| Feature | Backend? | When |
|---|---|---|
| A. Designed printable book (with photos, layout options) | ❌ No (client-side print) | **Now** |
| B. Invite family & friends to add to the book | ✅ Yes (shared storage) | After voice (Phase 4+) |
| C. Finalize → shareable print link for $0.99 | ✅ Yes (hosting + payments) | After B |

---

## A. PRINTABLE BOOK — layout system  (buildable now)

**How it works:** the app builds a hidden `#printContent` document and calls the browser's print → the user prints at home or "Save as PDF" (then optionally takes the PDF to any bindery). No server, no shipping.

### Page types
1. **Cover** — crest, "{Name}'s Memory Book", "As told by {relation}", year. (navy or cream)
2. **Dedication** (optional) — the one-word descriptor + short description.
3. **Chapter divider** — numbered, category name, gilt rule, sprig.
4. **Q&A page (text only)** — category eyebrow, italic gold question, serif answer, page number.
5. **Q&A page with photo** — same + a framed photo with caption.
6. **Closing page** — "Captured with love · anchorremembers.com" + crest.

### Style options (chosen at print time)
- **Cover finish:** Heirloom (navy) ·or· Light (cream)
- **Include photos:** on/off
- **Page size:** 7×9 keepsake ·or· US Letter ·or· A5
- (font is fixed: editorial serif)

### Build notes
- Pure `@media print` CSS + generated HTML. Already have a basic `printKeepsake()`; this replaces it with the designed template above.
- Photos already stored locally (base64) flow straight in.

---

## B. INVITE FAMILY & FRIENDS  (needs backend)

**Goal:** more voices in one book (siblings add their memories of Dad; grandkids add a note).

### Flow
1. Owner taps **"Invite Family"** on Home → app creates a unique link, e.g. `anchorremembers.com/add/AbC123`.
2. Owner shares the link (text/email/WhatsApp).
3. Recipient opens it → a **simple contributor view**: the person's name + photo, a list of prompts, "Add your memory" (write + optional photo + sign your name). **No account needed.**
4. Contributions land in the owner's **"Review" inbox** → owner approves → merged into the book (tagged "— added by James, grandson").

### UI pieces
- Home: `Invite Family` button + small "3 contributions waiting" badge.
- Contributor page: cover header, prompt list, write/photo box, "Sign your name", submit + thank-you.
- Review inbox: cards with Approve / Edit / Decline.

### Backend needs
- Store the book + contributions; unique share tokens; light spam protection; image upload. Contributors are anonymous-by-token (no login).
- Privacy control: choose whether contributors see existing answers or only the prompts.

---

## C. FINALIZE → SHAREABLE PRINT LINK ($0.99)  (needs backend + payments)

**Goal:** anyone in the family can get their own print-ready copy for a small fee — viral, low-friction gifting.

### Flow
1. Owner taps **"Finalize Book"** → confirmation ("This locks a shareable snapshot; you can still edit your own copy") → app creates a **public link** `anchorremembers.com/book/Xy7Q`.
2. Anyone opening the link sees a **preview** (cover + a few sample pages) and **"Print this book — $0.99"**.
3. They pay (Stripe) → unlock the **full print-ready PDF** to download/print themselves.

### Pricing reality check
- $0.99 via Stripe nets ~**$0.67** after fees (~$0.32). Fine as a goodwill/viral price. Options: keep $0.99, or bundle ("$0.99 to print / $0.00 for the owner"), or a slightly higher "$2.99 high-res PDF".

### UI pieces
- "Finalize & Share" modal → link + copy button + share sheet.
- Recipient landing page: hero cover, 3-page preview, price, pay button, then download.

### Backend needs
- Host the finalized snapshot (data or pre-rendered PDF), Stripe Checkout per link, access gate after payment, PDF generation (server-side, or client-print after unlock).

---

## Recommended phasing
1. **Now:** ship the **printable book layout system (A)** — large emotional value, zero backend.
2. **Voice recording (Phase 3)** as already planned.
3. **Multiple books (Phase 4)** as planned.
4. **Then turn on a lightweight backend** for **B → C**. Suggested stack to keep it cheap/simple: a serverless setup (Cloudflare Pages Functions + KV/D1, or Supabase) + Stripe. Keeps the local-first experience as the default and adds sharing on top.

### Architecture principle
Local-first stays the core. B & C are *additive sharing layers* — a book never *requires* the cloud; the owner can always print their own copy for free, offline.
