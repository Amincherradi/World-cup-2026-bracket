// ----- Live data from API-Football (api-sports.io) -----
// Fetches the real group standings for the FIFA World Cup 2026 and turns them
// into bracket slot assignments + a set of eliminated teams. Falls back to the
// hand-entered snapshot in data.js when no API key is configured or a fetch
// fails, so the app always renders something sensible.

import { GROUPS, BRACKET, TEAMS_BY_ID, LIVE_QUALIFIED, LIVE_ELIMINATED, STRENGTH } from './data';

const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
const BASE = 'https://v3.football.api-sports.io';
const LEAGUE = 1; // API-Football league id for the FIFA World Cup
const SEASON = 2026;

// Keyless fallback source: openfootball public-domain match data (no API key,
// no quota). Updated by the community, so slightly less real-time than the API.
const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// How often to re-poll while the app is open (ms). API-Football's free tier is
// 100 requests/day, so don't go below a couple of minutes.
export const POLL_MS = 3 * 60 * 1000;

// In-progress matches change minute-by-minute, so poll them more often than the
// full standings. Still gentle on API-Football's free quota.
export const LIVE_POLL_MS = 45 * 1000;

// Live data is always available now (openfootball needs no key); a key just
// upgrades the source to API-Football.
export const LIVE_ENABLED = true;

// ----- Name → internal id resolution -----
// Build the base map from the canonical names in data.js, then add aliases for
// the spellings API-Football tends to use.
const NAME_TO_ID = {};
const GROUP_OF = {};
for (const g of GROUPS) {
  for (const t of g.teams) {
    NAME_TO_ID[norm(t.name)] = t.id;
    GROUP_OF[t.id] = g.id;
  }
}

const ALIASES = {
  usa: ['usa', 'united states of america'],
  kor: ['korea republic', 'south korea', 'korea'],
  tur: ['turkiye', 'türkiye'],
  civ: ["cote d'ivoire", 'cote divoire', 'ivory coast'],
  cod: ['dr congo', 'congo dr', 'democratic republic of congo', 'congo democratic republic'],
  bih: ['bosnia and herzegovina', 'bosnia herzegovina', 'bosnia-herzegovina'],
  cuw: ['curacao', 'curaçao'],
  cpv: ['cape verde islands', 'cabo verde', 'cape verde'],
  irn: ['iran', 'ir iran'],
};
for (const [id, names] of Object.entries(ALIASES)) {
  for (const n of names) NAME_TO_ID[norm(n)] = id;
}

function norm(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveId(apiName) {
  return NAME_TO_ID[norm(apiName)] ?? null;
}

// ----- Slot label → slot id lookup (from the bracket layout) -----
const R32_SLOTS = [...BRACKET.left[0], ...BRACKET.right[0]];
const SLOT_BY_LABEL = Object.fromEntries(R32_SLOTS.map((s) => [s.label, s.id]));
// The "3 ABCDF"-style slots: parse out the eligible group letters.
const THIRD_SLOTS = R32_SLOTS.filter((s) => s.label.startsWith('3 ')).map((s) => ({
  id: s.id,
  groups: s.label.slice(2).split('').filter((c) => c.trim()),
}));

// ----- Fetch -----
// Both sources are normalised to the same fixture shape:
//   { group: 'A'|null, team1, team2, ft: [g1, g2] | null }
// group is null for knockout matches; ft is null for unplayed fixtures.

async function fetchFixturesOpenFootball() {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`openfootball ${res.status}`);
  const json = await res.json();
  const matches = json?.matches;
  if (!Array.isArray(matches)) throw new Error('Unexpected openfootball shape');
  return matches.map((m) => ({
    group: m.group ? m.group.replace(/group/i, '').trim() : null,
    team1: m.team1,
    team2: m.team2,
    ft: Array.isArray(m.score?.ft) ? m.score.ft : null,
  }));
}

async function fetchFixturesApiFootball() {
  const res = await fetch(`${BASE}/fixtures?league=${LEAGUE}&season=${SEASON}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const json = await res.json();
  // API-Football returns HTTP 200 with an `errors` object for plan/quota issues
  // (e.g. the free plan has no access to season 2026) — treat that as a failure
  // so we fall back to openfootball instead of rendering an empty bracket.
  if (json?.errors && Object.keys(json.errors).length) {
    throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  }
  const fixtures = json?.response;
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    throw new Error('API-Football returned no fixtures');
  }
  return fixtures.map((f) => {
    const round = f.league?.round ?? ''; // e.g. "Group A - 1"
    const gm = /group\s+([a-l])/i.exec(round);
    const finished = ['FT', 'AET', 'PEN'].includes(f.fixture?.status?.short);
    return {
      group: gm ? gm[1].toUpperCase() : null,
      team1: f.teams?.home?.name,
      team2: f.teams?.away?.name,
      ft: finished ? [f.goals?.home ?? 0, f.goals?.away ?? 0] : null,
    };
  });
}

// ----- Currently-live matches (score + minute, Google-style) -----
// Source order: API-Football (if a paid key) -> football-data.org (free, via
// the /api/live proxy) -> [] (openfootball has no in-play data). Each entry
// resolves teams to our internal ids so the UI can show the right flags.
//
// Returns: [{ id, homeId, awayId, home, away, code1, code2, gh, ga, minute,
//             status, live }]  — minute is a display string ("57'", "HT", ...).
const LIVE_STATUSES = ['1H', '2H', 'ET', 'BT', 'P', 'HT', 'LIVE', 'INT', 'SUSP'];

function liveMinute(status) {
  const short = status?.short;
  const elapsed = status?.elapsed;
  if (short === 'HT') return 'HT';
  if (short === 'P') return 'PEN';
  if (short === 'BT') return 'ET';
  if (elapsed != null) {
    const extra = status?.extra;
    return `${elapsed}${extra ? '+' + extra : ''}'`;
  }
  return 'LIVE';
}

export async function fetchLiveMatches() {
  if (API_KEY) {
    try {
      const res = await fetch(`${BASE}/fixtures?league=${LEAGUE}&live=all`, {
        headers: { 'x-apisports-key': API_KEY },
      });
      if (!res.ok) throw new Error(`API-Football ${res.status}`);
      const json = await res.json();
      if (json?.errors && Object.keys(json.errors).length) {
        throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
      }
      const fixtures = Array.isArray(json?.response) ? json.response : [];
      return fixtures
        .filter((f) => LIVE_STATUSES.includes(f.fixture?.status?.short))
        .map((f) => {
          const homeId = resolveId(f.teams?.home?.name);
          const awayId = resolveId(f.teams?.away?.name);
          return {
            id: f.fixture?.id,
            homeId,
            awayId,
            home: TEAMS_BY_ID[homeId]?.name ?? f.teams?.home?.name,
            away: TEAMS_BY_ID[awayId]?.name ?? f.teams?.away?.name,
            code1: TEAMS_BY_ID[homeId]?.code ?? null,
            code2: TEAMS_BY_ID[awayId]?.code ?? null,
            gh: f.goals?.home ?? 0,
            ga: f.goals?.away ?? 0,
            minute: liveMinute(f.fixture?.status),
            status: f.fixture?.status?.short,
            live: true,
          };
        });
    } catch (err) {
      console.warn('[liveData] API-Football live unavailable, trying football-data:', err.message);
    }
  }
  // Free path: football-data.org via our proxy.
  try {
    return liveFromFootballData(await fetchFootballDataMatches());
  } catch (err) {
    console.warn('[liveData] live matches unavailable:', err.message);
    return [];
  }
}

// ----- football-data.org (free, via our /api/live proxy) -----
// One proxy round-trip returns every World Cup match; we derive both the full
// fixture list (for the bracket) and the in-play matches (for the live cards)
// from it. football-data statuses: SCHEDULED/TIMED (upcoming), IN_PLAY, PAUSED
// (half-time), FINISHED.
const FD_LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

async function fetchFootballDataMatches() {
  const res = await fetch('/api/live');
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(`football-data: ${json.error}`);
  const matches = json?.matches;
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error('football-data returned no matches');
  }
  return matches;
}

// football-data match -> our normalised fixture shape.
function fixturesFromFootballData(matches) {
  return matches.map((m) => {
    // group is e.g. "GROUP_A"; pull the trailing letter.
    const gm = /([a-l])\s*$/i.exec(m.group || '');
    const finished = m.status === 'FINISHED';
    return {
      group: gm ? gm[1].toUpperCase() : null,
      team1: m.homeTeam?.name,
      team2: m.awayTeam?.name,
      ft: finished
        ? [m.score?.fullTime?.home ?? 0, m.score?.fullTime?.away ?? 0]
        : null,
    };
  });
}

// The free football-data tier omits the live `minute`, so estimate it from the
// kickoff time. Rough by design: assumes a 15-min half-time break and caps at
// 90+. Used only as a fallback when the API doesn't supply a real minute.
function estimateMinute(utcDate) {
  if (!utcDate) return 'LIVE';
  const mins = Math.floor((Date.now() - new Date(utcDate).getTime()) / 60000);
  if (mins < 0) return 'LIVE';
  if (mins <= 45) return `${Math.max(1, mins)}'`;
  if (mins <= 60) return 'HT'; // likely the break (or 45'+ stoppage)
  const second = mins - 15; // discount the half-time break
  return second >= 90 ? "90+'" : `${second}'`;
}

// A match can't realistically still be running this long after kickoff (90' +
// half-time + stoppage + extra time + penalties, with margin). The free feed
// sometimes lags on FINISHED, leaving a finished game stuck on PAUSED/IN_PLAY —
// this guards against showing "HT" for a game that's actually over.
const MAX_LIVE_MS = 150 * 60 * 1000;

// football-data in-play matches -> live-card shape (same as fetchLiveMatches).
function liveFromFootballData(matches) {
  return matches
    .filter((m) => FD_LIVE_STATUSES.includes(m.status))
    .filter((m) => {
      if (!m.utcDate) return true;
      return Date.now() - new Date(m.utcDate).getTime() < MAX_LIVE_MS;
    })
    .map((m) => {
      const homeId = resolveId(m.homeTeam?.name);
      const awayId = resolveId(m.awayTeam?.name);
      const minute =
        m.status === 'PAUSED'
          ? 'HT'
          : m.minute != null
          ? `${m.minute}${m.injuryTime ? '+' + m.injuryTime : ''}'`
          : estimateMinute(m.utcDate);
      return {
        id: m.id,
        homeId,
        awayId,
        home: TEAMS_BY_ID[homeId]?.name ?? m.homeTeam?.name,
        away: TEAMS_BY_ID[awayId]?.name ?? m.awayTeam?.name,
        code1: TEAMS_BY_ID[homeId]?.code ?? null,
        code2: TEAMS_BY_ID[awayId]?.code ?? null,
        gh: m.score?.fullTime?.home ?? 0,
        ga: m.score?.fullTime?.away ?? 0,
        minute,
        status: m.status,
        live: true,
      };
    });
}

// football-data upcoming matches -> compact "next up" shape, soonest first.
const FD_UPCOMING_STATUSES = ['TIMED', 'SCHEDULED'];
function upcomingFromFootballData(matches, limit = 16) {
  return matches
    .filter((m) => FD_UPCOMING_STATUSES.includes(m.status) && m.utcDate)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, limit)
    .map((m) => {
      const homeId = resolveId(m.homeTeam?.name);
      const awayId = resolveId(m.awayTeam?.name);
      const gm = /([a-l])\s*$/i.exec(m.group || '');
      return {
        id: m.id,
        home: TEAMS_BY_ID[homeId]?.name ?? m.homeTeam?.name,
        away: TEAMS_BY_ID[awayId]?.name ?? m.awayTeam?.name,
        code1: TEAMS_BY_ID[homeId]?.code ?? null,
        code2: TEAMS_BY_ID[awayId]?.code ?? null,
        utcDate: m.utcDate,
        group: gm ? gm[1].toUpperCase() : null,
      };
    });
}

// Upcoming fixtures for the header marquee. Only the free football-data source
// is wired here (the live cards already cover the API-Football path); returns []
// if unavailable so the marquee simply doesn't render.
export async function fetchUpcomingMatches() {
  try {
    return upcomingFromFootballData(await fetchFootballDataMatches());
  } catch (err) {
    console.warn('[liveData] upcoming matches unavailable:', err.message);
    return [];
  }
}

// ----- Standings & qualification logic -----

// Points/GD/GF table for a set of played results within one group. Also tracks
// wins/draws/losses so the standings modal can show a full league-table row.
function tableFor(teams, played) {
  const T = Object.fromEntries(
    teams.map((t) => [t, { name: t, pts: 0, gf: 0, ga: 0, played: 0, w: 0, d: 0, l: 0 }])
  );
  for (const r of played) {
    const a = T[r.a];
    const b = T[r.b];
    a.played++; b.played++;
    a.gf += r.ga; a.ga += r.gb;
    b.gf += r.gb; b.ga += r.ga;
    if (r.ga > r.gb) { a.pts += 3; a.w++; b.l++; }
    else if (r.gb > r.ga) { b.pts += 3; b.w++; a.l++; }
    else { a.pts++; b.pts++; a.d++; b.d++; }
  }
  return Object.values(T)
    .map((t) => ({ ...t, gd: t.gf - t.ga }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
}

// Which teams have *mathematically* clinched a top-2 finish in their group,
// regardless of how the remaining matches go. Goal-difference-safe: a team is
// only clinched if it can never be dragged into a tie that decides 2nd/3rd on
// goals — i.e. in every win/draw/loss combination of the remaining games it has
// at most one team strictly above it and at most two at-or-above it on points.
function clinchedTop2(teams, played, remaining) {
  const safe = Object.fromEntries(teams.map((t) => [t, true]));
  const outcomes = [[1, 0], [0, 0], [0, 1]];
  const total = 3 ** remaining.length;
  for (let mask = 0; mask < total; mask++) {
    let x = mask;
    const sim = remaining.map((g) => {
      const o = outcomes[x % 3];
      x = Math.floor(x / 3);
      return { a: g.a, b: g.b, ga: o[0], gb: o[1] };
    });
    const pts = Object.fromEntries(tableFor(teams, [...played, ...sim]).map((r) => [r.name, r.pts]));
    for (const t of teams) {
      const above = teams.filter((o) => pts[o] > pts[t]).length;
      const atOrAbove = teams.filter((o) => pts[o] >= pts[t]).length;
      if (!(above <= 1 && atOrAbove <= 2)) safe[t] = false;
    }
  }
  return new Set(teams.filter((t) => safe[t]));
}

const strengthOf = (name) => STRENGTH[resolveId(name)] ?? 0;

//  Project each group's FINAL standings from the results already played plus a
// strength-based forecast of the remaining matches. Returns
// { A: [winnerId, runnerUpId, thirdId, fourthId], ... } — used to seed Predict
// so its bracket reflects games that have actually been played.
function projectGroupOrder(groups) {
  const order = {};
  for (const [letter, g] of Object.entries(groups)) {
    const teams = [...g.teams];
    const stat = Object.fromEntries(teams.map((t) => [t, { pts: 0, gf: 0, ga: 0 }]));
    // Real results.
    for (const r of g.played) {
      const a = stat[r.a];
      const b = stat[r.b];
      a.gf += r.ga; a.ga += r.gb;
      b.gf += r.gb; b.ga += r.ga;
      if (r.ga > r.gb) a.pts += 3;
      else if (r.gb > r.ga) b.pts += 3;
      else { a.pts++; b.pts++; }
    }
    // Forecast remaining matches: clearly-stronger team wins; near-equal = draw.
    for (const m of g.remaining) {
      const sa = strengthOf(m.a);
      const sb = strengthOf(m.b);
      if (Math.abs(sa - sb) <= 2) { stat[m.a].pts++; stat[m.b].pts++; }
      else if (sa > sb) { stat[m.a].pts += 3; stat[m.a].gf++; stat[m.b].ga++; }
      else { stat[m.b].pts += 3; stat[m.b].gf++; stat[m.a].ga++; }
    }
    order[letter] = teams
      .map((t) => ({ id: resolveId(t), name: t, gd: stat[t].gf - stat[t].ga, ...stat[t] }))
      .sort((x, y) =>
        y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || strengthOf(y.name) - strengthOf(x.name))
      .map((r) => r.id)
      .filter(Boolean);
  }
  return order;
}

// Assign best-third teams to the eligible "3 ..." slots. Greedy, most
// constrained slot first — an approximation of FIFA's combination table that
// always produces a valid (group-eligible) placement.
function assignThirds(bestThirds, assignments) {
  const slots = THIRD_SLOTS.map((s) => ({ ...s }));
  const pool = [...bestThirds];
  const eligibleCount = (slot) => pool.filter((t) => slot.groups.includes(t.letter)).length;
  while (slots.length && pool.length) {
    slots.sort((a, b) => eligibleCount(a) - eligibleCount(b));
    const slot = slots.shift();
    const idx = pool.findIndex((t) => slot.groups.includes(t.letter));
    const pick = idx >= 0 ? pool.splice(idx, 1)[0] : pool.shift();
    if (pick) assignments[slot.id] = pick.id;
  }
}

// Turn the full fixture list into bracket assignments + eliminated teams.
// A team only appears in the bracket once its slot is genuinely decided:
//  - group still in progress -> only teams that have clinched top 2, in their
//    current 1st/2nd slot; no third-place slots, no eliminations.
//  - all groups finished -> winners (1X), runners-up (2X), the best 8 third-
//    placed teams in the "3 ..." slots, and everyone else marked OUT.
function buildSnapshot(fixtures) {
  // Bucket group fixtures by letter.
  const groups = {}; // letter -> { teams:Set, played:[{a,b,ga,gb}], remaining:[{a,b}] }
  for (const f of fixtures) {
    if (!f.group || !f.team1 || !f.team2) continue;
    const g = (groups[f.group] ??= { teams: new Set(), played: [], remaining: [] });
    g.teams.add(f.team1); g.teams.add(f.team2);
    if (f.ft) g.played.push({ a: f.team1, b: f.team2, ga: f.ft[0], gb: f.ft[1] });
    else g.remaining.push({ a: f.team1, b: f.team2 });
  }

  const assignments = {};
  const eliminated = new Set();
  const thirds = [];
  // 3rd-placed team of every group (decorated), for the modal's cross-group
  // "best 3rds" ranking — separate from `thirds`, which drives bracket slots.
  const thirdRanking = [];
  // Full league tables per group letter, for the standings modal. Each row keeps
  // the resolved internal id + flag code so the UI can render flags + names.
  const standings = {};
  const allComplete = Object.values(groups).every((g) => g.remaining.length === 0)
    && Object.keys(groups).length === 12;

  for (const [letter, g] of Object.entries(groups)) {
    const teams = [...g.teams];
    const table = tableFor(teams, g.played);

    // Build the display table for this group (decorated with id/code).
    standings[letter] = table.map((row) => {
      const id = resolveId(row.name);
      return {
        ...row,
        id,
        code: TEAMS_BY_ID[id]?.code ?? null,
        name: TEAMS_BY_ID[id]?.name ?? row.name,
      };
    });
    // Track the 3rd-placed team of every group for the cross-group ranking,
    // regardless of whether the group has finished yet.
    const third = standings[letter][2];
    if (third) thirdRanking.push({ ...third, letter });

    if (g.remaining.length === 0) {
      // Group finished: ranks are final.
      table.forEach((row, i) => {
        const id = resolveId(row.name);
        if (!id) return;
        if (i === 0) assignments[SLOT_BY_LABEL[`1${letter}`]] = id;
        else if (i === 1) assignments[SLOT_BY_LABEL[`2${letter}`]] = id;
        else if (i === 2) thirds.push({ id, letter, pts: row.pts, gd: row.gd, gf: row.gf });
        else eliminated.add(id); // 4th — can't be a best-third
      });
    } else {
      // In progress: only place teams that have already clinched top 2.
      const clinched = clinchedTop2(teams, g.played, g.remaining);
      table.forEach((row, i) => {
        if (!clinched.has(row.name) || i > 1) return;
        const id = resolveId(row.name);
        if (id) assignments[SLOT_BY_LABEL[`${i + 1}${letter}`]] = id;
      });
    }
  }

  // Third-place slots only resolve once every group is done (cross-group rank).
  if (allComplete) {
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    assignThirds(thirds.slice(0, 8), assignments);
    for (const t of thirds.slice(8)) eliminated.add(t.id);
  }

  // Rank every group's 3rd-placed team against each other (FIFA tiebreakers:
  // points, then goal difference, then goals for). Top 8 qualify.
  thirdRanking.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  return {
    assignments,
    eliminated,
    groupOrder: projectGroupOrder(groups),
    standings,
    thirdRanking,
  };
}

// Returns { assignments, eliminated, groupOrder } from the best available
// source. Order of preference: API-Football (if a working paid key) ->
// football-data.org (free token, via the /api/live proxy) -> openfootball
// (keyless, results only) -> the static snapshot. Note: API-Football's *free*
// plan has no access to season 2026, so a free key fails and we fall through.
export async function fetchLive() {
  if (API_KEY) {
    try {
      return buildSnapshot(await fetchFixturesApiFootball());
    } catch (err) {
      console.warn('[liveData] API-Football unavailable, falling back to football-data:', err.message);
    }
  }
  // Free path: football-data.org via our /api/live proxy.
  try {
    return buildSnapshot(fixturesFromFootballData(await fetchFootballDataMatches()));
  } catch (err) {
    console.warn('[liveData] football-data unavailable, falling back to openfootball:', err.message);
  }
  try {
    return buildSnapshot(await fetchFixturesOpenFootball());
  } catch (err) {
    console.warn('[liveData] live fetch failed, using static snapshot:', err);
    // No groupOrder -> Predict falls back to the static group listing order.
    return {
      assignments: { ...LIVE_QUALIFIED },
      eliminated: new Set(LIVE_ELIMINATED),
      standings: {},
      thirdRanking: [],
    };
  }
}
