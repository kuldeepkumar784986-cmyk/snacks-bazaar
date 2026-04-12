// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — Premium JS Enhancements
//  • Hamburger mobile menu toggle
//  • Navbar scroll shrink
//  • Close menu on outside tap / link click
//  • AOS re-trigger after dynamic content loads
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  const nav = document.querySelector('.nav');

  // ── Hamburger mobile menu toggle ──────────────────────
  const hamburger = document.querySelector('.hamburger');
  if (hamburger && nav) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('nav--mobile-open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.textContent = isOpen ? '✕' : '☰';
    });

    // Close when any nav link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--mobile-open');
        hamburger.textContent = '☰';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('nav--mobile-open') && !nav.contains(e.target)) {
        nav.classList.remove('nav--mobile-open');
        hamburger.textContent = '☰';
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Navbar scroll shrink ──────────────────────────────
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Re-init AOS after dynamic product cards load ──────
  document.addEventListener('productsRendered', () => {
    if (window.AOS) AOS.refresh();
  });

  // ── Bottom nav: mark active page ─────────────────────
  const path = window.location.pathname;
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (
      (path === '/' || path.includes('index')) && href.includes('index') ||
      path.includes('shop') && href.includes('shop') ||
      path.includes('account') && href.includes('account')
    ) {
      item.classList.add('active');
    }
  });

})();
