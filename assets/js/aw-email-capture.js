/* ──────────────────────────────────────────────────────────────────
   AnchorWithin — Email Capture
   ──────────────────────────────────────────────────────────────────

   Shared, provider-abstracted email-capture handler. Attaches to every
   <form class="aw-email-capture"> on the page. Pages don't need to wire
   up handlers — drop the markup in, this module finds and binds it.

   Per-page usage:
     <link rel="stylesheet" href="/assets/css/aw-email-capture.css">
     <script src="/assets/js/aw-email-capture.js" defer></script>

     <form class="aw-email-capture" data-aw-magnet="resonance-pack">
       <input type="email" name="email" required autocomplete="email"
              placeholder="you@domain.com" aria-label="Email address">
       <input type="text"  name="aw_hp" tabindex="-1" autocomplete="off"
              class="aw-honeypot" aria-hidden="true">
       <button type="submit" class="aw-email-capture__submit">Reserve</button>
       <p class="aw-email-capture__msg" role="status" aria-live="polite"></p>
     </form>

   Provider abstraction:
     Default backend is Buttondown (indie, on-brand, simple HTML embed).
     To swap providers, set window.AW_EMAIL_CONFIG before this script
     loads, or edit PROVIDER / ENDPOINT constants below. Provider-specific
     payload shapes live in PROVIDERS at the bottom of this file —
     adding a new one is a single function.

   Submit behavior:
     1. preventDefault on form submit
     2. honeypot check — bots auto-fill all fields; real users leave blank
     3. local email validation (light — provider does final word)
     4. fire-and-forget POST in no-cors mode (avoids CORS noise; we can't
        read the response anyway, so UI is optimistic)
     5. Plausible event lead:email_submit fires regardless of network
        outcome — we capture intent, not just success
     6. show success state, lock inputs, prevent double-submit

   Failure modes (all silent — analytics must never break the page):
     • Network offline / fetch throws        → caught, UI still positive
     • Provider 4xx/5xx                       → undetectable via no-cors;
                                               optimistic UI is the choice
     • Honeypot tripped (bot)                 → silent reject, fake success
     • Malformed email                        → inline error, no submit
     • Plausible blocked                      → aw_track is a queue-stub
     • aw_track undefined                     → optional chain, no throw
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var AW_EMAIL_CAPTURE_VERSION = '5.2.0';

  /* ═══════════════════════════════════════════════════════════════════
     CONFIG — provider + endpoint
     Override at runtime by setting window.AW_EMAIL_CONFIG BEFORE this
     script loads, e.g.:
       <script>window.AW_EMAIL_CONFIG = {
         provider: 'buttondown',
         endpoint: 'https://buttondown.email/api/emails/embed-subscribe/anchorwithin'
       };</script>
       <script src="/assets/js/aw-email-capture.js" defer></script>
     ═══════════════════════════════════════════════════════════════════ */
  var cfg = (window.AW_EMAIL_CONFIG && typeof window.AW_EMAIL_CONFIG === 'object')
    ? window.AW_EMAIL_CONFIG : {};

  // TODO: replace REPLACE_WITH_YOUR_BUTTONDOWN_USERNAME after creating your
  // Buttondown account at https://buttondown.email. Or override via
  // AW_EMAIL_CONFIG above without editing this file.
  var PROVIDER = cfg.provider || 'buttondown';
  var ENDPOINT = cfg.endpoint ||
    'https://buttondown.email/api/emails/embed-subscribe/REPLACE_WITH_YOUR_BUTTONDOWN_USERNAME';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Expose version for debugging (mirrors analytics.js pattern)
  window.__awEmailCapture = {
    version: AW_EMAIL_CAPTURE_VERSION,
    provider: PROVIDER,
    endpointConfigured: ENDPOINT.indexOf('REPLACE_WITH_') === -1
  };

  /* ═══════════════════════════════════════════════════════════════════
     PROVIDER PAYLOAD BUILDERS
     Each function returns a URL-encoded string for POST body.
     ═══════════════════════════════════════════════════════════════════ */
  var PROVIDERS = {
    buttondown: function (email, magnet) {
      var p = new URLSearchParams();
      p.set('email', email);
      if (magnet) p.set('tag', magnet);
      return p.toString();
    },
    convertkit: function (email, magnet) {
      var p = new URLSearchParams();
      p.set('email_address', email);
      if (magnet) p.set('fields[magnet]', magnet);
      return p.toString();
    },
    emailoctopus: function (email, magnet) {
      var p = new URLSearchParams();
      p.set('field_0', email);
      if (magnet) p.set('field_magnet', magnet);
      return p.toString();
    },
    mailerlite: function (email, magnet) {
      var p = new URLSearchParams();
      p.set('fields[email]', email);
      if (magnet) p.set('fields[magnet]', magnet);
      return p.toString();
    }
  };

  function buildPayload(email, magnet) {
    var builder = PROVIDERS[PROVIDER] || PROVIDERS.buttondown;
    return builder(email, magnet);
  }

  /* ═══════════════════════════════════════════════════════════════════
     SUBMIT HANDLER
     ═══════════════════════════════════════════════════════════════════ */
  function handleSubmit(form, e) {
    try { e.preventDefault(); } catch (err) { /* nothing */ }

    var emailEl   = form.querySelector('input[type="email"]');
    var honeyEl   = form.querySelector('input[name="aw_hp"]');
    var msgEl     = form.querySelector('.aw-email-capture__msg');
    var email     = emailEl ? (emailEl.value || '').trim() : '';
    var honeypot  = honeyEl ? (honeyEl.value || '').trim() : '';
    var magnet    = form.getAttribute('data-aw-magnet') || 'unknown';

    // Honeypot: bots auto-fill all fields — real users leave blank.
    // Silent fake-success: bot thinks it worked, we never fire the POST.
    if (honeypot) {
      showSuccess(form, msgEl);
      return;
    }

    if (!EMAIL_RE.test(email)) {
      showError(msgEl, "That doesn't look like a valid email.");
      return;
    }

    setLoading(form, true);

    // Fire-and-forget POST. no-cors avoids CORS preflight noise but means
    // we can't read the response — optimistic UI is the design choice here.
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildPayload(email, magnet)
      }).catch(function () { /* silent */ });
    } catch (err) { /* silent — fetch might not exist in ancient browsers */ }

    // Plausible event — captures intent regardless of network outcome.
    // placement + page props let us measure which surface / page converts.
    try {
      if (window.aw_track) {
        var placement = form.getAttribute('data-aw-placement') || 'inline';
        window.aw_track('lead', 'email_submit', magnet, {
          provider:  PROVIDER,
          placement: placement,
          page:      (window.location && window.location.pathname) || ''
        });
      }
    } catch (err) { /* silent */ }

    setLoading(form, false);
    showSuccess(form, msgEl);
  }

  /* ═══════════════════════════════════════════════════════════════════
     UI STATE HELPERS
     ═══════════════════════════════════════════════════════════════════ */
  function setLoading(form, isLoading) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = !!isLoading;
    form.classList.toggle('is-loading', !!isLoading);
  }

  function showSuccess(form, msgEl) {
    form.classList.add('is-success');
    if (msgEl) {
      msgEl.textContent = 'Got it. Watch your inbox — a note is on the way.';
      msgEl.setAttribute('data-state', 'success');
    }
    // Lock all inputs to prevent double-submits
    var inputs = form.querySelectorAll('input, button');
    Array.prototype.forEach.call(inputs, function (el) { el.disabled = true; });
  }

  function showError(msgEl, text) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.setAttribute('data-state', 'error');
  }

  /* ═══════════════════════════════════════════════════════════════════
     BOOT — attach to every form on the page
     ═══════════════════════════════════════════════════════════════════ */
  function attach(form) {
    if (form.__aw_email_bound) return;
    form.__aw_email_bound = true;
    form.addEventListener('submit', function (e) { handleSubmit(form, e); });
    // Live-clear the error state on input
    var emailEl = form.querySelector('input[type="email"]');
    if (emailEl) {
      emailEl.addEventListener('input', function () {
        var msgEl = form.querySelector('.aw-email-capture__msg');
        if (msgEl && msgEl.getAttribute('data-state') === 'error') {
          msgEl.textContent = '';
          msgEl.removeAttribute('data-state');
        }
      });
    }
  }

  function init() {
    try {
      var forms = document.querySelectorAll('form.aw-email-capture');
      Array.prototype.forEach.call(forms, attach);
    } catch (err) { /* silent */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API for aw-distribution.js — lets the distribution orchestrator
  // bind forms that it injects AFTER the initial DOMContentLoaded scan.
  window.AW = window.AW || {};
  window.AW.bindEmailForm = attach;
})();
