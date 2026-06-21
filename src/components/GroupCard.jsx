import Flag from './Flag';

// A single group panel (e.g. "GRUPO A") with its 4 draggable flags.
export default function GroupCard({
  group,
  onDragStart,
  usedTeamIds,
  eliminatedIds,
  selectedTeamId,
  onSelectTeam,
  liveByTeam,
}) {
  return (
    <div className="group-card">
      <div className="group-title">GRUPO {group.id}</div>
      <div className="group-flags">
        {group.teams.map((team) => {
          const eliminated = eliminatedIds?.has(team.id);
          const used = usedTeamIds.has(team.id);
          const disabled = eliminated || used;
          const isSelected = selectedTeamId === team.id;
          const live = liveByTeam?.[team.id];
          return (
            <div
              key={team.id}
              className={
                'group-flag' +
                (eliminated ? ' is-eliminated' : used ? ' is-used' : '') +
                (isSelected ? ' is-selected' : '') +
                (live ? ' is-live' : '')
              }
              draggable={!disabled}
              onDragStart={(e) => !disabled && onDragStart(e, team.id)}
              onClick={() => !disabled && onSelectTeam?.(team.id)}
              title={
                live
                  ? `${team.name} — live ${live.score} (${live.minute})`
                  : eliminated
                  ? `${team.name} — eliminated`
                  : team.name
              }
            >
              <Flag code={team.code} title={team.name} />
              {eliminated && <span className="out-badge">OUT</span>}
              {live && !eliminated && (
                <span className="live-badge">
                  <span className="live-badge-dot" />
                  {live.score} {live.minute}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
