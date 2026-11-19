import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { creditCoins } from '../services/economy';

const router = Router();

const DAILY_TASKS = [
  { code: 'checkin', title: 'Kunlik kirish bonusi', desc: 'Ilovaga har kuni kirib bonus oling', reward: 150, icon: '📅' },
  { code: 'join_room', title: 'Ovozli xonaga kiring', desc: 'Istalgan Voice yoki Video xonada qatnashing', reward: 200, icon: '🎤' },
  { code: 'send_gift', title: 'Do‘stingizga sovg‘a yuboring', desc: 'Istalgan xonada kamida 1 ta sovg‘a ulashing', reward: 300, icon: '🎁' },
  { code: 'play_game', title: 'Party o‘yinda qatnashing', desc: 'Ludo yoki Lucky Wheel o‘yinini o‘ynang', reward: 250, icon: '🎲' },
  { code: 'host_live', title: 'Efir oching (Host vazifasi)', desc: 'O‘z xonangizni yaratib efir boshlang', reward: 500, icon: '🔥' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const today = todayStr();
  const claimed = db
    .prepare('SELECT task_code FROM task_claims WHERE user_id = ? AND claim_date = ?')
    .all(req.user!.id, today)
    .map((r) => r.task_code);
  const claimedSet = new Set(claimed);

  res.json({
    date: today,
    tasks: DAILY_TASKS.map((t) => ({
      ...t,
      claimed: claimedSet.has(t.code),
    })),
  });
});

router.post('/claim', requireAuth, (req: AuthRequest, res) => {
  try {
    const code = String(req.body?.code || '');
    const task = DAILY_TASKS.find((t) => t.code === code);
    if (!task) {
      res.status(404).json({ error: 'Vazifa topilmadi' });
      return;
    }
    const today = todayStr();
    const exists = db
      .prepare('SELECT 1 FROM task_claims WHERE user_id = ? AND task_code = ? AND claim_date = ?')
      .get(req.user!.id, code, today);
    if (exists) {
      res.status(400).json({ error: 'Bugungi mukofot allaqachon olingan' });
      return;
    }

    db.prepare('INSERT INTO task_claims (user_id, task_code, claim_date, reward) VALUES (?, ?, ?, ?)').run(
      req.user!.id,
      code,
      today,
      task.reward
    );
    const result = creditCoins(req.user!.id, task.reward, 'TASK_REWARD', `Kunlik vazifa: ${task.title}`);
    res.json({ ok: true, reward: task.reward, coins: result.coins });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
