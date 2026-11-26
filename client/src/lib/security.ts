export type GateScope = 'site' | 'owner';

const SESSION_KEYS: Record<GateScope, string> = {
  site: 'zoralive_site_session_v4',
  owner: 'zoralive_owner_session_v4',
};

const LOCK_KEYS: Record<GateScope, string> = {
  site: 'zoralive_site_lock_v4',
  owner: 'zoralive_owner_lock_v4',
};

const SALTS: Record<GateScope, string> = {
  site: 'zoralive_site_v3',
  owner: 'zoralive_owner_v3',
};

// Salted SHA-256 digests used ONLY as local dev fallback when /api/verify-gate is unavailable
const FALLBACK_HASHES: Record<GateScope, string> = {
  site: 'fe68450bc46784b691f25b39e1591afa85b90c92a9158c1da2ff3de4a043ee03',
  owner: '0afae73517f9f1ceccdffa9c40d75ff470f55089c7813a4dfb1854daf8ae07b4',
};

const MAX_LOCAL_ATTEMPTS = 5;
const LOCAL_LOCK_MS = 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isGateSessionValid(scope: GateScope): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS[scope]);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.token && Number(parsed?.expiresAt) > Date.now());
  } catch {
    return false;
  }
}

export function clearGateSession(scope: GateScope): void {
  try {
    sessionStorage.removeItem(SESSION_KEYS[scope]);
  } catch {
    // ignore
  }
}

function getLockState(scope: GateScope): { count: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem(LOCK_KEYS[scope]);
    if (!raw) return { count: 0, lockedUntil: 0 };
    const p = JSON.parse(raw);
    return { count: Number(p.count) || 0, lockedUntil: Number(p.lockedUntil) || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function setLockState(scope: GateScope, state: { count: number; lockedUntil: number }) {
  try {
    sessionStorage.setItem(LOCK_KEYS[scope], JSON.stringify(state));
  } catch {
    // ignore
  }
}

export async function verifyGatePin(
  scope: GateScope,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  const clean = pin.trim();
  if (!clean) return { ok: false, error: 'Parolni kiriting' };

  const now = Date.now();
  const lock = getLockState(scope);
  if (lock.lockedUntil > now) {
    const sec = Math.ceil((lock.lockedUntil - now) / 1000);
    return { ok: false, error: `Juda ko‘p noto‘g‘ri urinish. ${sec} soniya kuting.` };
  }

  // 1. Primary: Server-side Vercel Serverless Function (/api/verify-gate)
  try {
    const res = await fetch('/api/verify-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, pin: clean }),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data?.ok && data?.token) {
        sessionStorage.setItem(
          SESSION_KEYS[scope],
          JSON.stringify({ token: data.token, expiresAt: data.expiresAt || now + SESSION_TTL_MS })
        );
        setLockState(scope, { count: 0, lockedUntil: 0 });
        return { ok: true };
      }
      if (res.status === 429 && data?.retryAfterSec) {
        setLockState(scope, { count: 0, lockedUntil: now + Number(data.retryAfterSec) * 1000 });
      }
      return { ok: false, error: data?.error || 'Parol noto‘g‘ri' };
    }
  } catch {
    // Network or local Vite dev server without /api mounted — fall through to hashed check
  }

  // 2. Fallback (local Vite dev only): Web Crypto salted SHA-256 check (zero plaintext PIN in code)
  try {
    const hash = await sha256Hex(`${SALTS[scope]}:${clean}`);
    if (hash === FALLBACK_HASHES[scope]) {
      const expiresAt = now + SESSION_TTL_MS;
      sessionStorage.setItem(
        SESSION_KEYS[scope],
        JSON.stringify({ token: `local_${scope}_${expiresAt}`, expiresAt })
      );
      setLockState(scope, { count: 0, lockedUntil: 0 });
      return { ok: true };
    }
  } catch {
    // ignore
  }

  const nextCount = lock.count + 1;
  if (nextCount >= MAX_LOCAL_ATTEMPTS) {
    setLockState(scope, { count: 0, lockedUntil: now + LOCAL_LOCK_MS });
    return { ok: false, error: '5 marta noto‘g‘ri kiritildi. 60 soniya kuting.' };
  }
  setLockState(scope, { count: nextCount, lockedUntil: 0 });
  return {
    ok: false,
    error: scope === 'owner' ? 'Kod noto‘g‘ri! Ega Paneliga kirish taqiqlangan.' : 'Parol noto‘g‘ri',
  };
}

/**
 * Ensures coin/diamond values are always finite non-negative integers within safe bounds.
 */
export function clampSafeBalance(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1_000_000_000, Math.floor(n)));
}
