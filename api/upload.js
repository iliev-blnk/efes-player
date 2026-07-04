import { handleUpload } from '@vercel/blob/client';
import { verifyToken } from './_auth.js';

// Client-side upload token minting. The browser sends the audio file directly
// to Vercel Blob (bypassing the 4.5 MB serverless request-body limit); this
// function only authorizes the upload and hands back a short-lived token.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD NOT ALLOWED' });

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // clientPayload carries the admin token from the browser.
        if (!verifyToken(clientPayload)) throw new Error('UNAUTHORIZED');
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav',
            'audio/ogg', 'audio/flac', 'audio/webm', 'audio/*',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 60 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client persists the returned URL via the normal save flow.
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
