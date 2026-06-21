// Vercel serverless proxy for football-data.org (free tier).
//
// football-data.org blocks direct browser calls (no CORS) and a token must not
// ship to the client, so this function calls it server-side and returns just the
// World Cup matches array. The free tier covers the World Cup competition and
// includes live status + minute. Get a free token at football-data.org/client
// and set it as the FOOTBALL_DATA_KEY environment variable in Vercel.
//
// The response is edge-cached for 30s so a burst of visitors can't blow through
// football-data's 10 requests/minute limit while keeping the minute fresh.
export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_KEY;
  if (!token) {
    res.status(200).json({ matches: [], error: 'no-token' });
    return;
  }
  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': token } }
    );
    if (!r.ok) throw new Error(`football-data ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ matches: Array.isArray(json.matches) ? json.matches : [] });
  } catch (err) {
    res.status(200).json({ matches: [], error: String(err?.message || err) });
  }
}
