import crypto from 'node:crypto';

const SITE_SALT = 'zoralive_site_v3';
const OWNER_SALT = 'zoralive_owner_v3';

// Default salted SHA-256 digests (can be overridden via Vercel Env Vars SITE_GATE_PIN / OWNER_PANEL_PIN)
const DEFAULT_SITE_HASH = 'fe68450bc46784b691f25b39e1591afa85b90c92a9158c1da2ff3de4a043ee03';
const DEFAULT_OWNER_HASH = '0afae73517f9f1ceccdffa9c40d75ff470f55089c7813a4dfb1854daf8ae07b4';

const SESSION_SECRET = process.env.GATE_SESSION_SECRET || 'zoralive_hmac_gate_secret_v3';
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 5 * 60 * 1000;

// In-memory rate-limit bucket per warm serverless instance
const attemptsByIp = new Map();

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '')).split(',')[0].trim() || 'unknown';
  const now = Date.now();

  const bucket = attemptsByIp.get(ip) || { count: 0, lockedUntil: 0 };
  if (bucket.lockedUntil > now) {
    const retryAfterSec = Math.ceil((bucket.lockedUntil - now) / 1000);
    return res.status(429).json({
      ok: false,
      error: `Juda ko‘p noto‘g‘ri urinish. ${retryAfterSec} soniyadan keyin urinib ko‘ring.`,
      retryAfterSec,
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const scope = body.scope === 'owner' ? 'owner' : 'site';
  const pin = String(body.pin || '').trim();

  if (!pin || pin.length > 32) {
    return res.status(400).json({ ok: false, error: 'Parol kiritilmadi' });
  }

  const expectedHash =
    scope === 'owner'
      ? process.env.OWNER_PANEL_PIN
        ? sha256Hex(`${OWNER_SALT}:${process.env.OWNER_PANEL_PIN.trim()}`)
        : DEFAULT_OWNER_HASH
      : process.env.SITE_GATE_PIN
      ? sha256Hex(`${SITE_SALT}:${process.env.SITE_GATE_PIN.trim()}`)
      : DEFAULT_SITE_HASH;

  const actualHash = sha256Hex(`${scope === 'owner' ? OWNER_SALT : SITE_SALT}:${pin}`);
  const valid = safeEqualHex(actualHash, expectedHash);

  if (!valid) {
    bucket.count += 1;
    if (bucket.count >= MAX_ATTEMPTS) {
      bucket.lockedUntil = now + LOCK_WINDOW_MS;
      bucket.count = 0;
    }
    attemptsByIp.set(ip, bucket);
    return res.status(401).json({
      ok: false,
      error: scope === 'owner' ? 'Kod noto‘g‘ri! Ega Paneliga kirish taqiqlangan.' : 'Parol noto‘g‘ri',
      remaining: Math.max(0, MAX_ATTEMPTS - bucket.count),
    });
  }

  attemptsByIp.delete(ip);
  const expiresAt = now + 12 * 60 * 60 * 1000;
  const payload = `${scope}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

  return res.status(200).json({
    ok: true,
    token: `${payload}.${sig}`,
    expiresAt,
  });
}
