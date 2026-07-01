// Builds a shareable "ZETA WORLD CUP 2026" poster from the current bracket on a
// canvas (no DOM screenshotting). The layout mirrors the promo poster exactly:
// ZETA wordmark + WORLD CUP 2026 lockup, a Quarter-Finals -> Semis -> Final
// bracket around the trophy, the WINNER banner, and the host-nation footer.
// Rendered at 1024x1536 to match src/assets/bgcard.png. Returns Promise<Blob>.
import { TEAMS_BY_ID } from './data';
import bgUrl from './assets/bgcard.png';
import zetaUrl from './assets/zeta.png';
import trophyUrl from './assets/World-Cup-Trophy-PNG-Picture.png';
import emblemUrl from './assets/2026_FIFA_World_Cup_emblem.svg.webp';

// Canvas size == background image size.
const W = 1024;
const H = 1536;

// ---- palette --------------------------------------------------------------
const GOLD_STOPS = [
  [0, '#fef3c0'],
  [0.45, '#e9bb42'],
  [0.56, '#cf9a2b'],
  [1, '#f6dd84'],
];
const SILVER_STOPS = [
  [0, '#ffffff'],
  [0.42, '#e6edf3'],
  [0.56, '#b3bdc9'],
  [1, '#8b96a3'],
];
const GOLD = '#e9b840';
const GOLD_DIM = 'rgba(233,184,64,0.85)';
const CARD_FILL = 'rgba(4,8,20,0.80)';

// flag-icons ships SVGs in the package; pull them all in as bundled asset URLs.
const FLAG_URLS = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const flagUrl = (code) => {
  if (!code) return null;
  const hit = Object.keys(FLAG_URLS).find((p) => p.endsWith(`/${code}.svg`));
  return hit ? FLAG_URLS[hit] : null;
};

// ---- bracket -> teams -----------------------------------------------------
// Quarter-final matchups (4), semi-final matchups (2), the final, the champion.
const QF_SLOTS = [
  ['L-r2-s0', 'L-r2-s1'],
  ['L-r2-s2', 'L-r2-s3'],
  ['R-r2-s0', 'R-r2-s1'],
  ['R-r2-s2', 'R-r2-s3'],
];
const SF_SLOTS = [
  ['L-r3-s0', 'L-r3-s1'],
  ['R-r3-s0', 'R-r3-s1'],
];
const FINAL_SLOTS = ['final-s0', 'final-s1'];

// Host nations (static footer).
const HOSTS = [
  { name: 'UNITED STATES', code: 'us' },
  { name: 'CANADA', code: 'ca' },
  { name: 'MÉXICO', code: 'mx' },
];

const nameOf = (t) => (t ? t.name : '—');

// ---- image loading --------------------------------------------------------
function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// The ZETA logo asset sits on a grey studio gradient. Key out the mid-grey
// background so the wordmark floats on the dark poster like the reference.
// Keeps saturated blues, bright metallic highlights and dark outlines; drops
// only the low-saturation mid-grey fill.
function keyOutGrey(img) {
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const bright = (r + g + b) / 3;
    if (sat < 20 && bright > 110 && bright < 206) {
      // fade grey out with a soft edge near the threshold
      const edge = Math.min(206 - bright, bright - 110, 20 - sat);
      p[i + 3] = Math.max(0, Math.min(p[i + 3], edge < 4 ? edge * 30 : 0));
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

// The official "26" emblem ships as a black monogram (invisible on the dark
// poster). Recolour the near-black pixels to gold so the "26" reads, leaving
// the gold trophy and white "FIFA" untouched.
function goldenEmblem(img) {
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 8) continue;
    const b = (p[i] + p[i + 1] + p[i + 2]) / 3;
    if (b < 72) {
      p[i] = 233;
      p[i + 1] = 184;
      p[i + 2] = 64;
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

// ---- primitive drawing helpers -------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Vertical metallic gradient spanning the cap height of text on baseline `y`.
function grad(ctx, y, size, stops) {
  const g = ctx.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function text(ctx, str, x, y, opts = {}) {
  const {
    size = 20,
    weight = 800,
    italic = false,
    align = 'center',
    ls = 0,
    fill = '#fff',
    stroke = null,
    sw = 0,
    glow = null,
    gb = 0,
    family = '"Arial Black","Segoe UI",system-ui,sans-serif',
  } = opts;
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${ls}px`;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = gb;
  }
  if (stroke) {
    ctx.lineWidth = sw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Shrink font until the (uppercased) text fits maxWidth, then draw it.
function fitText(ctx, str, x, y, maxWidth, opts = {}) {
  let size = opts.size ?? 20;
  const measure = () => {
    ctx.font = `${opts.italic ? 'italic ' : ''}${opts.weight ?? 800} ${size}px ${
      opts.family ?? '"Arial Black","Segoe UI",system-ui,sans-serif'
    }`;
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${opts.ls ?? 0}px`;
    return ctx.measureText(str).width;
  };
  while (measure() > maxWidth && size > 9) size -= 1;
  text(ctx, str, x, y, { ...opts, size });
}

function star(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Circular flag badge with a gold ring (cover-fit the 4:3 flag).
function flagCircle(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#f2f2f2';
  ctx.fill();
  ctx.clip();
  if (img) {
    const iw = 2 * r * (4 / 3);
    const ih = 2 * r;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3.5, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
}

// Small rounded flag chip for the host footer.
function flagChip(ctx, img, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = '#f2f2f2';
  ctx.fill();
  ctx.clip();
  if (img) {
    const iw = h * (4 / 3) > w ? h * (4 / 3) : w;
    ctx.drawImage(img, x + (w - iw) / 2, y, iw, h);
  }
  ctx.restore();
  roundRect(ctx, x, y, w, h, 4);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = GOLD_DIM;
  ctx.stroke();
}

// Gold-framed navy panel (double border, like the reference cards).
function panel(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = CARD_FILL;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, r);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(2, r - 4));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(233,184,64,0.35)';
  ctx.stroke();
}

// Thin gold divider with a centered "VS".
function vsDivider(ctx, cx, cy, half) {
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - half, cy);
  ctx.lineTo(cx - 14, cy);
  ctx.moveTo(cx + 14, cy);
  ctx.lineTo(cx + half, cy);
  ctx.stroke();
  text(ctx, 'VS', cx, cy + 6, {
    size: 17,
    weight: 900,
    italic: true,
    fill: grad(ctx, cy + 6, 17, GOLD_STOPS),
  });
}

// A two-team matchup card: flag + name stacked, "VS" divider between.
function matchCard(ctx, x, y, w, h, teamTop, teamBot, flagMap, opts = {}) {
  const r = opts.r ?? 16;
  panel(ctx, x, y, w, h, r);
  const fr = opts.fr ?? 30;
  const nameSize = opts.nameSize ?? 21;
  const flagCx = x + 20 + fr;
  const nameX = flagCx + fr + 16;
  const nameMax = x + w - nameX - 16;
  const rowH = h / 2;
  const drawRow = (team, cy) => {
    flagCircle(ctx, team ? flagMap.get(team.code) : null, flagCx, cy, fr);
    fitText(ctx, nameOf(team).toUpperCase(), nameX, cy + nameSize * 0.36, nameMax, {
      size: nameSize,
      weight: 900,
      align: 'left',
      ls: 0.5,
      fill: '#f4f6fb',
      family: '"Segoe UI",system-ui,Arial,sans-serif',
    });
  };
  drawRow(teamTop, y + rowH * 0.5);
  drawRow(teamBot, y + rowH * 1.5);
  vsDivider(ctx, x + w / 2, y + rowH, w / 2 - 18);
}

// ---- main render ----------------------------------------------------------
export async function generatePredictionCard(assignments) {
  const t = (slot) => TEAMS_BY_ID[assignments[slot]] ?? null;
  const qf = QF_SLOTS.map((pair) => pair.map(t));
  const sf = SF_SLOTS.map((pair) => pair.map(t));
  const finalists = FINAL_SLOTS.map(t);
  const champion = t('champion');

  // Preload all flags we need (bracket teams + hosts), keyed by ISO code.
  const codes = new Set();
  [...qf.flat(), ...sf.flat(), ...finalists, champion].forEach((tm) => tm && codes.add(tm.code));
  HOSTS.forEach((hnat) => codes.add(hnat.code));
  const codeList = [...codes];
  const [bg, zetaRaw, trophy, emblem, ...flagImgs] = await Promise.all([
    loadImage(bgUrl),
    loadImage(zetaUrl),
    loadImage(trophyUrl),
    loadImage(emblemUrl),
    ...codeList.map((c) => loadImage(flagUrl(c))),
  ]);
  const flagMap = new Map(codeList.map((c, i) => [c, flagImgs[i]]));
  const zeta = keyOutGrey(zetaRaw);
  const emblemGold = goldenEmblem(emblem);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const cx = W / 2;

  // ---- background ----
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else {
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, W, H);
  }

  // =========================================================================
  // HEADER
  // =========================================================================
  // ---- top-left emblem badge ----
  // gold corner frame with a diagonal bevel, a soft glow, then the gold "26"
  // emblem centred with a clean "WORLD CUP 2026" label beneath it.
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 172);
  ctx.lineTo(24, 40);
  ctx.lineTo(40, 24);
  ctx.lineTo(172, 24);
  ctx.stroke();
  // thin inner accent
  ctx.strokeStyle = 'rgba(233,184,64,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(31, 168);
  ctx.lineTo(31, 44);
  ctx.lineTo(44, 31);
  ctx.lineTo(168, 31);
  ctx.stroke();
  ctx.restore();

  const badgeCx = 96;
  if (emblemGold) {
    const ew = 58;
    const eh = ew * (emblemGold.height / emblemGold.width);
    ctx.save();
    ctx.shadowColor = 'rgba(233,184,64,0.45)';
    ctx.shadowBlur = 16;
    ctx.drawImage(emblemGold, badgeCx - ew / 2, 34, ew, eh);
    ctx.restore();
  } else {
    text(ctx, '26', badgeCx, 96, { size: 48, weight: 900, italic: true, fill: grad(ctx, 96, 48, GOLD_STOPS) });
  }
  text(ctx, 'WORLD CUP', badgeCx, 145, { size: 14, weight: 900, ls: 1.5, fill: '#f4f6fb', family: '"Segoe UI",system-ui,Arial,sans-serif' });
  text(ctx, '2026', badgeCx, 165, { size: 15, weight: 900, ls: 3, fill: grad(ctx, 165, 15, GOLD_STOPS), family: '"Segoe UI",system-ui,Arial,sans-serif' });

  // ---- top-right "The World UNITED" ----
  const twX = W - 44;
  text(ctx, 'The World', twX, 66, {
    size: 32, weight: 600, italic: true, align: 'right',
    fill: grad(ctx, 66, 32, GOLD_STOPS), family: 'Georgia,"Times New Roman",serif',
    glow: 'rgba(233,184,64,0.4)', gb: 10,
  });
  text(ctx, 'UNITED', twX, 100, {
    size: 21, weight: 700, align: 'right', ls: 8,
    fill: grad(ctx, 100, 21, GOLD_STOPS), family: 'Georgia,serif',
  });
  // gold rule flanking the wordmark
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(twX - 150, 110);
  ctx.lineTo(twX, 110);
  ctx.stroke();
  star(ctx, twX - 160, 109, 5, GOLD);

  // ZETA logo (crop the central band of the square asset so it sits tight)
  if (zeta) {
    const dw = 470;
    const scale = dw / zeta.width;
    const sy = Math.round(zeta.height * 0.30);
    const sh = Math.round(zeta.height * 0.42);
    const dh = sh * scale;
    ctx.save();
    ctx.shadowColor = 'rgba(60,140,240,0.55)';
    ctx.shadowBlur = 24;
    ctx.drawImage(zeta, 0, sy, zeta.width, sh, cx - dw / 2, 20, dw, dh);
    ctx.restore();
  } else {
    text(ctx, 'ZETA', cx, 130, { size: 90, weight: 900, italic: true, fill: grad(ctx, 130, 90, SILVER_STOPS) });
  }

  // WORLD CUP (silver) + 2026 (gold)
  text(ctx, 'WORLD CUP', cx, 300, {
    size: 104,
    weight: 900,
    italic: true,
    ls: 1,
    fill: grad(ctx, 300, 104, SILVER_STOPS),
    stroke: 'rgba(20,28,44,0.9)',
    sw: 5,
    glow: 'rgba(0,0,0,0.5)',
    gb: 10,
  });
  text(ctx, '2026', cx, 392, {
    size: 66,
    weight: 900,
    italic: true,
    ls: 6,
    fill: grad(ctx, 392, 66, GOLD_STOPS),
    stroke: 'rgba(60,40,8,0.7)',
    sw: 3,
  });
  // stars + rules flanking 2026
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 150, 375);
  ctx.lineTo(cx - 100, 375);
  ctx.moveTo(cx + 100, 375);
  ctx.lineTo(cx + 150, 375);
  ctx.stroke();
  star(ctx, cx - 172, 375, 11, GOLD);
  star(ctx, cx + 172, 375, 11, GOLD);

  // tagline
  text(ctx, 'ONE DREAM.  ONE GOAL.  ONE WORLD.', cx, 438, {
    size: 21,
    weight: 800,
    ls: 4,
    fill: '#e9edf4',
    family: '"Segoe UI",system-ui,Arial,sans-serif',
  });

  // =========================================================================
  // BRACKET
  // =========================================================================
  const cardW = 205;
  const cardH = 150;
  const topY = 470;
  const botY = 690;
  const leftX = 30;
  const rightX = W - 30 - cardW;

  const semiW = 190;
  const semiH = 170;
  const semiY = 582;
  const semiLX = 250;
  const semiRXpos = W - semiLX - semiW;

  // connectors (draw first, behind the cards)
  ctx.save();
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 3;
  const elbow = (x1, y1, x2, y2) => {
    const midX = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(midX, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  // left outer -> left semi
  elbow(leftX + cardW, topY + cardH / 2, semiLX, semiY + semiH * 0.32);
  elbow(leftX + cardW, botY + cardH / 2, semiLX, semiY + semiH * 0.68);
  // right outer -> right semi
  elbow(rightX, topY + cardH / 2, semiRXpos + semiW, semiY + semiH * 0.32);
  elbow(rightX, botY + cardH / 2, semiRXpos + semiW, semiY + semiH * 0.68);
  // semis -> center
  ctx.beginPath();
  ctx.moveTo(semiLX + semiW, semiY + semiH / 2);
  ctx.lineTo(semiLX + semiW + 30, semiY + semiH / 2);
  ctx.moveTo(semiRXpos - 30, semiY + semiH / 2);
  ctx.lineTo(semiRXpos, semiY + semiH / 2);
  ctx.stroke();
  ctx.restore();

  // QUARTER-FINALS label
  text(ctx, 'QUARTER-FINALS', cx, 462, {
    size: 22,
    weight: 900,
    ls: 2,
    fill: grad(ctx, 462, 22, GOLD_STOPS),
    family: '"Segoe UI",system-ui,Arial,sans-serif',
  });

  // outer QF cards
  matchCard(ctx, leftX, topY, cardW, cardH, qf[0][0], qf[0][1], flagMap);
  matchCard(ctx, leftX, botY, cardW, cardH, qf[1][0], qf[1][1], flagMap);
  matchCard(ctx, rightX, topY, cardW, cardH, qf[2][0], qf[2][1], flagMap);
  matchCard(ctx, rightX, botY, cardW, cardH, qf[3][0], qf[3][1], flagMap);

  // inner semi-final cards
  matchCard(ctx, semiLX, semiY, semiW, semiH, sf[0][0], sf[0][1], flagMap, { fr: 32, nameSize: 20 });
  matchCard(ctx, semiRXpos, semiY, semiW, semiH, sf[1][0], sf[1][1], flagMap, { fr: 32, nameSize: 20 });

  // ---- trophy (on top, between the semis) ----
  if (trophy) {
    const th = 380;
    const tw = th * (trophy.width / trophy.height);
    ctx.save();
    ctx.shadowColor = 'rgba(233,184,64,0.5)';
    ctx.shadowBlur = 40;
    ctx.drawImage(trophy, cx - tw / 2, 508, tw, th);
    ctx.restore();
  }

  // =========================================================================
  // FINAL
  // =========================================================================
  const finalX = 252;
  const finalW = W - finalX * 2;
  const finalY = 918;
  const finalH = 120;
  text(ctx, 'FINAL', cx, finalY - 12, {
    size: 26,
    weight: 900,
    ls: 3,
    fill: grad(ctx, finalY - 12, 26, GOLD_STOPS),
    family: '"Segoe UI",system-ui,Arial,sans-serif',
  });
  panel(ctx, finalX, finalY, finalW, finalH, 18);
  const fRow = finalY + 48;
  flagCircle(ctx, finalists[0] ? flagMap.get(finalists[0].code) : null, finalX + 60, fRow, 32);
  flagCircle(ctx, finalists[1] ? flagMap.get(finalists[1].code) : null, finalX + finalW - 60, fRow, 32);
  fitText(ctx, nameOf(finalists[0]).toUpperCase(), finalX + 150, fRow + 8, 150, {
    size: 24, weight: 900, ls: 0.5, fill: '#f4f6fb', family: '"Segoe UI",system-ui,Arial,sans-serif',
  });
  fitText(ctx, nameOf(finalists[1]).toUpperCase(), finalX + finalW - 150, fRow + 8, 150, {
    size: 24, weight: 900, ls: 0.5, fill: '#f4f6fb', family: '"Segoe UI",system-ui,Arial,sans-serif',
  });
  text(ctx, 'VS', cx, fRow + 9, { size: 30, weight: 900, italic: true, fill: grad(ctx, fRow + 9, 30, GOLD_STOPS) });
  text(ctx, '19 JULY 2026   •   METLIFE STADIUM   •   NEW JERSEY, USA', cx, finalY + finalH - 20, {
    size: 15, weight: 800, ls: 1.5, fill: '#c9cfda', family: '"Segoe UI",system-ui,Arial,sans-serif',
  });

  // =========================================================================
  // WINNER
  // =========================================================================
  const winX = 70;
  const winW = W - winX * 2;
  const winY = 1108;
  const winH = 248;
  text(ctx, 'WINNER', cx, winY - 14, {
    size: 40,
    weight: 900,
    italic: true,
    ls: 4,
    fill: grad(ctx, winY - 14, 40, GOLD_STOPS),
    family: '"Segoe UI",system-ui,Arial,sans-serif',
  });
  panel(ctx, winX, winY, winW, winH, 22);
  // trophy graphic on the left of the winner banner
  if (trophy) {
    const wh = 196;
    const ww = wh * (trophy.width / trophy.height);
    ctx.drawImage(trophy, winX + 40, winY + (winH - wh) / 2, ww, wh);
  }
  // champion flag circle on the right
  const champCx = winX + winW - 110;
  const champCy = winY + winH / 2;
  flagCircle(ctx, champion ? flagMap.get(champion.code) : null, champCx, champCy, 80);
  // centered champion text block
  const blockCx = (winX + 250 + (champCx - 90)) / 2;
  fitText(ctx, nameOf(champion).toUpperCase(), blockCx, winY + 108, champCx - 90 - (winX + 250), {
    size: 74, weight: 900, ls: 1, fill: grad(ctx, winY + 108, 74, GOLD_STOPS), stroke: 'rgba(60,40,8,0.6)', sw: 3,
  });
  text(ctx, 'CHAMPIONS OF THE WORLD', blockCx, winY + 150, {
    size: 22, weight: 900, ls: 3, fill: '#f4f6fb', family: '"Segoe UI",system-ui,Arial,sans-serif',
  });
  text(ctx, '2026', blockCx, winY + 200, {
    size: 38, weight: 900, italic: true, ls: 4, fill: grad(ctx, winY + 200, 38, GOLD_STOPS),
  });
  star(ctx, blockCx - 70, winY + 188, 12, GOLD);
  star(ctx, blockCx + 70, winY + 188, 12, GOLD);

  // =========================================================================
  // FOOTER
  // =========================================================================
  text(ctx, 'ONE STEP FROM GLORY', cx, 1424, {
    size: 40,
    weight: 900,
    italic: true,
    ls: 3,
    fill: grad(ctx, 1424, 40, SILVER_STOPS),
    stroke: 'rgba(20,28,44,0.8)',
    sw: 3,
  });

  // host nations row (flag chip + name, star separators), centered
  ctx.font = '800 20px "Segoe UI",system-ui,Arial,sans-serif';
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '1px';
  const chipW = 36;
  const chipH = 26;
  const gap = 12;
  const sep = 40;
  const items = HOSTS.map((hnat) => ({ ...hnat, tw: ctx.measureText(hnat.name).width }));
  const totalW =
    items.reduce((s, it) => s + chipW + gap + it.tw, 0) + sep * (items.length - 1);
  let hx = cx - totalW / 2;
  const hy = 1480;
  items.forEach((it, i) => {
    flagChip(ctx, flagMap.get(it.code), hx, hy - chipH + 4, chipW, chipH);
    hx += chipW + gap;
    text(ctx, it.name, hx, hy, {
      size: 20, weight: 800, align: 'left', ls: 1, fill: '#eef1f6', family: '"Segoe UI",system-ui,Arial,sans-serif',
    });
    hx += it.tw;
    if (i < items.length - 1) {
      star(ctx, hx + sep / 2, hy - 7, 8, GOLD);
      hx += sep;
    }
  });

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

// Share the card via the Web Share API (mobile) when possible, else download it.
export async function sharePredictionCard(assignments) {
  const blob = await generatePredictionCard(assignments);
  if (!blob) return;
  const file = new File([blob], 'my-zeta-worldcup-2026.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'ZETA World Cup 2026 — my prediction',
        text: 'My 2026 knockout prediction — build yours:',
      });
      return;
    } catch {
      /* user cancelled or share failed — fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-zeta-worldcup-2026.png';
  link.click();
  URL.revokeObjectURL(url);
}
