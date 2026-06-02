/**
 * Appointment calendar — Dialogflow `form_id`: "appointment"
 * Schedule: data/appointment-schedule.json → forms.appointment
 * Booked:   data/appointment-booked.json   → forms.appointment
 */
(function (w) {
  w.__DFCHAT_FORMS__ = w.__DFCHAT_FORMS__ || {};
  var def = {
    staffFormLabel: "appointment",
    formType: "appointment",
    titleByLanguage: {
      en: "Appointment",
      hi: "अपॉइंटमेंट",
      mr: "अपॉइंटमेंट"
    },
    subtitleByLanguage: {
      en: "Green = slot available. Red = full. Pick date, then time.",
      hi: "हरा = खाली स्लॉट। लाल = भरा। तारीख, फिर समय चुनें।",
      mr: "हिरवा = उपलब्ध. लाल = भरले. तारीख, नंतर वेळ."
    },
    showSubtitle: true,
    maxCardHeightPx: 540,
    chatSummaryFieldNames: ["appointmentdate", "appointmenttime"],
    fields: [
      {
        id: "appt-cal",
        name: "appointmentdate",
        type: "appointment",
        required: true,
        icon: "calendar",
        hiddenDateId: "appt-date",
        hiddenTimeId: "appt-time",
        i18nSummaryLabel: "summaryDateLabel",
        placeholderByLanguage: {
          en: "Calendar below",
          hi: "नीचे कैलेंडर",
          mr: "खाली दिनदर्शिका"
        }
      }
    ]
  };
  w.__DFCHAT_FORMS__.appointment = def;
  /** Purana Dialogflow form_id — same form */
  w.__DFCHAT_FORMS__.appintmentformgeneral = def;
})(typeof window !== "undefined" ? window : globalThis);
