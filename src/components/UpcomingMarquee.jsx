import Flag from './Flag';

// Short kickoff label, e.g. "Sat 19:00" or "Jun 22 19:00" if it's not today.
function kickoffLabel(utcDate) {
  const d = new Date(utcDate);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  const day = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${day} ${time}`;
}

// Horizontally-scrolling "next up" ticker of upcoming fixtures. The list is
// rendered twice back-to-back so the CSS marquee can loop seamlessly.
export default function UpcomingMarquee({ matches }) {
  if (!matches?.length) return null;

  const item = (m, i) => (
    <span className="up-item" key={`${m.id}-${i}`}>
      <span className="up-kick">{kickoffLabel(m.utcDate)}</span>
      {m.code1 && <Flag code={m.code1} title={m.home} />}
      <span className="up-team">{m.home}</span>
      <span className="up-v">v</span>
      <span className="up-team">{m.away}</span>
      {m.code2 && <Flag code={m.code2} title={m.away} />}
    </span>
  );

  return (
    <div className="upcoming" aria-label="Upcoming matches">
      <span className="up-label">NEXT UP</span>
      <div className="up-viewport">
        <div className="up-track">
          {matches.map((m, i) => item(m, i))}
          {/* duplicate for a seamless loop */}
          {matches.map((m, i) => item(m, i + matches.length))}
        </div>
      </div>
    </div>
  );
}
