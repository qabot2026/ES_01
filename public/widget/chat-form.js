/**
 * Dialogflow ES open_form UI — reads window.__DFCHAT_FORMS__ (see /public/forms/).
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
    location:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  };

  var STRINGS = {
    en: {
      submit: 'Submit',
      required: 'This field is required.',
      invalidEmail: 'Enter a valid email.',
      invalidPhone: 'Enter a valid mobile number.',
      invalidOtp: 'Enter a valid OTP code.',
      invalidPastBirthDate: 'Choose a date before today.',
      invalidFutureDate: 'Choose today or a later date.',
      namePlaceholder: 'Your name',
      mobilePlaceholder: 'Mobile number',
      emailPlaceholder: 'Email address',
      dialCodePlaceholder: 'Country code',
      otpCodePlaceholder: 'OTP code',
      otpEnterPlaceholder: 'Enter OTP',
      resendOtp: "Didn't receive? Send OTP again",
      changeMobile: 'Change mobile number',
      otpResending: 'Sending a new code…',
      otpResendNeedMobile: 'Enter your mobile number first.',
      birthDatePlaceholder: 'Date of birth',
      summaryNameLabel: 'Name',
      summaryMobileLabel: 'Mobile',
      summaryEmailLabel: 'Email',
      summaryDialCodeLabel: 'Code',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'Date',
      summaryTimeLabel: 'Time',
      summaryAppointmentDateLabel: 'Appointment Date',
      summaryAppointmentTimeLabel: 'Appointment Time',
      summaryDocumentLabel: 'Document',
      summaryDoctorIdLabel: 'Doctor',
      summaryBirthDateLabel: 'Birth date',
      summaryRatingLabel: 'Rating',
      summaryMessageLabel: 'Message',
      chooseFiles: 'Upload',
      addMoreFiles: 'Add',
      filesSelected: '{n} selected',
      clearFileSelection: 'Clear selection',
      removeFile: 'Remove file',
      calPrev: 'Previous month',
      calNext: 'Next month',
      calPickTime: 'Pick a time',
      calBookedLegend: 'Green - Available · Red - Full',
      calClosedDay: 'Not available on this day.',
      calTodayHidden: 'Today is not available for booking. Pick a future date.',
      calNoMoreSlotsToday: 'No more times left today. Try another date.',
      calOutsideWindow: 'You can only book within the allowed number of days.',
      calLoading: 'Loading…',
      formSubmitThanks: 'Thank you for sharing.',
      formSubmitThanksAppointment: 'Your appointment request has been submitted.',
      closeForm: 'Close form',
    },
    hi: {
      submit: 'जमा करें',
      required: 'यह फ़ील्ड आवश्यक है।',
      invalidEmail: 'मान्य ईमेल दर्ज करें।',
      invalidPhone: 'मान्य मोबाइल नंबर दर्ज करें।',
      invalidOtp: 'मान्य OTP दर्ज करें।',
      invalidPastBirthDate: 'आज से पहले की तारीख चुनें।',
      invalidFutureDate: 'आज या उसके बाद की तारीख चुनें।',
      namePlaceholder: 'आपका नाम',
      mobilePlaceholder: 'मोबाइल नंबर',
      emailPlaceholder: 'ईमेल पता',
      dialCodePlaceholder: 'देश कोड',
      otpCodePlaceholder: 'OTP कोड',
      otpEnterPlaceholder: 'OTP दर्ज करें',
      resendOtp: 'कोड नहीं मिला? OTP दोबारा भेजें',
      changeMobile: 'मोबाइल नंबर बदलें',
      otpResending: 'नया कोड भेजा जा रहा है…',
      otpResendNeedMobile: 'पहले मोबाइल नंबर दर्ज करें।',
      birthDatePlaceholder: 'जन्म तिथि',
      summaryNameLabel: 'नाम',
      summaryMobileLabel: 'मोबाइल',
      summaryEmailLabel: 'ईमेल',
      summaryDialCodeLabel: 'कोड',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'तिथि',
      summaryTimeLabel: 'समय',
      summaryAppointmentDateLabel: 'अपॉइंटमेंट तिथि',
      summaryAppointmentTimeLabel: 'अपॉइंटमेंट समय',
      summaryDocumentLabel: 'दस्तावेज़',
      summaryDoctorIdLabel: 'डॉक्टर',
      summaryBirthDateLabel: 'जन्म तिथि',
      summaryRatingLabel: 'रेटिंग',
      summaryMessageLabel: 'संदेश',
      chooseFiles: 'अपलोड',
      addMoreFiles: 'जोड़ें',
      filesSelected: '{n} चयनित',
      clearFileSelection: 'चयन साफ़ करें',
      removeFile: 'फ़ाइल हटाएं',
      calPrev: 'पिछला महीना',
      calNext: 'अगला महीना',
      calPickTime: 'समय चुनें',
      calBookedLegend: 'हरा - खाली · लाल - भरा',
      calClosedDay: 'इस दिन अपॉइंटमेंट उपलब्ध नहीं।',
      calTodayHidden: 'आज की तारीख उपलब्ध नहीं। आगे की तारीख चुनें।',
      calNoMoreSlotsToday: 'आज के लिए और समय उपलब्ध नहीं। दूसरी तारीख चुनें।',
      calOutsideWindow: 'केवल निर्धारित दिनों के भीतर ही बुक कर सकते हैं।',
      calLoading: 'लोड हो रहा है…',
      formSubmitThanks: 'साझा करने के लिए धन्यवाद।',
      formSubmitThanksAppointment: 'आपका अपॉइंटमेंट अनुरोध जमा हो गया है।',
      closeForm: 'फ़ॉर्म बंद करें',
    },
    mr: {
      submit: 'सबमिट करा',
      required: 'हे फील्ड आवश्यक आहे.',
      invalidEmail: 'वैध ईमेल टाका.',
      invalidPhone: 'वैध मोबाईल नंबर टाका.',
      invalidOtp: 'वैध OTP टाका.',
      invalidPastBirthDate: 'आजपूर्वीची तारीख निवडा.',
      invalidFutureDate: 'आज किंवा नंतरची तारीख निवडा.',
      namePlaceholder: 'तुमचे नाव',
      mobilePlaceholder: 'मोबाईल नंबर',
      emailPlaceholder: 'ईमेल पत्ता',
      dialCodePlaceholder: 'देश कोड',
      otpCodePlaceholder: 'OTP कोड',
      otpEnterPlaceholder: 'OTP टाका',
      resendOtp: 'कोड मिळाला नाही? OTP पुन्हा पाठवा',
      changeMobile: 'मोबाईल नंबर बदला',
      otpResending: 'नवा कोड पाठवत आहे…',
      otpResendNeedMobile: 'आधी मोबाईल नंबर टाका.',
      birthDatePlaceholder: 'जन्मतारीख',
      summaryNameLabel: 'नाव',
      summaryMobileLabel: 'मोबाईल',
      summaryEmailLabel: 'ईमेल',
      summaryDialCodeLabel: 'कोड',
      summaryOtpLabel: 'OTP',
      summaryDateLabel: 'तारीख',
      summaryTimeLabel: 'वेळ',
      summaryAppointmentDateLabel: 'अपॉइंटमेंट तारीख',
      summaryAppointmentTimeLabel: 'अपॉइंटमेंट वेळ',
      summaryDocumentLabel: 'दस्तऐवज',
      summaryDoctorIdLabel: 'डॉक्टर',
      summaryBirthDateLabel: 'जन्मतारीख',
      summaryRatingLabel: 'रेटिंग',
      summaryMessageLabel: 'संदेश',
      chooseFiles: 'अपलोड',
      addMoreFiles: 'जोडा',
      filesSelected: '{n} निवडले',
      clearFileSelection: 'निवड रद्द करा',
      removeFile: 'फाइल काढा',
      calPrev: 'मागील महिना',
      calNext: 'पुढील महिना',
      calPickTime: 'वेळ निवडा',
      calBookedLegend: 'हिरवा - उपलब्ध · लाल - भरले',
      calClosedDay: 'या दिवशी अपॉइंटमेंट उपलब्ध नाही.',
      calTodayHidden: 'आजची तारीख उपलब्ध नाही. पुढची तारीख निवडा.',
      calNoMoreSlotsToday: 'आजसाठी आणखी वेळ उपलब्ध नाही. दुसरी तारीख निवडा.',
      calOutsideWindow: 'फक्त ठरवलेल्या दिवसांमध्येच बुकिंग करता येईल.',
      calLoading: 'लोड होत आहे…',
      formSubmitThanks: 'माहिती शेअर केल्याबद्दल धन्यवाद.',
      formSubmitThanksAppointment: 'तुमची अपॉइंटमेंट विनंती जमा झाली आहे.',
      closeForm: 'फॉर्म बंद करा',
    },
  };

  /** Dialogflow open_form actions: query:INTENT_NAME or event:EVENT_NAME */
  function resolveFormAction(action) {
    var s = String(action || '').trim();
    if (!s) return null;
    if (/^query:/i.test(s)) {
      return { type: 'message', message: s.replace(/^query:/i, '').trim() || s };
    }
    if (/^event:/i.test(s)) {
      return { type: 'event', event: s.replace(/^event:/i, '').trim() };
    }
    return { type: 'message', message: s };
  }

  function summaryFieldLabel(field, name, lang) {
    if (field && field.i18nSummaryLabel) {
      return t(lang, field.i18nSummaryLabel);
    }
    if (field && field.placeholderByLanguage) {
      return langPick(field.placeholderByLanguage, lang) || name;
    }
    return name;
  }

  function findFieldDef(def, name) {
    return (def && def.fields || []).find(function (f) {
      return f.name === name;
    });
  }

  function combinedMobileLine(values, def, lang) {
    var dial = values.dial_code != null ? String(values.dial_code).trim() : '';
    var mobile = values.mobile != null ? String(values.mobile).trim() : '';
    if (!mobile) return '';
    var field = findFieldDef(def, 'mobile');
    var label = summaryFieldLabel(field, 'mobile', lang);
    var num = dial ? dial + ' ' + mobile : mobile;
    return label + ': ' + num;
  }

  function t(lang, key) {
    var pack = STRINGS[lang] || STRINGS.en;
    return pack[key] != null ? pack[key] : STRINGS.en[key] || key;
  }

  function langPick(map, lang) {
    if (!map || typeof map !== 'object') return '';
    return String(map[lang] || map.en || '').trim();
  }

  function isMobileViewport() {
    return !!(global.matchMedia && global.matchMedia('(max-width: 768px)').matches);
  }

  function getFormsCfg() {
    var c =
      global.QA_CHAT_UI_CONFIG &&
      global.QA_CHAT_UI_CONFIG.common &&
      global.QA_CHAT_UI_CONFIG.common.dialogflow &&
      global.QA_CHAT_UI_CONFIG.common.dialogflow.forms;
    return c || {};
  }

  function getFormDef(formId) {
    var registry = global.__DFCHAT_FORMS__ || {};
    return registry[String(formId || '').trim()] || null;
  }

  function isFormsEnabled() {
    return getFormsCfg().enabled !== false;
  }

  function apiBase(widget) {
    return (widget && widget.apiBase) || '';
  }

  function resolveNextFormId(def, request) {
    request = request || {};
    var ids = [];
    function push(id) {
      id = String(id || '').trim();
      if (id && ids.indexOf(id) < 0) ids.push(id);
    }
    push(request.nextFormId);
    if (Array.isArray(request.nextFormIds)) {
      request.nextFormIds.forEach(push);
    }
    push(request.followingFormId);
    push(request.following_form_id);
    push(request.thirdFormId);
    push(request.third_form_id);
    if (def) {
      push(def.nextFormId);
      if (Array.isArray(def.nextFormIds)) def.nextFormIds.forEach(push);
    }
    return ids[0] || '';
  }

  function formatOtpResend(values, def) {
    var lines = ['[form:otp]', 'staff:' + (def && def.staffFormLabel ? def.staffFormLabel : 'otp'), 'action:resend'];
    if (values.dial_code) lines.push('dial_code: ' + String(values.dial_code).trim());
    if (values.mobile) lines.push('mobile: ' + String(values.mobile).trim());
    return lines.join('\n');
  }

  function getOtpFormValues(form, widget) {
    var otpIn = form.querySelector('[name="otp"]');
    var mobileIn = form.querySelector('[name="mobile"]');
    var ctx = (widget && widget.clientContext) || {};
    var mobile = mobileIn ? String(mobileIn.value || '').trim() : '';
    if (!mobile) mobile = String(ctx.mobile || '').trim();
    return {
      otp: otpIn ? String(otpIn.value || '').trim() : '',
      mobile: mobile,
      dial_code: String(ctx.dial_code || '').trim(),
    };
  }

  function formatSubmission(formId, values, def, lang) {
    var lines = ['[form:' + formId + ']'];
    if (def && def.staffFormLabel) {
      lines.push('staff:' + String(def.staffFormLabel));
    }
    var names = (def && def.chatSummaryFieldNames) || Object.keys(values);
    names.forEach(function (name) {
      if (values[name] == null || values[name] === '') return;
      var field = findFieldDef(def, name);
      var label = appointmentSummaryLabel(name, field, def, lang);
      var val = formatSummaryFieldValue(name, values[name], field, def);
      lines.push(label + ': ' + val);
    });
    return lines.join('\n');
  }

  function buildSummaryText(formId, values, def, lang) {
    var lines = [submitThanksMessage(def, lang)];

    var names = (def && def.chatSummaryFieldNames) || Object.keys(values);
    var hasMobile = values.mobile != null && String(values.mobile).trim() !== '';
    var hasDial = values.dial_code != null && String(values.dial_code).trim() !== '';

    names.forEach(function (name) {
      if (name === 'dial_code' && hasMobile) return;
      if (values[name] == null || String(values[name]).trim() === '') return;

      if (name === 'mobile' && hasDial) {
        var combined = combinedMobileLine(values, def, lang);
        if (combined) lines.push(combined);
        return;
      }

      var field = findFieldDef(def, name);
      var label = appointmentSummaryLabel(name, field, def, lang);
      var val = formatSummaryFieldValue(name, values[name], field, def);
      lines.push(label + ': ' + val);
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

  function parseTime24Client(t) {
    var m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { h: h, min: min };
  }

  function to24hClient(t) {
    var s = String(t || '').trim();
    if (!s) return '';
    var p = parseTime24Client(s);
    if (p) {
      return String(p.h).padStart(2, '0') + ':' + String(p.min).padStart(2, '0');
    }
    var m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m12) return s;
    var h = parseInt(m12[1], 10);
    var min = m12[2];
    var pm = m12[3].toUpperCase() === 'PM';
    if (h < 1 || h > 12) return s;
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
    return String(h).padStart(2, '0') + ':' + min;
  }

  /** 12-hour display only (9:00 AM, 2:30 PM). */
  function to12hClient(t) {
    var s24 = to24hClient(t);
    var p = parseTime24Client(s24);
    if (!p) return String(t || '').trim();
    var pm = p.h >= 12;
    var h12 = p.h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + String(p.min).padStart(2, '0') + ' ' + (pm ? 'PM' : 'AM');
  }

  function formatAppointmentDateDisplay(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return String(iso || '').trim();
    return m[3] + '/' + m[2] + '/' + m[1];
  }

  function submitThanksMessage(def, lang) {
    if (def && def.formType === 'appointment') {
      return t(lang, 'formSubmitThanksAppointment');
    }
    return t(lang, 'formSubmitThanks');
  }

  function appointmentSummaryLabel(name, field, def, lang) {
    if (def && def.formType === 'appointment') {
      if (name === 'appointmentdate') return t(lang, 'summaryAppointmentDateLabel');
      if (name === 'appointmenttime') return t(lang, 'summaryAppointmentTimeLabel');
    }
    return summaryFieldLabel(field, name, lang);
  }

  function formatSummaryFieldValue(name, val, field, def) {
    val = String(val || '').trim();
    if (!val) return val;
    if (def && def.formType === 'appointment' && name === 'appointmentdate') {
      return formatAppointmentDateDisplay(val);
    }
    if (name === 'appointmenttime' || (field && field.type === 'time')) {
      return to12hClient(val);
    }
    return val;
  }

  function yesterdayIso() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateIso(d);
  }

  /** Local calendar date YYYY-MM-DD (not UTC — avoids wrong "today" in IST etc.). */
  function localDateIso(d) {
    d = d || new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function todayLocalIso() {
    return localDateIso(new Date());
  }

  function todayIsoInTimeZone(tz) {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: tz });
    } catch (e) {
      return todayLocalIso();
    }
  }

  function nowMinutesInTimeZone(tz) {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      var h = 0;
      var min = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') min = parseInt(p.value, 10);
      });
      return h * 60 + min;
    } catch (e) {
      var d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  }

  function isPastAppointmentDate(iso) {
    return String(iso || '').trim() < todayLocalIso();
  }

  function validatePastDate(val, field, lang) {
    if (!val) return t(lang, 'required');
    var max = yesterdayIso();
    if (field.pastDateMin && val < field.pastDateMin) {
      return t(lang, 'invalidPastBirthDate');
    }
    if (val > max) return t(lang, 'invalidPastBirthDate');
    return '';
  }

  function validateFutureDate(val, lang) {
    if (!val) return t(lang, 'required');
    if (isPastAppointmentDate(val)) return t(lang, 'invalidFutureDate');
    return '';
  }

  function validateValue(field, raw, lang) {
    var val = raw == null ? '' : String(raw).trim();
    if (field.required !== false && field.type !== 'hidden' && !val) {
      return t(lang, 'required');
    }
    if (!val) return '';
    if (field.pastDateOnly && field.type === 'date') {
      return validatePastDate(val, field, lang) || '';
    }
    if (field.futureDateOnly && field.type === 'date') {
      return validateFutureDate(val, lang) || '';
    }
    if (field.validateAs === 'email' || field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return t(lang, 'invalidEmail');
    }
    if (field.validateAs === 'phone' || field.type === 'tel') {
      if (!/^[0-9\s-]{8,15}$/.test(val)) return t(lang, 'invalidPhone');
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

  function applyDateConstraints(input, field) {
    if (field.pastDateOnly) {
      input.max = yesterdayIso();
      if (field.pastDateMin) input.min = field.pastDateMin;
    }
    if (field.futureDateOnly) {
      input.min = todayLocalIso();
    }
  }

  function dialOptionLabel(opt, compact) {
    var flag = opt.flag ? String(opt.flag) : '';
    var country = opt.country ? String(opt.country).toUpperCase() : '';
    if (compact) {
      if (flag && country) return flag + ' ' + country;
      if (flag) return flag;
      if (country) return country;
    }
    var val = String(opt.value != null ? opt.value : opt.label || '').trim();
    if (flag && country) return flag + ' ' + country;
    if (flag && val) return flag + ' ' + val;
    return opt.label != null ? String(opt.label) : val;
  }

  function flagCdnUrl(country, width) {
    var cc = String(country || '')
      .trim()
      .toLowerCase();
    if (!/^[a-z]{2}$/.test(cc)) return '';
    return 'https://flagcdn.com/w' + (width || 20) + '/' + cc + '.png';
  }

  function normalizeDialOptions(field) {
    return (field.options || []).map(function (opt) {
      return {
        value: String(opt.value != null ? opt.value : opt.label || '').trim(),
        country: String(opt.country || '').toUpperCase(),
        flag: opt.flag ? String(opt.flag) : '',
      };
    });
  }

  function findDialOption(options, code, flagHint, countryHint) {
    var want = String(code || '').trim();
    var country = countryHint ? String(countryHint).toUpperCase() : '';
    var flag = flagHint ? String(flagHint) : '';
    var fallback = null;
    var i;
    for (i = 0; i < options.length; i += 1) {
      var opt = options[i];
      if (opt.value !== want) continue;
      if (country && opt.country === country) return opt;
      if (flag && opt.flag === flag && !fallback) fallback = opt;
      if (!fallback) fallback = opt;
    }
    if (!fallback && country) {
      for (i = 0; i < options.length; i += 1) {
        if (options[i].country === country) return options[i];
      }
    }
    return fallback || (options.length ? options[0] : null);
  }

  function updateDialPickerUi(picker, opt) {
    if (!picker || !opt) return;
    var img = picker.querySelector('.qa-dial-picker__trigger .qa-dial-picker__flag-img');
    var iso = picker.querySelector('.qa-dial-picker__trigger .qa-dial-picker__iso');
    var code = picker.querySelector('.qa-dial-picker__trigger .qa-dial-picker__code');
    var url = flagCdnUrl(opt.country, 40);
    if (img) {
      img.src = url || '';
      img.alt = opt.country || '';
      img.style.visibility = url ? 'visible' : 'hidden';
    }
    if (iso) iso.textContent = opt.country || '';
    if (code) code.textContent = opt.value || '';
  }

  function setDialPickerValue(picker, hidden, options, code, flagHint, countryHint) {
    var opt = findDialOption(options, code, flagHint, countryHint);
    if (!opt || !hidden) return false;
    hidden.value = opt.value;
    picker._dialCurrent = opt;
    updateDialPickerUi(picker, opt);
    return true;
  }

  function buildDialPicker(field, lang, prefill) {
    var options = normalizeDialOptions(field);
    var picker = document.createElement('div');
    picker.className = 'qa-dial-picker';
    picker._dialOptions = options;

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.className = 'qa-dial-picker__value qa-form__input';
    hidden.id = field.id || 'qa-f-' + field.name;
    if (field.name) hidden.name = field.name;
    if (field.required) hidden.required = true;
    hidden.setAttribute('aria-label', t(lang, 'dialCodePlaceholder'));

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'qa-dial-picker__trigger qa-form__input qa-form__input--dial-code';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var flagImg = document.createElement('img');
    flagImg.className = 'qa-dial-picker__flag-img';
    flagImg.width = 22;
    flagImg.height = 16;
    flagImg.decoding = 'async';
    flagImg.loading = 'lazy';

    var iso = document.createElement('span');
    iso.className = 'qa-dial-picker__iso';
    var dialCode = document.createElement('span');
    dialCode.className = 'qa-dial-picker__code';
    trigger.appendChild(flagImg);
    trigger.appendChild(iso);
    trigger.appendChild(dialCode);

    var menu = document.createElement('ul');
    menu.className = 'qa-dial-picker__menu';
    menu.hidden = true;
    menu.setAttribute('role', 'listbox');

    options.forEach(function (opt) {
      var li = document.createElement('li');
      li.className = 'qa-dial-picker__option';
      li.setAttribute('role', 'option');
      li.setAttribute('data-value', opt.value);
      var liImg = document.createElement('img');
      liImg.className = 'qa-dial-picker__flag-img';
      liImg.src = flagCdnUrl(opt.country, 20);
      liImg.alt = '';
      liImg.width = 22;
      liImg.height = 16;
      var liIso = document.createElement('span');
      liIso.className = 'qa-dial-picker__iso';
      liIso.textContent = opt.country;
      var liCode = document.createElement('span');
      liCode.className = 'qa-dial-picker__code';
      liCode.textContent = opt.value;
      li.appendChild(liImg);
      li.appendChild(liIso);
      li.appendChild(liCode);
      li.addEventListener('click', function (ev) {
        ev.stopPropagation();
        setDialPickerValue(picker, hidden, options, opt.value, opt.flag, opt.country);
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        showFieldError(hidden, '');
      });
      menu.appendChild(li);
    });

    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var willOpen = menu.hidden;
      var menus = document.querySelectorAll('.qa-dial-picker__menu');
      for (var m = 0; m < menus.length; m += 1) {
        if (menus[m] !== menu) menus[m].hidden = true;
      }
      menu.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    if (!global.__QA_DIAL_PICKER_DOC_CLOSE__) {
      global.__QA_DIAL_PICKER_DOC_CLOSE__ = true;
      document.addEventListener('click', function () {
        var openMenus = document.querySelectorAll('.qa-dial-picker__menu:not([hidden])');
        for (var i = 0; i < openMenus.length; i += 1) {
          openMenus[i].hidden = true;
          var tr = openMenus[i].parentElement;
          if (tr) {
            var btn = tr.querySelector('.qa-dial-picker__trigger');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    picker.appendChild(hidden);
    picker.appendChild(trigger);
    picker.appendChild(menu);

    if (prefill[field.name] != null) {
      setDialPickerValue(picker, hidden, options, String(prefill[field.name]).trim());
    } else if (options.length) {
      setDialPickerValue(picker, hidden, options, options[0].value, '', options[0].country);
    }

    return { picker: picker, input: hidden };
  }

  function flagForCountryFromOptions(options, countryCode) {
    var cc = String(countryCode || '').toUpperCase();
    if (!cc) return '';
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].country === cc) return options[i].flag || '';
    }
    return '';
  }

  function detectPreferredDialCode(lang) {
    lang = String(lang || '').toLowerCase();
    if (lang === 'hi' || lang === 'mr') return '+91';

    var localeDial = {
      in: '+91',
      us: '+1',
      ca: '+1',
      gb: '+44',
      ae: '+971',
      au: '+61',
      sg: '+65',
      sa: '+966',
      qa: '+974',
      om: '+968',
      kw: '+965',
      bh: '+973',
      np: '+977',
      bd: '+880',
      lk: '+94',
      pk: '+92',
      my: '+60',
      de: '+49',
      fr: '+33',
      it: '+39',
      es: '+34',
    };

    try {
      var langs = [];
      if (global.navigator) {
        if (Array.isArray(global.navigator.languages)) {
          langs = global.navigator.languages.slice();
        } else if (global.navigator.language) {
          langs = [global.navigator.language];
        }
      }
      for (var i = 0; i < langs.length; i++) {
        var part = String(langs[i] || '')
          .split('-')[1]
          .toLowerCase();
        if (part && localeDial[part]) return localeDial[part];
        var base = String(langs[i] || '').split('-')[0].toLowerCase();
        if (base === 'hi' || base === 'mr') return '+91';
      }
      var tz =
        global.Intl &&
        global.Intl.DateTimeFormat &&
        global.Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && /Asia\/Kolkata|Asia\/Calcutta/.test(tz)) return '+91';
    } catch (e) {}

    return '+91';
  }

  function detectPreferredCountryCode(lang) {
    lang = String(lang || '').toLowerCase();
    if (lang === 'hi' || lang === 'mr') return 'IN';

    var localeCountry = {
      in: 'IN',
      us: 'US',
      ca: 'CA',
      gb: 'GB',
      ae: 'AE',
      au: 'AU',
      sg: 'SG',
      sa: 'SA',
      qa: 'QA',
      om: 'OM',
      kw: 'KW',
      bh: 'BH',
      np: 'NP',
      bd: 'BD',
      lk: 'LK',
      pk: 'PK',
      my: 'MY',
      de: 'DE',
      fr: 'FR',
      it: 'IT',
      es: 'ES',
    };

    try {
      var langs = [];
      if (global.navigator) {
        if (Array.isArray(global.navigator.languages)) {
          langs = global.navigator.languages.slice();
        } else if (global.navigator.language) {
          langs = [global.navigator.language];
        }
      }
      for (var i = 0; i < langs.length; i++) {
        var part = String(langs[i] || '')
          .split('-')[1]
          .toLowerCase();
        if (part && localeCountry[part]) return localeCountry[part];
      }
      var tz =
        global.Intl &&
        global.Intl.DateTimeFormat &&
        global.Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && /Asia\/Kolkata|Asia\/Calcutta/.test(tz)) return 'IN';
    } catch (e) {}

    return 'IN';
  }

  function detectPreferredDialFlag(lang) {
    try {
      var langs = [];
      if (global.navigator) {
        if (Array.isArray(global.navigator.languages)) {
          langs = global.navigator.languages.slice();
        } else if (global.navigator.language) {
          langs = [global.navigator.language];
        }
      }
      for (var i = 0; i < langs.length; i++) {
        var l = String(langs[i] || '').toLowerCase();
        if (l.indexOf('-ca') >= 0) return '🇨🇦';
        if (l.indexOf('-us') >= 0) return '🇺🇸';
      }
    } catch (e) {}
    return '';
  }

  function applyAutoDetectDialCode(picker, hidden, options, lang, prefill) {
    if (prefill && prefill.dial_code != null && String(prefill.dial_code).trim()) {
      if (setDialPickerValue(picker, hidden, options, String(prefill.dial_code).trim())) return;
    }
    var preferred = detectPreferredDialCode(lang);
    var flagHint = detectPreferredDialFlag(lang);
    var countryHint = detectPreferredCountryCode(lang);
    if (!setDialPickerValue(picker, hidden, options, preferred, flagHint, countryHint) && options.length) {
      setDialPickerValue(picker, hidden, options, options[0].value, '', options[0].country);
    }
  }

  function detectDialFromIp(picker, hidden, dialField, lang, prefill, widget) {
    var options = picker._dialOptions || [];
    if (prefill && prefill.dial_code != null && String(prefill.dial_code).trim()) {
      return;
    }
    applyAutoDetectDialCode(picker, hidden, options, lang, prefill);

    var useIp =
      dialField.detectFromIp ||
      dialField.detectFromLocation ||
      dialField.autoDetectDialCode;
    if (!useIp) return;

    var base = apiBase(widget);
    if (!base) return;

    fetchJson(base + '/api/detect-country').then(function (data) {
      if (!data || !data.dialCode) return;
      var flag = flagForCountryFromOptions(options, data.countryCode);
      setDialPickerValue(picker, hidden, options, data.dialCode, flag, data.countryCode);
    });
  }

  function isUploadForm(def, formId) {
    var id = String(formId || '').toLowerCase();
    return (
      String((def && def.formType) || '').toLowerCase() === 'upload' ||
      id === 'upload' ||
      id === 'uploaddocument'
    );
  }

  function formatFileSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function fileAlreadySelected(list, file) {
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].name === file.name && list[i].size === file.size && list[i].lastModified === file.lastModified) {
        return true;
      }
    }
    return false;
  }

  function syncUploadInputFiles(form, input) {
    if (!input || typeof DataTransfer === 'undefined') return;
    var dt = new DataTransfer();
    (form._selectedFiles || []).forEach(function (file) {
      try {
        dt.items.add(file);
      } catch (e) {}
    });
    input.files = dt.files;
  }

  function renderUploadFileField(field, lang, form) {
    if (!form._selectedFiles) form._selectedFiles = [];

    var wrap = document.createElement('div');
    wrap.className = 'qa-form__field qa-form__field--upload';

    var controlWrap = document.createElement('div');
    controlWrap.className = 'qa-form__upload';

    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'qa-form__file-input-native';
    input.id = field.id || 'qa-f-' + field.name;
    input.name = field.name;
    if (field.accept) input.accept = field.accept;
    if (field.multiple !== false) input.multiple = true;
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;

    var toolbar = document.createElement('div');
    toolbar.className = 'qa-form__upload-toolbar';

    var toolbarRow = document.createElement('div');
    toolbarRow.className = 'qa-form__upload-toolbar-row';

    var pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.className = 'qa-form__upload-pick';

    var pickIcon = null;
    if (field.icon && ICONS[field.icon]) {
      pickIcon = document.createElement('span');
      pickIcon.className = 'qa-form__upload-pick-icon';
      pickIcon.innerHTML = ICONS[field.icon];
      pickIcon.setAttribute('aria-hidden', 'true');
      pickBtn.appendChild(pickIcon);
    }
    var pickLabel = document.createElement('span');
    pickLabel.className = 'qa-form__upload-pick-label';
    pickBtn.appendChild(pickLabel);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'qa-form__upload-clear';
    clearBtn.textContent = t(lang, 'clearFileSelection');
    clearBtn.hidden = true;

    var countBadge = document.createElement('span');
    countBadge.className = 'qa-form__upload-count';
    countBadge.hidden = true;

    var list = document.createElement('ul');
    list.className = 'qa-form__upload-list';
    list.setAttribute('role', 'list');

    function formatFilesSelected(n) {
      return String(t(lang, 'filesSelected') || '{n} selected').replace('{n}', String(n));
    }

    function updatePickLabel() {
      var n = form._selectedFiles.length;
      pickLabel.textContent =
        n > 0 ? t(lang, 'addMoreFiles') : fieldPlaceholder(field, lang) || t(lang, 'chooseFiles');
      pickBtn.classList.toggle('qa-form__upload-pick--secondary', n > 0);
      if (n > 0) {
        countBadge.hidden = false;
        countBadge.textContent = formatFilesSelected(n);
      } else {
        countBadge.hidden = true;
        countBadge.textContent = '';
      }
    }

    function renderFileList() {
      list.innerHTML = '';
      form._selectedFiles.forEach(function (file, idx) {
        var li = document.createElement('li');
        li.className = 'qa-form__upload-item';
        li.setAttribute('role', 'listitem');

        var nameEl = document.createElement('span');
        nameEl.className = 'qa-form__upload-item-name';
        nameEl.textContent = file.name;
        nameEl.title = file.name;

        var meta = document.createElement('span');
        meta.className = 'qa-form__upload-item-meta';
        meta.textContent = formatFileSize(file.size);

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'qa-form__upload-remove';
        removeBtn.setAttribute('aria-label', t(lang, 'removeFile') + ': ' + file.name);
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          form._selectedFiles.splice(idx, 1);
          refreshUploadUi();
        });

        li.appendChild(nameEl);
        li.appendChild(meta);
        li.appendChild(removeBtn);
        list.appendChild(li);
      });
      list.hidden = form._selectedFiles.length === 0;
    }

    function refreshUploadUi() {
      syncUploadInputFiles(form, input);
      renderFileList();
      clearBtn.hidden = form._selectedFiles.length === 0;
      updatePickLabel();
      showFieldError(input, '');
    }

    pickBtn.addEventListener('click', function (e) {
      e.preventDefault();
      input.click();
    });

    input.addEventListener('change', function () {
      if (!input.files || !input.files.length) return;
      for (var i = 0; i < input.files.length; i += 1) {
        var file = input.files[i];
        if (!fileAlreadySelected(form._selectedFiles, file)) {
          form._selectedFiles.push(file);
        }
      }
      input.value = '';
      refreshUploadUi();
    });

    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      form._selectedFiles = [];
      input.value = '';
      refreshUploadUi();
    });

    toolbarRow.appendChild(pickBtn);
    toolbarRow.appendChild(countBadge);
    toolbar.appendChild(toolbarRow);
    toolbar.appendChild(clearBtn);
    controlWrap.appendChild(toolbar);
    controlWrap.appendChild(list);
    controlWrap.appendChild(input);
    wrap.appendChild(controlWrap);

    var err = document.createElement('span');
    err.className = 'qa-form__error';
    err.hidden = true;
    wrap.appendChild(err);

    form._uploadInput = input;
    updatePickLabel();
    refreshUploadUi();

    return { wrap: wrap, input: input };
  }

  function isOtpForm(def, formId) {
    return (
      String((def && def.formType) || '').toLowerCase() === 'otp' ||
      String(formId || '').toLowerCase() === 'otp'
    );
  }

  function renderOtpForm(scroll, form, wrap, def, lang, prefill, widget, request) {
    var otpField;
    var mobileField;
    (def.fields || []).forEach(function (f) {
      if (!f || !f.name) return;
      if (f.name === 'otp') otpField = f;
      if (f.name === 'mobile') mobileField = f;
    });

    if (otpField) {
      scroll.appendChild(buildControlRow(otpField, lang, prefill).wrap);
    }

    var actions = document.createElement('div');
    actions.className = 'qa-form__otp-actions';

    var statusEl = document.createElement('p');
    statusEl.className = 'qa-form__otp-status';
    statusEl.hidden = true;

    var resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.className = 'qa-form__otp-link';
    resendBtn.textContent = t(lang, 'resendOtp');
    resendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var vals = getOtpFormValues(form, widget);
      if (mobileWrap && !mobileWrap.hidden && !vals.mobile) {
        statusEl.hidden = false;
        statusEl.textContent = t(lang, 'otpResendNeedMobile');
        if (mobileInput) showFieldError(mobileInput, t(lang, 'required'));
        return;
      }
      if (!vals.mobile && !vals.dial_code) {
        mobileWrap.hidden = false;
        mobileField.required = true;
        if (mobileInput) {
          mobileInput.required = true;
          mobileInput.focus();
        }
        statusEl.hidden = false;
        statusEl.textContent = t(lang, 'otpResendNeedMobile');
        changeBtn.hidden = true;
        return;
      }
      statusEl.hidden = false;
      statusEl.textContent = t(lang, 'otpResending');
      resendBtn.disabled = true;
      if (widget && typeof widget.handleOtpResend === 'function') {
        widget
          .handleOtpResend({
            request: request,
            def: def,
            values: vals,
            form: form,
            statusEl: statusEl,
            resendBtn: resendBtn,
          })
          .finally(function () {
            resendBtn.disabled = false;
          });
      } else {
        resendBtn.disabled = false;
        statusEl.hidden = true;
      }
    });
    actions.appendChild(resendBtn);

    var mobileWrap = null;
    var mobileInput = null;
    if (mobileField) {
      var mobileBuilt = buildControlRow(mobileField, lang, prefill);
      mobileWrap = mobileBuilt.wrap;
      mobileWrap.classList.add('qa-form__field--otp-mobile');
      mobileInput = mobileBuilt.input;
      if (mobileField.hiddenUntilChangeMobile) {
        mobileWrap.hidden = true;
      }
    }

    var changeBtn = document.createElement('button');
    changeBtn.type = 'button';
    changeBtn.className = 'qa-form__otp-link';
    changeBtn.textContent = t(lang, 'changeMobile');
    changeBtn.addEventListener('click', function () {
      if (!mobileWrap || !mobileInput) return;
      mobileWrap.hidden = false;
      mobileField.required = true;
      mobileInput.required = true;
      var sub = wrap.querySelector('.qa-form__subtitle');
      if (sub && def.subtitleMobileByLanguage) {
        sub.textContent = langPick(def.subtitleMobileByLanguage, lang);
      }
      if (prefill.mobile != null && String(prefill.mobile).trim()) {
        mobileInput.value = String(prefill.mobile).trim();
      } else if (
        widget &&
        widget.clientContext &&
        widget.clientContext.mobile != null
      ) {
        mobileInput.value = String(widget.clientContext.mobile).trim();
      }
      mobileInput.focus();
      changeBtn.hidden = true;
    });
    actions.appendChild(changeBtn);
    actions.appendChild(statusEl);

    scroll.appendChild(actions);
    if (mobileWrap) scroll.appendChild(mobileWrap);

    form._otpMobileRequired = function () {
      return mobileWrap && !mobileWrap.hidden;
    };
  }

  function isPhonePairField(field, next) {
    if (!field || !next) return false;
    var t1 = String(field.type || '').toLowerCase();
    var t2 = String(next.type || '').toLowerCase();
    return (
      (field.name === 'dial_code' || field.autoDetectDialCode) &&
      t1 === 'select' &&
      (next.name === 'mobile' || t2 === 'tel')
    );
  }

  function buildPhoneRow(dialField, mobileField, lang, prefill, widget) {
    var row = document.createElement('div');
    row.className = 'qa-form__phone-row';

    var dialBuilt = buildControlRow(dialField, lang, prefill, {
      role: 'dial',
      compactDial: true,
      hideIcon: true,
      skipAutoDetect: true,
    });
    var mobileBuilt = buildControlRow(mobileField, lang, prefill, {
      role: 'mobile',
      hideIcon: false,
    });

    row.appendChild(dialBuilt.wrap);
    row.appendChild(mobileBuilt.wrap);

    if (dialField.autoDetectDialCode && dialBuilt.input && dialBuilt.picker) {
      detectDialFromIp(
        dialBuilt.picker,
        dialBuilt.input,
        dialField,
        lang,
        prefill,
        widget
      );
    }

    return row;
  }

  function buildControlRow(field, lang, prefill, rowOpts) {
    rowOpts = rowOpts || {};
    prefill = prefill || {};
    var wrap = document.createElement('div');
    wrap.className = 'qa-form__field';
    if (rowOpts.role === 'dial') wrap.classList.add('qa-form__field--dial');
    if (rowOpts.role === 'mobile') wrap.classList.add('qa-form__field--mobile');
    var type = String(field.type || 'text').toLowerCase();
    var isDialCodeField = field.name === 'dial_code' || field.autoDetectDialCode;

    var controlWrap = document.createElement('div');
    controlWrap.className = 'qa-form__control';
    if (field.icon && ICONS[field.icon] && !rowOpts.hideIcon) {
      var icon = document.createElement('span');
      icon.className = 'qa-form__icon';
      icon.innerHTML = ICONS[field.icon];
      controlWrap.appendChild(icon);
    }

    var input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
    } else if (type === 'select') {
      var isDialCode = isDialCodeField;
      if (isDialCode) {
        var dialBuilt = buildDialPicker(field, lang, prefill);
        input = dialBuilt.input;
        controlWrap.appendChild(dialBuilt.picker);
      } else {
        input = document.createElement('select');
        (field.options || []).forEach(function (opt) {
          var o = document.createElement('option');
          o.value = opt.value != null ? opt.value : opt.label;
          o.textContent = opt.label != null ? opt.label : opt.value;
          input.appendChild(o);
        });
        controlWrap.appendChild(input);
      }
    } else if (type === 'file') {
      input = document.createElement('input');
      input.type = 'file';
      if (field.accept) input.accept = field.accept;
      if (field.multiple) input.multiple = true;
    } else {
      input = document.createElement('input');
      input.type = type === 'tel' ? 'tel' : type;
    }

    if (type !== 'select' || !isDialCodeField) {
      input.className = 'qa-form__input';
    }
    input.id = input.id || field.id || 'qa-f-' + field.name;
    if (field.name && input.name !== field.name) input.name = field.name;
    if (field.required) input.required = true;
    if (field.autocomplete) input.autocomplete = field.autocomplete;
    if (field.inputMode) input.inputMode = field.inputMode;
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.minLength) input.minLength = field.minLength;
    if (field.pattern) input.pattern = field.pattern;
    applyDateConstraints(input, field);

    var phText = fieldPlaceholder(field, lang);
    if (phText && type !== 'select' && type !== 'file') {
      input.placeholder = phText;
    }

    if (prefill[field.name] != null && !(type === 'select' && isDialCodeField)) {
      input.value = String(prefill[field.name]);
    } else if (field.value != null && type !== 'file' && !(type === 'select' && isDialCodeField)) {
      input.value = String(field.value);
    }

    if (type === 'select' && isDialCodeField && field.autoDetectDialCode && prefill[field.name] == null && !rowOpts.skipAutoDetect) {
      var dialPicker = controlWrap.querySelector('.qa-dial-picker');
      if (dialPicker) {
        applyAutoDetectDialCode(
          dialPicker,
          input,
          dialPicker._dialOptions,
          lang,
          prefill
        );
      }
    }

    if (
      type !== 'select' ||
      !isDialCodeField
    ) {
      controlWrap.appendChild(input);
    }
    wrap.appendChild(controlWrap);

    var err = document.createElement('span');
    err.className = 'qa-form__error';
    err.hidden = true;
    wrap.appendChild(err);

    return { wrap: wrap, input: input, picker: controlWrap.querySelector('.qa-dial-picker') };
  }

  function fetchJson(url) {
    return fetch(url)
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return null;
      });
  }

  function renderGeolocationField(field, form, lang, widget, prefill) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-form__field qa-form__field--geo';

    function hidden(id, name, val) {
      var h = document.createElement('input');
      h.type = 'hidden';
      h.id = id;
      h.name = name;
      h.value = val != null ? String(val) : '';
      form.appendChild(h);
      return h;
    }

    var hLat = hidden(field.hiddenLatId || 'geo-lat', 'lat', prefill.lat);
    var hLng = hidden(field.hiddenLngId || 'geo-lng', 'lng', prefill.lng);
    var hBranchId = hidden(
      field.hiddenBranchIdId || 'geo-branchId',
      'branchId',
      prefill.branchId
    );
    var hBranchName = hidden(
      field.hiddenBranchNameId || 'geo-branchName',
      'branchName',
      prefill.branchName
    );
    var hBranchCity = hidden(
      field.hiddenBranchCityId || 'geo-branchCity',
      'branchCity',
      prefill.branchCity
    );
    var hBranchArea = hidden(
      field.hiddenBranchAreaId || 'geo-branchArea',
      'branchArea',
      prefill.branchArea
    );
    var hDist = hidden(
      field.hiddenBranchDistanceKmId || 'geo-branchDistanceKm',
      'branchDistanceKm',
      prefill.branchDistanceKm
    );

    var intro = document.createElement('p');
    intro.className = 'qa-form__geo-intro';
    intro.textContent = langPick(field.introByLanguage, lang);
    wrap.appendChild(intro);

    var status = document.createElement('p');
    status.className = 'qa-form__geo-status';
    status.hidden = true;
    wrap.appendChild(status);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qa-form__geo-btn';
    btn.textContent = langPick(field.buttonLabelByLanguage, lang) || 'Use my location';
    wrap.appendChild(btn);

    var list = document.createElement('div');
    list.className = 'qa-form__geo-list';
    list.hidden = true;
    wrap.appendChild(list);

    var picked = document.createElement('p');
    picked.className = 'qa-form__geo-picked';
    picked.hidden = true;
    wrap.appendChild(picked);

    var err = document.createElement('span');
    err.className = 'qa-form__error';
    err.hidden = true;
    wrap.appendChild(err);

    function showStatus(msg) {
      status.textContent = msg;
      status.hidden = !msg;
    }

    function selectBranch(b) {
      hBranchId.value = b.id || '';
      hBranchName.value = b.name || '';
      hBranchCity.value = b.city || '';
      hBranchArea.value = b.area || '';
      hDist.value = b.distanceKm != null ? String(b.distanceKm) : '';
      picked.textContent =
        (b.name || '') +
        (b.area ? ' — ' + b.area : '') +
        (b.city ? ', ' + b.city : '') +
        (b.distanceKm != null ? ' (' + b.distanceKm + ' km)' : '');
      picked.hidden = false;
      list.hidden = true;
      err.hidden = true;
      wrap.classList.remove('qa-form__field--invalid');
    }

    btn.addEventListener('click', function () {
      if (!global.navigator || !navigator.geolocation) {
        showStatus(langPick(field.unsupportedByLanguage, lang));
        return;
      }
      showStatus(langPick(field.locatingByLanguage, lang));
      list.hidden = true;
      picked.hidden = true;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          hLat.value = String(lat);
          hLng.value = String(lng);
          var base = apiBase(widget);
          if (!base) {
            showStatus(langPick(field.fetchFailedByLanguage, lang));
            return;
          }
          var limit = field.resultLimit || 5;
          fetchJson(
            base +
              '/api/nearest-branches?lat=' +
              encodeURIComponent(lat) +
              '&lng=' +
              encodeURIComponent(lng) +
              '&limit=' +
              encodeURIComponent(limit)
          ).then(function (data) {
            showStatus('');
            var branches = (data && data.branches) || [];
            list.innerHTML = '';
            if (!branches.length) {
              showStatus(langPick(field.noResultsByLanguage, lang));
              return;
            }
            var prompt = document.createElement('p');
            prompt.className = 'qa-form__geo-prompt';
            prompt.textContent = langPick(field.pickPromptByLanguage, lang);
            list.appendChild(prompt);
            branches.forEach(function (b) {
              var row = document.createElement('div');
              row.className = 'qa-form__geo-item';
              var label = document.createElement('span');
              label.textContent =
                b.name +
                ' — ' +
                (b.area || b.city || '') +
                (b.distanceKm != null ? ' · ' + b.distanceKm + ' km' : '');
              var pickBtn = document.createElement('button');
              pickBtn.type = 'button';
              pickBtn.className = 'qa-form__geo-pick';
              pickBtn.textContent = langPick(field.bookButtonLabelByLanguage, lang) || 'Select';
              pickBtn.addEventListener('click', function () {
                selectBranch(b);
              });
              row.appendChild(label);
              row.appendChild(pickBtn);
              list.appendChild(row);
            });
            list.hidden = false;
            btn.textContent = langPick(field.retryButtonLabelByLanguage, lang) || btn.textContent;
          });
        },
        function () {
          showStatus(langPick(field.permissionDeniedByLanguage, lang));
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    });

    wrap._validateGeo = function () {
      if (!hBranchId.value) {
        err.textContent = t(lang, 'required');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        return false;
      }
      return true;
    };

    return wrap;
  }

  function normalizeApptFormId(formId) {
    var id = String(formId || 'appointment')
      .trim()
      .toLowerCase();
    if (id === 'general' || id === 'appintmentformgeneral' || id === 'appintmentformdoctor') {
      return 'appointment';
    }
    return id || 'appointment';
  }

  function isAppointmentCalendarField(field, def) {
    var t = String((field && field.type) || '').toLowerCase();
    return (
      t === 'appointment' ||
      t === 'appointmentgeneral' ||
      t === 'appointmentdoctor' ||
      String((def && def.formType) || '').toLowerCase() === 'appointment'
    );
  }

  function apptSlotsQuery(formId, dateIso) {
    return (
      '/api/appointment-slots?formId=' +
      encodeURIComponent(normalizeApptFormId(formId)) +
      '&date=' +
      encodeURIComponent(dateIso)
    );
  }

  function apptMonthQuery(formId, year, monthIndex) {
    return (
      '/api/appointment-month?formId=' +
      encodeURIComponent(normalizeApptFormId(formId)) +
      '&year=' +
      encodeURIComponent(year) +
      '&month=' +
      encodeURIComponent(monthIndex + 1)
    );
  }

  function renderAppointmentCalendar(field, form, lang, widget, prefill, formId) {
    formId = normalizeApptFormId(formId);
    var wrap = document.createElement('div');
    wrap.className = 'qa-form__field qa-form__field--calendar';

    var dateHidden = document.createElement('input');
    dateHidden.type = 'hidden';
    dateHidden.name = 'appointmentdate';
    dateHidden.id = field.hiddenDateId || field.id + '-date';
    var initialDate = prefill.appointmentdate || '';
    if (isPastAppointmentDate(initialDate)) {
      initialDate = '';
    }
    dateHidden.value = initialDate;

    var timeHidden = document.createElement('input');
    timeHidden.type = 'hidden';
    timeHidden.name = 'appointmenttime';
    timeHidden.id = field.hiddenTimeId || field.id + '-time';
    timeHidden.value = isPastAppointmentDate(prefill.appointmentdate)
      ? ''
      : to24hClient(prefill.appointmenttime || '');

    form.appendChild(dateHidden);
    form.appendChild(timeHidden);

    var nav = document.createElement('div');
    nav.className = 'qa-form-cal__nav';
    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'qa-form-cal__nav-btn';
    prevBtn.setAttribute('aria-label', t(lang, 'calPrev'));
    prevBtn.textContent = '‹';
    var monthLabel = document.createElement('span');
    monthLabel.className = 'qa-form-cal__month';
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'qa-form-cal__nav-btn';
    nextBtn.setAttribute('aria-label', t(lang, 'calNext'));
    nextBtn.textContent = '›';
    nav.appendChild(prevBtn);
    nav.appendChild(monthLabel);
    nav.appendChild(nextBtn);
    wrap.appendChild(nav);

    var grid = document.createElement('div');
    grid.className = 'qa-form-cal__grid';
    wrap.appendChild(grid);

    var slotsHead = document.createElement('div');
    slotsHead.className = 'qa-form-cal__slots-head';
    slotsHead.hidden = true;
    var slotsTitle = document.createElement('p');
    slotsTitle.className = 'qa-form-cal__slots-title';
    slotsTitle.textContent = t(lang, 'calPickTime');
    var legend = document.createElement('p');
    legend.className = 'qa-form-cal__legend';
    legend.textContent = t(lang, 'calBookedLegend');
    slotsHead.appendChild(slotsTitle);
    slotsHead.appendChild(legend);
    wrap.appendChild(slotsHead);

    var slotsWrap = document.createElement('div');
    slotsWrap.className = 'qa-form-cal__slots';
    slotsWrap.hidden = true;
    wrap.appendChild(slotsWrap);

    var err = document.createElement('span');
    err.className = 'qa-form__error';
    err.hidden = true;
    wrap.appendChild(err);

    var view = new Date();
    view.setDate(1);
    var bookedDates = [];
    var closedDates = [];
    var calAllowToday = true;
    var calBookingMin = '';
    var calBookingMax = '';
    var calMaxBookingDays = 30;
    var calBusinessTz = '';
    var selectedDate = dateHidden.value || '';

    function calendarTodayIso() {
      return calBusinessTz ? todayIsoInTimeZone(calBusinessTz) : todayLocalIso();
    }

    function applyTimezoneFromApi(data) {
      if (data && data.timezone) calBusinessTz = String(data.timezone).trim();
    }

    function filterPastSlotsClient(slotList, iso, hidePast) {
      if (!hidePast || iso !== calendarTodayIso()) return slotList;
      var nowM = calBusinessTz
        ? nowMinutesInTimeZone(calBusinessTz)
        : (function () {
            var d = new Date();
            return d.getHours() * 60 + d.getMinutes();
          })();
      return slotList.filter(function (s) {
        var slot24 = s.time24 || to24hClient(s.time);
        var p = parseTime24Client(slot24);
        if (!p) return true;
        return p.h * 60 + p.min > nowM;
      });
    }

    function addDaysIsoClient(iso, days) {
      var p = String(iso || '').split('-').map(Number);
      var d = new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
      d.setDate(d.getDate() + days);
      return localDateIso(d);
    }

    function applyBookingWindowFromApi(data) {
      if (!data) return;
      applyTimezoneFromApi(data);
      if (data.allowToday === false) calAllowToday = false;
      if (data.bookingWindow) {
        calBookingMin = data.bookingWindow.min || '';
        calBookingMax = data.bookingWindow.max || '';
        calMaxBookingDays = data.bookingWindow.maxBookingDays || calMaxBookingDays;
      } else if (data.maxBookingDays) {
        calMaxBookingDays = data.maxBookingDays;
        var today = calendarTodayIso();
        calBookingMin = calAllowToday ? today : addDaysIsoClient(today, 1);
        calBookingMax = addDaysIsoClient(calBookingMin, calMaxBookingDays - 1);
      }
    }

    function defaultBookingWindow() {
      var today = calendarTodayIso();
      calBookingMin = calAllowToday ? today : addDaysIsoClient(today, 1);
      calBookingMax = addDaysIsoClient(calBookingMin, calMaxBookingDays - 1);
    }
    defaultBookingWindow();

    function monthKey(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function fetchMonthBooked() {
      var base = apiBase(widget);
      var y = view.getFullYear();
      var m = view.getMonth();
      bookedDates = [];
      closedDates = [];
      grid.classList.remove('qa-form-cal__grid--busy');
      if (!base) return Promise.resolve();
      grid.classList.add('qa-form-cal__grid--busy');
      return fetchJson(base + apptMonthQuery(formId, y, m))
        .then(function (data) {
          if (!data) return;
          applyBookingWindowFromApi(data);
          closedDates = Array.isArray(data.closedDates) ? data.closedDates.slice() : [];
          bookedDates = Array.isArray(data.bookedDates) ? data.bookedDates.slice() : [];
        })
        .finally(function () {
          grid.classList.remove('qa-form-cal__grid--busy');
        });
    }

    function renderSlots(iso) {
      if (String(iso || '').trim() < calendarTodayIso()) {
        slotsWrap.innerHTML = '';
        slotsHead.hidden = true;
        slotsWrap.hidden = true;
        dateHidden.value = '';
        timeHidden.value = '';
        selectedDate = '';
        return;
      }
      slotsWrap.innerHTML = '';
      slotsHead.hidden = false;
      slotsWrap.hidden = false;
      var base = apiBase(widget);
      if (!base) return;
      slotsWrap.classList.add('qa-form-cal__slots--loading');
      fetchJson(base + apptSlotsQuery(formId, iso)).then(function (data) {
        slotsWrap.classList.remove('qa-form-cal__slots--loading');
        applyTimezoneFromApi(data);
        if (data && data.noAvailableSlots) {
          slotsWrap.innerHTML = '';
          var goneMsg = document.createElement('p');
          goneMsg.className = 'qa-form-cal__closed-msg';
          goneMsg.textContent =
            iso === calendarTodayIso()
              ? t(lang, 'calNoMoreSlotsToday')
              : t(lang, 'calClosedDay');
          slotsWrap.appendChild(goneMsg);
          return;
        }
        if (data && data.closed) {
          slotsWrap.innerHTML = '';
          var closedMsg = document.createElement('p');
          closedMsg.className = 'qa-form-cal__closed-msg';
          closedMsg.textContent = t(lang, 'calClosedDay');
          slotsWrap.appendChild(closedMsg);
          dateHidden.value = '';
          timeHidden.value = '';
          selectedDate = '';
          return;
        }
        var slotList = (data && data.slots) || [];
        if (data && data.hidePastTimesToday) {
          slotList = filterPastSlotsClient(slotList, iso, true);
        }
        if (!slotList.length) {
          var emptyMsg = document.createElement('p');
          emptyMsg.className = 'qa-form-cal__closed-msg';
          emptyMsg.textContent =
            iso === calendarTodayIso()
              ? t(lang, 'calNoMoreSlotsToday')
              : t(lang, 'calClosedDay');
          slotsWrap.appendChild(emptyMsg);
          return;
        }
        slotList.forEach(function (s) {
          var slot24 = s.time24 || to24hClient(s.time);
          var slot12 = s.time || to12hClient(slot24);
          var isFull = s.status === 'full';
          var cap = s.capacity || 1;
          var bookedN = s.booked || 0;
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'qa-form-cal__slot';
          if (isFull) {
            b.classList.add('qa-form-cal__slot--full');
            b.disabled = true;
          } else {
            b.classList.add('qa-form-cal__slot--available');
            b.setAttribute('data-slot-status', 'available');
          }
          b.textContent =
            cap > 1 ? slot12 + ' (' + bookedN + '/' + cap + ')' : slot12;
          b.setAttribute('data-slot-24', slot24);
          if (to24hClient(timeHidden.value) === slot24 && dateHidden.value === iso) {
            b.classList.add('qa-form-cal__slot--active');
          }
          b.addEventListener(
            'click',
            (function (d, t24, full, btn) {
              return function () {
                if (full) return;
                dateHidden.value = d;
                timeHidden.value = t24;
                selectedDate = d;
                slotsWrap.querySelectorAll('.qa-form-cal__slot').forEach(function (el) {
                  el.classList.remove('qa-form-cal__slot--active');
                });
                btn.classList.add('qa-form-cal__slot--active');
                err.hidden = true;
              };
            })(iso, slot24, isFull, b)
          );
          slotsWrap.appendChild(b);
        });
      });
    }

    function renderGrid() {
      var y = view.getFullYear();
      var m = view.getMonth();
      monthLabel.textContent = view.toLocaleString(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN', {
        month: 'long',
        year: 'numeric',
      });
      grid.innerHTML = '';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) {
        var h = document.createElement('span');
        h.className = 'qa-form-cal__dow';
        h.textContent = d;
        grid.appendChild(h);
      });
      var first = new Date(y, m, 1).getDay();
      var days = new Date(y, m + 1, 0).getDate();
      var today = calendarTodayIso();
      for (var i = 0; i < first; i += 1) {
        var pad = document.createElement('span');
        pad.className = 'qa-form-cal__pad';
        grid.appendChild(pad);
      }
      for (var day = 1; day <= days; day += 1) {
        var iso =
          y +
          '-' +
          String(m + 1).padStart(2, '0') +
          '-' +
          String(day).padStart(2, '0');
        var cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'qa-form-cal__day';
        cell.textContent = String(day);
        var isPast = iso < today;
        var isTodayBlocked = iso === today && !calAllowToday;
        var isOutside =
          (calBookingMin && iso < calBookingMin) || (calBookingMax && iso > calBookingMax);
        var isClosed = closedDates.indexOf(iso) >= 0;
        if (isPast || isTodayBlocked || isOutside) {
          cell.disabled = true;
          cell.classList.add('qa-form-cal__day--past');
        } else if (isClosed) {
          cell.disabled = true;
          cell.classList.add('qa-form-cal__day--closed');
        } else if (bookedDates.indexOf(iso) >= 0) {
          cell.classList.add('qa-form-cal__day--booked');
          cell.classList.add('qa-form-cal__day--full');
        }
        if (iso === selectedDate) {
          cell.classList.add('qa-form-cal__day--active');
        }
        cell.addEventListener(
          'click',
          (function (d, closed, todayBlocked, outside, dayBtn) {
            return function () {
              if (d < today || closed || todayBlocked || outside) return;
              selectedDate = d;
              dateHidden.value = d;
              grid.querySelectorAll('.qa-form-cal__day').forEach(function (el) {
                el.classList.remove('qa-form-cal__day--active');
              });
              dayBtn.classList.add('qa-form-cal__day--active');
              renderSlots(d);
            };
          })(iso, isClosed, isTodayBlocked, isOutside, cell)
        );
        grid.appendChild(cell);
      }
    }

    function syncPrevNav() {
      var now = new Date();
      var atCurrentMonth =
        view.getFullYear() === now.getFullYear() && view.getMonth() === now.getMonth();
      prevBtn.disabled = atCurrentMonth;
      prevBtn.classList.toggle('qa-form-cal__nav-btn--disabled', atCurrentMonth);
    }

    prevBtn.addEventListener('click', function () {
      if (prevBtn.disabled) return;
      view.setMonth(view.getMonth() - 1);
      renderGrid();
      syncPrevNav();
      fetchMonthBooked().then(renderGrid);
    });
    nextBtn.addEventListener('click', function () {
      view.setMonth(view.getMonth() + 1);
      renderGrid();
      syncPrevNav();
      fetchMonthBooked().then(renderGrid);
    });

    renderGrid();
    syncPrevNav();
    fetchMonthBooked().then(function () {
      renderGrid();
      if (dateHidden.value && !isPastAppointmentDate(dateHidden.value)) {
        renderSlots(dateHidden.value);
      }
    });

    wrap._validateAppt = function () {
      if (!dateHidden.value || !timeHidden.value) {
        err.textContent = t(lang, 'required');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        return false;
      }
      if (isPastAppointmentDate(dateHidden.value)) {
        err.textContent = t(lang, 'invalidFutureDate');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        dateHidden.value = '';
        timeHidden.value = '';
        selectedDate = '';
        renderGrid();
        return false;
      }
      if (closedDates.indexOf(dateHidden.value) >= 0) {
        err.textContent = t(lang, 'calClosedDay');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        return false;
      }
      if (dateHidden.value === calendarTodayIso() && !calAllowToday) {
        err.textContent = t(lang, 'calTodayHidden');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        return false;
      }
      if (
        dateHidden.value &&
        ((calBookingMin && dateHidden.value < calBookingMin) ||
          (calBookingMax && dateHidden.value > calBookingMax))
      ) {
        err.textContent = t(lang, 'calOutsideWindow');
        err.hidden = false;
        wrap.classList.add('qa-form__field--invalid');
        return false;
      }
      err.hidden = true;
      wrap.classList.remove('qa-form__field--invalid');
      return true;
    };

    return wrap;
  }

  function collectFieldValues(def, form, lang, hiddenStore) {
    var values = {};
    var valid = true;

    (def.fields || []).forEach(function (field) {
      if (!field || !field.name) return;
      var type = String(field.type || 'text').toLowerCase();

      if (type === 'hidden') {
        values[field.name] = hiddenStore[field.name]
          ? hiddenStore[field.name].value
          : '';
        return;
      }

      if (type === 'geolocation') {
        values.branchId = (form.querySelector('[name="branchId"]') || {}).value || '';
        values.branchName = (form.querySelector('[name="branchName"]') || {}).value || '';
        values.branchCity = (form.querySelector('[name="branchCity"]') || {}).value || '';
        values.branchArea = (form.querySelector('[name="branchArea"]') || {}).value || '';
        values.branchDistanceKm =
          (form.querySelector('[name="branchDistanceKm"]') || {}).value || '';
        values.lat = (form.querySelector('[name="lat"]') || {}).value || '';
        values.lng = (form.querySelector('[name="lng"]') || {}).value || '';
        var geoWrap = form.querySelector('.qa-form__field--geo');
        if (field.required !== false && geoWrap && geoWrap._validateGeo && !geoWrap._validateGeo()) {
          valid = false;
        }
        return;
      }

      if (isAppointmentCalendarField(field, def)) {
        values.appointmentdate =
          (form.querySelector('[name="appointmentdate"]') || {}).value || '';
        var apptTimeRaw =
          (form.querySelector('[name="appointmenttime"]') || {}).value || '';
        values.appointmenttime = to12hClient(apptTimeRaw);
        var calWrap = form.querySelector('.qa-form__field--calendar');
        if (field.required !== false && calWrap && calWrap._validateAppt && !calWrap._validateAppt()) {
          valid = false;
        }
        return;
      }

      if (type === 'file') {
        var fileInput =
          form._uploadInput ||
          form.querySelector('#' + (field.id || 'qa-f-' + field.name));
        var names = [];
        var files = form._selectedFiles;
        if (files && files.length) {
          files.forEach(function (f) {
            names.push(f.name);
          });
        } else if (fileInput && fileInput.files && fileInput.files.length) {
          for (var fi = 0; fi < fileInput.files.length; fi += 1) {
            names.push(fileInput.files[fi].name);
          }
        }
        values[field.name] = names.join(', ');
        if (field.required && !names.length) {
          valid = false;
          if (fileInput) showFieldError(fileInput, t(lang, 'required'));
        }
        return;
      }

      var input = form.querySelector('[name="' + field.name + '"]');
      var raw = input ? (input.tagName === 'SELECT' ? input.value : input.value) : '';
      if (field.name === 'appointmenttime' || field.type === 'time') {
        raw = to12hClient(raw);
      }
      values[field.name] = raw;
      var errMsg = validateValue(field, raw, lang);
      if (errMsg) {
        valid = false;
        if (input) showFieldError(input, errMsg);
      }
    });

    return { values: values, valid: valid };
  }

  function formHasHeavyFields(def) {
    return (def.fields || []).some(function (f) {
      var t = String((f && f.type) || '').toLowerCase();
      return isAppointmentCalendarField(f, def) || t === 'geolocation';
    });
  }

  function scaledFormMaxHeight(def, formId) {
    var n = Number(def && def.maxCardHeightPx) || 0;
    formId = String(formId || '').toLowerCase();
    if (formId === 'contact') {
      return Math.max(n, 380);
    }
    if (formId === 'upload' || formId === 'uploaddocument') {
      return Math.max(n, 320);
    }
    if (
      formId === 'appointment' ||
      formId === 'appintmentformgeneral' ||
      formId === 'appintmentformdoctor'
    ) {
      return Math.max(n, 480);
    }
    if (!formHasHeavyFields(def)) {
      return Math.max(n, 300);
    }
    if (!n || n <= 0) return 320;
    return Math.min(Math.round(n * 0.75), 480);
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
    if (isUploadForm(def, formId)) wrap.classList.add('qa-form--upload');
    wrap.style.maxHeight = scaledFormMaxHeight(def, formId) + 'px';

    var header = document.createElement('div');
    header.className = 'qa-form__header qa-form__header--with-close';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'qa-form__close';
    closeBtn.setAttribute('aria-label', t(lang, 'closeForm'));
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function () {
      if (widget && typeof widget.handleFormClose === 'function') {
        widget.handleFormClose({
          formId: formId,
          request: request,
          formEl: wrap,
        });
      } else {
        wrap.classList.add('qa-form--closed');
      }
    });
    header.appendChild(closeBtn);

    var titleEl = document.createElement('h3');
    titleEl.className = 'qa-form__title';
    titleEl.textContent = langPick(def.titleByLanguage, lang);
    header.appendChild(titleEl);
    if (def.showSubtitle !== false) {
      var subText = '';
      if (isMobileViewport() && def.subtitleMobileByLanguage) {
        subText = langPick(def.subtitleMobileByLanguage, lang);
      } else {
        subText = langPick(def.subtitleByLanguage, lang);
      }
      if (!subText && request && request.message) subText = request.message;
      if (subText) {
        var sub = document.createElement('p');
        sub.className = 'qa-form__subtitle';
        sub.textContent = subText;
        header.appendChild(sub);
      }
    }
    wrap.appendChild(header);

    var form = document.createElement('form');
    form.className = 'qa-form__form';
    form.noValidate = true;

    var scroll = document.createElement('div');
    scroll.className = 'qa-form__scroll';

    var hiddenStore = {};
    var fieldsList = def.fields || [];

    if (isOtpForm(def, formId)) {
      renderOtpForm(scroll, form, wrap, def, lang, prefill, widget, request);
    }

    for (var fi = 0; fi < fieldsList.length; fi += 1) {
      if (isOtpForm(def, formId)) break;
      var field = fieldsList[fi];
      if (!field || !field.name) continue;
      var type = String(field.type || 'text').toLowerCase();
      var nextField = fieldsList[fi + 1];

      if (isPhonePairField(field, nextField)) {
        scroll.appendChild(buildPhoneRow(field, nextField, lang, prefill, widget));
        fi += 1;
        continue;
      }

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
        continue;
      }

      if (type === 'geolocation') {
        scroll.appendChild(renderGeolocationField(field, form, lang, widget, prefill));
        continue;
      }

      if (isAppointmentCalendarField(field, def)) {
        scroll.appendChild(
          renderAppointmentCalendar(field, form, lang, widget, prefill, formId)
        );
        continue;
      }

      if (type === 'file' && isUploadForm(def, formId)) {
        scroll.appendChild(renderUploadFileField(field, lang, form).wrap);
        continue;
      }

      var built = buildControlRow(field, lang, prefill);
      scroll.appendChild(built.wrap);
    }

    var footer = document.createElement('div');
    footer.className = 'qa-form__footer';

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'qa-form__submit';
    submit.textContent =
      langPick(def.submitLabelByLanguage, lang) || t(lang, 'submit');
    footer.appendChild(submit);

    form.appendChild(scroll);
    form.appendChild(footer);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (wrap.classList.contains('qa-form--submitted')) return;

      form.querySelectorAll('.qa-form__error').forEach(function (el) {
        el.hidden = true;
        el.textContent = '';
      });
      form.querySelectorAll('.qa-form__field--invalid').forEach(function (el) {
        el.classList.remove('qa-form__field--invalid');
      });

      if (form._otpMobileRequired && form._otpMobileRequired()) {
        var mobileFieldDef = (def.fields || []).find(function (f) {
          return f && f.name === 'mobile';
        });
        var mobileIn = form.querySelector('[name="mobile"]');
        if (mobileFieldDef && mobileIn) {
          var mobileErr = validateValue(mobileFieldDef, mobileIn.value, lang);
          if (mobileErr) {
            showFieldError(mobileIn, mobileErr);
            return;
          }
        }
      }

      var result = collectFieldValues(def, form, lang, hiddenStore);
      if (!result.valid) return;

      wrap.classList.add('qa-form--submitted');
      form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = true;
      });

      var nextFormId = resolveNextFormId(def, request || {});
      if (widget && typeof widget.handleFormSubmit === 'function') {
        widget.handleFormSubmit({
          formId: formId,
          values: result.values,
          def: def,
          request: request,
          formEl: wrap,
          nextFormId: nextFormId,
          summaryText: buildSummaryText(formId, result.values, def, lang),
          dialogflowText: formatSubmission(formId, result.values, def, lang),
        });
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  global.QAChatForm = {
    buildFormEl: buildFormEl,
    formatSubmission: formatSubmission,
    formatOtpResend: formatOtpResend,
    buildSummaryText: buildSummaryText,
    resolveFormAction: resolveFormAction,
    resolveNextFormId: resolveNextFormId,
    getFormDef: getFormDef,
    isFormsEnabled: isFormsEnabled,
  };
})(typeof window !== 'undefined' ? window : globalThis);
