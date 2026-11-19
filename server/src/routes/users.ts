import { Router } from 'express';
import { db } from '../db/database';
import { sanitizeUser } from '../services/level';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', requireAuth, (req, res) => {
  const type = String(req.query.type || 'wealth');
  if (type === 'agency') {
    const agencies = db
      .prepare(`
        SELECT a.*, u.display_name as owner_name, u.avatar as owner_avatar,
          (SELECT COUNT(*) FROM users WHERE agency_id = a.id) as host_count
        FROM agencies a
        LEFT JOIN users u ON u.id = a.owner_id
        ORDER BY a.total_earned DESC
        LIMIT 20
      `)
      .all();
    res.json({ agencies });
    return;
  }

  const col = type === 'charm' ? 'charm_xp' : 'wealth_xp';
  const rows = db
    .prepare(`SELECT * FROM users WHERE is_banned = 0 ORDER BY ${col} DESC LIMIT 25`)
    .all()
    .map(sanitizeUser);
  res.json({ users: rows });
});

router.get('/directory', requireAuth, (req: AuthRequest, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const me = req.user!.id;
  const followingSet = new Set(
    db.prepare('SELECT following_id FROM follows WHERE follower_id = ?').all(me).map((r) => r.following_id)
  );

  let rows;
  if (q) {
    rows = db
      .prepare(
        `SELECT * FROM users WHERE is_banned = 0 AND (LOWER(display_name) LIKE ? OR LOWER(username) LIKE ? OR CAST(uid AS TEXT) LIKE ?) LIMIT 30`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM users WHERE is_banned = 0 ORDER BY charm_xp DESC LIMIT 30').all();
  }

  res.json({
    users: rows.map((r) => ({
      ...sanitizeUser(r),
      isFollowing: followingSet.has(r.id),
    })),
  });
});

router.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const { displayName, bio, country, gender, avatar } = req.body || {};
  const user = req.user!;
  db.prepare(`
    UPDATE users SET
      display_name = COALESCE(?, display_name),
      bio = COALESCE(?, bio),
      country = COALESCE(?, country),
      gender = COALESCE(?, gender),
      avatar = COALESCE(?, avatar)
    WHERE id = ?
  `).run(
    displayName ? String(displayName).trim().slice(0, 40) : null,
    bio !== undefined ? String(bio).trim().slice(0, 160) : null,
    country || null,
    gender || null,
    avatar || null,
    user.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)!;
  res.json({ user: sanitizeUser(updated) });
});

router.post('/:id/follow', requireAuth, (req: AuthRequest, res) => {
  const targetId = String(req.params.id);
  const me = req.user!.id;
  if (targetId === me) {
    res.status(400).json({ error: 'O‘zingizga obuna bo‘la olmaysiz' });
    return;
  }
  const existing = db
    .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
    .get(me, targetId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(me, targetId);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').run(
      me,
      targetId,
      new Date().toISOString()
    );
    res.json({ following: true });
  }
});

export default router;
