import { checkLogin, makeToken } from './_auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD NOT ALLOWED' });
  const { user, pass } = req.body || {};
  if (!checkLogin(user, pass)) return res.status(401).json({ error: 'WRONG USERNAME OR PASSWORD' });
  return res.status(200).json({ token: makeToken() });
}
