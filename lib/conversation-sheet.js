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
/** One in-flight sync per session — prevents duplicate Sheet rows. */
const syncChains = new Map();

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

function titleCase(s) {
  return String(s || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isInternalActionToken(s) {
  const t = String(s || '').trim();
  return (
    !t ||
    /^__GO_/i.test(t) ||
    /^query:/i.test(t) ||
    /^event:/i.test(t) ||
    t.toLowerCase() === 'upload' ||
    t.toLowerCase() === 'resend_otp'
  );
}

function normalizeUserQueryText(text) {
  const raw = String(text == null ? '' : text).trim();
  if (!raw) return '';

  // Form submit payload from widget — show only "Contact form filled", not field values
  const formMatch = raw.match(/\[form:([^\]\s]+)\]/i);
  if (formMatch) {
    return `${titleCase(formMatch[1])} form filled`;
  }

  if (isInternalActionToken(raw)) return '';

  return raw;
}

function userQueriesFromTurns(turns) {
  const items = turns
    .filter((t) => t.role === 'user')
    .map((t) => normalizeUserQueryText(t.text))
    .filter(Boolean);

  // De-dupe consecutive duplicates after normalization
  const deduped = [];
  for (let i = 0; i < items.length; i += 1) {
    if (i === 0 || items[i] !== items[i - 1]) deduped.push(items[i]);
  }

  return deduped.join(' | ').slice(0, 2000);
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

/** Sheet display: "+91 9966006600" using dial_code + mobile from form meta. */
function formatMobileForSheet(meta) {
  const rawMobile = String(meta.mobile || meta.phone || '').trim();
  if (!rawMobile) return '';

  const compact = rawMobile.replace(/\s+/g, '');
  if (/^\+\d{8,}$/.test(compact)) {
    const m = compact.match(/^(\+\d{1,4})(\d+)$/);
    if (m) return `${m[1]} ${m[2]}`;
    return rawMobile;
  }

  let dial = String(
    meta.dial_code || meta.dialCode || meta.country_dial_code || ''
  ).trim();
  if (dial && !dial.startsWith('+')) {
    dial = '+' + dial.replace(/\D/g, '');
  }
  if (!dial) {
    const digits = rawMobile.replace(/\D/g, '');
    if (digits.length === 10) dial = '+91';
  }

  let local = rawMobile.replace(/\D/g, '');
  if (dial) {
    const dialDigits = dial.replace(/\D/g, '');
    if (local.startsWith(dialDigits) && local.length > dialDigits.length) {
      local = local.slice(dialDigits.length);
    }
    if (local.length > 10) local = local.slice(-10);
    return `${dial} ${local}`;
  }

  return rawMobile;
}

/** "Repeated" if this mobile exists on another sheet row; else "First Time". */
async function resolveRepeatedUserLabel(doc) {
  const meta = doc.meta || {};
  const norm = sheets.normalizeMobile(formatMobileForSheet(meta));
  if (!norm) return '';

  const excludeRow =
    doc.sheetRow && Number(doc.sheetRow) >= 2 ? Number(doc.sheetRow) : null;
  const existing = await sheets.listSheetMobiles(excludeRow);
  const isRepeat = existing.some((m) => m === norm);
  return isRepeat ? 'Repeated' : 'First Time';
}

function buildRowValues(doc) {
  const meta = doc.meta || {};
  const turns = doc.turns || [];
  const sid = doc.sessionId || '';
  const started = turns[0] && turns[0].at ? new Date(turns[0].at) : new Date();
  const metrics = computeMetrics(turns);
  const link = sheets.transcriptUrl(sid);
  const convLink = link || '';

  const apptDate = meta.appointmentdate || meta.appointment_date || '';
  const apptTime = meta.appointmenttime || meta.appointment_time || '';

  return [
    convLink,
    formatDate(started),
    formatTime(started),
    scalar(meta.name),
    formatMobileForSheet(meta),
    scalar(meta.email),
    scalar(meta.channel || 'Web'),
    userQueriesFromTurns(turns),
    scalar(meta.repeatedUserLabel || meta.repeatedUser),
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
  pick(['dial_code', 'dialCode', 'country_dial_code'], 'dial_code');
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
        console.warn('[conversation-sheet] sync failed:', e.message);
      });
    }, 2500)
  );
}

async function runSheetSync(sessionId) {
  if (!sheets.isConfigured()) return { skipped: true };
  const sid = String(sessionId || '').trim();
  const doc = chatTranscript.getSessionDoc(sid);
  if (!doc.turns || !doc.turns.length) return { skipped: true, reason: 'no_turns' };

  doc.meta = doc.meta || {};
  doc.meta.repeatedUserLabel = await resolveRepeatedUserLabel(doc);

  const values = buildRowValues(doc);
  await sheets.ensureHeaderRow(SHEET_HEADERS);

  let sheetRow = doc.sheetRow && Number(doc.sheetRow);
  if (sheetRow >= 2) {
    await sheets.updateRow(sheetRow, values);
    return { ok: true, updated: sheetRow };
  }

  const rowNum = await sheets.appendRowValues(values);
  if (!rowNum) {
    console.warn('[conversation-sheet] append returned no row for', sid);
    return { ok: false, error: 'append_failed' };
  }

  chatTranscript.setSheetRow(sid, rowNum);

  const after = chatTranscript.getSessionDoc(sid);
  if (after.sheetRow && Number(after.sheetRow) !== rowNum) {
    await sheets.updateRow(Number(after.sheetRow), values);
    return { ok: true, updated: after.sheetRow, deduped: true };
  }

  return { ok: true, appended: rowNum };
}

async function syncSessionToSheet(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) return { skipped: true };

  const prev = syncChains.get(sid) || Promise.resolve();
  const job = prev
    .then(() => runSheetSync(sid))
    .catch((e) => {
      console.warn('[conversation-sheet] sync failed:', e.message);
      throw e;
    });
  syncChains.set(sid, job);
  try {
    return await job;
  } finally {
    if (syncChains.get(sid) === job) syncChains.delete(sid);
  }
}

module.exports = {
  SHEET_HEADERS,
  metaFromClientBody,
  mergeSessionMeta,
  scheduleSheetSync,
  syncSessionToSheet,
  buildRowValues,
};
