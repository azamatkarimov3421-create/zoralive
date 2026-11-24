import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../services/level';

const router = Router();

// Live viewer counts injected from socket manager
export const liveRoomMetrics = new Map<string, { viewers: number; hasPk: boolean; occupiedSeats: number }>();

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const type = String(req.query.type || 'ALL').toUpperCase();
  const followingOnly = req.query.following === '1';
  const q = String(req.query.q || '').trim().toLowerCase();
  const me = req.user!.id;

  let query = `
    SELECT r.*, u.display_name as host_name, u.avatar as host_avatar,
           u.active_frame as host_frame, u.vip_level as host_vip, u.uid as host_uid
    FROM rooms r
    JOIN users u ON u.id = r.host_id
    WHERE r.is_live = 1
  `;
  const params: unknown[] = [];

  if (type !== 'ALL' && ['VOICE', 'VIDEO', 'GAME'].includes(type)) {
    query += ' AND r.type = ?';
    params.push(type);
  }
  if (followingOnly) {
    query += ' AND r.host_id IN (SELECT following_id FROM follows WHERE follower_id = ?)';
    params.push(me);
  }
  if (q) {
    query += ' AND (LOWER(r.title) LIKE ? OR LOWER(u.display_name) LIKE ? OR CAST(r.room_number AS TEXT) LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  query += ' ORDER BY r.is_featured DESC, r.total_gifts DESC, r.created_at DESC';
  const rows = db.prepare(query).all(...params);

  const rooms = rows.map((r) => {
    const live = liveRoomMetrics.get(r.id);
    return {
      id: r.id,
      roomNumber: r.room_number,
      hostId: r.host_id,
      hostName: r.host_name,
      hostAvatar: r.host_avatar,
      hostFrame: r.host_frame || '',
      hostVip: r.host_vip || 0,
      hostUid: r.host_uid,
      title: r.title,
      type: r.type,
      theme: r.theme,
      cover: r.cover,
      country: r.country,
      seatCount: r.seat_count,
      isLive: Boolean(r.is_live),
      isFeatured: Boolean(r.is_featured),
      totalGifts: r.total_gifts,
      viewerCount: (r.viewer_boost || 0) + (live?.viewers || 0),
      hasPk: live?.hasPk || false,
      occupiedSeats: live?.occupiedSeats || (r.type === 'VOICE' ? 3 : 1),
      createdAt: r.created_at,
    };
  });

  res.json({ rooms });
});

router.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const roomId = String(req.params.id);
  let room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    const hostFallback = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) || req.user!;
    const maxNum = db.prepare('SELECT MAX(room_number) as m FROM rooms').get()?.m || 8900;
    db.prepare(`
      INSERT OR IGNORE INTO rooms (id, room_number, host_id, title, type, theme, cover, country, seat_count, is_live, created_at)
      VALUES (?, ?, ?, ?, 'VOICE', 'light', '/assets/stage-palace.jpg', 'UZ', 8, 1, ?)
    `).run(roomId, Number(maxNum) + 1, hostFallback.id, `${hostFallback.display_name} xonasi`, new Date().toISOString());
    room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  }
  if (!room) {
    res.status(404).json({ error: 'Xona topilmadi' });
    return;
  }
  const host = db.prepare('SELECT * FROM users WHERE id = ?').get(room.host_id);
  const isFollowing = Boolean(
    db
      .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
      .get(req.user!.id, room.host_id)
  );
  const live = liveRoomMetrics.get(room.id);
  res.json({
    room: {
      id: room.id,
      roomNumber: room.room_number,
      hostId: room.host_id,
      host: host ? sanitizeUser(host) : null,
      title: room.title,
      notice: room.notice || '',
      type: room.type,
      theme: room.theme,
      cover: room.cover,
      country: room.country,
      seatCount: room.seat_count,
      isLive: Boolean(room.is_live),
      totalGifts: room.total_gifts,
      viewerCount: (room.viewer_boost || 0) + (live?.viewers || 0),
      isFollowing,
    },
  });
});

router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { title, type, theme, seatCount } = req.body || {};
  const user = req.user!;
  const cleanTitle = String(title || `${user.display_name} xonasi`).trim().slice(0, 64);
  const roomType = ['VOICE', 'VIDEO', 'GAME'].includes(String(type).toUpperCase())
    ? String(type).toUpperCase()
    : 'VOICE';

  const covers: Record<string, string> = {
    galaxy: '/assets/stage-galaxy.jpg',
    gold: '/assets/stage-palace.jpg',
    ocean: '/assets/stage-ocean.jpg',
    neon: '/assets/stage-neon.jpg',
  };
  const chosenTheme = covers[theme] ? theme : 'galaxy';
  const maxNum = db.prepare('SELECT MAX(room_number) as m FROM rooms').get()?.m || 8800;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO rooms (id, room_number, host_id, title, type, theme, cover, country, seat_count, is_live, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    Number(maxNum) + 1,
    user.id,
    cleanTitle,
    roomType,
    chosenTheme,
    covers[chosenTheme],
    user.country || 'UZ',
    roomType === 'VIDEO' ? 4 : Math.min(12, Math.max(4, Number(seatCount) || 8)),
    now
  );

  // Promote regular user to HOST when they launch a room
  if (user.role === 'USER') {
    db.prepare("UPDATE users SET role = 'HOST' WHERE id = ?").run(user.id);
  }

  const created = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)!;
  res.status(201).json({
    room: {
      id: created.id,
      roomNumber: created.room_number,
      hostId: created.host_id,
      title: created.title,
      type: created.type,
      theme: created.theme,
      cover: created.cover,
      seatCount: created.seat_count,
    },
  });
});

router.post('/:id/close', requireAuth, (req: AuthRequest, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(String(req.params.id));
  if (!room) {
    res.status(404).json({ error: 'Xona topilmadi' });
    return;
  }
  if (room.host_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Faqat xona egasi yoki admin yopa oladi' });
    return;
  }
  db.prepare('UPDATE rooms SET is_live = 0 WHERE id = ?').run(room.id);
  res.json({ ok: true });
});

router.post('/:id/report', requireAuth, (req: AuthRequest, res) => {
  const { reason } = req.body || {};
  db.prepare(
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at)
     VALUES (?, ?, 'ROOM', ?, ?, 'OPEN', ?)`
  ).run(uuid(), req.user!.id, String(req.params.id), String(reason || 'Qoidabuzarlik').slice(0, 200), new Date().toISOString());
  res.json({ ok: true, message: 'Shikoyat moderatorlarga yuborildi' });
});

export default router;
