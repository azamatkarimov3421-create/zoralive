import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (location: string) => SQLiteDatabase;
};

export interface SQLiteStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Record<string, any> | undefined;
  all(...params: unknown[]): Record<string, any>[];
}

export interface SQLiteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SQLiteStatement;
  close(): void;
}

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'zoralive.db');
export const db: SQLiteDatabase = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function runTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      uid INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL,
      bio TEXT DEFAULT '',
      country TEXT DEFAULT 'UZ',
      gender TEXT DEFAULT 'other',
      role TEXT DEFAULT 'USER',
      coins INTEGER DEFAULT 1500,
      diamonds INTEGER DEFAULT 0,
      wealth_xp INTEGER DEFAULT 0,
      charm_xp INTEGER DEFAULT 0,
      vip_level INTEGER DEFAULT 0,
      vip_expires_at TEXT,
      active_frame TEXT DEFAULT '',
      active_ride TEXT DEFAULT '',
      active_bubble TEXT DEFAULT '',
      agency_id TEXT,
      is_banned INTEGER DEFAULT 0,
      is_demo INTEGER DEFAULT 0,
      hosted_minutes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      commission_rate REAL DEFAULT 0.10,
      total_earned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_number INTEGER UNIQUE NOT NULL,
      host_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      theme TEXT DEFAULT 'galaxy',
      cover TEXT NOT NULL,
      country TEXT DEFAULT 'UZ',
      seat_count INTEGER DEFAULT 8,
      is_live INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      total_gifts INTEGER DEFAULT 0,
      viewer_boost INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      effect_type TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS store_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration_days INTEGER DEFAULT 30,
      preview_style TEXT NOT NULL,
      vip_tier INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      tx_type TEXT NOT NULL,
      description TEXT NOT NULL,
      ref_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payout_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      diamonds_amount INTEGER NOT NULL,
      usd_amount REAL NOT NULL,
      method TEXT NOT NULL,
      destination TEXT NOT NULL,
      kyc_full_name TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      admin_note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      msg_type TEXT DEFAULT 'TEXT',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_claims (
      user_id TEXT NOT NULL,
      task_code TEXT NOT NULL,
      claim_date TEXT NOT NULL,
      reward INTEGER NOT NULL,
      PRIMARY KEY (user_id, task_code, claim_date)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_spins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT,
      bet_amount INTEGER NOT NULL,
      sector_label TEXT NOT NULL,
      multiplier REAL NOT NULL,
      win_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      likes_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moment_likes (
      moment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (moment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS moment_comments (
      id TEXT PRIMARY KEY,
      moment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      tag TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      badge TEXT DEFAULT '👑',
      leader_id TEXT NOT NULL,
      honor_xp INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Safe idempotent column migrations for existing databases
  try {
    db.exec('ALTER TABLE users ADD COLUMN family_id TEXT');
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE rooms ADD COLUMN notice TEXT DEFAULT ''");
  } catch {
    // column already exists
  }
}
