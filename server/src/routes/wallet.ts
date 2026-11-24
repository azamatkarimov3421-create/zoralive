import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  creditCoins,
  exchangeDiamondsToCoins,
} from '../services/economy';

const router = Router();

const TOPUP_PACKAGES = [
  { id: 'pkg-1', coins: 5000, bonus: 0, priceUsd: 0, priceUzs: 0, badge: 'Tekin' },
  { id: 'pkg-2', coins: 15000, bonus: 1500, priceUsd: 0, priceUzs: 0, badge: 'Tekin' },
  { id: 'pkg-3', coins: 50000, bonus: 5000, priceUsd: 0, priceUzs: 0, badge: 'Tekin' },
  { id: 'pkg-4', coins: 150000, bonus: 25000, priceUsd: 0, priceUzs: 0, badge: 'VIP Tekin' },
  { id: 'pkg-5', coins: 500000, bonus: 100000, priceUsd: 0, priceUzs: 0, badge: 'Cheksiz Tekin' },
];

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const ledger = db
    .prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 40')
    .all(user.id);

  res.json({
    coins: user.coins,
    diamonds: user.diamonds,
    packages: TOPUP_PACKAGES,
    ledger,
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

router.post('/withdraw', requireAuth, (_req: AuthRequest, res) => {
  res.status(400).json({ error: 'Bu ilovada pul yechish va daromad olish mavjud emas' });
});

export default router;
