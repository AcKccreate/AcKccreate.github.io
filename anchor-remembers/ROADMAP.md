# AnchorRemembers — Capabilities & Roadmap

## PART 1 — WHAT IT CAN DO TODAY (as built)

### A. The website (marketing / landing)
- Fully responsive luxury landing page (mobile stacks to one column; desktop is multi-column to match the mockup).
- Your real AR logo embedded (header, hero book, favicon, social card).
- Refined gold line-icons throughout (no emojis).
- Hero with real navy-leather book photo + two CTAs ("Begin a New Memory Book", "Continue Existing Book").
- Feature strip: Captures What Matters · Preserve Their Voice · Creates Heirlooms · Private & Secure.
- "Their voice, in their own words" story band (lifestyle photo).
- Legacy band (3 columns): How It Works (4 steps) · Your Legacy Tree (illustrated, fills with progress) · Founder Edition unlock card.
- "An Heirloom, Beautifully Made" keepsake showcase (3 product photos).
- Family call-to-action band (photo background + button).
- Botanical sprig accents echoing the logo's laurel.
- Footer: copyright, privacy note, YouTube + Store links.
- SEO/sharing: page title + description, Open Graph + Twitter cards, branded 1200×630 share image, favicon, iOS home-screen icon, theme color.

### B. The memory-book app (works fully, in the browser)
- Two capture modes: **for a loved one** or **for yourself** (questions reword automatically, e.g. "What did {name}…" vs "What did you…").
- Role picker: Father, Mother, Grandfather, Grandmother, Son, Daughter, Sibling, Spouse/Partner, Friend, Co-worker, Neighbor, Other.
- **Two question sets:** 25 universal prompts (Their Story / Voice / Heart / Wisdom / Joy / Spirit) and a deep **45-prompt Father Edition** (Beginnings, Childhood, Middle Years, Love & Family, Traditions, The Best Of, People, Wisdom, Legacy).
- Category filter pills to jump between themes.
- Answer editor with autosizing notes, saved on tap.
- **Photo uploads** per prompt (up to 12), shown as a gallery (Founder feature).
- Progress dashboard: answers, total words, photos.
- **Legacy Tree** that grows through stages (Seed → Sapling → Growing Tree → Legacy Tree) as you answer.
- **Legacy Vault** (Archive): browse every saved memory, edit any entry.
- **Export as text** and **export as JSON** (your own backup).
- **Print Keepsake**: generates a formatted, printable memory book (Founder feature).
- **Founder Edition unlock** ($5.99) via Stripe — unlocks photo uploads, Print Keepsake, and the full Father set. Returns and unlocks automatically after payment.
- **432 Hz ambient tone** toggle (Web Audio).
- **100% private:** everything is stored locally on the device. No account, no server, nothing leaves the device unless the user exports it.

### C. Hosting / deploy
- Single self-contained `index.html` + image files. No build, no dependencies.
- Static deploy on GitHub Pages; custom domain **anchorremembers.com** (DNS configured).

### D. Today's limitations (honest)
- Data lives in ONE browser on ONE device (localStorage). No cloud, no sync, no cross-device.
- Photos stored as base64 in localStorage — can hit the browser's ~5 MB limit if many/large.
- Effectively one book per device (starting fresh resets the current one).
- No audio/voice recording yet (it's named as a feature but not built).
- No real backend, accounts, or order fulfillment.
- "Preserve Their Voice" and some copy promise more than the app currently delivers.

---

## PART 2 — WHAT WE WANT IT TO BECOME

### Near-term (polish + launch)
- [ ] Go live on **anchorremembers.com** (upload files, enable Pages, confirm HTTPS).
- [ ] Color-grade the family photos toward the warm cream/gold palette.
- [ ] Optional: add the grandfather + grandson photo as a second story band.
- [ ] Decide **anchorremembers.app** use (redirect to .com, or the app subdomain).
- [ ] Add a **testimonials / "What families say"** section (social proof, like the mockup).
- [ ] Analytics (e.g., Plausible) to see traffic and conversions.
- [ ] Fix the photo-storage limit (move photos to IndexedDB, or warn on large files).

### Core product (the big leaps)
- [ ] **Voice / audio recording** — capture a loved one's actual voice per prompt, with playback ("Preserve Their Voice" for real).
- [ ] **Accounts + cloud sync + backup** — so a book is safe and available across phone, tablet, computer.
- [ ] **Multiple books** per person — manage several loved ones from one place.
- [ ] **Family collaboration** — invite siblings/relatives to add answers and photos to the same book.
- [ ] **Share a finished book** — a private link or polished PDF/web book for family.

### Premium / revenue
- [ ] **Physical printed keepsake** — order a real bound book (and the gift box from the mockups), shipped.
- [ ] **Pricing tiers** — free capture, paid digital unlock, premium physical product; revisit the $5.99 price for the luxury positioning.
- [ ] **Gifting flow** — buy a book/box as a gift for a parent or grandparent.

### Intelligence / experience
- [ ] **AI help** — suggest follow-up questions, gently polish/transcribe answers, turn voice notes into text.
- [ ] **Smart prompts** — adaptive questions based on previous answers and the person's role.
- [ ] **Reminders / nudges** — gentle prompts to add one memory a week.
- [ ] **More editions** — Mother, Grandparent, Spouse, Child, Pet, Self/Memoir, etc. (curated deep sets like the Father Edition).
- [ ] **Themes / cover designs** — let users pick journal cover styles and color themes.

### Foundation
- [ ] Accessibility pass (screen readers, contrast, keyboard).
- [ ] Performance (image lazy-loading is in; add responsive image sizes).
- [ ] Legal/trust pages (privacy, terms) wired and consistent.

> This file is a living roadmap — reorder/check items as priorities shift.
