import Flag from './Flag';
import { TEAMS_BY_ID } from '../data';

// A single bracket slot. Supports both mouse drag-and-drop and tap-to-place
// (touch). Shows a placeholder label when empty, the flag when filled.
export default function Slot({
  slot,
  teamId,
  side,
  onDrop,
  onDragStart,
  onClear,
  onTap,
  selected,
}) {
  const team = teamId ? TEAMS_BY_ID[teamId] : null;
  const isSelected = team && selected === teamId;

  return (
    <div
      className={
        `slot${team ? ' is-filled' : ''} slot-${side}` +
        (isSelected ? ' is-selected' : '')
      }
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
      onClick={() => onTap?.(slot.id)}
    >
      {team ? (
        <>
          <Flag code={team.code} title={team.name} />
          <button
            type="button"
            className="slot-clear"
            onClick={(e) => {
              e.stopPropagation(); // don't trigger a tap-place on the slot
              onClear(slot.id);
            }}
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
