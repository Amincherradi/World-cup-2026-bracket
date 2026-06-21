// Builds a shareable "my prediction" image from the current bracket on a canvas
// (no extra deps, no DOM screenshotting). Uses the app theme so the share asset
// matches the product, with team flags drawn above each name. Returns Promise<Blob>.
import { TEAMS_BY_ID, BRACKET } from './data';

const W = 1200;
const H = 700;

// Pulled straight from the app theme (App.scss) so the card matches the product.
const C = {
  slate0: '#d1ced5', // pale-slate page bg
  slate1: '#c4c0ca',
  panel: '#ffffff', // platinum card
  chip: '#ededed',
  line: '#b0abb5',
  border: '#cdcad1',
  accent: '#3270b4', // bright-marine
  text: '#503432', // chocolate-plum
  muted: '#837a78',
  danger: '#bf3337', // tomato-jam
};

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

const team = (assignments, slotId) => TEAMS_BY_ID[assignments[slotId]] ?? null;
const nameOf = (t) => (t ? t.name : '—');

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw a flag centered horizontally on cx, top edge at `top`, given width.
function drawFlag(ctx, img, cx, top, w) {
  const h = (w * 3) / 4;
  const x = cx - w / 2;
  if (img) {
    ctx.drawImage(img, x, top, w, h);
  } else {
    ctx.fillStyle = C.chip;
    ctx.fillRect(x, top, w, h);
  }
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, top, w, h);
  return h;
}

export async function generatePredictionCard(assignments) {
  // Resolve the teams we need, then preload their flags before drawing.
  const champion = team(assignments, BRACKET.champion.id);
  const finalists = [team(assignments, BRACKET.final[0].id), team(assignments, BRACKET.final[1].id)];
  const semis = ['L-r3-s0', 'L-r3-s1', 'R-r3-s0', 'R-r3-s1'].map((s) => team(assignments, s));
  const all = [champion, ...finalists, ...semis];
  const imgs = await Promise.all(all.map((t) => loadImage(flagUrl(t?.code))));
  const img = new Map(all.map((t, i) => [t?.id ?? `x${i}`, imgs[i]]));
  const flagFor = (t) => (t ? img.get(t.id) : null);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const cx = W / 2;

  // page background (pale-slate gradient, like the app)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, C.slate0);
  grad.addColorStop(1, C.slate1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // platinum panel
  const M = 40;
  ctx.fillStyle = C.panel;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  roundRect(ctx, M, M, W - M * 2, H - M * 2, 26);
  ctx.fill();
  ctx.stroke();

  // faint bracket-glyph watermark (ties to the BracketLive logo)
  drawBracketGlyph(ctx, W - 250, H - 250, 210, C.accent, 0.06);

  // ---- wordmark (top-left) ----
  ctx.textAlign = 'left';
  ctx.fillStyle = C.danger;
  ctx.beginPath();
  ctx.arc(86, 92, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '800 30px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = C.text;
  ctx.fillText('BRACKET', 104, 102);
  const bw = ctx.measureText('BRACKET').width;
  ctx.fillStyle = C.accent;
  ctx.fillText('LIVE', 104 + bw, 102);

  ctx.textAlign = 'right';
  ctx.font = '700 17px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = C.muted;
  ctx.fillText('MY 2026 PREDICTION', W - 80, 100);

  // ---- champion ----
  ctx.textAlign = 'center';
  ctx.font = '800 19px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = C.danger;
  ctx.fillText('CHAMPION', cx, 168);

  drawFlag(ctx, flagFor(champion), cx, 184, 104);

  const champ = nameOf(champion).toUpperCase();
  ctx.fillStyle = C.text;
  const champPx = fitText(ctx, champ, cx, 332, W - 260, 76);
  ctx.font = `850 ${champPx}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
  const cw = Math.min(ctx.measureText(champ).width, W - 260);
  ctx.fillStyle = C.accent;
  roundRect(ctx, cx - cw / 2, 348, cw, 6, 3);
  ctx.fill();

  // ---- final (two columns, flag above name) ----
  const finalLabelY = 408;
  ctx.font = '700 15px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = C.muted;
  ctx.fillText('THE FINAL', cx, finalLabelY);

  const colX = [cx - 215, cx + 215];
  finalists.forEach((t, i) => {
    drawFlag(ctx, flagFor(t), colX[i], finalLabelY + 16, 70);
    ctx.fillStyle = C.text;
    fitText(ctx, nameOf(t), colX[i], finalLabelY + 96, 320, 32);
  });
  // marine VS badge between the columns
  ctx.fillStyle = C.accent;
  roundRect(ctx, cx - 28, finalLabelY + 44, 56, 32, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 16px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText('VS', cx, finalLabelY + 66);

  // ---- semifinalists (4 columns, flag above name) ----
  const semiLabelY = 548;
  ctx.font = '700 14px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = C.muted;
  ctx.fillText('SEMI-FINALISTS', cx, semiLabelY);

  const sStep = (W - M * 2 - 80) / 4;
  const sStart = M + 40 + sStep / 2;
  semis.forEach((t, i) => {
    const sx = sStart + sStep * i;
    drawFlag(ctx, flagFor(t), sx, semiLabelY + 14, 44);
    ctx.fillStyle = C.text;
    ctx.font = '700 18px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    fitText(ctx, nameOf(t), sx, semiLabelY + 70, sStep - 16, 18, '700');
  });

  // ---- footer ----
  ctx.fillStyle = C.accent;
  roundRect(ctx, M, H - M - 4, W - M * 2, 4, 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = '700 17px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = C.muted;
  ctx.fillText('Build yours · world-cup-2026-bracket-five.vercel.app', cx, H - 66);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

// Shrink the font until the text fits maxWidth, draw it centered, return px used.
function fitText(ctx, text, x, y, maxWidth, basePx, weight = '850') {
  let px = basePx;
  const set = () => (ctx.font = `${weight} ${px}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`);
  set();
  while (ctx.measureText(text).width > maxWidth && px > 14) {
    px -= 2;
    set();
  }
  ctx.fillText(text, x, y);
  return px;
}

// The BracketLive bracket glyph (same shape as the logo) used as a watermark.
function drawBracketGlyph(ctx, x, y, size, color, alpha) {
  const s = size / 64;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const seg = (pts) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  };
  seg([[6, 14], [20, 14], [20, 26], [6, 26]]);
  seg([[20, 20], [32, 20]]);
  seg([[6, 38], [20, 38], [20, 50], [6, 50]]);
  seg([[20, 44], [32, 44]]);
  seg([[32, 20], [32, 44]]);
  seg([[32, 32], [46, 32]]);
  ctx.globalAlpha = alpha * 1.8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(50, 32, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Share the card via the Web Share API (mobile) when possible, else download it.
export async function sharePredictionCard(assignments) {
  const blob = await generatePredictionCard(assignments);
  if (!blob) return;
  const file = new File([blob], 'my-bracketlive-prediction.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'My BracketLive prediction',
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
  link.download = 'my-bracketlive-prediction.png';
  link.click();
  URL.revokeObjectURL(url);
}
