import { put } from '@vercel/blob';
import busboy from 'busboy';
import { verifyToken } from './_auth.js';

// Backend audio upload to Vercel Blob with proper MIME type handling.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD NOT ALLOWED' });
  const token = req.headers['x-admin-token'];
  if (!verifyToken(token)) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const bb = busboy({ headers: req.headers, limits: { fileSize: 60 * 1024 * 1024 } });
    let filename = '';
    let fileBuffer = null;
    let mimeType = 'audio/mpeg';

    bb.on('file', (fieldname, file, info) => {
      filename = info.filename;
      const ext = filename.split('.').pop()?.toLowerCase();
      const types = {
        mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac',
        wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', webm: 'audio/webm',
      };
      mimeType = types[ext] || 'audio/mpeg';

      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });

    bb.on('close', async () => {
      if (!fileBuffer) return res.status(400).json({ error: 'NO FILE' });
      if (fileBuffer.length === 0) return res.status(400).json({ error: 'EMPTY FILE' });

      try {
        const blob = await put(`songs/${Date.now()}-${filename}`, fileBuffer, {
          access: 'public',
          contentType: mimeType,
        });
        return res.status(200).json({ url: blob.url });
      } catch (e) {
        return res.status(500).json({ error: 'BLOB SAVE FAILED: ' + e.message });
      }
    });

    req.pipe(bb);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
