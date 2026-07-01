import { useEffect, useRef } from 'react';
import { BRACKET, TEAM_COLORS } from '../data';
import Slot from './Slot';
import trophy from '../assets/World-Cup-Trophy-PNG-Picture.png';

// --- Radial bracket geometry ----------------------------------------------
// The bracket is drawn as concentric rings collapsing toward the trophy in the
// centre: 32 Round-of-32 slots on the outer ring, then 16 / 8 / 4 / 2 inward,
// with the champion at the core. Slots that play each other sit next to each
// other angularly, and each parent slot sits at the midpoint angle of its two
// children — so connector lines run cleanly inward.

const STAGE = 1040; // unscaled design size (square), scaled to fit on screen
const C = STAGE / 2; // centre point

// Radius of each ring, outermost -> innermost (ring 4 = the two finalists).
const RADII = [470, 372, 280, 192, 104];
const START = -90; // degrees; ring index 0 begins at 12 o'clock

// Ordered slot list per ring: right half first (top → bottom of the right
// semicircle), then left half — so child indices 2i / 2i+1 average to parent i.
function buildRings() {
  const rings = [];
  for (let r = 0; r < 4; r++) {
    rings.push([
      ...BRACKET.right[r].map((slot) => ({ slot, side: 'R' })),
      ...BRACKET.left[r].map((slot) => ({ slot, side: 'L' })),
    ]);
  }
  // Ring 4: the two finalists (right finalist, then left finalist).
  rings.push([
    { slot: BRACKET.final[1], side: 'R' },
    { slot: BRACKET.final[0], side: 'L' },
  ]);
  return rings;
}

const RINGS = buildRings();

// Polar -> cartesian for a given ring index and slot position within the ring.
function pointFor(ringIdx, i, count) {
  const angle = ((START + ((i + 0.5) / count) * 360) * Math.PI) / 180;
  const radius = RADII[ringIdx];
  return {
    x: C + radius * Math.cos(angle),
    y: C + radius * Math.sin(angle),
  };
}

export default function RoundedBracket({ assignments, slotProps, embed, credits, actions }) {
  // Scale the fixed-size stage down to fit the available width.
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;
    const update = () => {
      // Fit the square stage to whichever is tighter: available width or the
      // viewport height left below the top of the bracket — so the whole circle
      // is visible without scrolling.
      const availW = wrap.clientWidth;
      const top = wrap.getBoundingClientRect().top;
      const availH = window.innerHeight - top - 12;
      const scale = Math.min(1, availW / STAGE, availH / STAGE);
      stage.style.setProperty('--stage-scale', String(scale));
      // Reserve the scaled height so the page doesn't leave a huge gap.
      wrap.style.height = `${STAGE * scale}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Pre-compute every slot's point so we can draw connectors and place slots.
  const points = RINGS.map((ring, r) => ring.map((_, i) => pointFor(r, i, ring.length)));

  // Badge radius per ring (matches the CSS sizes) + a small gap, so spokes can
  // start/stop at the badge rim instead of crossing through the circle.
  const RING_RADIUS = [26, 26, 28, 31, 34];

  // Angle (radians) and polar->cartesian helpers in the stage coordinate space.
  const angOf = (ringIdx, i) =>
    ((START + ((i + 0.5) / RINGS[ringIdx].length) * 360) * Math.PI) / 180;
  const polar = (ang, radius) => ({
    x: C + radius * Math.cos(ang),
    y: C + radius * Math.sin(ang),
  });
  // SVG arc path between two angles at a fixed radius.
  const arcPath = (a0, a1, radius) => {
    const s = polar(a0, radius);
    const e = polar(a1, radius);
    const sweep = a1 > a0 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 0 ${sweep} ${e.x} ${e.y}`;
  };

  // Team in a given ring slot, and the team that advanced from that matchup
  // (the parent slot one ring inward, or the champion for the finalists ring).
  const teamAt = (r, i) => assignments[RINGS[r][i].slot.id];
  const parentTeamOf = (r, i) =>
    r < RINGS.length - 1
      ? assignments[RINGS[r + 1][Math.floor(i / 2)].slot.id]
      : assignments[BRACKET.champion.id];

  // A slot is a "loser" once its matchup is decided and it isn't the team that
  // advanced — that's where the badge gets greyed out.
  const loserSlotIds = new Set();
  for (let r = 0; r < RINGS.length; r++) {
    RINGS[r].forEach((node, i) => {
      const me = teamAt(r, i);
      const winner = parentTeamOf(r, i);
      if (me && winner && me !== winner) loserSlotIds.add(node.slot.id);
    });
  }

  // Classic-bracket "elbow" connectors, radial edition: each child runs a radial
  // spoke inward to a junction ring, an arc joins the two siblings, and a radial
  // spoke continues from the parent's angle inward to the parent badge. The
  // winner's side is tinted with its flag colour.
  const segs = []; // { d, key, color } — color null = undecided/faint
  for (let r = 0; r < RINGS.length - 1; r++) {
    const parentRing = RINGS[r + 1];
    parentRing.forEach((_, j) => {
      const i0 = 2 * j;
      const i1 = 2 * j + 1;
      const a0 = angOf(r, i0);
      const a1 = angOf(r, i1);
      const ap = angOf(r + 1, j);
      const Rc = RADII[r] - RING_RADIUS[r]; // child rim (inner side)
      const Rp = RADII[r + 1] + RING_RADIUS[r + 1]; // parent rim (outer side)
      const Rj = (RADII[r] + RADII[r + 1]) / 2; // junction ring

      const t0 = teamAt(r, i0);
      const t1 = teamAt(r, i1);
      const winner = parentTeamOf(r, i0);
      const c0 = t0 && winner && t0 === winner ? TEAM_COLORS[t0] : null;
      const c1 = t1 && winner && t1 === winner ? TEAM_COLORS[t1] : null;
      const cp = winner ? TEAM_COLORS[winner] : null;

      const radial = (ang, rA, rB) => {
        const s = polar(ang, rA);
        const e = polar(ang, rB);
        return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
      };

      // Child spokes (inward to the junction ring).
      segs.push({ d: radial(a0, Rc, Rj), key: `s-${r}-${i0}`, color: c0 });
      segs.push({ d: radial(a1, Rc, Rj), key: `s-${r}-${i1}`, color: c1 });
      // Arc joining the siblings, split at the parent angle so each half can
      // carry its own side's colour.
      segs.push({ d: arcPath(a0, ap, Rj), key: `a-${r}-${j}-0`, color: c0 });
      segs.push({ d: arcPath(ap, a1, Rj), key: `a-${r}-${j}-1`, color: c1 });
      // Parent spoke (junction ring inward to the parent badge).
      segs.push({ d: radial(ap, Rj, Rp), key: `p-${r}-${j}`, color: cp });
    });
  }
  // (No finalist -> centre lines: they would cross through the trophy/champion
  // circle at the core, so we leave the centre clean.)

  return (
    <div className="rounded-stage-wrap" ref={wrapRef}>
      {actions?.topCenter && (
        <div className="rounded-actions rounded-actions-tc">{actions.topCenter}</div>
      )}
      {actions?.topLeft && (
        <div className="rounded-actions rounded-actions-tl">{actions.topLeft}</div>
      )}
      {actions?.topRight && (
        <div className="rounded-actions rounded-actions-tr">{actions.topRight}</div>
      )}
      <div className="rounded-stage" ref={stageRef}>
        {/* Connector lines */}
        <svg
          className="rounded-lines"
          viewBox={`0 0 ${STAGE} ${STAGE}`}
          width={STAGE}
          height={STAGE}
          aria-hidden="true"
        >
          {segs.map((s) => (
            <path
              key={s.key}
              className={s.color ? 'is-won' : ''}
              d={s.d}
              fill="none"
              style={s.color ? { stroke: s.color, color: s.color } : undefined}
            />
          ))}
        </svg>

        {/* Trophy + champion badge at the core */}
        <div className="rounded-core" style={{ left: `${C}px`, top: `${C}px` }}>
          <img className="rounded-emblem" src={trophy} alt="World Cup Trophy" />
          <div className="rounded-champion">
            <Slot
              slot={BRACKET.champion}
              teamId={assignments[BRACKET.champion.id]}
              side="center"
              {...slotProps}
            />
          </div>
          <span className="rounded-champion-label">CHAMPION</span>
        </div>

        {/* All ring slots */}
        {RINGS.map((ring, r) =>
          ring.map(({ slot, side }, i) => {
            const p = points[r][i];
            return (
              <div
                key={slot.id}
                className={`rounded-slot ring-${r}${
                  loserSlotIds.has(slot.id) ? ' is-loser' : ''
                }`}
                style={{ left: `${p.x}px`, top: `${p.y}px` }}
              >
                <Slot
                  slot={slot}
                  teamId={assignments[slot.id]}
                  side={side}
                  {...slotProps}
                />
              </div>
            );
          })
        )}

        {/* Zeta logo, centred in the empty bottom-right corner of the square. */}
        {!embed && (
          <div
            className="rounded-zeta zeta-box"
            role="img"
            aria-label="Zeta"
            style={{ left: `${STAGE * 1.08}px`, top: `${STAGE * 0.84}px` }}
          />
        )}

        {/* Credit links, mirrored to the bottom-left corner. */}
        {!embed && credits && (
          <div
            className="rounded-credits rounded-credits-left"
            style={{ left: `${STAGE * 1.08}px`, top: `${STAGE * 0.92}px` }}
          >
            {credits}
          </div>
        )}
      </div>
    </div>
  );
}
