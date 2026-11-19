import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const me = req.user!.id;
  const rows = db
    .prepare(`
      SELECT m.*, u.display_name, u.avatar, u.active_frame, u.vip_level, u.uid,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comments_count
      FROM moments m
      JOIN users u ON u.id = m.user_id
      ORDER BY m.created_at DESC
      LIMIT 40
    `)
    .all();

  const likedSet = new Set(
    db.prepare('SELECT moment_id FROM moment_likes WHERE user_id = ?').all(me).map((r) => r.moment_id)
  );

  res.json({
    moments: rows.map((m) => ({
      id: m.id,
      userId: m.user_id,
      displayName: m.display_name,
      avatar: m.avatar,
      frame: m.active_frame || '',
      vipLevel: m.vip_level || 0,
      uid: m.uid,
      content: m.content,
      imageUrl: m.image_url || '',
      likesCount: m.likes_count || 0,
      commentsCount: Number(m.comments_count || 0),
      liked: likedSet.has(m.id),
      createdAt: m.created_at,
    })),
  });
});

router.post('/', requireAuth, (req: AuthRequest, res) => {
  const content = String(req.body?.content || '').trim().slice(0, 400);
  const imageUrl = String(req.body?.imageUrl || '').trim();
  if (!content && !imageUrl) {
    res.status(400).json({ error: 'Matn yoki rasm kiriting' });
    return;
  }
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO moments (id, user_id, content, image_url, likes_count, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(id, req.user!.id, content, imageUrl.slice(0, 1500000), now);
  res.status(201).json({ ok: true, id });
});

router.post('/:id/like', requireAuth, (req: AuthRequest, res) => {
  const momentId = String(req.params.id);
  const me = req.user!.id;
  const exists = db.prepare('SELECT 1 FROM moment_likes WHERE moment_id = ? AND user_id = ?').get(momentId, me);
  if (exists) {
    db.prepare('DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?').run(momentId, me);
    db.prepare('UPDATE moments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(momentId);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)').run(momentId, me);
    db.prepare('UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?').run(momentId);
    res.json({ liked: true });
  }
});

router.get('/:id/comments', requireAuth, (req, res) => {
  const comments = db
    .prepare(`
      SELECT c.*, u.display_name, u.avatar
      FROM moment_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.moment_id = ?
      ORDER BY c.created_at ASC
      LIMIT 50
    `)
    .all(String(req.params.id));
  res.json({ comments });
});

router.post('/:id/comments', requireAuth, (req: AuthRequest, res) => {
  const content = String(req.body?.content || '').trim().slice(0, 240);
  if (!content) {
    res.status(400).json({ error: 'Izoh bo‘sh' });
    return;
  }
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO moment_comments (id, moment_id, user_id, content, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, String(req.params.id), req.user!.id, content, now);
  res.status(201).json({
    comment: {
      id,
      moment_id: String(req.params.id),
      user_id: req.user!.id,
      display_name: req.user!.display_name,
      avatar: req.user!.avatar,
      content,
      created_at: now,
    },
  });
});

export default router;
