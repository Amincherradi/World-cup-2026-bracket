import Flag from './Flag';
import { TEAMS_BY_ID } from '../data';

// A single droppable bracket slot. Shows a placeholder label when empty,
// the flag when filled. Filled slots are draggable (move) and clearable.
export default function Slot({ slot, teamId, side, onDrop, onDragStart, onClear }) {
  const team = teamId ? TEAMS_BY_ID[teamId] : null;

  return (
    <div
      className={`slot${team ? ' is-filled' : ''} slot-${side}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        onDrop(e, slot.id);
      }}
      draggable={!!team}
      onDragStart={(e) => team && onDragStart(e, team.id, slot.id)}
    >
      {team ? (
        <>
          <Flag code={team.code} title={team.name} />
          <button
            type="button"
            className="slot-clear"
            onClick={() => onClear(slot.id)}
            title={`Remove ${team.name}`}
            aria-label={`Remove ${team.name}`}
          >
            ×
          </button>
        </>
      ) : (
        <span className="slot-label">{slot.label}</span>
      )}
    </div>
  );
}
