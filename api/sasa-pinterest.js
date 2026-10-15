export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL එකක් අවශ්‍යයි' });

  const key = 'Sasa_Dev_Api_7e9cf42bd33607b3503c016dd49720fec6d22b63';
  const apiUrl = `https://sasa-dev-api.xyz/api/pinterest/dl?apikey=${key}&url=${encodeURIComponent(url)}`;

  try {
    const r = await fetch(apiUrl);
    res.status(200).json(await r.json());
  } catch {
    res.status(500).json({ error: 'API එකට සම්බන්ධ වෙන්න බැරි වුණා' });
  }
}
