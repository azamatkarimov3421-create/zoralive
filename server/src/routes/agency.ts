import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../services/level';

const router = Router();

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const allAgencies = db
    .prepare(`
      SELECT a.*, u.display_name as owner_name,
        (SELECT COUNT(*) FROM users WHERE agency_id = a.id) as host_count
      FROM agencies a
      LEFT JOIN users u ON u.id = a.owner_id
      ORDER BY a.total_earned DESC
    `)
    .all();

  let myAgency = null;
  let roster: any[] = [];
  if (user.agency_id) {
    myAgency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(user.agency_id) || null;
    if (myAgency) {
      roster = db
        .prepare('SELECT * FROM users WHERE agency_id = ? ORDER BY charm_xp DESC')
        .all(myAgency.id)
        .map(sanitizeUser);
    }
  }

  res.json({
    myAgency,
    roster,
    allAgencies,
    hostStats: {
      hostedMinutes: user.hosted_minutes || 0,
      diamonds: user.diamonds || 0,
      targetMinutes: 600,
      targetDiamonds: 10000,
    },
  });
});

router.post('/create', requireAuth, (req: AuthRequest, res) => {
  const { name, code } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 48);
  const cleanCode = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);

  if (cleanName.length < 3 || cleanCode.length < 4) {
    res.status(400).json({ error: 'Agentlik nomi (3+ harf) va kodi (4+ belgi) kiritilishi shart' });
    return;
  }

  const exists = db.prepare('SELECT id FROM agencies WHERE UPPER(code) = ?').get(cleanCode);
  if (exists) {
    res.status(409).json({ error: 'Bu Agency ID band' });
    return;
  }

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO agencies (id, code, name, owner_id, commission_rate, total_earned, created_at)
     VALUES (?, ?, ?, ?, 0.10, 0, ?)`
  ).run(id, cleanCode, cleanName, req.user!.id, now);

  db.prepare("UPDATE users SET agency_id = ?, role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'AGENCY' END WHERE id = ?").run(
    id,
    req.user!.id
  );

  const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(id);
  res.status(201).json({ ok: true, agency });
});

router.post('/join', requireAuth, (req: AuthRequest, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const agency = db.prepare('SELECT * FROM agencies WHERE UPPER(code) = ?').get(code);
  if (!agency) {
    res.status(404).json({ error: 'Bunday Agency ID topilmadi (masalan: ZORA77 yoki TASH01)' });
    return;
  }
  db.prepare("UPDATE users SET agency_id = ?, role = CASE WHEN role = 'USER' THEN 'HOST' ELSE role END WHERE id = ?").run(
    agency.id,
    req.user!.id
  );
  res.json({ ok: true, agency });
});

router.post('/leave', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE users SET agency_id = NULL WHERE id = ?').run(req.user!.id);
  res.json({ ok: true });
});

export default router;
