/**
 * Staff conversation transcript API (Only Refer–style viewer).
 */

const chatTranscript = require('./chat-transcript');
const sheets = require('./sheets');
const liveAgent = require('./live-agent');

const TZ =
  process.env.CONVERSATIONS_TRANSCRIPT_TZ ||
  process.env.SHEETS_CONV_DATETIME_TZ ||
  'Asia/Kolkata';

function parseAtMs(iso) {
  if (!iso) return undefined;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function mapRole(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'user' || r === 'visitor' || r === 'customer') return 'user';
  if (r === 'agent' || r === 'human' || r === 'staff') return 'agent';
  return 'assistant';
}

function turnsFromSessionDoc(doc) {
  const turns = Array.isArray(doc.turns) ? doc.turns : [];
  return turns
    .map((t) => {
      const text = t && t.text != null ? String(t.text).trim() : '';
      if (!text) return null;
      const row = {
        role: mapRole(t.role),
        text,
      };
      const at = parseAtMs(t.at);
      if (at !== undefined) row.at = at;
      if (t.meta && typeof t.meta === 'object') {
        if (t.meta.rich) row.rich = t.meta.rich;
        if (t.meta.rich_json) row.rich_json = t.meta.rich_json;
      }
      return row;
    })
    .filter(Boolean);
}

function turnsFromLiveAgent(sessionId) {
  const detail = liveAgent.getSessionDetail(sessionId);
  if (!detail.ok) return [];
  const msgs = detail.messages || [];
  return msgs
    .map((m) => {
      const text = m && m.text != null ? String(m.text).trim() : '';
      if (!text) return null;
      const from = String(m.from || '').toLowerCase();
      const role = from === 'agent' ? 'agent' : from === 'user' ? 'user' : 'assistant';
      const row = { role, text };
      const at = parseAtMs(m.at);
      if (at !== undefined) row.at = at;
      return row;
    })
    .filter(Boolean);
}

function mergeTurns(a, b) {
  return [...a, ...b].sort((x, y) => {
    const ax = x.at != null ? x.at : 0;
    const ay = y.at != null ? y.at : 0;
    if (ax !== ay) return ax - ay;
    return 0;
  });
}

function metaFromDoc(doc) {
  const m = doc.meta && typeof doc.meta === 'object' ? doc.meta : {};
  return {
    name: m.name || '',
    email: m.email || '',
    mobile: m.mobile || m.phone || '',
    channel: m.channel || 'Web',
    device: m.device || '',
    browser: m.browser || '',
    form_id: m.form_id || '',
  };
}

async function getConversationTranscript(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) {
    return { ok: false, error: 'Missing session query parameter.' };
  }

  const doc = chatTranscript.getSessionDoc(sid);
  let turns = turnsFromSessionDoc(doc);
  const liveTurns = turnsFromLiveAgent(sid);
  if (liveTurns.length) {
    turns = mergeTurns(turns, liveTurns);
  }

  const meta = metaFromDoc(doc);
  let sheet = null;

  if (sheets.isConfigured()) {
    const row = await sheets.fetchSheetRowBySessionId(sid);
    if (row) {
      sheet = { rowNumber: row.rowNumber, columns: row.columns };
      if (!meta.name && row.columns.Name) meta.name = row.columns.Name;
      if (!meta.email && row.columns.Email) meta.email = row.columns.Email;
      if (!meta.mobile && row.columns.Mobile) meta.mobile = row.columns.Mobile;
    }
  }

  const timeIncludesDate =
    String(process.env.CONVERSATIONS_TRANSCRIPT_TIME_INCLUDES_DATE || '')
      .trim()
      .toLowerCase() === 'true' ||
    String(process.env.CONVERSATIONS_TRANSCRIPT_TIME_INCLUDES_DATE || '')
      .trim() === '1';

  return {
    ok: true,
    session: sid,
    source: liveTurns.length ? 'transcript+live_agent' : 'transcript',
    meta,
    sheet,
    turns,
    transcript_time_zone: TZ,
    transcript_time_includes_date: timeIncludesDate,
    transcript_stats: {
      turn_count: turns.length,
      assistant_count: turns.filter((t) => t.role === 'assistant').length,
    },
  };
}

function verifyViewerAuth(req) {
  const sheetSecret = String(
    process.env.CONVERSATIONS_SHEET_VIEW_SECRET || ''
  ).trim();
  const deskToken = String(process.env.LIVE_AGENT_DESK_TOKEN || '').trim();

  const authHdr =
    String(req.headers['x-conversations-sheet-secret'] || '').trim() ||
    String(req.headers['x-agent-token'] || '').trim() ||
    String(req.headers['x-desk-token'] || '').trim();
  let bearer = '';
  const auth = String(req.headers.authorization || '').trim();
  if (/^Bearer\s+/i.test(auth)) bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const got = authHdr || bearer || String(req.query.secret || '').trim();

  if (sheetSecret && got === sheetSecret) return { ok: true };
  if (deskToken && got === deskToken) return { ok: true };
  if (liveAgent.verifyDeskToken(req)) return { ok: true };

  if (!sheetSecret && !deskToken && !liveAgent.isDeskTokenRequired()) {
    return { ok: true };
  }

  return {
    ok: false,
    error:
      'Unauthorized — use desk token (X-Agent-Token) or conversations viewer secret.',
  };
}

module.exports = {
  getConversationTranscript,
  verifyViewerAuth,
};
