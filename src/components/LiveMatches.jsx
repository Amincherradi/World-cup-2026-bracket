import Flag from './Flag';

// Google-style "live now" score cards: (flag) 0 - 0 (flag) with a pulsing
// minute badge. Renders nothing when no match is in progress.
export default function LiveMatches({ matches }) {
  if (!matches?.length) return null;

  return (
    <div className="live-matches" role="list" aria-label="Live matches">
      {matches.map((m) => (
        <div className="live-card" role="listitem" key={m.id}>
          <span className="lc-side lc-home">
            {m.code1 && <Flag code={m.code1} title={m.home} />}
            <span className="lc-name">{m.home}</span>
          </span>
          <span className="lc-score">
            {m.gh}<span className="lc-dash">-</span>{m.ga}
          </span>
          <span className="lc-side lc-away">
            <span className="lc-name">{m.away}</span>
            {m.code2 && <Flag code={m.code2} title={m.away} />}
          </span>
          <span className="lc-minute" title="Live">
            <span className="lc-dot" />
            {m.minute}
          </span>
        </div>
      ))}
    </div>
  );
}
