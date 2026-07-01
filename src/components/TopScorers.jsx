import Flag from './Flag';

// All-time FIFA World Cup top goalscorers (men's tournament). Stable historical
// records — there's no live "all-time" API, so this list is curated. The current
// tournament's golden-boot race (the `live` prop) IS fetched live and shown on
// top when data is available.
const ALL_TIME_SCORERS = [
  { name: 'Lionel Messi', country: 'Argentina', code: 'ar', goals: 19 },
  { name: 'Kylian Mbappé', country: 'France', code: 'fr', goals: 16 },
  { name: 'Miroslav Klose', country: 'Germany', code: 'de', goals: 16 },
  { name: 'Ronaldo', country: 'Brazil', code: 'br', goals: 15 },
  { name: 'Gerd Müller', country: 'West Germany', code: 'de', goals: 14 },
  { name: 'Just Fontaine', country: 'France', code: 'fr', goals: 13 },
  { name: 'Pelé', country: 'Brazil', code: 'br', goals: 12 },
  { name: 'Sándor Kocsis', country: 'Hungary', code: 'hu', goals: 11 },
  { name: 'Jürgen Klinsmann', country: 'Germany', code: 'de', goals: 11 },
  { name: 'Gary Lineker', country: 'England', code: 'gb-eng', goals: 10 },
];

// One leaderboard section: a list of { name, country, code, goals } rows with a
// proportional bar. The top row is highlighted as the leader.
function ScorerList({ players }) {
  const max = players[0]?.goals || 1;
  return (
    <ol className="ts-list">
      {players.map((p, i) => (
        <li key={`${p.name}-${i}`} className={`ts-row${i === 0 ? ' is-leader' : ''}`}>
          <span className="ts-rank">{i + 1}</span>
          <span className="ts-flag">{p.code && <Flag code={p.code} title={p.country} />}</span>
          <span className="ts-info">
            <span className="ts-name">{p.name}</span>
            <span className="ts-bar" style={{ '--pct': `${(p.goals / max) * 100}%` }} />
          </span>
          <span className="ts-goals">{p.goals}</span>
        </li>
      ))}
    </ol>
  );
}

export default function TopScorers({ live = [] }) {
  const hasLive = Array.isArray(live) && live.length > 0;
  return (
    <div className="ts-stack">
      <span className="ts-logo" role="img" aria-label="Zeta" />
      <div className="ts-social" aria-label="Social links">
        <a
          className="ts-soc ts-soc-in"
          href="https://www.linkedin.com/in/amine-cherradi-610025151/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <a
          className="ts-soc ts-soc-gh"
          href="https://github.com/Amincherradi"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
      </div>
      <aside className="top-scorers" aria-label="World Cup top scorers">
        <span className="ts-badge">Moya</span>
      {hasLive && (
        <div className="ts-section">
          <div className="ts-head">
            <span className="ts-live is-realtime">
              <span className="ts-dot" />
              LIVE
            </span>
            <h3 className="ts-title">
              <i className="fa-solid fa-futbol" aria-hidden="true" />
              GOLDEN BOOT
            </h3>
            <span className="ts-sub">2026 · this tournament</span>
          </div>
          <ScorerList players={live.slice(0, 5)} />
        </div>
      )}

      <div className="ts-section">
        <div className="ts-head">
          <span className="ts-live">
            <span className="ts-dot" />
            ALL-TIME
          </span>
          <h3 className="ts-title">
            <i className="fa-solid fa-futbol" aria-hidden="true" />
            TOP SCORERS
          </h3>
          <span className="ts-sub">FIFA World Cup · career goals</span>
        </div>
        <ScorerList players={ALL_TIME_SCORERS.slice(0, 10)} />
      </div>
      </aside>
    </div>
  );
}
