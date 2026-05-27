/* ──────────────────────────────────────────────────────────────────
   AnchorWithin — Distribution
   ──────────────────────────────────────────────────────────────────

   The orchestrator for lead-magnet exposure surfaces. Reads body
   data-attributes and conditionally injects/activates each surface.

   Pages opt in via the body element:
     <body data-aw-distribution="footer,exit" data-aw-magnet="resonance-pack">

   Supported placements (comma-separated):
     footer  — passive embed prepended to page footer
     exit    — exit-intent modal (DESKTOP-ONLY, frequency-capped)
     inline  — reserved; pages place inline blocks manually for now

   Frequency caps (silent-fail with try/catch around all storage access):
     footer            no cap — always shown
     exit modal        1× per session; 30-day suppression if dismissed;
                       permanent suppression if submitted

   Aggression hierarchy (per the 5.3 spec):
     footer  LOW       always-on passive collection
     inline  MEDIUM    between resonant sections (manual placement only)
     exit    HIGH      desktop only, frequency-capped, dismissable

   Mobile UX:
     • Exit-intent never binds on touch / coarse-pointer devices.
     • Footer band is visually compact and works at 320px viewports.

   Requires aw-email-capture.js (loaded as a sibling defer-script);
   binds injected forms via window.AW.bindEmailForm exposed there.
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var AW_DISTRIBUTION_VERSION = '5.3.0';

  // Storage keys — namespaced to avoid collision with attribution from 5.1
  var KEY_EXIT_SESSION   = 'aw_exit_shown_session';
  var KEY_EXIT_DISMISSED = 'aw_exit_dismissed_ts';
  var KEY_EXIT_SUBMITTED = 'aw_exit_submitted';
  var EXIT_SUPPRESS_DAYS = 30;

  /* ═══════════════════════════════════════════════════════════════════
     SAFE STORAGE — same pattern as analytics.js
     ═══════════════════════════════════════════════════════════════════ */
  function safeLocal() {
    try {
      if (typeof window.localStorage === 'undefined') return null;
      window.localStorage.setItem('__aw_probe', '1');
      window.localStorage.removeItem('__aw_probe');
      return window.localStorage;
    } catch (e) { return null; }
  }
  function safeSession() {
    try {
      if (typeof window.sessionStorage === 'undefined') return null;
      window.sessionStorage.setItem('__aw_probe', '1');
      window.sessionStorage.removeItem('__aw_probe');
      return window.sessionStorage;
    } catch (e) { return null; }
  }
  function readKey(store, key) {
    if (!store) return null;
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function writeKey(store, key, val) {
    if (!store) return;
    try { store.setItem(key, val); } catch (e) { /* silent */ }
  }

  /* ═══════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════ */
  function init() {
    var body = document.body;
    if (!body) return;

    var raw = body.getAttribute('data-aw-distribution') || '';
    var surfaces = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (surfaces.length === 0) return;

    var magnet = body.getAttribute('data-aw-magnet') || 'resonance-pack';

    window.__awDistribution = {
      version:   AW_DISTRIBUTION_VERSION,
      magnet:    magnet,
      surfaces:  surfaces,
      activated: []
    };

    if (surfaces.indexOf('footer') !== -1) {
      try { injectFooterBand(magnet); window.__awDistribution.activated.push('footer'); }
      catch (e) { /* silent */ }
    }
    if (surfaces.indexOf('exit') !== -1) {
      try { if (initExitIntent(magnet)) window.__awDistribution.activated.push('exit'); }
      catch (e) { /* silent */ }
    }
    // 'inline' is intentionally a no-op here — pages place inline blocks
    // manually using the .aw-email-capture component directly.
  }

  /* ═══════════════════════════════════════════════════════════════════
     FOOTER BAND — passive embed
     ═══════════════════════════════════════════════════════════════════ */
  function injectFooterBand(magnet) {
    if (document.querySelector('.aw-footer-band')) return; // idempotent

    var band = document.createElement('section');
    band.className = 'aw-footer-band';
    band.setAttribute('aria-label', 'Newsletter signup');
    band.innerHTML =
      '<div class="aw-footer-band__inner">' +
        '<div class="aw-footer-band__copy">' +
          '<p class="aw-footer-band__eyebrow">The Resonance Pack</p>' +
          '<p class="aw-footer-band__lede">A private rotation of frequency audio for your nervous system. Reserve your place.</p>' +
        '</div>' +
        '<form class="aw-email-capture aw-email-capture--compact" ' +
              'data-aw-magnet="' + escapeAttr(magnet) + '" ' +
              'data-aw-placement="footer" ' +
              'data-layout="row">' +
          '<input type="email" name="email" required placeholder="you@domain.com" autocomplete="email" aria-label="Email address">' +
          '<input type="text" name="aw_hp" tabindex="-1" autocomplete="off" class="aw-honeypot" aria-hidden="true">' +
          '<button type="submit" class="aw-email-capture__submit">Reserve</button>' +
          '<p class="aw-email-capture__msg" role="status" aria-live="polite"></p>' +
        '</form>' +
      '</div>';

    // Insert before the page's existing <footer> if present; otherwise
    // append to <body> so it lives at the bottom of the document.
    var existingFooter = document.querySelector('footer');
    if (existingFooter && existingFooter.parentNode) {
      existingFooter.parentNode.insertBefore(band, existingFooter);
    } else {
      document.body.appendChild(band);
    }

    bindIfReady(band.querySelector('form'));
  }

  /* ═══════════════════════════════════════════════════════════════════
     EXIT INTENT — desktop-only, frequency-capped modal
     ═══════════════════════════════════════════════════════════════════ */
  function initExitIntent(magnet) {
    // Desktop check — exit-intent on touch makes no sense (no cursor leave)
    var isDesktop = false;
    try {
      isDesktop = window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        window.innerWidth >= 768;
    } catch (e) { isDesktop = false; }
    if (!isDesktop) return false;

    if (!shouldShowExit()) return false;

    // Build modal but keep it hidden until the trigger fires
    var modal = buildExitModal(magnet);
    document.body.appendChild(modal);
    bindIfReady(modal.querySelector('form'));

    // Mouseout trigger — fires when cursor leaves through the top
    // (toward URL bar or tab close). We require clientY < 0 to avoid
    // false-positives from moving to the dock or other windows.
    function onMouseOut(e) {
      try {
        if (e.clientY < 0 && !e.relatedTarget && !e.toElement) {
          showExit(modal);
          document.removeEventListener('mouseout', onMouseOut);
        }
      } catch (err) { /* silent */ }
    }
    document.addEventListener('mouseout', onMouseOut);
    return true;
  }

  function shouldShowExit() {
    var sess = safeSession();
    var local = safeLocal();
    if (readKey(sess, KEY_EXIT_SESSION)) return false;
    if (readKey(local, KEY_EXIT_SUBMITTED)) return false;
    var dismissTs = parseInt(readKey(local, KEY_EXIT_DISMISSED) || '0', 10);
    if (dismissTs && (Date.now() - dismissTs) < (EXIT_SUPPRESS_DAYS * 86400000)) return false;
    return true;
  }

  function buildExitModal(magnet) {
    var wrap = document.createElement('div');
    wrap.className = 'aw-exit-modal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'aw-exit-title');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="aw-exit-modal__overlay" data-aw-exit-dismiss></div>' +
      '<div class="aw-exit-modal__card">' +
        '<button type="button" class="aw-exit-modal__close" data-aw-exit-dismiss aria-label="Close">' +
          '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<p class="aw-exit-modal__eyebrow">Before you leave</p>' +
        '<h2 id="aw-exit-title" class="aw-exit-modal__title">The Resonance Pack opens soon.</h2>' +
        '<p class="aw-exit-modal__lede">Reserve your place. Five frequencies tuned for your nervous system. Quiet delivery, no marketing.</p>' +
        '<form class="aw-email-capture" ' +
              'data-aw-magnet="' + escapeAttr(magnet) + '" ' +
              'data-aw-placement="exit">' +
          '<input type="email" name="email" required placeholder="you@domain.com" autocomplete="email" aria-label="Email address">' +
          '<input type="text" name="aw_hp" tabindex="-1" autocomplete="off" class="aw-honeypot" aria-hidden="true">' +
          '<button type="submit" class="aw-email-capture__submit">Reserve your place</button>' +
          '<p class="aw-email-capture__msg" role="status" aria-live="polite"></p>' +
        '</form>' +
      '</div>';

    // Dismiss handlers — overlay click, close button, Escape key
    var dismissers = wrap.querySelectorAll('[data-aw-exit-dismiss]');
    Array.prototype.forEach.call(dismissers, function (el) {
      el.addEventListener('click', function () { hideExit(wrap, /* submitted */ false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('is-shown')) {
        hideExit(wrap, false);
      }
    });

    // If the form succeeds, mark as submitted and hide
    var form = wrap.querySelector('form');
    form.addEventListener('submit', function () {
      // The aw-email-capture handler already runs; we just observe success
      // by polling the is-success class briefly
      setTimeout(function () {
        if (form.classList.contains('is-success')) {
          var local = safeLocal();
          writeKey(local, KEY_EXIT_SUBMITTED, String(Date.now()));
          setTimeout(function () { hideExit(wrap, /* submitted */ true); }, 1800);
        }
      }, 100);
    });
    return wrap;
  }

  function showExit(modal) {
    modal.classList.add('is-shown');
    modal.setAttribute('aria-hidden', 'false');
    var sess = safeSession();
    writeKey(sess, KEY_EXIT_SESSION, '1');
    // Fire view event so we can compute exit-modal trigger rate
    try {
      if (window.aw_track) {
        window.aw_track('lead', 'exit_modal_shown', modal.querySelector('form').getAttribute('data-aw-magnet'), {
          page: (window.location && window.location.pathname) || ''
        });
      }
    } catch (e) { /* silent */ }
  }

  function hideExit(modal, submitted) {
    modal.classList.remove('is-shown');
    modal.setAttribute('aria-hidden', 'true');
    if (!submitted) {
      // Track explicit dismissal so we can see dismiss-vs-submit ratios
      var local = safeLocal();
      writeKey(local, KEY_EXIT_DISMISSED, String(Date.now()));
      try {
        if (window.aw_track) {
          var f = modal.querySelector('form');
          window.aw_track('lead', 'cta_dismissed', f && f.getAttribute('data-aw-magnet'), {
            placement: 'exit',
            page: (window.location && window.location.pathname) || ''
          });
        }
      } catch (e) { /* silent */ }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     UTIL
     ═══════════════════════════════════════════════════════════════════ */
  function bindIfReady(form) {
    if (!form) return;
    if (window.AW && typeof window.AW.bindEmailForm === 'function') {
      window.AW.bindEmailForm(form);
    } else {
      // aw-email-capture.js hasn't loaded yet; defer briefly
      setTimeout(function () { bindIfReady(form); }, 50);
    }
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
