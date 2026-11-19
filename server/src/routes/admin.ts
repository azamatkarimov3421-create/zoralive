import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db, runTransaction } from '../db/database';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { creditCoins } from '../services/economy';
import { sanitizeUser } from '../services/level';

const router = Router();

router.get('/dashboard', requireAdmin, (_req, res) => {
  const totalUsers = Number(db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0);
  const activeRooms = Number(db.prepare('SELECT COUNT(*) as c FROM rooms WHERE is_live = 1').get()?.c || 0);
  const totalAgencies = Number(db.prepare('SELECT COUNT(*) as c FROM agencies').get()?.c || 0);
  const pendingPayouts = Number(
    db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'PENDING'").get()?.c || 0
  );
  const openReports = Number(db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'OPEN'").get()?.c || 0);
  const totalGiftsVolume = Number(
    db.prepare("SELECT COALESCE(SUM(ABS(amount)), 0) as s FROM ledger WHERE tx_type = 'GIFT_SEND'").get()?.s || 0
  );
  const totalTopupCoins = Number(
    db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM ledger WHERE tx_type = 'TOPUP'").get()?.s || 0
  );

  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 60').all().map(sanitizeUser);
  const rooms = db
    .prepare(`
      SELECT r.*, u.display_name as host_name
      FROM rooms r
      JOIN users u ON u.id = r.host_id
      ORDER BY r.is_live DESC, r.created_at DESC
      LIMIT 40
    `)
    .all();
  const gifts = db.prepare('SELECT * FROM gifts ORDER BY price ASC').all();
  const payouts = db
    .prepare(`
      SELECT p.*, u.display_name, u.username, u.uid
      FROM payout_requests p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `)
    .all();
  const agencies = db
    .prepare(`
      SELECT a.*, u.display_name as owner_name,
        (SELECT COUNT(*) FROM users WHERE agency_id = a.id) as host_count
      FROM agencies a
      LEFT JOIN users u ON u.id = a.owner_id
      ORDER BY a.total_earned DESC
    `)
    .all();
  const reports = db
    .prepare(`
      SELECT rp.*, u.display_name as reporter_name
      FROM reports rp
      LEFT JOIN users u ON u.id = rp.reporter_id
      ORDER BY rp.created_at DESC
      LIMIT 40
    `)
    .all();

  res.json({
    stats: {
      totalUsers,
      activeRooms,
      totalAgencies,
      pendingPayouts,
      openReports,
      totalGiftsVolume,
      totalTopupCoins,
      estimatedPlatformRevenueUsd: Number(((totalGiftsVolume * 0.4) / 100).toFixed(2)),
    },
    users,
    rooms,
    gifts,
    payouts,
    agencies,
    reports,
  });
});

router.post('/users/:id/coins', requireAdmin, (req: AuthRequest, res) => {
  try {
    const amount = Math.floor(Number(req.body?.amount || 0));
    const note = String(req.body?.note || 'Admin tomonidan qo‘shildi');
    const result = creditCoins(String(req.params.id), amount, 'ADMIN_GRANT', note);
    res.json({ ok: true, coins: result.coins });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/users/:id/ban', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id, is_banned, role FROM users WHERE id = ?').get(String(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }
  if (user.role === 'ADMIN') {
    res.status(400).json({ error: 'Super Adminni bloklab bo‘lmaydi' });
    return;
  }
  const nextVal = user.is_banned ? 0 : 1;
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(nextVal, user.id);
  res.json({ ok: true, isBanned: Boolean(nextVal) });
});

router.post('/rooms/:id/toggle', requireAdmin, (req, res) => {
  const room = db.prepare('SELECT id, is_live FROM rooms WHERE id = ?').get(String(req.params.id));
  if (!room) {
    res.status(404).json({ error: 'Xona topilmadi' });
    return;
  }
  const next = room.is_live ? 0 : 1;
  db.prepare('UPDATE rooms SET is_live = ? WHERE id = ?').run(next, room.id);
  res.json({ ok: true, isLive: Boolean(next) });
});

router.post('/gifts', requireAdmin, (req, res) => {
  const { nameUz, icon, category, price, effectType, accentColor } = req.body || {};
  if (!nameUz || !icon || !price) {
    res.status(400).json({ error: 'Nom, ikonka va narx kiritilishi shart' });
    return;
  }
  const id = `gift-${uuid().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO gifts (id, name, name_uz, icon, category, price, effect_type, accent_color, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(
    id,
    String(nameUz),
    String(nameUz),
    String(icon),
    ['BASIC', 'LUCKY', 'LUXURY'].includes(category) ? category : 'BASIC',
    Math.max(1, Number(price)),
    ['pulse', 'burst', 'banner', 'fullscreen'].includes(effectType) ? effectType : 'burst',
    String(accentColor || '#22d3ee')
  );
  res.status(201).json({ ok: true, id });
});

router.put('/gifts/:id', requireAdmin, (req, res) => {
  const { price, isActive } = req.body || {};
  db.prepare(
    `UPDATE gifts SET price = COALESCE(?, price), is_active = COALESCE(?, is_active) WHERE id = ?`
  ).run(price !== undefined ? Number(price) : null, isActive !== undefined ? (isActive ? 1 : 0) : null, String(req.params.id));
  res.json({ ok: true });
});

router.post('/payouts/:id/process', requireAdmin, (req, res) => {
  try {
    const decision = String(req.body?.status || '').toUpperCase();
    const adminNote = String(req.body?.adminNote || '');
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      res.status(400).json({ error: 'Status APPROVED yoki REJECTED bo‘lishi kerak' });
      return;
    }

    runTransaction(() => {
      const payout = db.prepare('SELECT * FROM payout_requests WHERE id = ?').get(String(req.params.id));
      if (!payout) throw new Error('So‘rov topilmadi');
      if (payout.status !== 'PENDING') throw new Error('Bu so‘rov allaqachon ko‘rib chiqilgan');

      db.prepare('UPDATE payout_requests SET status = ?, admin_note = ?, processed_at = ? WHERE id = ?').run(
        decision,
        adminNote,
        new Date().toISOString(),
        payout.id
      );

      // Refund diamonds if rejected
      if (decision === 'REJECTED') {
        const user = db.prepare('SELECT id, diamonds FROM users WHERE id = ?').get(payout.user_id);
        if (user) {
          const refunded = Number(user.diamonds) + Number(payout.diamonds_amount);
          db.prepare('UPDATE users SET diamonds = ? WHERE id = ?').run(refunded, user.id);
          db.prepare(
            `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, ref_id, created_at)
             VALUES (?, ?, 'DIAMONDS', ?, ?, 'WITHDRAW_REFUND', ?, ?, ?)`
          ).run(
            uuid(),
            user.id,
            Number(payout.diamonds_amount),
            refunded,
            `Pul yechish rad etildi — qaytarildi (${adminNote || 'Admin'})`,
            payout.id,
            new Date().toISOString()
          );
        }
      }
    });

    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reports/:id/resolve', requireAdmin, (req, res) => {
  const status = req.body?.status === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, String(req.params.id));
  res.json({ ok: true });
});

export default router;
