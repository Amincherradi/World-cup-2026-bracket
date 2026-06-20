import { useState } from 'react';
import {
  GROUPS,
  BRACKET,
  getInitialAssignments,
  predictBracket,
  LIVE_ELIMINATED,
} from './data';
import GroupCard from './components/GroupCard';
import Slot from './components/Slot';
import emblem from './assets/2026_FIFA_World_Cup_emblem.svg.webp';
import zeta from './assets/zeta.png';
import { Analytics } from '@vercel/analytics/react';
import './App.scss';

const TOP_GROUPS = GROUPS.slice(0, 6); // A–F
const BOTTOM_GROUPS = GROUPS.slice(6); // G–L

// Round names per column, outermost -> innermost (matches BRACKET.left order).
const ROUND_NAMES = ['ROUND OF 32', 'ROUND OF 16', 'QUARTER-FINALS', 'SEMI-FINALS'];

export default function App() {
  // slotId -> teamId. Seeded with the live FIFA snapshot (teams that have
  // actually qualified so far); drag in the rest as they qualify.
  const [assignments, setAssignments] = useState(getInitialAssignments);

  const usedTeamIds = new Set(Object.values(assignments));

  // Drag from a group flag: just carry the teamId.
  const handleGroupDragStart = (e, teamId) => {
    e.dataTransfer.setData('teamId', teamId);
    e.dataTransfer.setData('fromSlot', '');
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Drag from a filled slot: carry teamId + origin slot so we can move it.
  const handleSlotDragStart = (e, teamId, fromSlot) => {
    e.dataTransfer.setData('teamId', teamId);
    e.dataTransfer.setData('fromSlot', fromSlot);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDrop = (e, slotId) => {
    const teamId = e.dataTransfer.getData('teamId');
    if (!teamId) return;
    const fromSlot = e.dataTransfer.getData('fromSlot');

    setAssignments((prev) => ({
      // Dropping a flag fills the target slot and leaves the source intact —
      // advancing a team to the next round shouldn't empty its current round.
      // Use the × button on a slot to clear it.
      ...prev,
      [slotId]: teamId,
    }));
  };

  const handleClear = (slotId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleClearAll = () => setAssignments({});
  const handleResetLive = () => setAssignments(getInitialAssignments());
  const handlePredict = () => setAssignments(predictBracket());

  const slotProps = {
    onDrop: handleDrop,
    onDragStart: handleSlotDragStart,
    onClear: handleClear,
  };

  // Round-name header row for one half (mirrors the body's flex columns).
  const renderHeadHalf = (side) => (
    <div className={`head-half head-half-${side}`}>
      {ROUND_NAMES.map((name) => (
        <div className="head-cell" key={`${side}-${name}`}>
          {name}
        </div>
      ))}
    </div>
  );

  // One half (left/right) as 4 round columns of slots.
  const renderHalf = (side, rounds) =>
    rounds.map((round, ri) => (
      <div className={`round round-${ri}`} key={`${side}-r${ri}`}>
        {round.map((slot) => (
          <div className="match-cell" key={slot.id}>
            {/* incoming line (vertical + stub) from the previous round */}
            <span className="conn conn-in" />
            <Slot
              slot={slot}
              teamId={assignments[slot.id]}
              side={side}
              {...slotProps}
            />
            {/* outgoing stub toward the next round */}
            <span className="conn conn-out" />
          </div>
        ))}
      </div>
    ));

  return (
    <div className="app">
      <header className="topbar">
        <h1>World Cup 2026</h1>
        <div className="banner">
          <h2>BRACKET</h2>
          <span className="banner-live">
            <span className="live-dot" />
            LIVE
          </span>
        </div>
        <div className="actions">
          <span className="predict-note">
            <strong>Predict</strong> uses worldwide community current probabilities — not my own picks.
          </span>
          <button type="button" className="reset-btn predict" onClick={handlePredict}>
            Predict
          </button>
          <button type="button" className="reset-btn" onClick={handleResetLive}>
            Reset to live
          </button>
          <button type="button" className="reset-btn ghost" onClick={handleClearAll}>
            Clear all
          </button>
        </div>
      </header>

      <div className="layout">
      {/* Left groups A–F */}
      <div className="groups groups-side">
        {TOP_GROUPS.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            usedTeamIds={usedTeamIds}
            eliminatedIds={LIVE_ELIMINATED}
            onDragStart={handleGroupDragStart}
          />
        ))}
      </div>

      {/* Bracket */}
      <main className="bracket">
        {/* Round-name headers, aligned to the columns below */}
        <div className="bracket-head">
          {renderHeadHalf('L')}
          <div className="head-center">FINAL</div>
          {renderHeadHalf('R')}
        </div>

        <div className="bracket-body">
          <div className="half half-left">
            {renderHalf('L', BRACKET.left)}
            {/* merge the two left semi-finalists into the left finalist */}
            <span className="sf-merge sf-merge-left" />
          </div>

          <div className="center">
            <img className="emblem" src={emblem} alt="FIFA World Cup 2026 emblem" />
            <div className="final-row">
              <Slot
                slot={BRACKET.final[0]}
                teamId={assignments[BRACKET.final[0].id]}
                side="center"
                {...slotProps}
              />
              <div className="vs">VS</div>
              <Slot
                slot={BRACKET.final[1]}
                teamId={assignments[BRACKET.final[1].id]}
                side="center"
                {...slotProps}
              />
            </div>
            <div className="champion-wrap">
              <Slot
                slot={BRACKET.champion}
                teamId={assignments[BRACKET.champion.id]}
                side="center"
                {...slotProps}
              />
              <span className="champion-label">CHAMPION</span>
            </div>
            <div className="center-footer">
              <img className="zeta-logo" src={zeta} alt="Zeta" />
              <div className="credits">
                <a
                  className="credit"
                  href="https://github.com/Amincherradi"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  Amincherradi
                </a>
                <span className="credit">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                  @zetamine
                </span>
              </div>
            </div>
          </div>

          <div className="half half-right">
            {renderHalf('R', BRACKET.right)}
            {/* merge the two right semi-finalists into the right finalist */}
            <span className="sf-merge sf-merge-right" />
          </div>
        </div>
      </main>

      {/* Right groups G–L */}
      <div className="groups groups-side">
        {BOTTOM_GROUPS.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            usedTeamIds={usedTeamIds}
            eliminatedIds={LIVE_ELIMINATED}
            onDragStart={handleGroupDragStart}
          />
        ))}
      </div>
      </div>
      <Analytics />
    </div>
  );
}
