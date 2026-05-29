/**
 * Form: contact — default `open_form` / `form_id`: "contact".
 * Load before `company.config.js` (see `chat-frame.html`).
 */
(function (w) {
  w.__DFCHAT_FORMS__ = w.__DFCHAT_FORMS__ || {};
  w.__DFCHAT_FORMS__.contact = {
    staffFormLabel: "contact",
    titleByLanguage: {
      en: "Contact us",
      hi: "हमसे संपर्क करें",
      mr: "आमच्याशी संपर्क करा"
    },
    subtitleByLanguage: {
      en: "Share your contact details.",
      hi: "अपनी जानकारी साझा करें।",
      mr: "तुमची माहिती शेअर करा."
    },
    showSubtitle: true,
    maxCardHeightPx: 300,
    // Optional static chaining. Prefer Dialogflow `open_form`: `next_form_id` + `following_form_id` + `third_form_id`, or `next_form_ids` array.
    // nextFormId: "uploadDocument",
    chatSummaryFieldNames: ["name", "dial_code", "mobile", "email"],
    fields: [
      { id: "c-name", name: "name", type: "text", required: true, icon: "user", i18nPlaceholder: "namePlaceholder", i18nSummaryLabel: "summaryNameLabel", autocomplete: "name" },
      {
        id: "c-dial-code",
        name: "dial_code",
        type: "select",
        required: true,
        icon: "phone",
        i18nPlaceholder: "dialCodePlaceholder",
        i18nSummaryLabel: "summaryDialCodeLabel",
        autoDetectDialCode: true,
        options: [
          { flag: "🇮🇳", value: "+91" },
          { flag: "🇺🇸", value: "+1" },
          { flag: "🇨🇦", value: "+1" },
          { flag: "🇬🇧", value: "+44" },
          { flag: "🇦🇪", value: "+971" },
          { flag: "🇦🇺", value: "+61" },
          { flag: "🇸🇬", value: "+65" },
          { flag: "🇸🇦", value: "+966" },
          { flag: "🇶🇦", value: "+974" },
          { flag: "🇴🇲", value: "+968" },
          { flag: "🇰🇼", value: "+965" },
          { flag: "🇧🇭", value: "+973" },
          { flag: "🇳🇵", value: "+977" },
          { flag: "🇧🇩", value: "+880" },
          { flag: "🇱🇰", value: "+94" },
          { flag: "🇵🇰", value: "+92" },
          { flag: "🇲🇾", value: "+60" },
          { flag: "🇩🇪", value: "+49" },
          { flag: "🇫🇷", value: "+33" },
          { flag: "🇮🇹", value: "+39" },
          { flag: "🇪🇸", value: "+34" }
        ]
      },
      { id: "c-mobile", name: "mobile", type: "tel", required: true, icon: "phone", i18nPlaceholder: "mobilePlaceholder", i18nSummaryLabel: "summaryMobileLabel", autocomplete: "tel", inputMode: "tel" },
      { id: "c-email", name: "email", type: "email", required: true, icon: "email", validateAs: "email", i18nPlaceholder: "emailPlaceholder", i18nSummaryLabel: "summaryEmailLabel", autocomplete: "email" }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
