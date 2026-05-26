/* ──────────────────────────────────────────────────────────────────
   AnchorWithin — Exit-Intent Popup
   ──────────────────────────────────────────────────────────────────
   Soul-side exit-intent module. Pairs with
   /assets/css/exit-popup.css and the design tokens in
   /assets/css/tokens.css.

   Per-page enable (recommended pattern):
     <link rel="stylesheet" href="/assets/css/tokens.css">
     <link rel="stylesheet" href="/assets/css/exit-popup.css">
     <script src="/assets/js/exit-popup.js" defer></script>

   Per-page disable:
     • Don't include the <script> tag, OR
     • Set window.AW_EXIT_POPUP = { enabled: false } before the
       script tag loads (useful if you ship the script globally
       and want to opt out on specific pages).

   Per-page customization (optional, set BEFORE the script loads):
     <script>
       window.AW_EXIT_POPUP = {
         code:    'CUSTOM10',
         ctaHref: 'https://ackccreate.github.io/echowalk/',
         headline:'Wait — your first walk is on us'
       };
     </script>

   Trigger logic (preserved from original inline implementation):
     • Mobile (Mobi/Android UA): show after 45s if not already shown
     • Desktop: show on mouseleave with clientY <= 10 (cursor exits
       the top edge of the viewport)
     • Once shown OR dismissed, sessionStorage.aw_exit_shown blocks
       further appearances in the same browsing session
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var cfg = Object.assign({
    enabled:       true,
    storageKey:    'aw_exit_shown',
    mobileDelayMs: 45000,
    badge:         'EXCLUSIVE OFFER',
    headline:      'Wait — 25% off your first purchase',
    preLine:       'Use code at checkout:',
    code:          'R2vTLvFP',
    ctaText:       'Browse Products',
    ctaHref:       'https://ackccreate.github.io/anchorwithin-home/',
    noteLine:      'One-time use · All products'
  }, window.AW_EXIT_POPUP || {});

  if (cfg.enabled === false) return;
  if (sessionStorage.getItem(cfg.storageKey)) return;

  function markShown() {
    try { sessionStorage.setItem(cfg.storageKey, '1'); } catch (e) {}
  }

  function dismiss(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    markShown();
  }

  function build() {
    var overlay = document.createElement('div');
    overlay.id = 'aw-exit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'aw-exit-headline');

    var box = document.createElement('div');
    box.id = 'aw-exit-box';

    var close = document.createElement('button');
    close.id = 'aw-exit-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×'; // ×
    close.addEventListener('click', function () { dismiss(overlay); });

    var badge = document.createElement('div');
    badge.id = 'aw-exit-badge';
    badge.textContent = cfg.badge;

    var headline = document.createElement('h2');
    headline.id = 'aw-exit-headline';
    headline.textContent = cfg.headline;

    var pre = document.createElement('p');
    pre.textContent = cfg.preLine;

    var code = document.createElement('div');
    code.id = 'aw-exit-code';
    code.textContent = cfg.code;

    var cta = document.createElement('a');
    cta.id = 'aw-exit-cta';
    cta.href = cfg.ctaHref;
    cta.textContent = cfg.ctaText;
    cta.addEventListener('click', markShown);

    var note = document.createElement('p');
    note.id = 'aw-exit-note';
    note.textContent = cfg.noteLine;

    box.appendChild(close);
    box.appendChild(badge);
    box.appendChild(headline);
    box.appendChild(pre);
    box.appendChild(code);
    box.appendChild(cta);
    box.appendChild(note);
    overlay.appendChild(box);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss(overlay);
    });

    function escHandler(e) {
      if (e.key === 'Escape') {
        dismiss(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    }
    document.addEventListener('keydown', escHandler);

    return overlay;
  }

  function show() {
    if (sessionStorage.getItem(cfg.storageKey)) return;
    var overlay = build();
    document.body.appendChild(overlay);
    var closeBtn = overlay.querySelector('#aw-exit-close');
    if (closeBtn) closeBtn.focus();
    markShown();
  }

  var isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile) {
    setTimeout(function () {
      if (!sessionStorage.getItem(cfg.storageKey)) show();
    }, cfg.mobileDelayMs);
  } else {
    document.addEventListener('mouseleave', function leaveHandler(e) {
      if (e.clientY <= 10 && !sessionStorage.getItem(cfg.storageKey)) {
        show();
        document.removeEventListener('mouseleave', leaveHandler);
      }
    });
  }
})();
