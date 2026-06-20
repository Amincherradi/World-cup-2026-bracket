# World Cup 2026 — Bracket 🏆

An interactive, frontend-only **drag-and-drop bracket** for the FIFA World Cup 2026.
Drag national flags from the 12 groups into the knockout bracket, predict the whole
tournament with one click, and follow the live state of the competition.

Built with **React + Vite** and **SCSS** — runs entirely in the browser.

## Features

- **12 groups (A–L)** with crisp SVG flags, flanking the bracket.
- **Drag & drop** flags into any slot, from the Round of 32 all the way to the Champion.
- **Predict** — fills the entire bracket in one click based on team strength ratings.
- **Live** — pulls real World Cup 2026 results and seeds the bracket (group winners,
  runners-up, best third-placed teams) automatically, marking eliminated teams as "OUT".
  Refreshes on load and polls every few minutes. **No API key required.**
- **Responsive** dark-on-light design.

## Getting started

```bash
npm install
npm run dev      # http://localhost:4200
npm run build    # production build
```

## Live data

By default, live results come from [**openfootball/worldcup.json**](https://github.com/openfootball/worldcup.json)
— a public-domain, no-key, no-quota data feed. Group tables are computed from the
played match results in [`src/liveData.js`](src/liveData.js); it works out of the box
with no setup.

**Optional upgrade — API-Football:** for fresher, more real-time data you can use
[API-Football](https://www.api-football.com/) (free tier ~100 requests/day). Add a key
from <https://dashboard.api-football.com> to `.env` and the app switches to it automatically:

```
VITE_API_FOOTBALL_KEY=your_key_here
```

If either source fails to load, the app falls back to the hand-entered snapshot in
[`src/data.js`](src/data.js). Polling defaults to every 3 minutes (`POLL_MS` in `src/liveData.js`).

> A team only appears in the bracket once its slot is genuinely decided — not from
> provisional standings. While a group is in progress, only teams that have **mathematically
> clinched** a top-2 finish are placed (goal-difference-safe). The best-third slots and any
> eliminations resolve only once every group has finished all its matches.
