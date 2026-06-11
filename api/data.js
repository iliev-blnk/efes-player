import { list } from '@vercel/blob';
import DEFAULTS from './_defaults.js';

// Public endpoint: the player fetches tracks + program from here on load.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { blobs } = await list({ prefix: 'data/config-' });
    if (!blobs.length) return res.status(200).json(DEFAULTS);
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!r.ok) throw new Error('blob fetch failed');
    return res.status(200).json(await r.json());
  } catch (e) {
    // Blob store not provisioned yet (or transient error): fall back to defaults
    return res.status(200).json({ ...DEFAULTS, _warning: 'BLOB STORE NOT CONFIGURED' });
  }
}
