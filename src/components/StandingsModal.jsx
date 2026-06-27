import { useEffect, useState } from 'react';
import Flag from './Flag';

// Group letters A–L, used for the tab strip. Derived from whatever the live
// snapshot actually provided so we never show an empty tab.
function groupLetters(standings) {
  return Object.keys(standings).sort();
}

// One league-table row: rank, flag + name, MP/W/D/L/GF/GA/GD/Pts.
function TableRow({ row, rank, highlight }) {
  return (
    <tr className={highlight ? 'is-qualified' : ''}>
      <td className="rank">{rank}</td>
      <td className="team">
        {row.code ? <Flag code={row.code} title={row.name} /> : <span className="flag-blank" />}
        <span className="team-name">{row.name}</span>
      </td>
      <td>{row.played}</td>
      <td>{row.w}</td>
      <td>{row.d}</td>
      <td>{row.l}</td>
      <td>{row.gf}</td>
      <td>{row.ga}</td>
      <td className="gd">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
      <td className="pts">{row.pts}</td>
    </tr>
  );
}

// Modal showing either a single group's standings or the cross-group ranking of
// every 3rd-placed team. `view` is a group letter ('A'..'L') or 'thirds'.
export default function StandingsModal({ standings, thirdRanking, initialView, onClose }) {
  const letters = groupLetters(standings);
  const [view, setView] = useState(initialView ?? letters[0] ?? 'thirds');

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isThirds = view === 'thirds';
  const rows = isThirds ? thirdRanking : standings[view] ?? [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="standings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isThirds ? 'Best third-placed teams' : `Group ${view} standings`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{isThirds ? 'Best 3rd-Placed Teams' : `Group ${view} — Standings`}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-tabs">
          {letters.map((l) => (
            <button
              type="button"
              key={l}
              className={'modal-tab' + (view === l ? ' is-active' : '')}
              onClick={() => setView(l)}
            >
              {l}
            </button>
          ))}
          <button
            type="button"
            className={'modal-tab modal-tab-thirds' + (isThirds ? ' is-active' : '')}
            onClick={() => setView('thirds')}
          >
            Best 3rds
          </button>
        </div>

        <div className="modal-body">
          {rows.length === 0 ? (
            <p className="modal-empty">No standings available yet.</p>
          ) : (
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="rank">#</th>
                  <th className="team">{isThirds ? 'Team (Group)' : 'Team'}</th>
                  <th>MP</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th className="gd">GD</th>
                  <th className="pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <TableRow
                    key={row.id ?? `${view}-${i}`}
                    row={isThirds ? { ...row, name: `${row.name} (${row.letter})` } : row}
                    rank={i + 1}
                    // Group view: top 2 always qualify. Thirds view: top 8 qualify.
                    highlight={isThirds ? i < 8 : i < 2}
                  />
                ))}
              </tbody>
            </table>
          )}
          <p className="modal-legend">
            {isThirds
              ? 'Top 8 third-placed teams (highlighted) advance to the Round of 32.'
              : 'Top 2 (highlighted) qualify directly; 3rd place may still advance as a best third.'}
          </p>
        </div>
      </div>
    </div>
  );
}
