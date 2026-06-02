/**
 * One Google Sheet row per conversation (session) — canonical headers.
 */

const sheets = require('./sheets');
const chatTranscript = require('./chat-transcript');

const TZ = process.env.SHEETS_CONV_DATETIME_TZ || 'Asia/Kolkata';

/** Row 1 headers — match your Google Sheet exactly. */
const SHEET_HEADERS = [
  'Conv. Link',
  'Conv. Date',
  'Conv. Time',
  'Name',
  'Mobile',
  'Email',
  'Channel',
  'User Queries',
  'Repeated User',
  'Source URL',
  'Session ID',
  'Device',
  'Browser',
  'OS',
  'City',
  'IP Address',
  'App. Booked',
  'App. Date',
  'App. Time',
  'Document',
  'Sentiment',
  'Rating',
  'Feedback',
  'Duration',
  'CRM Push Status',
  'Message Count',
  'Average Response Time',
  'UtmCampaign',
  'UtmContent',
  'UtmMedium',
  'UtmSource',
  'UtmTerm',
  'Fall back',
];

const syncTimers = new Map();

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { timeZone: TZ });
}

function formatTime(d) {
  return d.toLocaleTimeString('en-IN', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function scalar(v) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v).trim();
}

function userQueriesFromTurns(turns) {
  return turns
    .filter((t) => t.role === 'user')
    .map((t) => t.text)
    .filter(Boolean)
    .join(' | ')
    .slice(0, 2000);
}

function computeMetrics(turns) {
  const userBot = turns.filter((t) => t.role === 'user' || t.role === 'bot');
  const count = userBot.length;
  if (!turns.length) {
    return { duration: '', messageCount: '0', avgResponse: '' };
  }
  const t0 = Date.parse(turns[0].at || '');
  const t1 = Date.parse(turns[turns.length - 1].at || '');
  let duration = '';
  if (Number.isFinite(t0) && Number.isFinite(t1) && t1 >= t0) {
    const sec = Math.round((t1 - t0) / 1000);
    duration = sec < 60 ? sec + 's' : Math.round(sec / 60) + 'm';
  }
  const gaps = [];
  for (let i = 0; i < turns.length - 1; i += 1) {
    if (turns[i].role !== 'user') continue;
    const next = turns[i + 1];
    if (!next || next.role !== 'bot') continue;
    const a = Date.parse(turns[i].at || '');
    const b = Date.parse(next.at || '');
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
      gaps.push((b - a) / 1000);
    }
  }
  let avgResponse = '';
  if (gaps.length) {
    const avg = gaps.reduce((s, x) => s + x, 0) / gaps.length;
    avgResponse = avg < 60 ? Math.round(avg) + 's' : (avg / 60).toFixed(1) + 'm';
  }
  return {
    duration,
    messageCount: String(count),
    avgResponse,
  };
}

function buildRowValues(doc) {
  const meta = doc.meta || {};
  const turns = doc.turns || [];
  const sid = doc.sessionId || '';
  const started = turns[0] && turns[0].at ? new Date(turns[0].at) : new Date();
  const metrics = computeMetrics(turns);
  const link = sheets.transcriptUrl(sid);
  const convLink = link
    ? `=HYPERLINK("${link.replace(/"/g, '""')}","Chat")`
    : '';

  const apptDate = meta.appointmentdate || meta.appointment_date || '';
  const apptTime = meta.appointmenttime || meta.appointment_time || '';

  return [
    convLink,
    formatDate(started),
    formatTime(started),
    scalar(meta.name),
    scalar(meta.mobile || meta.phone),
    scalar(meta.email),
    scalar(meta.channel || 'Web'),
    userQueriesFromTurns(turns),
    scalar(meta.repeatedUser),
    scalar(meta.sourceUrl || meta.pageUrl || meta.url),
    sid,
    scalar(meta.device),
    scalar(meta.browser),
    scalar(meta.os),
    scalar(meta.city),
    scalar(meta.ip || meta.ipAddress),
    apptDate || apptTime ? 'yes' : scalar(meta.appointmentBooked),
    scalar(meta.appointmentDateDisplay || apptDate),
    scalar(meta.appointmentTimeDisplay || apptTime),
    scalar(meta.document || meta.upload),
    scalar(meta.sentiment),
    scalar(meta.rating || meta.feedbackRating),
    scalar(meta.feedback || meta.feedbackMessage || meta.message_feedback),
    metrics.duration,
    scalar(meta.crmPushStatus),
    metrics.messageCount,
    metrics.avgResponse,
    scalar(meta.utm_campaign || meta.utmCampaign),
    scalar(meta.utm_content || meta.utmContent),
    scalar(meta.utm_medium || meta.utmMedium),
    scalar(meta.utm_source || meta.utmSource),
    scalar(meta.utm_term || meta.utmTerm),
    scalar(meta.fallback || meta.fallBack),
  ];
}

/** Map widget / form POST body into transcript meta keys. */
function metaFromClientBody(body) {
  if (!body || typeof body !== 'object') return {};
  const b = body;
  const out = {};
  const pick = (keys, target) => {
    keys.forEach((k) => {
      if (b[k] != null && String(b[k]).trim() !== '') out[target || k] = b[k];
    });
  };
  pick(['name'], 'name');
  pick(['mobile', 'phone'], 'mobile');
  pick(['email'], 'email');
  pick(['channel'], 'channel');
  pick(['sourceUrl', 'pageUrl', 'url'], 'sourceUrl');
  pick(['device'], 'device');
  pick(['browser'], 'browser');
  pick(['os'], 'os');
  pick(['city'], 'city');
  pick(['ip', 'ipAddress'], 'ip');
  pick(['document', 'upload'], 'document');
  pick(['sentiment'], 'sentiment');
  pick(['rating', 'feedbackRating'], 'rating');
  pick(['feedback', 'feedbackMessage', 'message'], 'feedback');
  pick(['crmPushStatus'], 'crmPushStatus');
  pick(['repeatedUser'], 'repeatedUser');
  pick(['fallback', 'fallBack'], 'fallback');
  pick(
    [
      'utm_campaign',
      'utmCampaign',
      'utm_content',
      'utmContent',
      'utm_medium',
      'utmMedium',
      'utm_source',
      'utmSource',
      'utm_term',
      'utmTerm',
    ],
    null
  );
  if (b.form_id === 'appointment' || b.appointmentdate || b.appointment_date) {
    out.appointmentBooked = 'yes';
    if (b.appointmentdate) out.appointmentdate = b.appointmentdate;
    if (b.appointment_date) out.appointmentdate = b.appointment_date;
    if (b.appointmenttime) out.appointmenttime = b.appointmenttime;
    if (b.appointment_time) out.appointmenttime = b.appointment_time;
    if (b.appointmentDateDisplay) out.appointmentDateDisplay = b.appointmentDateDisplay;
    if (b.appointmentTimeDisplay) out.appointmentTimeDisplay = b.appointmentTimeDisplay;
  }
  return out;
}

function mergeSessionMeta(sessionId, partial) {
  return chatTranscript.mergeSessionMeta(sessionId, partial);
}

function scheduleSheetSync(sessionId) {
  if (!sheets.isConfigured()) return;
  const sid = String(sessionId || '').trim();
  if (!sid) return;
  if (syncTimers.has(sid)) clearTimeout(syncTimers.get(sid));
  syncTimers.set(
    sid,
    setTimeout(() => {
      syncTimers.delete(sid);
      syncSessionToSheet(sid).catch((e) => {
        console.warn('[conversation-sheet]', e.message);
      });
    }, 2500)
  );
}

async function syncSessionToSheet(sessionId) {
  if (!sheets.isConfigured()) return { skipped: true };
  const doc = chatTranscript.getSessionDoc(sessionId);
  if (!doc.turns || !doc.turns.length) return { skipped: true, reason: 'no_turns' };

  const values = buildRowValues(doc);
  await sheets.ensureHeaderRow(SHEET_HEADERS);

  if (doc.sheetRow && Number(doc.sheetRow) >= 2) {
    await sheets.updateRow(Number(doc.sheetRow), values);
    return { ok: true, updated: doc.sheetRow };
  }

  const rowNum = await sheets.appendRowValues(values);
  if (rowNum) {
    chatTranscript.setSheetRow(sessionId, rowNum);
  }
  return { ok: true, appended: rowNum };
}

module.exports = {
  SHEET_HEADERS,
  metaFromClientBody,
  mergeSessionMeta,
  scheduleSheetSync,
  syncSessionToSheet,
  buildRowValues,
};
