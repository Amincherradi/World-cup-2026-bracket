// Vercel serverless proxy for football-data.org top scorers (free tier).
//
// Like /api/live, football-data.org blocks direct browser calls and the token
// must stay server-side. This returns the current FIFA World Cup edition's top
// scorers (the live "golden boot" race). Note: football-data has no ALL-TIME
// endpoint — this is the current tournament only; the all-time list is curated
// client-side. Get a free token at football-data.org/client and set it as the
// FOOTBALL_DATA_KEY environment variable.
//
// Cached for 2 minutes at the edge — scorer totals change slowly and this keeps
// well under football-data's 10 requests/minute free limit.
export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_KEY;
  if (!token) {
    res.status(200).json({ scorers: [], error: 'no-token' });
    return;
  }
  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/scorers?limit=10',
      { headers: { 'X-Auth-Token': token } }
    );
    if (!r.ok) throw new Error(`football-data ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ scorers: Array.isArray(json.scorers) ? json.scorers : [] });
  } catch (err) {
    res.status(200).json({ scorers: [], error: String(err?.message || err) });
  }
}
