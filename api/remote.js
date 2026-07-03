import { getCache } from '@vercel/functions';
import { verifyToken } from './_auth.js';

// Relay between the phone remote and the PC player, backed by the Vercel
// Runtime Cache (regional, shared across function invocations). The phone
// POSTs commands; the player long-polls GET for them and POSTs its state back.

const CMD_KEY = 'remote-cmds-v1';
const STATE_KEY = 'remote-state-v1';
const CMD_TTL = 10 * 60;    // seconds
const STATE_TTL = 60 * 60;  // seconds
const MAX_QUEUE = 20;
const MAX_WAIT_MS = 25000;  // long-poll hold, must stay under maxDuration
const POLL_STEP_MS = 750;

const ACTIONS = new Set(['toggle', 'prev', 'next', 'playTrack', 'volume', 'seek', 'fade', 'autoplay']);

// Fallback for environments where the runtime cache is unavailable. Only
// shared when invocations land on the same instance, but better than nothing.
const memory = new Map();

async function kvGet(key) {
  try {
    const v = await getCache().get(key);
    if (v !== undefined) return v;
  } catch (e) { /* fall through to memory */ }
  return memory.get(key);
}

async function kvSet(key, value, ttl) {
  memory.set(key, value);
  try {
    await getCache().set(key, value, { ttl });
  } catch (e) { /* memory fallback already updated */ }
}

// Commands older than a minute are dropped (leftovers from a closed session).
// reset=true means the queue restarted (cache eviction) and the client must
// rewind its cursor instead of filtering by id.
function freshCmds(queue, since) {
  const cutoff = Date.now() - 60000;
  const reset = queue.seq < since;
  const base = reset ? queue.items : queue.items.filter(c => c.id > since);
  return { reset, cmds: base.filter(c => c.at > cutoff) };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'POST') {
    const body = req.body || {};

    if (body.type === 'cmd') {
      if (!verifyToken(body.token)) return res.status(401).json({ error: 'UNAUTHORIZED' });
      if (!ACTIONS.has(body.action)) return res.status(400).json({ error: 'UNKNOWN ACTION' });
      const queue = (await kvGet(CMD_KEY)) || { seq: 0, items: [] };
      queue.seq += 1;
      queue.items.push({ id: queue.seq, action: body.action, value: body.value ?? null, at: Date.now() });
      queue.items = queue.items.slice(-MAX_QUEUE);
      await kvSet(CMD_KEY, queue, CMD_TTL);
      return res.status(200).json({ ok: true, seq: queue.seq });
    }

    if (body.type === 'state') {
      const s = body.state || {};
      const state = {
        title: s.title != null ? String(s.title).slice(0, 200) : null,
        slot: s.slot != null ? String(s.slot).slice(0, 100) : null,
        index: Number.isInteger(s.index) ? s.index : -1,
        playing: !!s.playing,
        volume: Math.min(100, Math.max(0, Number(s.volume) || 0)),
        fade: !!s.fade,
        autoplay: !!s.autoplay,
        position: Math.max(0, Number(s.position) || 0),
        duration: Math.max(0, Number(s.duration) || 0),
        loaded: Array.isArray(s.loaded) ? s.loaded.slice(0, 100).map(Boolean) : [],
        tracks: Array.isArray(s.tracks)
          ? s.tracks.slice(0, 100).map(t => ({
              title: String(t?.title || '').slice(0, 200),
              slot: String(t?.slot || '').slice(0, 100),
            }))
          : [],
        at: Date.now(),
      };
      await kvSet(STATE_KEY, state, STATE_TTL);
      // Piggyback pending commands so the player picks them up without
      // waiting for its next long-poll cycle.
      const queue = (await kvGet(CMD_KEY)) || { seq: 0, items: [] };
      const { reset, cmds } = freshCmds(queue, Number(body.since) || 0);
      return res.status(200).json({ ok: true, seq: queue.seq, reset, cmds });
    }

    return res.status(400).json({ error: 'BAD REQUEST' });
  }

  if (req.method === 'GET') {
    const role = String(req.query.role || 'remote');

    if (role === 'player') {
      const since = Number(req.query.since) || 0;
      const waitSec = Math.min(25, Math.max(0, Number(req.query.wait) || 0));
      const deadline = Date.now() + Math.min(waitSec * 1000, MAX_WAIT_MS);
      for (;;) {
        const queue = (await kvGet(CMD_KEY)) || { seq: 0, items: [] };
        const { reset, cmds } = freshCmds(queue, since);
        if (cmds.length || reset || Date.now() >= deadline) {
          return res.status(200).json({ seq: queue.seq, reset, cmds });
        }
        await sleep(POLL_STEP_MS);
      }
    }

    // role=remote: the phone polls player state to render its UI.
    const [state, queue] = await Promise.all([kvGet(STATE_KEY), kvGet(CMD_KEY)]);
    return res.status(200).json({ state: state || null, seq: (queue || { seq: 0 }).seq, now: Date.now() });
  }

  return res.status(405).json({ error: 'METHOD NOT ALLOWED' });
}
