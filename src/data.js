// FIFA World Cup 2026 — 12 groups (A–L), 4 teams each.
// `code` values are flag-icons ISO codes (gb-eng / gb-sct for the home nations).

export const GROUPS = [
  {
    id: 'A',
    teams: [
      { id: 'mex', name: 'Mexico', code: 'mx' },
      { id: 'kor', name: 'South Korea', code: 'kr' },
      { id: 'cze', name: 'Czech Republic', code: 'cz' },
      { id: 'rsa', name: 'South Africa', code: 'za' },
    ],
  },
  {
    id: 'B',
    teams: [
      { id: 'can', name: 'Canada', code: 'ca' },
      { id: 'sui', name: 'Switzerland', code: 'ch' },
      { id: 'bih', name: 'Bosnia-Herzegovina', code: 'ba' },
      { id: 'qat', name: 'Qatar', code: 'qa' },
    ],
  },
  {
    id: 'C',
    teams: [
      { id: 'bra', name: 'Brazil', code: 'br' },
      { id: 'mar', name: 'Morocco', code: 'ma' },
      { id: 'sco', name: 'Scotland', code: 'gb-sct' },
      { id: 'hai', name: 'Haiti', code: 'ht' },
    ],
  },
  {
    id: 'D',
    teams: [
      { id: 'usa', name: 'United States', code: 'us' },
      { id: 'aus', name: 'Australia', code: 'au' },
      { id: 'par', name: 'Paraguay', code: 'py' },
      { id: 'tur', name: 'Turkey', code: 'tr' },
    ],
  },
  {
    id: 'E',
    teams: [
      { id: 'ger', name: 'Germany', code: 'de' },
      { id: 'civ', name: 'Ivory Coast', code: 'ci' },
      { id: 'ecu', name: 'Ecuador', code: 'ec' },
      { id: 'cuw', name: 'Curaçao', code: 'cw' },
    ],
  },
  {
    id: 'F',
    teams: [
      { id: 'swe', name: 'Sweden', code: 'se' },
      { id: 'jpn', name: 'Japan', code: 'jp' },
      { id: 'ned', name: 'Netherlands', code: 'nl' },
      { id: 'tun', name: 'Tunisia', code: 'tn' },
    ],
  },
  {
    id: 'G',
    teams: [
      { id: 'nzl', name: 'New Zealand', code: 'nz' },
      { id: 'irn', name: 'Iran', code: 'ir' },
      { id: 'bel', name: 'Belgium', code: 'be' },
      { id: 'egy', name: 'Egypt', code: 'eg' },
    ],
  },
  {
    id: 'H',
    teams: [
      { id: 'uru', name: 'Uruguay', code: 'uy' },
      { id: 'ksa', name: 'Saudi Arabia', code: 'sa' },
      { id: 'esp', name: 'Spain', code: 'es' },
      { id: 'cpv', name: 'Cape Verde', code: 'cv' },
    ],
  },
  {
    id: 'I',
    teams: [
      { id: 'nor', name: 'Norway', code: 'no' },
      { id: 'fra', name: 'France', code: 'fr' },
      { id: 'sen', name: 'Senegal', code: 'sn' },
      { id: 'irq', name: 'Iraq', code: 'iq' },
    ],
  },
  {
    id: 'J',
    teams: [
      { id: 'arg', name: 'Argentina', code: 'ar' },
      { id: 'aut', name: 'Austria', code: 'at' },
      { id: 'jor', name: 'Jordan', code: 'jo' },
      { id: 'alg', name: 'Algeria', code: 'dz' },
    ],
  },
  {
    id: 'K',
    teams: [
      { id: 'col', name: 'Colombia', code: 'co' },
      { id: 'cod', name: 'Congo DR', code: 'cd' },
      { id: 'por', name: 'Portugal', code: 'pt' },
      { id: 'uzb', name: 'Uzbekistan', code: 'uz' },
    ],
  },
  {
    id: 'L',
    teams: [
      { id: 'eng', name: 'England', code: 'gb-eng' },
      { id: 'gha', name: 'Ghana', code: 'gh' },
      { id: 'pan', name: 'Panama', code: 'pa' },
      { id: 'cro', name: 'Croatia', code: 'hr' },
    ],
  },
];

// Representative primary flag colour per team — used to tint the winning
// connector lines in the radial bracket.
export const TEAM_COLORS = {
  mex: '#006847', kor: '#003478', cze: '#11457e', rsa: '#007a4d',
  can: '#ff0000', sui: '#ff0000', bih: '#002395', qat: '#8a1538',
  bra: '#009b3a', mar: '#c1272d', sco: '#005eb8', hai: '#00209f',
  usa: '#3c3b6e', aus: '#ffcd00', par: '#d52b1e', tur: '#e30a17',
  ger: '#dd0000', civ: '#f77f00', ecu: '#ffd100', cuw: '#002b7f',
  swe: '#006aa7', jpn: '#bc002d', ned: '#f36c21', tun: '#e70013',
  nzl: '#00247d', irn: '#239f40', bel: '#ef3340', egy: '#ce1126',
  uru: '#0038a8', ksa: '#006c35', esp: '#c60b1e', cpv: '#003893',
  nor: '#ef2b2d', fra: '#0055a4', sen: '#00853f', irq: '#ce1126',
  arg: '#75aadb', aut: '#ed2939', jor: '#ce1126', alg: '#006233',
  col: '#fcd116', cod: '#007fff', por: '#da291c', uzb: '#0099b5',
  eng: '#cf081f', gha: '#006b3f', pan: '#da121a', cro: '#ff0000',
};

// Flat lookup: teamId -> team object
export const TEAMS_BY_ID = Object.fromEntries(
  GROUPS.flatMap((g) => g.teams.map((t) => [t.id, t]))
);

// ----- Bracket structure -----
// Round of 32 position labels, matching FIFA's official 2026 knockout bracket.
// Left half (top→bottom) then right half (top→bottom). Each entry is one slot;
// adjacent slots play each other. The "3 ..." labels list the groups a third-
// placed opponent may come from (depends on which 8 thirds qualify).
const R32_LEFT = [
  '1E', '3 ABCDF',
  '1I', '3 CDFGH',
  '2A', '2B',
  '1F', '2C',
  '2K', '2L',
  '1H', '2J',
  '1D', '3 BEFIJ',
  '1G', '3 AEHIJ',
];

const R32_RIGHT = [
  '1C', '2F',
  '2E', '2I',
  '1A', '3 CEFHI',
  '1L', '3 EHIJK',
  '1J', '2H',
  '2D', '2G',
  '1B', '3 EFGIJ',
  '1K', '3 DEIJL',
];

// Build the slots for a half: 4 rounds (R32, R16, QF, SF) collapsing 16 -> 1.
function buildHalf(side, r32Labels) {
  const rounds = [];
  // Round 0 — R32: 8 matches, 16 slots with labels
  rounds.push(
    Array.from({ length: 16 }, (_, i) => ({
      id: `${side}-r0-s${i}`,
      label: r32Labels[i],
    }))
  );
  // Rounds 1..3 — R16 (8), QF (4), SF (2)
  const counts = [8, 4, 2];
  counts.forEach((count, ri) => {
    rounds.push(
      Array.from({ length: count }, (_, i) => ({
        id: `${side}-r${ri + 1}-s${i}`,
        label: '',
      }))
    );
  });
  return rounds;
}

export const BRACKET = {
  left: buildHalf('L', R32_LEFT),
  right: buildHalf('R', R32_RIGHT),
  final: [
    { id: 'final-s0', label: 'SF1' },
    { id: 'final-s1', label: 'SF2' },
  ],
  champion: { id: 'champion', label: 'CHAMPION' },
};

// ----- FIFA Annex C: official best-third allocation -----
// Which "3 ..." Round-of-32 slot each qualifying third-placed team plays in
// depends on *which* 8 of the 12 groups supply a qualifying third — FIFA
// publishes all 495 combinations in Annex C of the tournament regulations. A
// greedy "most-constrained-slot-first" placement produces a *valid* bracket but
// not necessarily FIFA's official one, so we encode the realized combinations
// here and look them up first. Key: the 8 qualifying group letters, sorted and
// joined. Value: group letter -> the slot label that group's third plays in.
export const THIRD_PLACE_TABLE = {
  // 2026 tournament — thirds from B, D, E, F, I, J, K, L qualified.
  BDEFIJKL: {
    D: '3 ABCDF', // 3D -> vs 1E
    F: '3 CDFGH', // 3F -> vs 1I
    B: '3 BEFIJ', // 3B -> vs 1D
    I: '3 AEHIJ', // 3I -> vs 1G
    E: '3 CEFHI', // 3E -> vs 1A
    K: '3 EHIJK', // 3K -> vs 1L
    J: '3 EFGIJ', // 3J -> vs 1B
    L: '3 DEIJL', // 3L -> vs 1K
  },
};

// Look up the official slot allocation for a set of qualifying third-place group
// letters. Returns { groupLetter: slotLabel } or null if the combination isn't
// in the table (caller should fall back to a greedy valid placement).
export function thirdPlaceMapping(groupLetters) {
  const key = [...new Set(groupLetters)].sort().join('');
  return THIRD_PLACE_TABLE[key] ?? null;
}

// ----- Live snapshot from FIFA (updated 2026-06-20) -----
// Group stage still in progress. Only Mexico and the United States (co-hosts)
// have officially qualified for the Round of 32 so far. Placed in their group-
// winner slots (1A / 1D). Re-run the lookup to refresh as more teams qualify.
export const LIVE_QUALIFIED = {
  'R-r0-s4': 'mex', // 1A — Mexico
  'L-r0-s12': 'usa', // 1D — United States
};

export function getInitialAssignments() {
  return { ...LIVE_QUALIFIED };
}

// ----- Real eliminated teams (live, updated 2026-06-20) -----
// Group stage still in progress. Haiti (Group C) is the first team
// mathematically eliminated after losing to Brazil.
// Add team ids here as more teams are knocked out; the UI disables them.
export const LIVE_ELIMINATED = new Set([
  'hai', // Haiti — eliminated (lost to Brazil)
]);

const GROUPS_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

// ----- Team strength ratings (0–100), proxy for community win probability -----
export const STRENGTH = {
  mex: 76, kor: 71, cze: 72, rsa: 64,
  can: 70, sui: 80, bih: 72, qat: 63,
  bra: 93, mar: 82, sco: 69, hai: 54,
  usa: 75, aus: 68, par: 67, tur: 78,
  ger: 88, civ: 73, ecu: 74, cuw: 52,
  swe: 73, jpn: 79, ned: 89, tun: 69,
  nzl: 57, irn: 71, bel: 86, egy: 72,
  uru: 84, ksa: 65, esp: 94, cpv: 57,
  nor: 81, fra: 95, sen: 80, irq: 62,
  arg: 96, aut: 77, jor: 60, alg: 73,
  col: 81, cod: 66, por: 90, uzb: 63,
  eng: 91, gha: 70, pan: 59, cro: 85,
};

// Effective strength: eliminated teams can't advance.
const eff = (id) => (id && !LIVE_ELIMINATED.has(id) ? STRENGTH[id] ?? 0 : -1);

// Pick the winner of a matchup (higher rating wins; handles empty slots).
const winner = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return eff(a) >= eff(b) ? a : b;
};

// Resolve a group position to a team id. `groupOrder` (from the live feed) is a
// projection of each group's final standings — e.g. { A: ['mex','kor','cze',…] }
// derived from results already played plus a strength-based forecast of the rest.
// Without it we fall back to the static listing order in GROUPS.
const positionId = (groupOrder, letter, rank /* 0-based */) =>
  groupOrder?.[letter]?.[rank] ?? GROUPS_BY_ID[letter].teams[rank]?.id;

// Fill the entire bracket. Seeds the Round of 32 from the projected group
// standings (so it reflects results already played), then advances by rating.
export function predictBracket(groupOrder) {
  const a = {};

  // 1) Seed the Round of 32.
  const thirdSlots = [];
  const usedThird = new Set();
  for (const slot of [...BRACKET.left[0], ...BRACKET.right[0]]) {
    const label = slot.label.trim();
    const m = /^([12])([A-L])$/.exec(label);
    if (m) {
      // "1E" -> projected winner, "2A" -> projected runner-up
      a[slot.id] = positionId(groupOrder, m[2], Number(m[1]) - 1);
    } else {
      // "3 ABCDF" -> a best third-placed team from one of those groups
      const letters = label.replace(/[^A-L]/g, '').split('');
      thirdSlots.push({ slotId: slot.id, label, letters });
    }
  }
  // Best-third slots: take the 8 strongest projected third-placed teams across
  // all groups, then assign them to the eligible "3 ..." slots most-constrained
  // slot first. This guarantees every slot is filled (a naive per-slot pick can
  // exhaust a slot's eligible groups and leave it empty, e.g. "3 EFGIJ").
  const thirdPool = Object.keys(GROUPS_BY_ID)
    .map((L) => ({ id: positionId(groupOrder, L, 2), letter: L }))
    .filter((c) => c.id)
    .sort((x, y) => eff(y.id) - eff(x.id))
    .slice(0, 8);

  // Prefer FIFA's official Annex C allocation when this exact set of 8 third-
  // place groups is in the table; otherwise fall back to the greedy placement.
  const official = thirdPlaceMapping(thirdPool.map((c) => c.letter));
  if (official) {
    for (const c of thirdPool) {
      const slot = thirdSlots.find((s) => s.label === official[c.letter]);
      if (slot) {
        a[slot.slotId] = c.id;
        usedThird.add(c.id);
      }
    }
  } else {
    const pending = thirdSlots.map((s) => ({ ...s }));
    const eligibleCount = (slot) =>
      thirdPool.filter((c) => !usedThird.has(c.id) && slot.letters.includes(c.letter)).length;
    while (pending.length) {
      pending.sort((x, y) => eligibleCount(x) - eligibleCount(y));
      const slot = pending.shift();
      // Strongest eligible-and-unused team; fall back to any unused so the slot
      // never ends up empty.
      let pick = null;
      for (const c of thirdPool) {
        if (usedThird.has(c.id)) continue;
        if (slot.letters.includes(c.letter) && (!pick || eff(c.id) > eff(pick.id))) pick = c;
      }
      if (!pick) pick = thirdPool.find((c) => !usedThird.has(c.id)) ?? null;
      if (pick) {
        a[slot.slotId] = pick.id;
        usedThird.add(pick.id);
      }
    }
  }

  // 2) Advance through each half: round r cell i is fed by round r-1 cells 2i, 2i+1.
  const advanceHalf = (rounds) => {
    for (let r = 1; r < rounds.length; r++) {
      rounds[r].forEach((slot, i) => {
        const f1 = a[rounds[r - 1][2 * i].id];
        const f2 = a[rounds[r - 1][2 * i + 1].id];
        a[slot.id] = winner(f1, f2);
      });
    }
  };
  advanceHalf(BRACKET.left);
  advanceHalf(BRACKET.right);

  // 3) Final: each half's two semi-finalists produce one finalist.
  const leftSF = BRACKET.left[BRACKET.left.length - 1];
  const rightSF = BRACKET.right[BRACKET.right.length - 1];
  const leftFinalist = winner(a[leftSF[0].id], a[leftSF[1].id]);
  const rightFinalist = winner(a[rightSF[0].id], a[rightSF[1].id]);
  a['final-s0'] = leftFinalist;
  a['final-s1'] = rightFinalist;
  a['champion'] = winner(leftFinalist, rightFinalist);

  return a;
}
