import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../services/level';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const families = db
    .prepare(`
      SELECT f.*, u.display_name as leader_name,
        (SELECT COUNT(*) FROM users WHERE family_id = f.id) as members_count
      FROM families f
      LEFT JOIN users u ON u.id = f.leader_id
      ORDER BY f.honor_xp DESC
      LIMIT 30
    `)
    .all();

  let myFamily = null;
  let members: any[] = [];
  if (user.family_id) {
    myFamily = families.find((f) => f.id === user.family_id) || null;
    if (myFamily) {
      members = db
        .prepare('SELECT * FROM users WHERE family_id = ? ORDER BY wealth_xp + charm_xp DESC')
        .all(myFamily.id)
        .map(sanitizeUser);
    }
  }

  res.json({ myFamily, members, families });
});

router.post('/create', requireAuth, (req: AuthRequest, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 36);
  const tag = String(req.body?.tag || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
  const badge = String(req.body?.badge || '👑').slice(0, 4);

  if (name.length < 3 || tag.length < 2) {
    res.status(400).json({ error: 'Klan nomi (3+) va teg (2–5 harf) kiriting' });
    return;
  }
  const exists = db.prepare('SELECT id FROM families WHERE UPPER(tag) = ?').get(tag);
  if (exists) {
    res.status(409).json({ error: 'Bu teg band' });
    return;
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO families (id, tag, name, badge, leader_id, honor_xp, created_at)
     VALUES (?, ?, ?, ?, ?, 1000, ?)`
  ).run(id, tag, name, badge, req.user!.id, new Date().toISOString());

  db.prepare('UPDATE users SET family_id = ? WHERE id = ?').run(id, req.user!.id);
  res.status(201).json({ ok: true, id });
});

router.post('/:id/join', requireAuth, (req: AuthRequest, res) => {
  const fam = db.prepare('SELECT id FROM families WHERE id = ?').get(String(req.params.id));
  if (!fam) {
    res.status(404).json({ error: 'Klan topilmadi' });
    return;
  }
  db.prepare('UPDATE users SET family_id = ? WHERE id = ?').run(fam.id, req.user!.id);
  res.json({ ok: true });
});

router.post('/leave', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE users SET family_id = NULL WHERE id = ?').run(req.user!.id);
  res.json({ ok: true });
});

export default router;
