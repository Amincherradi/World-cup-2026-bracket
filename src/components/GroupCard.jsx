import Flag from './Flag';

// A single group panel (e.g. "GRUPO A") with its 4 draggable flags.
export default function GroupCard({
  group,
  onDragStart,
  usedTeamIds,
  eliminatedIds,
}) {
  return (
    <div className="group-card">
      <div className="group-title">GRUPO {group.id}</div>
      <div className="group-flags">
        {group.teams.map((team) => {
          const eliminated = eliminatedIds?.has(team.id);
          const used = usedTeamIds.has(team.id);
          const disabled = eliminated || used;
          return (
            <div
              key={team.id}
              className={
                'group-flag' +
                (eliminated ? ' is-eliminated' : used ? ' is-used' : '')
              }
              draggable={!disabled}
              onDragStart={(e) => !disabled && onDragStart(e, team.id)}
              title={eliminated ? `${team.name} — eliminated` : team.name}
            >
              <Flag code={team.code} title={team.name} />
              {eliminated && <span className="out-badge">OUT</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
