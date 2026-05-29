/**
 * Dialogflow ES open_form UI — reads definitions from window.__DFCHAT_FORMS__.
 * Load /forms/*.js before this script (see embed.js).
 */
(function (global) {
  'use strict';

  var ICONS = {
    user:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
    email:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    star:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
    message:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    key:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    file:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
  };

  var STRINGS = {
    en: {
      submit: 'Submit',
      required: 'This field is required.',
      invalidEmail: 'Enter a valid email.',
      invalidPhone: 'Enter a valid mobile number.',
      invalidOtp: 'Enter a valid OTP code.',
      namePlaceholder: 'Your name',
      mobilePlaceholder: 'Mobile number',
      emailPlaceholder: 'Email address',
      otpCodePlaceholder: 'OTP code',
      summaryNameLabel: 'Name',
      summaryMobileLabel: 'Mobile',
      summaryEmailLabel: 'Email',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'Date',
      summaryTimeLabel: 'Time',
      summaryDocumentLabel: 'Document',
      summaryDoctorIdLabel: 'Doctor',
      chooseFiles: 'Choose file(s)…',
    },
    hi: {
      submit: 'जमा करें',
      required: 'यह फ़ील्ड आवश्यक है।',
      invalidEmail: 'मान्य ईमेल दर्ज करें।',
      invalidPhone: 'मान्य मोबाइल नंबर दर्ज करें।',
      invalidOtp: 'मान्य OTP दर्ज करें।',
      namePlaceholder: 'आपका नाम',
      mobilePlaceholder: 'मोबाइल नंबर',
      emailPlaceholder: 'ईमेल पता',
      otpCodePlaceholder: 'OTP कोड',
      summaryNameLabel: 'नाम',
      summaryMobileLabel: 'मोबाइल',
      summaryEmailLabel: 'ईमेल',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'तिथि',
      summaryTimeLabel: 'समय',
      summaryDocumentLabel: 'दस्तावेज़',
      summaryDoctorIdLabel: 'डॉक्टर',
      chooseFiles: 'फ़ाइल(ें) चुनें…',
    },
    mr: {
      submit: 'सबमिट करा',
      required: 'हे फील्ड आवश्यक आहे.',
      invalidEmail: 'वैध ईमेल टाका.',
      invalidPhone: 'वैध मोबाईल नंबर टाका.',
      invalidOtp: 'वैध OTP टाका.',
      namePlaceholder: 'तुमचे नाव',
      mobilePlaceholder: 'मोबाईल नंबर',
      emailPlaceholder: 'ईमेल पत्ता',
      otpCodePlaceholder: 'OTP कोड',
      summaryNameLabel: 'नाव',
      summaryMobileLabel: 'मोबाईल',
      summaryEmailLabel: 'ईमेल',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'तारीख',
      summaryTimeLabel: 'वेळ',
      summaryDocumentLabel: 'दस्तऐवज',
      summaryDoctorIdLabel: 'डॉक्टर',
      chooseFiles: 'फाइल(्स) निवडा…',
    },
  };

  function t(lang, key) {
    var pack = STRINGS[lang] || STRINGS.en;
    return pack[key] != null ? pack[key] : STRINGS.en[key] || key;
  }

  function langPick(map, lang) {
    if (!map || typeof map !== 'object') return '';
    return String(map[lang] || map.en || '').trim();
  }

  function getFormDef(formId) {
    var registry = global.__DFCHAT_FORMS__ || {};
    return registry[String(formId || '').trim()] || null;
  }

  function isFormsEnabled() {
    var cfg =
      (global.QA_CHAT_UI_CONFIG &&
        global.QA_CHAT_UI_CONFIG.common &&
        global.QA_CHAT_UI_CONFIG.common.dialogflow &&
        global.QA_CHAT_UI_CONFIG.common.dialogflow.forms) ||
      {};
    return cfg.enabled !== false;
  }

  function resolveNextFormId(def, request) {
    var fromReq =
      request.nextFormId ||
      (Array.isArray(request.nextFormIds) && request.nextFormIds[0]) ||
      '';
    if (fromReq) return String(fromReq).trim();
    if (def && def.nextFormId) return String(def.nextFormId).trim();
    if (def && Array.isArray(def.nextFormIds) && def.nextFormIds.length) {
      return String(def.nextFormIds[0]).trim();
    }
    return '';
  }

  function formatSubmission(formId, values, def, lang) {
    var lines = ['[form:' + formId + ']'];
    var names = (def && def.chatSummaryFieldNames) || Object.keys(values);
    names.forEach(function (name) {
      if (values[name] == null || values[name] === '') return;
      var label = name;
      var field = (def && def.fields || []).find(function (f) {
        return f.name === name;
      });
      if (field && field.i18nSummaryLabel) {
        label = t(lang, field.i18nSummaryLabel);
      }
      lines.push(label + ': ' + String(values[name]));
    });
    return lines.join('\n');
  }

  function buildSummaryText(formId, values, def, lang) {
    var title = def ? langPick(def.titleByLanguage, lang) : formId;
    var lines = [title];
    var names = (def && def.chatSummaryFieldNames) || Object.keys(values);
    names.forEach(function (name) {
      if (values[name] == null || values[name] === '') return;
      var field = (def && def.fields || []).find(function (f) {
        return f.name === name;
      });
      var label = name;
      if (field && field.i18nSummaryLabel) {
        label = t(lang, field.i18nSummaryLabel);
      } else if (field && field.placeholderByLanguage) {
        label = langPick(field.placeholderByLanguage, lang) || name;
      }
      lines.push(label + ': ' + String(values[name]));
    });
    return lines.join('\n');
  }

  function fieldPlaceholder(field, lang) {
    if (field.placeholderByLanguage) {
      return langPick(field.placeholderByLanguage, lang);
    }
    if (field.i18nPlaceholder) {
      return t(lang, field.i18nPlaceholder);
    }
    return '';
  }

  function validateValue(field, raw, lang) {
    var val = raw == null ? '' : String(raw).trim();
    if (field.required !== false && field.type !== 'hidden' && !val) {
      return t(lang, 'required');
    }
    if (!val) return '';
    if (field.validateAs === 'email' || field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return t(lang, 'invalidEmail');
    }
    if (field.validateAs === 'phone' || field.type === 'tel') {
      if (!/^[+]?[\d\s-]{8,15}$/.test(val)) return t(lang, 'invalidPhone');
    }
    if (field.i18nInvalidMessage) {
      if (field.pattern && !new RegExp(field.pattern).test(val)) {
        return t(lang, field.i18nInvalidMessage);
      }
      if (field.minLength && val.length < field.minLength) {
        return t(lang, field.i18nInvalidMessage);
      }
      if (field.maxLength && val.length > field.maxLength) {
        return t(lang, field.i18nInvalidMessage);
      }
    }
    if (field.pattern && !new RegExp(field.pattern).test(val)) {
      return t(lang, field.i18nInvalidMessage || 'required');
    }
    return '';
  }

  function buildFormEl(request, widget) {
    if (!isFormsEnabled()) return null;
    var formId = String((request && request.formId) || 'contact').trim();
    var def = getFormDef(formId);
    if (!def) {
      var missing = document.createElement('div');
      missing.className = 'qa-form qa-form--missing';
      missing.textContent = 'Form "' + formId + '" is not loaded.';
      return missing;
    }

    var lang = (widget && widget.language) || 'en';
    var prefill = Object.assign(
      {},
      (widget && widget.clientContext) || {},
      (request && request.prefill) || {}
    );

    var wrap = document.createElement('div');
    wrap.className = 'qa-form';
    wrap.setAttribute('data-form-id', formId);
    if (def.maxCardHeightPx) {
      wrap.style.maxHeight = def.maxCardHeightPx + 'px';
    }

    var header = document.createElement('div');
    header.className = 'qa-form__header';
    var titleEl = document.createElement('h3');
    titleEl.className = 'qa-form__title';
    titleEl.textContent = langPick(def.titleByLanguage, lang);
    header.appendChild(titleEl);
    if (def.showSubtitle !== false) {
      var subText =
        langPick(def.subtitleByLanguage, lang) ||
        (request && request.message) ||
        '';
      if (subText) {
        var sub = document.createElement('p');
        sub.className = 'qa-form__subtitle';
        sub.textContent = subText;
        header.appendChild(sub);
      }
    }
    wrap.appendChild(header);

    var form = document.createElement('form');
    form.className = 'qa-form__body';
    form.noValidate = true;

    var hiddenStore = {};

    (def.fields || []).forEach(function (field) {
      if (!field || !field.name) return;
      var type = String(field.type || 'text').toLowerCase();

      if (type === 'hidden') {
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = field.name;
        hidden.id = field.id || 'qa-f-' + field.name;
        hidden.value =
          prefill[field.name] != null
            ? String(prefill[field.name])
            : String(field.value || '');
        hiddenStore[field.name] = hidden;
        form.appendChild(hidden);
        return;
      }

      if (type === 'appointmentdoctor' || type === 'appointmentgeneral') {
        var dateHidden = document.createElement('input');
        dateHidden.type = 'hidden';
        dateHidden.name = 'appointmentdate';
        dateHidden.id = field.hiddenDateId || field.id + '-date';
        dateHidden.value = prefill.appointmentdate || '';

        var timeHidden = document.createElement('input');
        timeHidden.type = 'hidden';
        timeHidden.name = 'appointmenttime';
        timeHidden.id = field.hiddenTimeId || field.id + '-time';
        timeHidden.value = prefill.appointmenttime || '';

        var apptWrap = document.createElement('div');
        apptWrap.className = 'qa-form__field qa-form__field--appt';

        var dateRow = buildControlRow(
          field,
          {
            id: (field.hiddenDateId || field.id + '-date') + '-ui',
            name: 'appointmentdate_ui',
            type: 'date',
            required: field.required,
            icon: 'calendar',
            value: prefill.appointmentdate || '',
          },
          lang
        );
        var timeRow = buildControlRow(
          field,
          {
            id: (field.hiddenTimeId || field.id + '-time') + '-ui',
            name: 'appointmenttime_ui',
            type: 'time',
            required: field.required,
            icon: 'clock',
            value: prefill.appointmenttime || '',
          },
          lang
        );

        apptWrap.appendChild(dateRow.wrap);
        apptWrap.appendChild(timeRow.wrap);
        form.appendChild(dateHidden);
        form.appendChild(timeHidden);
        form.appendChild(apptWrap);

        dateRow.input.addEventListener('change', function () {
          dateHidden.value = dateRow.input.value || '';
        });
        timeRow.input.addEventListener('change', function () {
          timeHidden.value = timeRow.input.value || '';
        });
        return;
      }

      var built = buildControlRow(field, field, lang, prefill);
      form.appendChild(built.wrap);
    });

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'qa-form__submit';
    submit.textContent =
      langPick(def.submitLabelByLanguage, lang) || t(lang, 'submit');
    form.appendChild(submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (wrap.classList.contains('qa-form--submitted')) return;

      var values = {};
      var valid = true;
      wrap.querySelectorAll('.qa-form__error').forEach(function (el) {
        el.hidden = true;
        el.textContent = '';
      });

      (def.fields || []).forEach(function (field) {
        if (!field || !field.name) return;
        var type = String(field.type || 'text').toLowerCase();
        if (type === 'hidden') {
          values[field.name] = hiddenStore[field.name]
            ? hiddenStore[field.name].value
            : prefill[field.name] || field.value || '';
          return;
        }
        if (type === 'appointmentdoctor' || type === 'appointmentgeneral') {
          var dEl = form.querySelector('[name="appointmentdate"]');
          var tEl = form.querySelector('[name="appointmenttime"]');
          values.appointmentdate = dEl ? dEl.value : '';
          values.appointmenttime = tEl ? tEl.value : '';
          ['appointmentdate', 'appointmenttime'].forEach(function (k) {
            var err = validateValue({ required: field.required, type: k === 'appointmentdate' ? 'date' : 'time' }, values[k], lang);
            if (err) valid = false;
            var ui = form.querySelector('[name="' + k + '_ui"]');
            if (ui) showFieldError(ui, err);
          });
          return;
        }
        if (type === 'file') {
          var fileInput = form.querySelector('#' + (field.id || 'qa-f-' + field.name));
          var names = [];
          if (fileInput && fileInput.files && fileInput.files.length) {
            for (var i = 0; i < fileInput.files.length; i++) {
              names.push(fileInput.files[i].name);
            }
          }
          values[field.name] = names.join(', ');
          var fileErr = field.required && !names.length ? t(lang, 'required') : '';
          if (fileErr) valid = false;
          if (fileInput) showFieldError(fileInput, fileErr);
          return;
        }

        var input = form.querySelector('[name="' + field.name + '"]');
        var raw = input ? (input.tagName === 'SELECT' ? input.value : input.value) : '';
        values[field.name] = raw;
        var errMsg = validateValue(field, raw, lang);
        if (errMsg) {
          valid = false;
          if (input) showFieldError(input, errMsg);
        }
      });

      if (!valid) return;

      wrap.classList.add('qa-form--submitted');
      form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = true;
      });

      var nextFormId = resolveNextFormId(def, request || {});
      if (widget && typeof widget.handleFormSubmit === 'function') {
        widget.handleFormSubmit({
          formId: formId,
          values: values,
          def: def,
          request: request,
          nextFormId: nextFormId,
          summaryText: buildSummaryText(formId, values, def, lang),
          dialogflowText: formatSubmission(formId, values, def, lang),
        });
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  function showFieldError(input, msg) {
    var field = input.closest('.qa-form__field');
    if (!field) return;
    var err = field.querySelector('.qa-form__error');
    if (!err) return;
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      field.classList.add('qa-form__field--invalid');
    } else {
      err.hidden = true;
      field.classList.remove('qa-form__field--invalid');
    }
  }

  function buildControlRow(fieldDef, field, lang, prefill) {
    prefill = prefill || {};
    var wrap = document.createElement('div');
    wrap.className = 'qa-form__field';
    var type = String(field.type || 'text').toLowerCase();

    if (field.icon && ICONS[field.icon]) {
      var icon = document.createElement('span');
      icon.className = 'qa-form__icon';
      icon.innerHTML = ICONS[field.icon];
      wrap.appendChild(icon);
    }

    var controlWrap = document.createElement('div');
    controlWrap.className = 'qa-form__control';

    var input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
    } else if (type === 'select') {
      input = document.createElement('select');
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = fieldPlaceholder(field, lang) || '—';
      ph.disabled = true;
      ph.selected = true;
      input.appendChild(ph);
      (field.options || []).forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.value != null ? opt.value : opt.label;
        o.textContent = opt.label != null ? opt.label : opt.value;
        input.appendChild(o);
      });
    } else if (type === 'file') {
      input = document.createElement('input');
      input.type = 'file';
      if (field.accept) input.accept = field.accept;
      if (field.multiple) input.multiple = true;
    } else {
      input = document.createElement('input');
      input.type = type === 'tel' ? 'tel' : type;
    }

    input.className = 'qa-form__input';
    input.id = field.id || 'qa-f-' + field.name;
    input.name = field.name;
    if (field.required) input.required = true;
    if (field.autocomplete) input.autocomplete = field.autocomplete;
    if (field.inputMode) input.inputMode = field.inputMode;
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.minLength) input.minLength = field.minLength;
    if (field.pattern) input.pattern = field.pattern;

    var phText = fieldPlaceholder(field, lang);
    if (phText && type !== 'select' && type !== 'file') {
      input.placeholder = phText;
    }
    if (type === 'file' && phText) {
      input.setAttribute('data-placeholder', phText);
    }

    if (prefill[field.name] != null) {
      input.value = String(prefill[field.name]);
    } else if (field.value != null && type !== 'file') {
      input.value = String(field.value);
    }

    controlWrap.appendChild(input);
    wrap.appendChild(controlWrap);

    var err = document.createElement('span');
    err.className = 'qa-form__error';
    err.hidden = true;
    wrap.appendChild(err);

    return { wrap: wrap, input: input };
  }

  global.QAChatForm = {
    buildFormEl: buildFormEl,
    formatSubmission: formatSubmission,
    buildSummaryText: buildSummaryText,
    resolveNextFormId: resolveNextFormId,
    getFormDef: getFormDef,
    isFormsEnabled: isFormsEnabled,
  };
})(typeof window !== 'undefined' ? window : globalThis);
