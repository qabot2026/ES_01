/**
 * User query analytics — counts, time range, bot vs fallback vs handoff.
 * Logged on each /api/chat exchange; backfills from transcript user turns.
 */

const fs = require('fs');
const path = require('path');
const transcriptDisplay = require('./transcript-display-text');
const chatTranscript = require('./chat-transcript');

const DATA_DIR =
  process.env.QUERY_ANALYTICS_DIR ||
  path.join(__dirname, '..', 'data');
const LOG_PATH =
  process.env.QUERY_ANALYTICS_LOG ||
  path.join(DATA_DIR, 'query-analytics.jsonl');

const MAX_LOG_BYTES = 12 * 1024 * 1024;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeQueryKey(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function shouldSkipQuery(text) {
  const raw = String(text || '').trim();
  if (!raw) return true;
  if (transcriptDisplay.isInternalActionToken(raw)) return true;
  if (transcriptDisplay.isFormSubmitPayload(raw)) return true;
  const display = transcriptDisplay.normalizeUserQueryText(raw);
  return !display;
}

function classifyOutcome(result) {
  if (!result || typeof result !== 'object') return 'bot';
  if (result.liveAgent) return 'handoff';
  if (result.intentIsFallback) return 'fallback';
  return 'bot';
}

function classifyTextOutcome(text) {
  if (transcriptDisplay.isHumanAgentHandoffToken(text)) return 'handoff';
  return 'bot';
}

function trimLogIfNeeded() {
  try {
    if (!fs.existsSync(LOG_PATH)) return;
    const stat = fs.statSync(LOG_PATH);
    if (stat.size <= MAX_LOG_BYTES) return;
    const buf = fs.readFileSync(LOG_PATH, 'utf8');
    const lines = buf.split('\n').filter(Boolean);
    const keep = lines.slice(-Math.floor(lines.length * 0.6));
    fs.writeFileSync(LOG_PATH, keep.join('\n') + '\n', 'utf8');
  } catch (e) {
    console.warn('[query-analytics] trim log:', e.message);
  }
}

/** @param {{ sessionId: string, query: string, outcome?: string, intent?: string, at?: string, source?: string }} row */
function recordQuery(row) {
  const query = transcriptDisplay.normalizeUserQueryText(row.query);
  if (!query || shouldSkipQuery(row.query)) return false;
  ensureDir();
  const entry = {
    at: row.at || new Date().toISOString(),
    sessionId: String(row.sessionId || '').trim(),
    query,
    queryKey: normalizeQueryKey(query),
    outcome: row.outcome || 'bot',
    intent: row.intent ? String(row.intent).slice(0, 120) : '',
    source: row.source || 'chat',
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
  trimLogIfNeeded();
  return true;
}

function readLoggedEvents() {
  ensureDir();
  if (!fs.existsSync(LOG_PATH)) return [];
  try {
    const raw = fs.readFileSync(LOG_PATH, 'utf8');
    const out = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e && e.query && e.at) out.push(e);
      } catch {
        /* skip bad line */
      }
    }
    return out;
  } catch {
    return [];
  }
}

function eventDedupeKey(e) {
  return [
    e.sessionId || '',
    e.at || '',
    e.queryKey || normalizeQueryKey(e.query),
  ].join('|');
}

function eventsFromTranscripts(sinceMs) {
  const index = chatTranscript.loadIndex();
  const sessions = Object.values(index.sessions || {});
  const events = [];
  for (const s of sessions) {
    const sid = s.sessionId;
    if (!sid) continue;
    const updatedMs = Date.parse(s.updatedAt || '') || 0;
    if (sinceMs && updatedMs < sinceMs) continue;
    let doc;
    try {
      doc = chatTranscript.getSessionDoc(sid);
    } catch {
      continue;
    }
    const turns = Array.isArray(doc.turns) ? doc.turns : [];
    for (const t of turns) {
      if (!t || t.role !== 'user') continue;
      const raw = String(t.text || '').trim();
      if (shouldSkipQuery(raw)) continue;
      const query = transcriptDisplay.normalizeUserQueryText(raw);
      if (!query) continue;
      const at = t.at || doc.updatedAt || s.updatedAt || new Date().toISOString();
      const atMs = Date.parse(at) || 0;
      if (sinceMs && atMs < sinceMs) continue;
      const outcome = classifyTextOutcome(raw);
      events.push({
        at,
        sessionId: sid,
        query,
        queryKey: normalizeQueryKey(query),
        outcome,
        intent: '',
        source: 'transcript',
      });
    }
  }
  return events;
}

function mergeEvents(logged, transcriptEvents) {
  const seen = new Set(logged.map(eventDedupeKey));
  const merged = logged.slice();
  for (const e of transcriptEvents) {
    const key = eventDedupeKey(e);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(e);
  }
  return merged;
}

function parsePeriod(opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const days = Math.min(Math.max(Number(o.days) || 30, 1), 365);
  const customFrom = o.from ? Date.parse(String(o.from)) : NaN;
  const customTo = o.to ? Date.parse(String(o.to)) : NaN;
  const now = Date.now();
  let fromMs = now - days * 24 * 60 * 60 * 1000;
  let toMs = now;
  if (Number.isFinite(customFrom)) fromMs = customFrom;
  if (Number.isFinite(customTo)) toMs = customTo;
  return { fromMs, toMs, days };
}

function filterByRange(events, fromMs, toMs) {
  return events.filter((e) => {
    const t = Date.parse(e.at);
    if (!Number.isFinite(t)) return false;
    return t >= fromMs && t <= toMs;
  });
}

function aggregateQueries(events) {
  const byQuery = new Map();
  const byDay = new Map();
  let total = 0;
  let bot = 0;
  let fallback = 0;
  let handoff = 0;

  for (const e of events) {
    total += 1;
    if (e.outcome === 'fallback') fallback += 1;
    else if (e.outcome === 'handoff') handoff += 1;
    else bot += 1;

    const day = String(e.at || '').slice(0, 10);
    if (day) {
      const d = byDay.get(day) || { date: day, total: 0, bot: 0, fallback: 0, handoff: 0 };
      d.total += 1;
      if (e.outcome === 'fallback') d.fallback += 1;
      else if (e.outcome === 'handoff') d.handoff += 1;
      else d.bot += 1;
      byDay.set(day, d);
    }

    const key = e.queryKey || normalizeQueryKey(e.query);
    if (!key) continue;
    let row = byQuery.get(key);
    if (!row) {
      row = {
        query: e.query,
        queryKey: key,
        total: 0,
        bot: 0,
        fallback: 0,
        handoff: 0,
        lastAt: e.at,
        sessions: new Set(),
      };
      byQuery.set(key, row);
    }
    row.total += 1;
    if (e.outcome === 'fallback') row.fallback += 1;
    else if (e.outcome === 'handoff') row.handoff += 1;
    else row.bot += 1;
    if (String(e.at) > String(row.lastAt)) row.lastAt = e.at;
    if (e.sessionId) row.sessions.add(e.sessionId);
  }

  const queries = Array.from(byQuery.values())
    .map((r) => ({
      query: r.query,
      total: r.total,
      bot: r.bot,
      fallback: r.fallback,
      handoff: r.handoff,
      lastAt: r.lastAt,
      sessions: r.sessions.size,
    }))
    .sort((a, b) => b.total - a.total || String(b.lastAt).localeCompare(String(a.lastAt)));

  const daily = Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return { total, bot, fallback, handoff, queries, daily };
}

function getQueryAnalytics(opts) {
  const { fromMs, toMs, days } = parsePeriod(opts);
  const logged = readLoggedEvents();
  const transcriptEvents = eventsFromTranscripts(fromMs);
  const merged = mergeEvents(logged, transcriptEvents);
  const inRange = filterByRange(merged, fromMs, toMs);
  const agg = aggregateQueries(inRange);
  const limit = Math.min(Math.max(Number(opts && opts.limit) || 200, 1), 500);

  return {
    ok: true,
    period: {
      days,
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    },
    summary: {
      totalQueries: agg.total,
      botAnswered: agg.bot,
      fallback: agg.fallback,
      handoff: agg.handoff,
      uniqueQueries: agg.queries.length,
    },
    daily: agg.daily,
    queries: agg.queries.slice(0, limit),
    sources: {
      logged: logged.length,
      transcriptBackfill: transcriptEvents.length,
      inPeriod: inRange.length,
    },
  };
}

module.exports = {
  recordQuery,
  getQueryAnalytics,
  normalizeQueryKey,
};
