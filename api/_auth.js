import crypto from 'node:crypto';

// Override these in Vercel: Project -> Settings -> Environment Variables.
// The defaults below let the dashboard work out of the box, but since this
// repo is public you should set your own ADMIN_PASSWORD before sharing the URL.
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASSWORD || 'EPHESUS26-SABBATH';
const SECRET = process.env.SESSION_SECRET || 'sp-session-' + PASS;

const SESSION_DAYS = 7;

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function checkLogin(user, pass) {
  return safeEqual(user, USER) && safeEqual(pass, PASS);
}

export function makeToken() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return exp + '.' + sig;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (Date.now() > Number(exp)) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return safeEqual(sig, expected);
}
