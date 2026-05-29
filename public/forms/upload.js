/**
 * Form: document upload — `form_id`: "upload" or "uploadDocument".
 */
(function (w) {
  w.__DFCHAT_FORMS__ = w.__DFCHAT_FORMS__ || {};
  var uploadFormDef = {
    /** Staff script / Sheets / API id (not the registry key `uploadDocument`). */
    staffFormLabel: "upload",
    formType: "upload",
    titleByLanguage: {
      en: "Upload document",
      hi: "दस्तावेज़ अपलोड करें",
      mr: "दस्तऐवज अपलोड करा"
    },
    subtitleByLanguage: {
      en: "Select your files, then submit. Complete Contact us first if we need your mobile on file.",
      hi: "फ़ाइलें चुनें, फिर जमा करें। मोबाइल नंबर के लिए पहले संपर्क फॉर्म भरें।",
      mr: "फाइल निवडा, नंतर सबमिट करा. मोबाईलसाठी आधी संपर्क फॉर्म भरा."
    },
    showSubtitle: true,
    maxCardHeightPx: 300,
    chatSummaryFieldNames: ["document"],
    fields: [
      {
        id: "u-document",
        name: "document",
        type: "file",
        required: true,
        multiple: true,
        icon: "file",
        i18nSummaryLabel: "summaryDocumentLabel",
        accept: "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-zip-compressed",
        placeholderByLanguage: {
          en: "Upload files",
          hi: "फ़ाइल अपलोड करें",
          mr: "फाइल अपलोड करा"
        }
      }
    ]
  };
  w.__DFCHAT_FORMS__.upload = uploadFormDef;
  w.__DFCHAT_FORMS__.uploadDocument = uploadFormDef;
})(typeof window !== "undefined" ? window : globalThis);
