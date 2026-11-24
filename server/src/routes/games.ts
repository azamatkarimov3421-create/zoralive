import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db, runTransaction } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Ziigo Greedy / Lucky Wheel 8 sectors (Play Store compliant: virtual coins only, non-cashout)
export const WHEEL_SECTORS = [
  { id: 'cherry', label: 'Gilos', icon: '🍒', multiplier: 2, weight: 28, color: '#ef4444' },
  { id: 'lemon', label: 'Limon', icon: '🍋', multiplier: 2, weight: 26, color: '#eab308' },
  { id: 'grape', label: 'Uzum', icon: '🍇', multiplier: 3, weight: 16, color: '#8b5cf6' },
  { id: 'diamond', label: 'Olmos', icon: '💎', multiplier: 5, weight: 10, color: '#06b6d4' },
  { id: 'crown', label: 'Toj', icon: '👑', multiplier: 8, weight: 5, color: '#f59e0b' },
  { id: 'rocket', label: 'Raketa', icon: '🚀', multiplier: 15, weight: 2, color: '#ec4899' },
  { id: 'clover', label: 'Omad', icon: '🍀', multiplier: 1.5, weight: 8, color: '#10b981' },
  { id: 'miss', label: 'Bo‘sh', icon: '💨', multiplier: 0, weight: 5, color: '#475569' },
];

function pickWeightedSector() {
  const total = WHEEL_SECTORS.reduce((acc, s) => acc + s.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL_SECTORS.length; i++) {
    r -= WHEEL_SECTORS[i].weight;
    if (r <= 0) return { index: i, sector: WHEEL_SECTORS[i] };
  }
  return { index: 0, sector: WHEEL_SECTORS[0] };
}

router.get('/wheel/config', requireAuth, (_req, res) => {
  const recent = db
    .prepare(`
      SELECT gs.*, u.display_name, u.avatar
      FROM game_spins gs
      JOIN users u ON u.id = gs.user_id
      ORDER BY gs.created_at DESC
      LIMIT 15
    `)
    .all();
  res.json({ sectors: WHEEL_SECTORS, recent });
});

router.post('/wheel/spin', requireAuth, (req: AuthRequest, res) => {
  try {
    const bet = Math.floor(Number(req.body?.bet || 0));
    const roomId = req.body?.roomId ? String(req.body.roomId) : null;
    if (![10, 50, 100, 500, 1000].includes(bet)) {
      res.status(400).json({ error: 'Tikish summasi 10, 50, 100, 500 yoki 1000 tanga bo‘lishi kerak' });
      return;
    }

    const userId = req.user!.id;
    const outcome = runTransaction(() => {
      const user = db.prepare('SELECT id, coins, display_name FROM users WHERE id = ?').get(userId)!;
      const { index, sector } = pickWeightedSector();
      const winAmount = Math.floor(bet * sector.multiplier);
      const finalCoins = Number(user.coins) + winAmount;
      const now = new Date().toISOString();
      const spinId = uuid();

      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(finalCoins, userId);

      db.prepare(
        `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, ref_id, created_at)
         VALUES (?, ?, 'COINS', ?, ?, 'GAME_BET', ?, ?, ?)`
      ).run(uuid(), userId, 0, Number(user.coins), `Lucky Wheel tekin aylanish (${bet})`, spinId, now);

      if (winAmount > 0) {
        db.prepare(
          `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, ref_id, created_at)
           VALUES (?, ?, 'COINS', ?, ?, 'GAME_WIN', ?, ?, ?)`
        ).run(
          uuid(),
          userId,
          winAmount,
          finalCoins,
          `Lucky Wheel yutuq: ${sector.icon} ${sector.label} (x${sector.multiplier})`,
          spinId,
          now
        );
      }

      db.prepare(
        `INSERT INTO game_spins (id, user_id, room_id, bet_amount, sector_label, multiplier, win_amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(spinId, userId, roomId, bet, `${sector.icon} ${sector.label}`, sector.multiplier, winAmount, now);

      return {
        spinId,
        sectorIndex: index,
        sector,
        bet,
        winAmount,
        coins: finalCoins,
      };
    });

    res.json({ ok: true, ...outcome });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
