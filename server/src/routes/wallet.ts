import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  creditCoins,
  exchangeDiamondsToCoins,
  createWithdrawalRequest,
} from '../services/economy';
import { config } from '../config';

const router = Router();

const TOPUP_PACKAGES = [
  { id: 'pkg-1', coins: 500, bonus: 0, priceUsd: 0.99, priceUzs: 12900, badge: '' },
  { id: 'pkg-2', coins: 1500, bonus: 150, priceUsd: 2.99, priceUzs: 38900, badge: 'Ommabop' },
  { id: 'pkg-3', coins: 5000, bonus: 600, priceUsd: 9.99, priceUzs: 129000, badge: '+12% Bonus' },
  { id: 'pkg-4', coins: 15000, bonus: 2500, priceUsd: 29.99, priceUzs: 385000, badge: 'VIP Tanlov' },
  { id: 'pkg-5', coins: 50000, bonus: 10000, priceUsd: 99.99, priceUzs: 1280000, badge: 'Eng Foydali' },
];

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const ledger = db
    .prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 40')
    .all(user.id);
  const payouts = db
    .prepare('SELECT * FROM payout_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(user.id);

  res.json({
    coins: user.coins,
    diamonds: user.diamonds,
    usdEquivalent: Number((user.diamonds / config.economy.diamondsPerUsd).toFixed(2)),
    minWithdrawDiamonds: config.economy.minWithdrawDiamonds,
    packages: TOPUP_PACKAGES,
    ledger,
    payouts,
  });
});

router.post('/topup', requireAuth, (req: AuthRequest, res) => {
  try {
    const { packageId, provider } = req.body || {};
    const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      res.status(400).json({ error: 'Paket topilmadi' });
      return;
    }
    const totalCoins = pkg.coins + pkg.bonus;
    const payMethod = String(provider || 'Click');
    const result = creditCoins(
      req.user!.id,
      totalCoins,
      'TOPUP',
      `Tanga xaridi: ${totalCoins} (${payMethod} — ${pkg.priceUzs.toLocaleString()} so‘m)`
    );
    res.json({ ok: true, coins: result.coins, added: totalCoins });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/exchange', requireAuth, (req: AuthRequest, res) => {
  try {
    const { diamonds } = req.body || {};
    const result = exchangeDiamondsToCoins(req.user!.id, Number(diamonds));
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/withdraw', requireAuth, (req: AuthRequest, res) => {
  try {
    const { diamonds, method, destination, kycFullName } = req.body || {};
    if (!destination || !kycFullName) {
      res.status(400).json({ error: 'Hamyon/karta raqami va to‘liq ism-familiya majburiy' });
      return;
    }
    const result = createWithdrawalRequest({
      userId: req.user!.id,
      diamondsAmount: Number(diamonds),
      method: String(method || 'USDT_TRC20'),
      destination: String(destination).trim(),
      kycFullName: String(kycFullName).trim(),
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
