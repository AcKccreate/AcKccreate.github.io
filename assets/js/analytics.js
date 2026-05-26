/* ──────────────────────────────────────────────────────────────────
   AnchorWithin — Analytics
   ──────────────────────────────────────────────────────────────────

   Privacy-first event tracking via Plausible. Single shared module
   loaded by every page in the property.

   What this gives you for free (no per-page wiring):
     • Automatic pageview tracking (via Plausible's standard script)
     • Automatic outbound stripe.com click tracking on every page
       (event delegation — no inline onclick rewrites required)
     • Lightweight first-visit attribution context (localStorage),
       passed alongside Stripe click events

   What pages can call directly:
     aw_track(category, action, label, props)
       category — high-level bucket (e.g. 'commerce', 'breathe', 'memorial')
       action   — Plausible event name (lowercase snake_case)
       label    — optional human-readable identifier
       props    — optional bag of extra properties (object)

   Per-page usage:
     <script src="/assets/js/analytics.js" defer></script>

   Privacy posture:
     • Plausible is cookie-free and GDPR/CCPA-compliant by default.
     • localStorage holds only first-visit context (path, referrer
       domain, UTM tags) — no personal identifiers, no fingerprinting,
       no cross-site tracking, no IPs.
     • Wrapped in try/catch so private-browsing modes that block
       localStorage don't break the page.

   Failure modes (all silent — analytics must never break the page):
     • Plausible CDN blocked by ad-blocker  → queue-stub absorbs calls
     • Domain not yet registered in account → events silently dropped
       server-side; no client-side errors
     • localStorage unavailable             → attribution is null,
       Stripe clicks still tracked without source context
     • Any caller passes garbage props      → wrapped in String()

   Switching providers later:
     Change PLAUSIBLE_DOMAIN + script src + the body of aw_track().
     Pages never need to be touched.
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     CONFIG — TODO: confirm this matches the domain registered in your
     Plausible account before the wedge starts collecting data.
     Default value below assumes the canonical GitHub Pages domain.
     If you've added a custom domain (e.g. anchorwithin.com) to your
     Plausible site, change this single string.
     ═══════════════════════════════════════════════════════════════════ */
  var PLAUSIBLE_DOMAIN = 'ackccreate.github.io'; // ← confirm or edit

  var STORAGE_KEY = 'aw_attribution';

  /* ═══════════════════════════════════════════════════════════════════
     PLAUSIBLE LOADER
     Inject the script once. If it fails to load (ad blocker, offline,
     CSP), the queue-stub below absorbs subsequent calls without error.
     ═══════════════════════════════════════════════════════════════════ */
  try {
    if (!document.querySelector('script[src*="plausible.io/js/script"]')) {
      var ps = document.createElement('script');
      ps.defer = true;
      ps.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
      ps.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(ps);
    }
  } catch (e) { /* silent — script injection should never throw, but be safe */ }

  // Queue-stub — buffers calls made before Plausible loads (or holds
  // them indefinitely if Plausible is blocked entirely).
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };

  /* ═══════════════════════════════════════════════════════════════════
     ATTRIBUTION CONTEXT (localStorage)
     Captured ONCE on first visit; refreshed only when a new UTM source
     arrives in the URL. Persisted across sessions. Never sent anywhere
     except as event props attached to Stripe click events.
     ═══════════════════════════════════════════════════════════════════ */
  function safeStorage() {
    try {
      if (typeof window.localStorage === 'undefined') return null;
      // Probe: Safari private mode allows window.localStorage to exist
      // but throws on setItem. Detect that here.
      window.localStorage.setItem('__aw_probe', '1');
      window.localStorage.removeItem('__aw_probe');
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function readAttribution() {
    var s = safeStorage();
    if (!s) return null;
    try {
      var raw = s.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeAttribution(obj) {
    var s = safeStorage();
    if (!s) return;
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) { /* silent */ }
  }

  function getReferrerDomain() {
    try {
      if (!document.referrer) return null;
      var u = new URL(document.referrer);
      if (u.hostname && u.hostname !== window.location.hostname) return u.hostname;
      return null;
    } catch (e) {
      return null;
    }
  }

  function getUtmParam(name) {
    try {
      var p = new URLSearchParams(window.location.search);
      var v = p.get(name);
      return v ? String(v).slice(0, 100) : null; // length cap for safety
    } catch (e) {
      return null;
    }
  }

  // Initialize OR refresh attribution
  var attribution = readAttribution();
  if (!attribution) {
    attribution = {
      first_visit_ts:   Date.now(),
      landing_path:     window.location.pathname || null,
      referrer_domain:  getReferrerDomain(),
      utm_source:       getUtmParam('utm_source'),
      utm_medium:       getUtmParam('utm_medium'),
      utm_campaign:     getUtmParam('utm_campaign')
    };
    writeAttribution(attribution);
  } else {
    // Returning visitor — refresh UTM if a new tagged source is in the URL,
    // so the most recent campaign always wins for attribution-on-click.
    var freshSource = getUtmParam('utm_source');
    if (freshSource && freshSource !== attribution.utm_source) {
      attribution.utm_source   = freshSource;
      attribution.utm_medium   = getUtmParam('utm_medium');
      attribution.utm_campaign = getUtmParam('utm_campaign');
      writeAttribution(attribution);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     CANONICAL EVENT API
     ═══════════════════════════════════════════════════════════════════ */
  window.aw_track = function (category, action, label, props) {
    try {
      var eventName = String(action || 'event');
      var payload = { category: String(category || 'unknown') };

      if (label !== undefined && label !== null) {
        payload.label = String(label);
      }
      if (props && typeof props === 'object') {
        for (var k in props) {
          if (Object.prototype.hasOwnProperty.call(props, k)) {
            payload[k] = String(props[k]);
          }
        }
      }
      window.plausible(eventName, { props: payload });
    } catch (e) {
      // Silent — never break the page on an analytics failure
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     AUTO-INSTRUMENTATION — outbound Stripe clicks
     Delegated listener on document. Catches clicks bubbling up from any
     <a href*="stripe.com"> regardless of where it appears in the DOM.
     Pages do not need to add inline onclick handlers.
     ═══════════════════════════════════════════════════════════════════ */
  function findStripeAnchor(target) {
    var node = target;
    while (node && node !== document && node.nodeType === 1) {
      if (node.tagName === 'A' && node.href && node.href.indexOf('stripe.com') !== -1) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    try {
      var a = findStripeAnchor(e.target);
      if (!a) return;
      var props = {
        href: a.href,
        page: window.location.pathname || ''
      };
      if (attribution) {
        if (attribution.utm_source)      props.utm_source = attribution.utm_source;
        if (attribution.utm_medium)      props.utm_medium = attribution.utm_medium;
        if (attribution.utm_campaign)    props.utm_campaign = attribution.utm_campaign;
        if (attribution.landing_path)    props.landing = attribution.landing_path;
        if (attribution.referrer_domain) props.referrer = attribution.referrer_domain;
      }
      window.aw_track('commerce', 'stripe_click', a.href, props);
    } catch (err) { /* silent */ }
  }, /* useCapture */ false);

})();
