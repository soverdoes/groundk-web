/* FILE: assets/js/main.js
   ──────────────────────────────────────────────
   Global: Mobile nav toggle · Header scroll ·
   Mobile sub-menu accordion · Mobile bottom CTA
   ────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ============================================
     1. MOBILE NAV TOGGLE
     ============================================ */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      const isOpen = mobileNav.getAttribute('aria-hidden') === 'false';

      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.getAttribute('aria-hidden') === 'false') {
        closeMobileNav();
        mobileToggle.focus();
      }
    });

    // Close when clicking a nav link
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileNav();
      });
    });
  }

  function openMobileNav() {
    if (!mobileNav || !mobileToggle) return;
    mobileNav.setAttribute('aria-hidden', 'false');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.setAttribute('aria-label', '메뉴 닫기');
    document.body.style.overflow = 'hidden';

    // Animate hamburger → X
    const lines = mobileToggle.querySelectorAll('.hamburger-line');
    if (lines.length === 3) {
      lines[0].style.transform = 'translateY(7px) rotate(45deg)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    }
  }

  function closeMobileNav() {
    if (!mobileNav || !mobileToggle) return;
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', '메뉴 열기');
    document.body.style.overflow = '';

    const lines = mobileToggle.querySelectorAll('.hamburger-line');
    if (lines.length === 3) {
      lines[0].style.transform = '';
      lines[1].style.opacity = '';
      lines[2].style.transform = '';
    }
  }


  /* ============================================
     2. MOBILE SUB-MENU ACCORDION
     ============================================ */
  document.querySelectorAll('.mobile-sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all other sub-menus first
      document.querySelectorAll('.mobile-sub-toggle').forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
        }
      });
      btn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    });
  });


  /* ============================================
     3. HEADER SCROLL BEHAVIOR
     - Adds .scrolled class when scrolled past threshold
     - Optional: hide on scroll down, show on scroll up
     ============================================ */
  const header = document.querySelector('.site-header');

  if (header) {
    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
      var scrollY = window.scrollY;

      // Add/remove .scrolled class
      if (scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }


  /* ============================================
     4. MOBILE BOTTOM CTA — show/hide on scroll
     Show when user scrolls past hero, hide at footer
     ============================================ */
  var bottomCta = document.querySelector('.mobile-bottom-cta');

  if (bottomCta) {
    var ctaTicking = false;

    function updateBottomCta() {
      var scrollY = window.scrollY;
      var docHeight = document.documentElement.scrollHeight;
      var winHeight = window.innerHeight;

      // Show after scrolling 300px, hide near bottom (last 200px)
      if (scrollY > 300 && scrollY < docHeight - winHeight - 200) {
        bottomCta.classList.add('is-visible');
      } else {
        bottomCta.classList.remove('is-visible');
      }
      ctaTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ctaTicking) {
        window.requestAnimationFrame(updateBottomCta);
        ctaTicking = true;
      }
    }, { passive: true });
  }


  /* ============================================
     5. DESKTOP DROPDOWN — keyboard support
     ============================================ */
  document.querySelectorAll('.gnb-item.has-sub > a').forEach(function (trigger) {
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var sub = trigger.nextElementSibling;
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

        if (!isOpen && sub) {
          var firstLink = sub.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      }
    });
  });


  /* ============================================
     6. CASE STUDIES FILTER (if present)
     ============================================ */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var caseCards = document.querySelectorAll('.case-card[data-category]');

  if (filterBtns.length && caseCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        // Update active state
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Filter cards
        caseCards.forEach(function (card) {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

})();
