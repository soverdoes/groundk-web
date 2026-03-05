/* FILE: assets/js/form.js
   ──────────────────────────────────────────────
   RFP 3-Step Form:
   · Step navigation (Next / Prev)
   · Per-step validation with error messages (aria-live)
   · "일정 미정" checkbox → disable date field
   · Submit → payload console.log + success screen
   · submitRfp(payload) hook for future API integration
   ────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ============================================
     0. EARLY EXIT if no form on this page
     ============================================ */
  var form = document.getElementById('rfp-form');
  if (!form) return;

  var stepper     = document.getElementById('form-stepper');
  var successEl   = document.getElementById('rfp-success');
  var totalSteps  = 3;
  var currentStep = 1;


  /* ============================================
     1. STEP NAVIGATION
     ============================================ */

  /**
   * Show the target step, hide others.
   * Updates stepper indicator and moves focus.
   * @param {number} target - step number (1-3)
   */
  function goToStep(target) {
    if (target < 1 || target > totalSteps) return;

    // Hide all steps
    form.querySelectorAll('.form-step').forEach(function (fs) {
      fs.hidden = true;
    });

    // Show target step
    var targetFieldset = document.getElementById('step-' + target);
    if (targetFieldset) {
      targetFieldset.hidden = false;
    }

    currentStep = target;
    updateStepper();

    // Keyboard a11y: focus first focusable field in new step
    if (targetFieldset) {
      var firstInput = targetFieldset.querySelector(
        'input:not([type="hidden"]):not([disabled]), select, textarea'
      );
      if (firstInput) {
        // Slight delay to ensure DOM update
        setTimeout(function () { firstInput.focus(); }, 50);
      }
    }

    // Scroll form into view
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Update the stepper indicator UI.
   */
  function updateStepper() {
    if (!stepper) return;

    stepper.querySelectorAll('.step').forEach(function (stepEl) {
      var stepNum = parseInt(stepEl.getAttribute('data-stepper'), 10);

      stepEl.classList.remove('active', 'completed');
      stepEl.removeAttribute('aria-current');

      if (stepNum === currentStep) {
        stepEl.classList.add('active');
        stepEl.setAttribute('aria-current', 'step');
      } else if (stepNum < currentStep) {
        stepEl.classList.add('completed');
      }
    });
  }

  // Next buttons
  form.querySelectorAll('.btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nextStep = parseInt(btn.getAttribute('data-next'), 10);
      if (validateStep(currentStep)) {
        goToStep(nextStep);
      }
    });
  });

  // Prev buttons
  form.querySelectorAll('.btn-prev').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var prevStep = parseInt(btn.getAttribute('data-prev'), 10);
      clearStepErrors(currentStep);
      goToStep(prevStep);
    });
  });


  /* ============================================
     2. "일정 미정" CHECKBOX → disable date input
     ============================================ */
  var startUnknown = document.getElementById('start-unknown');
  var startDate    = document.getElementById('start-date');

  if (startUnknown && startDate) {
    startUnknown.addEventListener('change', function () {
      if (startUnknown.checked) {
        startDate.disabled = true;
        startDate.value = '';
        startDate.removeAttribute('required');
        clearFieldError('start_date');
      } else {
        startDate.disabled = false;
        startDate.setAttribute('required', '');
      }
    });
  }


  /* ============================================
     3. VALIDATION
     ============================================ */

  // Validation messages (KR)
  var MSG = {
    required:      '필수 입력 항목입니다.',
    select:        '항목을 선택해 주세요.',
    checkbox_min:  '최소 1개 이상 선택해 주세요.',
    radio:         '항목을 선택해 주세요.',
    email_format:  '올바른 이메일 형식을 입력해 주세요.',
    phone_format:  '올바른 연락처를 입력해 주세요.',
    number_min:    '1 이상의 숫자를 입력해 주세요.',
    privacy:       '개인정보처리방침에 동의해 주세요.',
    file_size:     '파일 크기가 10MB를 초과합니다.'
  };

  // Email regex (simple but effective)
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Phone regex (Korean formats)
  var PHONE_RE = /^[\d\-+() ]{8,20}$/;

  /**
   * Validate all required fields in a given step.
   * @param {number} stepNum
   * @returns {boolean}
   */
  function validateStep(stepNum) {
    clearStepErrors(stepNum);
    var valid = true;
    var firstInvalid = null;

    if (stepNum === 1) {
      valid = validateField('event_type', function (v) { return v !== ''; }, MSG.select) && valid;
      valid = validateField('venue', function (v) { return v.trim() !== ''; }, MSG.required) && valid;

      // start_date: required unless "미정" checked
      if (!startUnknown || !startUnknown.checked) {
        valid = validateField('start_date', function (v) { return v !== ''; }, MSG.required) && valid;
      }

      valid = validateField('headcount', function (v) {
        var n = parseInt(v, 10);
        return !isNaN(n) && n >= 1;
      }, MSG.number_min) && valid;

      valid = validateRadio('vip', MSG.radio) && valid;
    }

    if (stepNum === 2) {
      valid = validateCheckboxGroup('scope', MSG.checkbox_min) && valid;
    }

    if (stepNum === 3) {
      valid = validateField('company', function (v) { return v.trim() !== ''; }, MSG.required) && valid;
      valid = validateField('name_title', function (v) { return v.trim() !== ''; }, MSG.required) && valid;
      valid = validateField('email', function (v) { return EMAIL_RE.test(v); }, MSG.email_format) && valid;
      valid = validateField('phone', function (v) { return PHONE_RE.test(v); }, MSG.phone_format) && valid;
      valid = validatePrivacy() && valid;
      valid = validateAttachment() && valid;
    }

    // Focus first invalid field
    if (!valid) {
      firstInvalid = form.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
      if (firstInvalid) firstInvalid.focus();
    }

    return valid;
  }

  /**
   * Validate a single field by name.
   * @param {string} fieldName - name attribute value
   * @param {function} test - (value) => boolean
   * @param {string} message - error message
   * @returns {boolean}
   */
  function validateField(fieldName, test, message) {
    var el = form.querySelector('[name="' + fieldName + '"]');
    if (!el) return true;

    var value = el.value;
    if (test(value)) {
      clearFieldError(fieldName);
      return true;
    }

    showFieldError(fieldName, message);
    return false;
  }

  /**
   * Validate a radio group by name.
   */
  function validateRadio(fieldName, message) {
    var radios = form.querySelectorAll('[name="' + fieldName + '"]');
    var checked = false;
    radios.forEach(function (r) {
      if (r.checked) checked = true;
    });

    if (checked) {
      clearFieldError(fieldName);
      return true;
    }

    showFieldError(fieldName, message);
    return false;
  }

  /**
   * Validate checkbox group — at least 1 checked.
   */
  function validateCheckboxGroup(fieldName, message) {
    var checkboxes = form.querySelectorAll('[name="' + fieldName + '"]');
    var checked = 0;
    checkboxes.forEach(function (cb) {
      if (cb.checked) checked++;
    });

    if (checked >= 1) {
      clearFieldError(fieldName);
      return true;
    }

    showFieldError(fieldName, message);
    return false;
  }

  /**
   * Validate privacy agreement checkbox.
   */
  function validatePrivacy() {
    var cb = document.getElementById('privacy-agree');
    if (!cb) return true;

    if (cb.checked) {
      clearFieldError('privacy_agree');
      return true;
    }

    showFieldError('privacy_agree', MSG.privacy);
    return false;
  }

  /**
   * Validate attachment file size (max 10MB).
   */
  function validateAttachment() {
    var fileInput = document.getElementById('attachment');
    if (!fileInput || !fileInput.files || !fileInput.files.length) return true;

    var file = fileInput.files[0];
    var maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size <= maxSize) {
      return true;
    }

    showFieldError('attachment', MSG.file_size);
    return false;
  }


  /* ============================================
     4. ERROR UI
     ============================================ */

  /**
   * Show error message for a field.
   * @param {string} fieldName
   * @param {string} message
   */
  function showFieldError(fieldName, message) {
    // Find the form-group container
    var group = form.querySelector('[data-field="' + fieldName + '"]');
    if (group) {
      group.classList.add('has-error');
    }

    // Find the error element (by convention: id = fieldName-with-dashes + "-error")
    var errorId = fieldName.replace(/_/g, '-') + '-error';
    var errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * Clear error for a single field.
   */
  function clearFieldError(fieldName) {
    var group = form.querySelector('[data-field="' + fieldName + '"]');
    if (group) {
      group.classList.remove('has-error');
    }

    var errorId = fieldName.replace(/_/g, '-') + '-error';
    var errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  /**
   * Clear all errors within a step.
   */
  function clearStepErrors(stepNum) {
    var stepEl = document.getElementById('step-' + stepNum);
    if (!stepEl) return;

    stepEl.querySelectorAll('.form-group.has-error').forEach(function (g) {
      g.classList.remove('has-error');
    });
    stepEl.querySelectorAll('.form-error').forEach(function (e) {
      e.textContent = '';
    });
  }

  /**
   * Inline validation — clear error on input change.
   */
  form.addEventListener('input', function (e) {
    var target = e.target;
    var group = target.closest('.form-group[data-field]');
    if (group && group.classList.contains('has-error')) {
      var fieldName = group.getAttribute('data-field');
      clearFieldError(fieldName);
    }
  });

  form.addEventListener('change', function (e) {
    var target = e.target;
    var group = target.closest('.form-group[data-field]');
    if (group && group.classList.contains('has-error')) {
      var fieldName = group.getAttribute('data-field');
      clearFieldError(fieldName);
    }
  });


  /* ============================================
     5. FORM SUBMISSION
     ============================================ */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate final step
    if (!validateStep(3)) return;

    // Collect payload
    var payload = collectPayload();

    // Submit
    submitRfp(payload);
  });

  /**
   * Collect all form data into a structured payload object.
   * @returns {Object}
   */
  function collectPayload() {
    var data = {};

    // Step 1
    data.event_type   = val('event_type');
    data.venue        = val('venue');
    data.start_date   = val('start_date') || null;
    data.start_unknown = !!form.querySelector('[name="start_unknown"]')?.checked;
    data.headcount    = parseInt(val('headcount'), 10) || 0;
    data.vip          = radioVal('vip');

    // Step 2
    data.scope = [];
    form.querySelectorAll('[name="scope"]:checked').forEach(function (cb) {
      data.scope.push(cb.value);
    });
    data.notes = val('notes') || null;

    // Step 3
    data.company      = val('company');
    data.name_title   = val('name_title');
    data.email        = val('email');
    data.phone        = val('phone');

    // File (if present)
    var fileInput = document.getElementById('attachment');
    if (fileInput && fileInput.files && fileInput.files.length) {
      data.attachment = {
        name: fileInput.files[0].name,
        size: fileInput.files[0].size,
        type: fileInput.files[0].type
      };
    } else {
      data.attachment = null;
    }

    data.privacy_agree = true;
    data.submitted_at  = new Date().toISOString();
    data.lang          = document.documentElement.lang || 'ko';

    return data;
  }

  function val(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value : '';
  }

  function radioVal(name) {
    var checked = form.querySelector('[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }


  /**
   * Submit the RFP payload.
   * Currently: console.log + show success UI.
   * Future: Replace body with fetch('/api/rfp', ...).
   *
   * @param {Object} payload - structured form data
   * @returns {Promise<void>}
   */
  async function submitRfp(payload) {
    var submitBtn = form.querySelector('.btn-submit');

    try {
      // Disable button to prevent double submit
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';
      }

      // ── HOOK POINT ──
      // Replace this block with actual API call:
      //
      // const response = await fetch('/api/rfp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Server error: ' + response.status);
      // }
      //
      // const result = await response.json();

      // For now: simulate network delay + log payload
      await new Promise(function (resolve) { setTimeout(resolve, 800); });

      console.group('%c[GroundK RFP] Payload', 'color: #3B82F6; font-weight: bold;');
      console.log(payload);
      console.groupEnd();

      // Show success
      showSuccess();

    } catch (err) {
      console.error('[GroundK RFP] Submit failed:', err);

      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '제안요청 제출';
      }

      // Show generic error (could be more specific based on err)
      alert('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  /**
   * Show success screen, hide form + reassurance.
   */
  function showSuccess() {
    form.hidden = true;

    if (successEl) {
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus on success heading for screen readers
      var heading = successEl.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }

    // Optionally hide reassurance section
    var reassurance = document.querySelector('.rfp-reassurance');
    if (reassurance) {
      reassurance.style.display = 'none';
    }

    // Update stepper to all-completed state
    if (stepper) {
      stepper.querySelectorAll('.step').forEach(function (s) {
        s.classList.remove('active');
        s.classList.add('completed');
        s.removeAttribute('aria-current');
      });
    }
  }


  /* ============================================
     6. EXPOSE for external use / testing
     ============================================ */
  window.GroundKRfp = {
    goToStep: goToStep,
    validateStep: validateStep,
    collectPayload: collectPayload,
    submitRfp: submitRfp
  };

})();
