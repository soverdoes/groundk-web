/* FILE: assets/js/i18n.js
   ──────────────────────────────────────────────
   Language Toggle: KR ↔ EN URL routing
   Works with folder/index.html static routing.
   ────────────────────────────────────────────── */

(function () {
  'use strict';

  var EN_PREFIX = '/en';

  /**
   * Determine if the current page is EN version.
   * @returns {boolean}
   */
  function isEnglish() {
    return window.location.pathname.startsWith(EN_PREFIX + '/') ||
           window.location.pathname === EN_PREFIX;
  }

  /**
   * Convert a KR path → EN path or vice versa.
   * KR: /services/vip-protocol-chauffeur/
   * EN: /en/services/vip-protocol-chauffeur/
   *
   * @param {string} currentPath
   * @param {'kr'|'en'} targetLang
   * @returns {string}
   */
  function buildLangPath(currentPath, targetLang) {
    // Strip EN prefix if present
    var basePath = currentPath;
    if (basePath.startsWith(EN_PREFIX + '/')) {
      basePath = basePath.slice(EN_PREFIX.length);
    } else if (basePath === EN_PREFIX) {
      basePath = '/';
    }

    // Ensure trailing slash for folder/index routing
    if (basePath !== '/' && !basePath.endsWith('/')) {
      basePath += '/';
    }

    if (targetLang === 'en') {
      return EN_PREFIX + basePath;
    }
    return basePath; // KR — no prefix
  }

  /**
   * EN has a smaller page set. Map KR-only pages to EN fallback.
   */
  var EN_AVAILABLE = [
    '/',
    '/pco-mice/',
    '/services/',
    '/services/mega-event-transportation/',
    '/services/vip-protocol-chauffeur/',
    '/services/shuttle-operation/',
    '/operations/',
    '/case-studies/',
    '/ir/',
    '/rfp/'
  ];

  function hasEnVersion(basePath) {
    return EN_AVAILABLE.indexOf(basePath) !== -1;
  }

  /**
   * Initialize language toggle links.
   * Finds all .lang-btn elements and sets correct href.
   */
  function initLangToggle() {
    var currentPath = window.location.pathname;
    var currentIsEn = isEnglish();

    // Derive the base path (KR equivalent)
    var basePath = currentPath;
    if (currentIsEn) {
      if (basePath.startsWith(EN_PREFIX + '/')) {
        basePath = basePath.slice(EN_PREFIX.length);
      } else if (basePath === EN_PREFIX) {
        basePath = '/';
      }
    }
    if (basePath !== '/' && !basePath.endsWith('/')) {
      basePath += '/';
    }

    // Update all lang toggle links on the page
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var lang = btn.getAttribute('lang');

      if (lang === 'ko') {
        btn.href = buildLangPath(currentPath, 'kr');
        if (!currentIsEn) {
          btn.classList.add('active');
          btn.setAttribute('aria-current', 'true');
        } else {
          btn.classList.remove('active');
          btn.removeAttribute('aria-current');
        }
      } else if (lang === 'en') {
        // If no EN version, link to EN home
        if (hasEnVersion(basePath)) {
          btn.href = buildLangPath(basePath, 'en');
        } else {
          btn.href = EN_PREFIX + '/';
        }

        if (currentIsEn) {
          btn.classList.add('active');
          btn.setAttribute('aria-current', 'true');
        } else {
          btn.classList.remove('active');
          btn.removeAttribute('aria-current');
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangToggle);
  } else {
    initLangToggle();
  }

  // Expose for external use
  window.GroundKi18n = {
    isEnglish: isEnglish,
    buildLangPath: buildLangPath,
    hasEnVersion: hasEnVersion
  };

})();
