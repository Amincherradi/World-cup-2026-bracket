import Flag from './Flag';

// Short kickoff label, e.g. "19:00" today or "Jun 22 19:00" otherwise.
function kickoffLabel(utcDate) {
  if (!utcDate) return '';
  const d = new Date(utcDate);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  const day = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${day} ${time}`;
}

// One fixture: "team v team" on top, kickoff time underneath.
function Fixture({ m }) {
  return (
    <div className="ff">
      <div className="ff-teams">
        <span className="ff-team">
          {m.code1 && <Flag code={m.code1} title={m.home} />}
          <span className="ff-name">{m.home}</span>
        </span>
        <span className="ff-v">VS</span>
        <span className="ff-team ff-team-away">
          {m.code2 && <Flag code={m.code2} title={m.away} />}
          <span className="ff-name">{m.away}</span>
        </span>
      </div>
      <div className="ff-time">{kickoffLabel(m.utcDate)}</div>
    </div>
  );
}

// Vertical match feed for the radial page — cards sized like the group cards.
// The upcoming list auto-scrolls top-to-bottom as a vertical marquee.
export default function RoundedFeed({ liveMatches, upcoming }) {
  // "Next up" must actually be upcoming: keep only fixtures whose kickoff is
  // still in the future (this also drops matches currently in progress, which
  // are shown in the LIVE card, and any that already finished).
  const now = Date.now();
  const future = (upcoming || []).filter((m) => {
    if (!m.utcDate) return false;
    const t = new Date(m.utcDate).getTime();
    return !Number.isNaN(t) && t > now;
  });

  if (!liveMatches?.length && !future.length) return null;

  // Slow the marquee proportionally to the list length (≈2.2s per fixture).
  const duration = Math.max(12, future.length * 2.2);

  return (
    <div className="rounded-feed groups-side">
      {liveMatches?.length > 0 && (
        <div className="group-card feed-card">
          <div className="group-title feed-title feed-title-live">
            <span className="feed-live-dot" />
            LIVE NOW
          </div>
          {liveMatches.map((m) => (
            <div className="ff ff-live" key={m.id}>
              <div className="ff-teams">
                <span className="ff-team">
                  {m.code1 && <Flag code={m.code1} title={m.home} />}
                  <span className="ff-name">{m.home}</span>
                </span>
                <span className="ff-score">
                  {m.gh}-{m.ga}
                </span>
                <span className="ff-team ff-team-away">
                  {m.code2 && <Flag code={m.code2} title={m.away} />}
                  <span className="ff-name">{m.away}</span>
                </span>
              </div>
              <div className="ff-time ff-min">{m.minute}</div>
            </div>
          ))}
        </div>
      )}

      {future.length > 0 && (
        <div className="group-card feed-card feed-card-upcoming">
          <div className="group-title feed-title">NEXT UP</div>
          <div className="feed-marquee">
            <div
              className="feed-track"
              style={{ animationDuration: `${duration}s` }}
            >
              {future.map((m, i) => (
                <Fixture m={m} key={`a-${m.id}-${i}`} />
              ))}
              {/* duplicate for a seamless vertical loop */}
              {future.map((m, i) => (
                <Fixture m={m} key={`b-${m.id}-${i}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
