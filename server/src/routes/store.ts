import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db, runTransaction } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../services/level';

const router = Router();

router.get('/gifts', requireAuth, (_req, res) => {
  const gifts = db.prepare('SELECT * FROM gifts WHERE is_active = 1 ORDER BY price ASC').all();
  res.json({ gifts: gifts.map((g: any) => ({ ...g, price: 0 })) });
});

router.get('/items', requireAuth, (req: AuthRequest, res) => {
  const items = db.prepare('SELECT * FROM store_items ORDER BY type ASC, price ASC').all();
  const owned = db
    .prepare('SELECT item_code, expires_at FROM user_inventory WHERE user_id = ? AND expires_at > ?')
    .all(req.user!.id, new Date().toISOString());
  const ownedMap = new Map(owned.map((o) => [o.item_code, o.expires_at]));

  res.json({
    items: items.map((it) => ({
      ...it,
      price: 0,
      owned: ownedMap.has(it.code),
      expiresAt: ownedMap.get(it.code) || null,
    })),
  });
});

router.post('/buy', requireAuth, (req: AuthRequest, res) => {
  try {
    const { itemId, code, itemType, nameUz, frameCode, bubbleCode } = req.body || {};
    const userId = req.user!.id;

    const updatedUser = runTransaction(() => {
      let item = db.prepare('SELECT * FROM store_items WHERE id = ? OR code = ?').get(String(itemId || ''), String(code || ''));
      if (!item && code && itemType) {
        const vipTierNum = itemType === 'VIP' ? Number(String(code).replace('vip-', '')) || 1 : 0;
        item = {
          id: String(itemId || `dyn_${code}`),
          type: String(itemType),
          code: String(code),
          name_uz: String(nameUz || code),
          price: 0,
          duration_days: 30,
          vip_tier: vipTierNum,
        };
      }
      if (!item) throw new Error('Mahsulot topilmadi');

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
      const newCoins = Number(user.coins);
      const newWealth = Number(user.wealth_xp) + 100;
      const expiresAt = new Date(Date.now() + Number(item.duration_days || 30) * 86400 * 1000).toISOString();
      const now = new Date().toISOString();

      db.prepare('UPDATE users SET coins = ?, wealth_xp = ? WHERE id = ?').run(newCoins, newWealth, userId);

      db.prepare(
        `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, ref_id, created_at)
         VALUES (?, ?, 'COINS', ?, ?, 'STORE_BUY', ?, ?, ?)`
      ).run(uuid(), userId, 0, newCoins, `Do‘kon (Tekin): ${item.name_uz}`, item.id, now);

      db.prepare(
        `INSERT INTO user_inventory (id, user_id, item_id, item_type, item_code, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(uuid(), userId, item.id, item.type, item.code, expiresAt, now);

      // Auto-equip bought item (Dragons ONLY equip when RIDE is bought — VIP never forces a dragon!)
      if (item.type === 'FRAME') {
        db.prepare('UPDATE users SET active_frame = ? WHERE id = ?').run(item.code, userId);
      } else if (item.type === 'RIDE') {
        db.prepare('UPDATE users SET active_ride = ? WHERE id = ?').run(item.code, userId);
      } else if (item.type === 'BUBBLE') {
        db.prepare('UPDATE users SET active_bubble = ? WHERE id = ?').run(item.code, userId);
      } else if (item.type === 'VIP') {
        const nextVip = Number(item.vip_tier || String(item.code).replace('vip-', '') || 1);
        db.prepare('UPDATE users SET vip_level = ?, vip_expires_at = ? WHERE id = ?').run(nextVip, expiresAt, userId);
        if (frameCode) {
          db.prepare('UPDATE users SET active_frame = ? WHERE id = ?').run(String(frameCode), userId);
          db.prepare(
            `INSERT INTO user_inventory (id, user_id, item_id, item_type, item_code, expires_at, created_at)
             VALUES (?, ?, ?, 'FRAME', ?, ?, ?)`
          ).run(uuid(), userId, `vip_fr_${frameCode}`, String(frameCode), expiresAt, now);
        }
        if (bubbleCode) {
          db.prepare('UPDATE users SET active_bubble = ? WHERE id = ?').run(String(bubbleCode), userId);
          db.prepare(
            `INSERT INTO user_inventory (id, user_id, item_id, item_type, item_code, expires_at, created_at)
             VALUES (?, ?, ?, 'BUBBLE', ?, ?, ?)`
          ).run(uuid(), userId, `vip_bb_${bubbleCode}`, String(bubbleCode), expiresAt, now);
        }
      }

      return db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
    });

    res.json({ ok: true, user: sanitizeUser(updatedUser) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/equip', requireAuth, (req: AuthRequest, res) => {
  const { itemType, itemCode } = req.body || {};
  const userId = req.user!.id;

  if (itemCode) {
    const owned = db
      .prepare('SELECT 1 FROM user_inventory WHERE user_id = ? AND item_code = ? AND expires_at > ?')
      .get(userId, String(itemCode), new Date().toISOString());
    if (!owned) {
      res.status(400).json({ error: 'Bu buyum sizning inventaringizda yo‘q' });
      return;
    }
  }

  const colMap: Record<string, string> = {
    FRAME: 'active_frame',
    RIDE: 'active_ride',
    BUBBLE: 'active_bubble',
  };
  const col = colMap[String(itemType)];
  if (!col) {
    res.status(400).json({ error: 'Noto‘g‘ri buyum turi' });
    return;
  }

  db.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).run(itemCode || '', userId);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
  res.json({ ok: true, user: sanitizeUser(updated) });
});

export default router;
