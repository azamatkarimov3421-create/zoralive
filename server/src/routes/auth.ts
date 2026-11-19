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

export default router;
