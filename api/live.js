export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const channels = (searchParams.get('channels') || '').split(',').filter(Boolean);
    if (!channels.length) return res.json([]);

    const results = await Promise.all(channels.map(async (ch) => {
      try {
        const r = await fetch(`https://kick.com/api/v1/channels/${ch}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
          }
        });
        if (!r.ok) return null;
        const data = await r.json();
        if (!data?.livestream?.is_live) return null;
        return { channel: ch, viewers: data.livestream.viewer_count || 0 };
      } catch (e) { return null; }
    }));
    res.json(results.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: "Internal Error" });
  }
}