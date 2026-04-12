// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — Premium JS Enhancements
//  • Navbar scroll shrink
//  • AOS re-trigger after dynamic content loads
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Navbar scroll shrink ──────────────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 30) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  // ── Re-init AOS after dynamic product cards load ──────
  // filter.js fires a custom event when products are rendered
  document.addEventListener('productsRendered', () => {
    if (window.AOS) AOS.refresh();
  });

})();
