import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { sanitizeUser } from '../services/level';
import { requireAuth, signToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { username, displayName, password, country, gender, agencyCode } = req.body || {};
    const cleanUsername = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = String(displayName || cleanUsername).trim();
    const cleanPass = String(password || '');

    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username kamida 3 ta harfdan iborat bo‘lishi kerak' });
      return;
    }
    if (cleanPass.length < 4) {
      res.status(400).json({ error: 'Parol kamida 4 ta belgidan iborat bo‘lishi kerak' });
      return;
    }

    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (exists) {
      res.status(409).json({ error: 'Bu username allaqachon band' });
      return;
    }

    let agencyId: string | null = null;
    let role = 'USER';
    if (agencyCode && String(agencyCode).trim()) {
      const agency = db
        .prepare('SELECT id FROM agencies WHERE UPPER(code) = UPPER(?)')
        .get(String(agencyCode).trim());
      if (agency) {
        agencyId = agency.id;
        role = 'HOST';
      }
    }

    const maxUidRow = db.prepare('SELECT MAX(uid) as m FROM users').get();
    const nextUid = (Number(maxUidRow?.m) || 100000) + 1;
    const id = uuid();
    const hash = bcrypt.hashSync(cleanPass, 8);
    const starterAvatars = [
      '/assets/avatar-azizbek.jpg',
      '/assets/avatar-madina.jpg',
      '/assets/avatar-sardor.jpg',
      '/assets/avatar-laylo.jpg',
      '/assets/avatar-abrorbek.jpg',
    ];
    const avatar = starterAvatars[nextUid % starterAvatars.length];
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, uid, username, display_name, password_hash, avatar, country, gender, role, coins, agency_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2000, ?, ?)
    `).run(id, nextUid, cleanUsername, cleanName, hash, avatar, country || 'UZ', gender || 'other', role, agencyId, now);

    db.prepare(
      `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, created_at)
       VALUES (?, ?, 'COINS', 2000, 2000, 'TOPUP', 'Yangi foydalanuvchi bonusi', ?)`
    ).run(uuid(), id, now);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)!;
    const token = signToken(id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ro‘yxatdan o‘tishda xatolik' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const cleanUsername = String(username || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(cleanUsername);
    if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
      res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
      return;
    }
    if (user.is_banned) {
      res.status(403).json({ error: 'Akkauntingiz administrator tomonidan bloklangan' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Kirishda xatolik' });
  }
});

router.post('/demo', (req, res) => {
  try {
    const { preset } = req.body || {};
    const usernameMap: Record<string, string> = {
      user: 'mehmon',
      host: 'madina_live',
      agency: 'silkroad',
      admin: 'admin',
    };
    const uname = usernameMap[String(preset || 'user')] || 'mehmon';
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(uname);
    if (!user) {
      res.status(404).json({ error: 'Demo akkaunt topilmadi' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const followers = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id)?.c || 0;
  const following = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id)?.c || 0;
  const inventory = db
    .prepare('SELECT * FROM user_inventory WHERE user_id = ? AND expires_at > ?')
    .all(user.id, new Date().toISOString());

  let agency = null;
  if (user.agency_id) {
    agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(user.agency_id) || null;
  }

  res.json({
    user: {
      ...sanitizeUser(user),
      followersCount: Number(followers),
      followingCount: Number(following),
      agency,
      inventory,
    },
  });
});

// Sync Supabase / Google / External profile into local SQLite & issue valid Socket/API JWT
router.post('/sync', (req, res) => {
  try {
    const p = req.body || {};
    const id = String(p.id || '').trim();
    if (!id) {
      res.status(400).json({ error: 'ID kiritilmagan' });
      return;
    }

    const displayName = String(p.displayName || p.display_name || p.username || 'Foydalanuvchi').trim().slice(0, 48);
    let baseUsername = String(p.username || id)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24) || `user_${Date.now().toString().slice(-5)}`;

    const existingById = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const conflictUsername = db
      .prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?')
      .get(baseUsername, id);
    if (conflictUsername) {
      baseUsername = `${baseUsername.slice(0, 18)}_${Math.floor(Math.random() * 900 + 100)}`;
    }

    let safeUid = Number(p.uid) || 100000 + Math.floor(Math.random() * 800000);
    const conflictUid = db.prepare('SELECT id FROM users WHERE uid = ? AND id != ?').get(safeUid, id);
    if (conflictUid) {
      const maxUidRow = db.prepare('SELECT MAX(uid) as m FROM users').get();
      safeUid = (Number(maxUidRow?.m) || 100000) + 1;
    }

    const avatar = String(p.avatar ?? '');
    const bio = String(p.bio ?? '');
    const country = String(p.country || 'UZ');
    const gender = String(p.gender || 'other');
    const role = String(p.role || 'USER');
    const coins = p.coins !== undefined ? Number(p.coins) : existingById ? Number(existingById.coins) : 5000;
    const diamonds = p.diamonds !== undefined ? Number(p.diamonds) : existingById ? Number(existingById.diamonds) : 0;
    const vipLevel = p.vipLevel !== undefined ? Number(p.vipLevel) : existingById ? Number(existingById.vip_level) : 0;
    const activeFrame = p.activeFrame !== undefined ? String(p.activeFrame) : existingById ? String(existingById.active_frame || '') : '';
    const activeRide = p.activeRide !== undefined ? String(p.activeRide) : existingById ? String(existingById.active_ride || '') : '';
    const activeBubble = p.activeBubble !== undefined ? String(p.activeBubble) : existingById ? String(existingById.active_bubble || '') : '';
    const now = new Date().toISOString();

    if (existingById) {
      db.prepare(`
        UPDATE users SET
          display_name = ?,
          avatar = ?,
          bio = ?,
          coins = ?,
          diamonds = ?,
          vip_level = ?,
          active_frame = ?,
          active_ride = ?,
          active_bubble = ?,
          role = ?
        WHERE id = ?
      `).run(displayName, avatar, bio, coins, diamonds, vipLevel, activeFrame, activeRide, activeBubble, role, id);
    } else {
      const dummyHash = bcrypt.hashSync('supabase_oauth_synced', 6);
      db.prepare(`
        INSERT INTO users (
          id, uid, username, display_name, password_hash, avatar, bio, country, gender, role,
          coins, diamonds, vip_level, active_frame, active_ride, active_bubble, is_demo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        id,
        safeUid,
        baseUsername,
        displayName,
        dummyHash,
        avatar,
        bio,
        country,
        gender,
        role,
        coins,
        diamonds,
        vipLevel,
        activeFrame,
        activeRide,
        activeBubble,
        now
      );
    }

    // Ensure currently equipped items exist in user_inventory so unequip/re-equip works cleanly
    const expiresAt = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
    const equippedPairs: Array<[string, string]> = [
      ['FRAME', activeFrame],
      ['RIDE', activeRide],
      ['BUBBLE', activeBubble],
    ];
    for (const [iType, iCode] of equippedPairs) {
      if (iCode && iCode !== 'none') {
        const hasInv = db
          .prepare('SELECT 1 FROM user_inventory WHERE user_id = ? AND item_code = ?')
          .get(id, iCode);
        if (!hasInv) {
          db.prepare(
            `INSERT INTO user_inventory (id, user_id, item_id, item_type, item_code, expires_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(uuid(), id, `sync_${iCode}`, iType, iCode, expiresAt, now);
        }
      }
    }

    const syncedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id)!;
    const token = signToken(id);
    res.json({ token, user: sanitizeUser(syncedUser) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync error' });
  }
});

export default router;
