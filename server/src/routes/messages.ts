import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../services/level';

const router = Router();

router.get('/conversations', requireAuth, (req: AuthRequest, res) => {
  const me = req.user!.id;
  const rows = db
    .prepare(`
      SELECT * FROM direct_messages
      WHERE sender_id = ? OR receiver_id = ?
      ORDER BY created_at DESC
    `)
    .all(me, me);

  const peerMap = new Map<string, any>();
  for (const row of rows) {
    const peerId = row.sender_id === me ? row.receiver_id : row.sender_id;
    if (!peerMap.has(peerId)) {
      const peer = db.prepare('SELECT * FROM users WHERE id = ?').get(peerId);
      if (peer) {
        peerMap.set(peerId, {
          peer: sanitizeUser(peer),
          lastMessage: row.content,
          lastAt: row.created_at,
        });
      }
    }
  }

  res.json({ conversations: Array.from(peerMap.values()) });
});

router.get('/:peerId', requireAuth, (req: AuthRequest, res) => {
  const me = req.user!.id;
  const peerId = String(req.params.peerId);
  const messages = db
    .prepare(`
      SELECT * FROM direct_messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
      LIMIT 100
    `)
    .all(me, peerId, peerId, me);
  const peer = db.prepare('SELECT * FROM users WHERE id = ?').get(peerId);
  res.json({
    peer: peer ? sanitizeUser(peer) : null,
    messages,
  });
});

router.post('/:peerId', requireAuth, (req: AuthRequest, res) => {
  const me = req.user!.id;
  const peerId = String(req.params.peerId);
  const content = String(req.body?.content || '').trim().slice(0, 500);
  if (!content) {
    res.status(400).json({ error: 'Xabar bo‘sh bo‘lmasligi kerak' });
    return;
  }
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO direct_messages (id, sender_id, receiver_id, content, msg_type, created_at)
     VALUES (?, ?, ?, ?, 'TEXT', ?)`
  ).run(id, me, peerId, content, now);

  res.status(201).json({
    message: {
      id,
      sender_id: me,
      receiver_id: peerId,
      content,
      msg_type: 'TEXT',
      created_at: now,
    },
  });
});

export default router;
