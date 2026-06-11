import { put, list, del } from '@vercel/blob';
import { verifyToken } from './_auth.js';

const MAX_ROWS = 64;

// Authenticated endpoint: the admin dashboard saves the full config here.
// Each save writes a new data/config-<ts>.json blob (fresh URL = no stale CDN
// cache) and deletes the previous ones.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD NOT ALLOWED' });
  const { token, data } = req.body || {};
  if (!verifyToken(token)) return res.status(401).json({ error: 'UNAUTHORIZED — LOG IN AGAIN' });
  if (!data || !Array.isArray(data.tracks) || !Array.isArray(data.program)) {
    return res.status(400).json({ error: 'BAD DATA' });
  }

  const clean = {
    tracks: data.tracks.slice(0, MAX_ROWS).map(t => ({
      title: String(t?.title ?? '').slice(0, 120),
      slot: String(t?.slot ?? '').slice(0, 120),
      audioUrl: (typeof t?.audioUrl === 'string' && t.audioUrl.startsWith('https://')) ? t.audioUrl.slice(0, 500) : null,
      filename: String(t?.filename ?? '').slice(0, 200),
    })),
    program: data.program.slice(0, MAX_ROWS).map(r => [
      String(r?.[0] ?? '').slice(0, 10),
      String(r?.[1] ?? '').slice(0, 160),
      Boolean(r?.[2]),
    ]),
    updatedAt: new Date().toISOString(),
  };

  try {
    const blob = await put(`data/config-${Date.now()}.json`, JSON.stringify(clean), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    try {
      const { blobs } = await list({ prefix: 'data/config-' });
      const old = blobs.filter(b => b.url !== blob.url).map(b => b.url);
      if (old.length) await del(old);
    } catch (e) { /* cleanup is best-effort */ }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'SAVE FAILED — IS THE BLOB STORE CONNECTED? (' + e.message + ')' });
  }
}
