/* FILE: assets/js/filters.js
   ──────────────────────────────────────────────
   Case Studies: fetch JSON → 4-filter → card render → modal detail
   Filters: type, scope, city, scale
   Defensive: works even if data is empty or fields are missing
   ────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ============================================
     0. EARLY EXIT — only run on case-studies page
     ============================================ */
  var grid = document.getElementById('case-grid');
  if (!grid) return;

  var lang = document.documentElement.lang === 'en' ? 'en' : 'ko';
  var cases = [];

  /* ── DOM references ── */
  var filterType  = document.getElementById('filter-type');
  var filterScope = document.getElementById('filter-scope');
  var filterCity  = document.getElementById('filter-city');
  var filterScale = document.getElementById('filter-scale');
  var resetBtn    = document.getElementById('filter-reset');
  var countEl     = document.getElementById('result-count');
  var modal       = document.getElementById('case-modal');
  var modalBody   = modal ? modal.querySelector('.case-modal-body') : null;
  var modalClose  = modal ? modal.querySelector('.case-modal-close') : null;


  /* ============================================
     1. FETCH DATA
     ============================================ */
  fetch('/assets/data/case-studies.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      cases = Array.isArray(data) ? data : [];
      render();
    })
    .catch(function (err) {
      console.warn('[GroundK Filters] Failed to load case data:', err);
      grid.innerHTML = emptyState();
    });


  /* ============================================
     2. FILTER LOGIC
     ============================================ */

  /**
   * Get currently selected filter values.
   * @returns {{ type: string, scope: string, city: string, scale: string }}
   */
  function getFilters() {
    return {
      type:  filterType  ? filterType.value  : 'all',
      scope: filterScope ? filterScope.value : 'all',
      city:  filterCity  ? filterCity.value  : 'all',
      scale: filterScale ? filterScale.value : 'all'
    };
  }

  /**
   * Filter cases by all 4 criteria (AND logic).
   * @param {Object[]} data
   * @returns {Object[]}
   */
  function filterCases(data) {
    var f = getFilters();

    return data.filter(function (c) {
      // type: string[] — match if ANY type matches
      if (f.type !== 'all') {
        var types = Array.isArray(c.type) ? c.type : [];
        if (types.indexOf(f.type) === -1) return false;
      }

      // scope: string[] — match if ANY scope matches
      if (f.scope !== 'all') {
        var scopes = Array.isArray(c.scope) ? c.scope : [];
        if (scopes.indexOf(f.scope) === -1) return false;
      }

      // city: exact string match
      if (f.city !== 'all') {
        if ((c.city || '') !== f.city) return false;
      }

      // scale: exact string match
      if (f.scale !== 'all') {
        if ((c.scale || '') !== f.scale) return false;
      }

      return true;
    });
  }


  /* ============================================
     3. RENDER CARDS
     ============================================ */

  /**
   * Main render pipeline: filter → build HTML → inject.
   */
  function render() {
    var filtered = filterCases(cases);
    updateCount(filtered.length);

    if (filtered.length === 0) {
      grid.innerHTML = emptyState();
      return;
    }

    var html = '';
    filtered.forEach(function (c) {
      html += buildCard(c);
    });
    grid.innerHTML = html;

    // Attach card click handlers for modal
    grid.querySelectorAll('.case-card[data-id]').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        openModal(id);
      });
      card.style.cursor = 'pointer';
    });
  }

  /**
   * Build a single case card HTML string.
   * @param {Object} c - case object
   * @returns {string}
   */
  function buildCard(c) {
    var title   = lang === 'en' ? (c.title_en || c.title_ko || '') : (c.title_ko || c.title_en || '');
    var summary = lang === 'en' ? (c.summary_en || c.summary_ko || '') : (c.summary_ko || c.summary_en || '');
    var period  = lang === 'en' ? (c.period_en || c.period_ko || '') : (c.period_ko || c.period_en || '');
    var photo   = c.photo || '/assets/images/case-placeholder.jpg';
    var id      = c.id || '';

    // Tag label
    var typeLabels = {
      ko: { conference: '국제행사', summit: '정상회의', sports: '스포츠', corporate: '기업행사', exhibition: '전시/박람회' },
      en: { conference: 'Conference', summit: 'Summit', sports: 'Sports', corporate: 'Corporate', exhibition: 'Exhibition' }
    };
    var typeArr = Array.isArray(c.type) ? c.type : [];
    var tagText = typeArr.map(function (t) {
      return (typeLabels[lang] || typeLabels.ko)[t] || t;
    }).join(', ');

    // Scope labels for meta
    var scopeLabels = {
      ko: { 'mega-event': '수송', vip: '의전', shuttle: '셔틀', consulting: '컨설팅' },
      en: { 'mega-event': 'Transport', vip: 'VIP Protocol', shuttle: 'Shuttle', consulting: 'Consulting' }
    };
    var scopeArr = Array.isArray(c.scope) ? c.scope : [];
    var scopeText = scopeArr.map(function (s) {
      return (scopeLabels[lang] || scopeLabels.ko)[s] || s;
    }).join(' / ');

    // Scale label
    var scaleLabels = {
      ko: { S: '소규모', M: '중규모', L: '대규모' },
      en: { S: 'Small', M: 'Medium', L: 'Large' }
    };
    var scaleText = (scaleLabels[lang] || scaleLabels.ko)[c.scale] || c.scale || '';

    var metaLabelPeriod  = lang === 'en' ? 'Period' : '기간';
    var metaLabelService = lang === 'en' ? 'Services' : '서비스';
    var metaLabelScale   = lang === 'en' ? 'Scale' : '규모';

    return '' +
      '<article class="case-card" data-id="' + escHtml(id) + '">' +
        '<div class="case-card-photo">' +
          '<img src="' + escHtml(photo) + '" alt="' + escHtml(title) + '" loading="lazy" width="480" height="300">' +
        '</div>' +
        '<div class="case-card-body">' +
          '<span class="case-tag">' + escHtml(tagText) + '</span>' +
          '<h3>' + escHtml(title) + '</h3>' +
          '<p>' + escHtml(summary) + '</p>' +
          '<dl class="case-meta">' +
            '<dt>' + metaLabelPeriod + '</dt><dd>' + escHtml(period) + '</dd>' +
            '<dt>' + metaLabelService + '</dt><dd>' + escHtml(scopeText) + '</dd>' +
            '<dt>' + metaLabelScale + '</dt><dd>' + escHtml(scaleText) + '</dd>' +
          '</dl>' +
        '</div>' +
      '</article>';
  }

  /**
   * Empty state when no results match.
   * @returns {string}
   */
  function emptyState() {
    var msg = lang === 'en'
      ? 'No case studies match the selected filters.'
      : '선택한 조건에 해당하는 사례가 없습니다.';
    return '<div class="case-empty"><p>' + escHtml(msg) + '</p></div>';
  }

  /**
   * Update result count display.
   * @param {number} count
   */
  function updateCount(count) {
    if (!countEl) return;
    if (lang === 'en') {
      countEl.textContent = count + ' case' + (count !== 1 ? 's' : '') + ' found';
    } else {
      countEl.textContent = '총 ' + count + '건';
    }
  }


  /* ============================================
     4. FILTER EVENT LISTENERS
     ============================================ */
  [filterType, filterScope, filterCity, filterScale].forEach(function (el) {
    if (el) {
      el.addEventListener('change', function () {
        render();
        updateResetVisibility();
      });
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (filterType)  filterType.value  = 'all';
      if (filterScope) filterScope.value = 'all';
      if (filterCity)  filterCity.value  = 'all';
      if (filterScale) filterScale.value = 'all';
      render();
      updateResetVisibility();
    });
  }

  /**
   * Show/hide reset button based on active filters.
   */
  function updateResetVisibility() {
    if (!resetBtn) return;
    var f = getFilters();
    var hasActive = f.type !== 'all' || f.scope !== 'all' || f.city !== 'all' || f.scale !== 'all';
    resetBtn.style.display = hasActive ? '' : 'none';
  }

  // Initial hide
  if (resetBtn) resetBtn.style.display = 'none';


  /* ============================================
     5. MODAL — Case Detail
     ============================================ */

  /**
   * Open modal with case detail (Challenge / Approach / Result).
   * @param {string} id
   */
  function openModal(id) {
    if (!modal || !modalBody) return;

    var c = null;
    for (var i = 0; i < cases.length; i++) {
      if (cases[i].id === id) { c = cases[i]; break; }
    }
    if (!c || !c.detail) return;

    var title = lang === 'en' ? (c.title_en || c.title_ko) : (c.title_ko || c.title_en);
    var d = c.detail;

    var challengeLabel = lang === 'en' ? 'Challenge' : '과제';
    var approachLabel  = lang === 'en' ? 'Approach'  : '접근 방식';
    var resultLabel    = lang === 'en' ? 'Result'    : '성과';

    var challenge = lang === 'en' ? (d.challenge_en || d.challenge_ko || '') : (d.challenge_ko || d.challenge_en || '');
    var approach  = lang === 'en' ? (d.approach_en  || d.approach_ko  || '') : (d.approach_ko  || d.approach_en  || '');
    var result    = lang === 'en' ? (d.result_en    || d.result_ko    || '') : (d.result_ko    || d.result_en    || '');

    modalBody.innerHTML = '' +
      '<h2 class="case-modal-title">' + escHtml(title) + '</h2>' +
      '<div class="case-modal-section">' +
        '<h3>' + challengeLabel + '</h3>' +
        '<p>' + escHtml(challenge) + '</p>' +
      '</div>' +
      '<div class="case-modal-section">' +
        '<h3>' + approachLabel + '</h3>' +
        '<p>' + escHtml(approach) + '</p>' +
      '</div>' +
      '<div class="case-modal-section">' +
        '<h3>' + resultLabel + '</h3>' +
        '<p>' + escHtml(result) + '</p>' +
      '</div>';

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Focus trap
    if (modalClose) modalClose.focus();
  }

  /**
   * Close the modal.
   */
  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    // Close on backdrop click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }


  /* ============================================
     6. UTILITIES
     ============================================ */

  /**
   * Escape HTML to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }


  /* ============================================
     7. EXPOSE for external use / testing
     ============================================ */
  window.GroundKCases = {
    render: render,
    filterCases: filterCases,
    openModal: openModal,
    closeModal: closeModal
  };

})();
