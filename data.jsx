// Live data layer — fetches the real Google Sheet CSV, maps rows into
// the shape the UI layer expects, and exposes async loaders.
//
// Exposes via window:
//   SHEET_BASE, SHEETS, goalKey
//   loadGoalData(forceRefresh)  -> { goals, summary, stale, ts }
//   loadZoneLog(zone)           -> [{ date, label, detail }]
//   clearGoalCache()
//   YEAR_PCT, DAYS_IN, DAYS_LEFT, MO_IN, MO_LEFT, TODAY

const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzT76dnq0RWElcySPShgxC6hk_iHKawPwkj1bsH9EjrJGKzMZ66Xo_Mpb8ey7yJDYm7M6eJdBkSKyv/pub?output=csv';

const SHEETS = {
  dashboard: 147941376, parkrun: 712844439, fitness: 928751721,
  music: 392176720, listening: 451507711, movies: 1147366727,
  creative: 108823288, blood: 1258053663, health: 828416010,
  volunteering: 1860768583, lifeadmin: 1864003038, getaways: 187836966,
};

// Heuristic zone → sheet key
function zoneToSheet(zone) {
  const norm = (zone || '').toLowerCase().replace(/[^a-z]/g, '');
  if (SHEETS[norm]) return norm;
  if (norm === 'writing' || norm === 'poetry' || norm === 'essays') return 'creative';
  if (norm === 'lifeadmin' || norm === 'admin' || norm === 'chores') return 'lifeadmin';
  return null;
}

// --- CSV parsing -------------------------------------------------------------
function parseCSV(text) {
  const rows = []; let current = ''; let inQ = false;
  for (const line of text.split('\n')) {
    if (inQ) {
      current += '\n' + line;
      if ((line.match(/"/g) || []).length % 2 === 1) { inQ = false; rows.push(parseLine(current)); current = ''; }
    } else {
      if ((line.match(/"/g) || []).length % 2 === 1) { inQ = true; current = line; }
      else rows.push(parseLine(line));
    }
  }
  return rows;
}

function parseLine(line) {
  const r = []; let c = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i+1] === '"') { c += '"'; i++; }
      else if (ch === '"') q = false;
      else c += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { r.push(c.trim()); c = ''; }
      else c += ch;
    }
  }
  r.push(c.trim());
  return r;
}

// --- Cache -------------------------------------------------------------------
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
function cacheGet(key) {
  try {
    const raw = localStorage.getItem('goals_' + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed;
  } catch { return null; }
}
function cacheSet(key, data) {
  try { localStorage.setItem('goals_' + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
function clearGoalCache() {
  for (const k of Object.keys(SHEETS)) {
    try { localStorage.removeItem('goals_' + k); } catch {}
  }
}

async function fetchSheet(key, forceRefresh) {
  if (!forceRefresh) {
    const c = cacheGet(key);
    if (c) return { rows: c.data, stale: false, ts: c.ts };
  }
  const res = await fetch(`${SHEET_BASE}&gid=${SHEETS[key]}`);
  const rows = parseCSV(await res.text());
  cacheSet(key, rows);
  return { rows, stale: false, ts: Date.now() };
}

// --- Year math ---------------------------------------------------------------
const TODAY = new Date();
const Y0 = new Date(TODAY.getFullYear(), 0, 1);
const Y1 = new Date(TODAY.getFullYear(), 11, 31);
const DAYS_IN = Math.max(0, Math.floor((TODAY - Y0) / 86400000));
const DAYS_LEFT = Math.max(0, Math.floor((Y1 - TODAY) / 86400000));
const YEAR_PCT = DAYS_IN / 365;
const MO_IN = DAYS_IN / 30.4;
const MO_LEFT = DAYS_LEFT / 30.4;

function goalKey(g) { return `${g.zone}::${g.goal}`; }

// Map raw verdict + status to design verdict keys
function normalizeVerdict(rawVerdict, rawStatus, pct, kind) {
  const v = (rawVerdict || '').toLowerCase().trim();
  const s = (rawStatus  || '').toLowerCase().trim();
  if (s === 'not started' || rawVerdict === '-' || rawVerdict === '') return 'open';
  if (v === 'done') return 'done';
  if (v === 'ahead') return 'ahead';
  if (v === 'close' || v === 'on track' || v === 'on-track') return 'on-track';
  if (v === 'behind') return 'behind';
  // Fallback: compute from pct
  if (kind === 'count' || kind === 'checklist') {
    if (pct >= 1) return 'done';
    if (pct >= YEAR_PCT) return 'ahead';
    if (YEAR_PCT - pct <= 0.10) return 'on-track';
    return 'behind';
  }
  return 'open';
}

// Parse a pace string like "2.4/mo" or "2.4 per month" into a number
function parsePace(s) {
  if (!s) return 0;
  const m = String(s).match(/(-?\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

// --- Goal mapping ------------------------------------------------------------
function mapRowToGoal(r) {
  const zone = r[1];
  const goal = r[2];
  if (!zone || !goal) return null;

  const progress = parseFloat(r[3]) || 0;
  const targetRaw = r[4];
  const tgt = parseFloat(targetRaw);
  const pct = r[5] ? (parseFloat(r[5]) / 100) : (tgt > 0 ? progress / tgt : 0);
  const rawStatus = r[6];
  const due = r[7] || '—';
  const rawPaceNeeded = r[8];
  const rawCurrentRate = r[9];
  const rawVerdict = r[11] || r[6];

  // Kind classification (mirrors logic in old index.html)
  const tr = (targetRaw || '').toString();
  const goalLower = goal.toLowerCase();
  const zoneLower = zone.toLowerCase();
  let kind = 'count';
  if (tr === '—' || tr === '-' || tr === '') kind = 'open';
  else if (tr.includes('%')) kind = 'percent';
  else if (tgt === 1) kind = 'binary';
  else if (!tgt || tgt <= 0 || isNaN(tgt)) kind = 'open';
  if (zoneLower === 'one-offs' || goalLower.includes('first aid')) kind = 'checklist';

  const verdict = normalizeVerdict(rawVerdict, rawStatus, pct, kind);
  const target = isNaN(tgt) ? 0 : tgt;
  const remaining = Math.max(0, target - progress);

  let neededPerMonth = parsePace(rawPaceNeeded);
  let currentPerMonth = parsePace(rawCurrentRate);
  if (!neededPerMonth && kind === 'count' && MO_LEFT > 0 && remaining > 0) {
    neededPerMonth = remaining / MO_LEFT;
  }
  if (!currentPerMonth && kind === 'count' && MO_IN > 0 && progress > 0) {
    currentPerMonth = progress / MO_IN;
  }

  return {
    zone, goal,
    progress, target,
    targetRaw: tr,
    due,
    kind,
    key: goalKey({ zone, goal }),
    pct: Math.max(0, Math.min(pct, 1)),
    verdict,
    remaining,
    neededPerMonth,
    currentPerMonth,
    log: null, // lazy
  };
}

async function loadGoalData(forceRefresh = false) {
  const { rows, ts } = await fetchSheet('dashboard', forceRefresh);

  // Find header row
  let hi = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].includes('Zone') && rows[i].includes('Goal')) { hi = i; break; }
  }
  if (hi === -1) throw new Error('Could not find header row in dashboard sheet');

  const goals = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const g = mapRowToGoal(rows[i]);
    if (g) goals.push(g);
  }

  const summary = {
    todayStr: TODAY.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    daysIn: DAYS_IN,
    daysLeft: DAYS_LEFT,
    yearPct: YEAR_PCT,
    monthsLeft: MO_LEFT,
    total: goals.length,
    done:    goals.filter(g => g.verdict === 'done').length,
    ahead:   goals.filter(g => g.verdict === 'ahead').length,
    onTrack: goals.filter(g => g.verdict === 'on-track').length,
    behind:  goals.filter(g => g.verdict === 'behind').length,
    open:    goals.filter(g => g.verdict === 'open').length,
  };

  return { goals, summary, ts };
}

// --- Activity log (lazy, best-effort) ---------------------------------------
function looksLikeDate(s) {
  if (!s) return false;
  return /\b\d{1,2}\b/.test(s) && /[a-zA-Z]/.test(s) // "Apr 19", "Jan 2026"
      || /\d{1,2}\/\d{1,2}/.test(s)                   // "19/4"
      || /\d{4}-\d{2}-\d{2}/.test(s);                 // "2026-04-19"
}

function findHeaderIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const joined = rows[i].join(' ').toLowerCase();
    if (/\b(date|when|day)\b/.test(joined) || /\b(title|album|film|artist|session|activity)\b/.test(joined)) {
      return i;
    }
  }
  // Fallback: first non-empty row
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(c => c && c.trim())) return i;
  }
  return 0;
}

function isCheckboxy(s) {
  const v = (s || '').trim().toLowerCase();
  return v === 'true' || v === 'false' || v === '✓' || v === '✗' || v === 'x' || v === '-' || v === '—' || v === 'yes' || v === 'no' || v === 'done' || v === 'todo';
}

async function loadZoneLog(zone) {
  const key = zoneToSheet(zone);
  if (!key) return [];
  let data;
  try {
    data = await fetchSheet(key, false);
  } catch { return []; }

  const rows = data.rows;
  const hi = findHeaderIndex(rows);
  const entries = [];
  for (let i = hi + 1; i < rows.length && entries.length < 10; i++) {
    const r = rows[i];
    // Strip empty + checkbox-y cells; keep the rest in order
    const cells = r.map(c => (c || '').trim()).filter(c => c && !isCheckboxy(c));
    if (cells.length < 1) continue;

    let date = '';
    let labelIdx = 0;
    if (looksLikeDate(cells[0])) { date = cells[0]; labelIdx = 1; }

    const label  = cells[labelIdx] || '';
    const detail = cells.slice(labelIdx + 1).join(' · ');
    if (!label) continue;
    entries.push({ date, label, detail });
  }
  return entries;
}

Object.assign(window, {
  SHEET_BASE, SHEETS, goalKey,
  loadGoalData, loadZoneLog, clearGoalCache,
  YEAR_PCT, DAYS_IN, DAYS_LEFT, MO_IN, MO_LEFT, TODAY,
});
