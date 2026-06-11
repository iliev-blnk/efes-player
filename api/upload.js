import { handleUpload } from '@vercel/blob/client';
import { verifyToken } from './_auth.js';

// Issues short-lived client-upload tokens so the browser uploads audio
// directly to Vercel Blob (bypasses the 4.5MB serverless body limit).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD NOT ALLOWED' });
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!verifyToken(clientPayload)) throw new Error('UNAUTHORIZED — LOG IN AGAIN');
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
            'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/webm',
          ],
          maximumSizeInBytes: 60 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => { /* URL is saved via /api/admin on Save */ },
    });
    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
