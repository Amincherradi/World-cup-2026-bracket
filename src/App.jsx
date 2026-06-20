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
            <img className="zeta-logo" src={zeta} alt="Zeta" />
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
