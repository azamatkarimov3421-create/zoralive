import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from './database';

const DEMO_AVATAR_UPGRADES: Record<string, string> = {
  admin: '/assets/avatar-abrorbek.jpg',
  silkroad: '/assets/avatar-abrorbek.jpg',
  madina_live: '/assets/avatar-madina.jpg',
  jasur_pk: '/assets/avatar-jasur.jpg',
  laylo_voice: '/assets/avatar-laylo.jpg',
  sardor_game: '/assets/avatar-sardor.jpg',
  mehmon: '/assets/avatar-azizbek.jpg',
};

const DEMO_ROOM_COVER_UPGRADES: Record<string, string> = {
  'room-voice-01': '/assets/stage-galaxy.jpg',
  'room-video-01': '/assets/stage-palace.jpg',
  'room-voice-02': '/assets/stage-ocean.jpg',
  'room-game-01': '/assets/stage-neon.jpg',
  'room-video-02': '/assets/stage-galaxy.jpg',
};

export function seedExtras(): void {
  const now = new Date().toISOString();

  const famCount = Number(db.prepare('SELECT COUNT(*) as c FROM families').get()?.c || 0);
  if (famCount === 0) {
    const f1 = 'fam-uzb-01';
    const f2 = 'fam-vip-02';
    db.prepare(
      `INSERT INTO families (id, tag, name, badge, leader_id, honor_xp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(f1, 'UZB', 'O‘zbekiston Yulduzlari', '👑', 'usr-host-01', 84500, now);
    db.prepare(
      `INSERT INTO families (id, tag, name, badge, leader_id, honor_xp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(f2, 'VIP', 'Toshkent Prime', '⚡', 'usr-host-02', 62300, now);

    db.prepare('UPDATE users SET family_id = ? WHERE id IN (?, ?) AND family_id IS NULL').run(
      f1,
      'usr-host-01',
      'usr-host-03'
    );
    db.prepare('UPDATE users SET family_id = ? WHERE id IN (?, ?) AND family_id IS NULL').run(
      f2,
      'usr-host-02',
      'usr-host-04'
    );
  }

  const momCount = Number(db.prepare('SELECT COUNT(*) as c FROM moments').get()?.c || 0);
  if (momCount === 0) {
    const ins = db.prepare(
      `INSERT INTO moments (id, user_id, content, image_url, likes_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    ins.run(
      uuid(),
      'usr-host-01',
      'Bugun kechqurun 21:00 da ovozli xonada jonli qo‘shiqlar va Ludo turniri 🎤',
      '/assets/avatar-madina.jpg',
      24,
      new Date(Date.now() - 1800 * 1000).toISOString()
    );
    ins.run(
      uuid(),
      'usr-host-02',
      'PK Battle’da 5 ta ketma-ket g‘alaba! Kim keyingi raqib bo‘ladi? ⚡',
      '/assets/avatar-jasur.jpg',
      19,
      new Date(Date.now() - 5400 * 1000).toISOString()
    );
    ins.run(
      uuid(),
      'usr-host-04',
      'Ludo xonasiga kiring, 4 kishilik katta o‘yin boshlanyapti 🎲',
      '/assets/avatar-sardor.jpg',
      15,
      new Date(Date.now() - 10800 * 1000).toISOString()
    );
  }

  // Ensure all 10 Mythical Dragon gifts exist
  const insGiftIgnore = db.prepare(`
    INSERT OR IGNORE INTO gifts (id, name, name_uz, icon, category, price, effect_type, accent_color, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const dragonGifts = [
    ['gift-dragon-zepharion', 'Zepharion', 'Zepharion (Osmon ajdarhosi)', '🐉', 'LUXURY', 2500, 'fullscreen', '#f59e0b'],
    ['gift-dragon-nythera', 'Nythera', 'Nythera (Kosmik ajdarho)', '🐉', 'LUXURY', 8888, 'fullscreen', '#a855f7'],
    ['gift-dragon-valtor', 'Valtor', 'Valtor (Olov va lava ajdarhosi)', '🐉', 'LUXURY', 3500, 'fullscreen', '#ef4444'],
    ['gift-dragon-sylvanna', 'Sylvanna', 'Sylvanna (Tabiat ajdarhosi)', '🐉', 'LUXURY', 2200, 'fullscreen', '#10b981'],
    ['gift-dragon-thalassor', 'Thalassor', 'Thalassor (Dengiz ajdarhosi)', '🐉', 'LUXURY', 2800, 'fullscreen', '#06b6d4'],
    ['gift-dragon-umbra', 'Umbra', 'Umbra (Soya ajdarhosi)', '🐉', 'LUXURY', 4500, 'fullscreen', '#6366f1'],
    ['gift-dragon-auriel', 'Auriel', 'Auriel (Kristall ajdarhosi)', '🐉', 'LUXURY', 5200, 'fullscreen', '#eab308'],
    ['gift-dragon-drakthar', 'Drakthar', 'Drakthar (Bo‘ron ajdarhosi)', '🐉', 'LUXURY', 4200, 'fullscreen', '#3b82f6'],
    ['gift-dragon-morvaxis', 'Morvaxis', 'Morvaxis (Suyak ajdarhosi)', '🐉', 'LUXURY', 6666, 'fullscreen', '#94a3b8'],
    ['gift-dragon-xaldris', 'Xaldris', 'Xaldris (Elementlar ajdarhosi)', '🐉', 'LUXURY', 19999, 'fullscreen', '#ec4899'],
  ];
  for (const dg of dragonGifts) insGiftIgnore.run(...dg);

  // Ensure all 12 Animated Frames, 10 Dragon Rides, VIP 1-12 & Cosmic Bubble exist
  const insStoreIgnore = db.prepare(`
    INSERT OR IGNORE INTO store_items (id, type, code, name, name_uz, description_uz, price, duration_days, preview_style, vip_tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const extraStore = [
    ['st-af-bronze-3', 'FRAME', 'frame-bronze-3', 'Bronze #3', 'Bronza #3 G‘olib', 'Animatsiyali Bronza ramka', 800, 30, 'frame-bronze-3', 1],
    ['st-af-frost-2', 'FRAME', 'frame-frost-2', 'Frost #2', 'Muzli #2 Ritsar', 'Animatsiyali Muzli ramka', 1200, 30, 'frame-frost-2', 2],
    ['st-af-rose-3', 'FRAME', 'frame-rose-3', 'Rose Crystal', 'Atirgul Kristall', 'Animatsiyali Atirgul ramka', 1500, 30, 'frame-rose-3', 3],
    ['st-af-gold-1', 'FRAME', 'frame-gold-1', 'Royal Gold #1', 'Qirollik Oltin #1', 'Animatsiyali Oltin #1 ramka', 2200, 30, 'frame-gold-1', 4],
    ['st-af-golden-wings', 'FRAME', 'frame-golden-wings', 'Golden Wings', 'Oltin Qanotlar', 'Animatsiyali Qanotli ramka', 2800, 30, 'frame-golden-wings', 5],
    ['st-af-amethyst-spark', 'FRAME', 'frame-amethyst-spark', 'Amethyst Spark', 'Ametist Uchqun', 'Animatsiyali Ametist ramka', 3200, 30, 'frame-amethyst-spark', 6],
    ['st-af-crystal-violet', 'FRAME', 'frame-crystal-violet', 'Cosmic Violet', 'Kosmik Binafsha', 'Animatsiyali Kosmik ramka', 4000, 30, 'frame-crystal-violet', 7],
    ['st-af-emerald-crown', 'FRAME', 'frame-emerald-crown', 'Emerald Crown', 'Zumrad Olmos Toj', 'Animatsiyali Zumrad ramka', 4800, 30, 'frame-emerald-crown', 8],
    ['st-af-palace-gold', 'FRAME', 'frame-palace-gold', 'Palace Gold', 'Saroy Oltini', 'Animatsiyali Saroy ramkasi', 5500, 30, 'frame-palace-gold', 9],
    ['st-af-inferno-1', 'FRAME', 'frame-inferno-1', 'Inferno #1', 'Olovli #1 Chempion', 'Animatsiyali Olovli ramka', 6800, 30, 'frame-inferno-1', 10],
    ['st-af-violet-2', 'FRAME', 'frame-violet-2', 'Imperial Violet', 'Binafsha Imperator', 'Animatsiyali Imperator ramkasi', 8500, 30, 'frame-violet-2', 11],
    ['st-af-obsidian-gold', 'FRAME', 'frame-obsidian-gold', 'Divine XII', 'Kosmik Ilohiy XII', 'VIP 12 Ilohiy Kosmik ramka', 12000, 30, 'frame-obsidian-gold', 12],

    ['st-rd-horse', 'RIDE', 'ride-horse', 'Armored Horse', '🐎 Zirhli Ritsar Oti', 'VIP 5 kirish ulovi', 1800, 30, 'ride-horse', 5],
    ['st-rd-mecha', 'RIDE', 'ride-mecha', 'Mecha Dragon', '🦾 Mexa Ajdarho', 'VIP 6 kirish ulovi', 2800, 30, 'ride-mecha', 6],
    ['st-drg-zepharion', 'RIDE', 'ride-dragon-zepharion', 'Zepharion', '🐉 Zepharion (Osmon)', 'Bo‘ron va osmonni boshqarish', 6500, 30, 'ride-dragon-zepharion', 9],
    ['st-drg-nythera', 'RIDE', 'ride-dragon-nythera', 'Nythera', '🐉 Nythera (Kosmik)', 'Koinot energiyasi kirishi', 14500, 30, 'ride-dragon-nythera', 11],
    ['st-drg-valtor', 'RIDE', 'ride-dragon-valtor', 'Valtor', '🐉 Valtor (Olov)', 'Lava va olov kirishi', 8500, 30, 'ride-dragon-valtor', 10],
    ['st-drg-sylvanna', 'RIDE', 'ride-dragon-sylvanna', 'Sylvanna', '🐉 Sylvanna (Tabiat)', 'Hayot energiyasi kirishi', 5500, 30, 'ride-dragon-sylvanna', 0],
    ['st-drg-thalassor', 'RIDE', 'ride-dragon-thalassor', 'Thalassor', '🐉 Thalassor (Dengiz)', 'Okean to‘lqini kirishi', 6800, 30, 'ride-dragon-thalassor', 0],
    ['st-drg-umbra', 'RIDE', 'ride-dragon-umbra', 'Umbra', '🐉 Umbra (Soya)', 'Zulmat va soya kirishi', 9500, 30, 'ride-dragon-umbra', 0],
    ['st-drg-auriel', 'RIDE', 'ride-dragon-auriel', 'Auriel', '🐉 Auriel (Kristall)', 'Kristall nuri kirishi', 11000, 30, 'ride-dragon-auriel', 0],
    ['st-drg-drakthar', 'RIDE', 'ride-dragon-drakthar', 'Drakthar', '🐉 Drakthar (Bo‘ron)', 'Chaqmoq tezligi kirishi', 8900, 30, 'ride-dragon-drakthar', 0],
    ['st-drg-morvaxis', 'RIDE', 'ride-dragon-morvaxis', 'Morvaxis', '🐉 Morvaxis (Suyak)', 'Suyak zirhi kirishi', 12500, 30, 'ride-dragon-morvaxis', 0],
    ['st-drg-xaldris', 'RIDE', 'ride-dragon-xaldris', 'Xaldris', '🐉 Xaldris (Elementlar)', 'VIP 12 Ilohiy cheksiz kirish', 29999, 30, 'ride-dragon-xaldris', 12],

    ['st-bb-cosmic', 'BUBBLE', 'bubble-cosmic', 'Cosmic VIP Chat', 'Cheksiz Kosmik VIP Chat', 'VIP 11-12 kosmik chat pufagi', 4500, 30, 'bubble-cosmic', 11],

    ['st-vip-2', 'VIP', 'vip-2', 'VIP 2 Bronze', 'VIP 2 — Bronza II', 'Muzli ramka + 2-daraja kirish', 2000, 30, 'vip-2', 2],
    ['st-vip-4', 'VIP', 'vip-4', 'VIP 4 Gold', 'VIP 4 — Oltin Nur', 'Yaltiroq oltin ramka + animatsiyali chat', 5500, 30, 'vip-4', 4],
    ['st-vip-6', 'VIP', 'vip-6', 'VIP 6 Mecha', 'VIP 6 — Mexa VI', 'Mexa ajdarho + eksklyuziv sovg‘alar', 12000, 30, 'vip-6', 6],
    ['st-vip-7', 'VIP', 'vip-7', 'VIP 7 Diamond', 'VIP 7 — Olmos VII', 'Lyuks avto + maxsus profil + Ring Effect', 18000, 30, 'vip-7', 7],
    ['st-vip-8', 'VIP', 'vip-8', 'VIP 8 Diamond', 'VIP 8 — Olmos VIII', 'Zumrad olmos ramka + Ring Effect', 25000, 30, 'vip-8', 8],
    ['st-vip-9', 'VIP', 'vip-9', 'VIP 9 Diamond G.', 'VIP 9 — Olmos Oltin IX', 'Zepharion kirishi + xona animatsiyasi', 35000, 30, 'vip-9', 9],
    ['st-vip-10', 'VIP', 'vip-10', 'VIP 10 Diamond G.', 'VIP 10 — Olmos Oltin X', 'Valtor olov animatsiyasi + Olovli #1 ramka', 50000, 30, 'vip-10', 10],
    ['st-vip-11', 'VIP', 'vip-11', 'VIP 11 Cosmic', 'VIP 11 — Kosmik XI', 'Nythera kosmik transformatsiya + cheksiz chat', 75000, 30, 'vip-11', 11],
    ['st-vip-12', 'VIP', 'vip-12', 'VIP 12 Divine', 'VIP 12 — Ilohiy Kosmik XII', 'VIP 12 Ilohiy xona kirishi + Xaldris', 120000, 30, 'vip-12', 12],
  ];
  for (const st of extraStore) insStoreIgnore.run(...st);
}

export function seedDatabase(): void {
  const existingUsers = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existingUsers && Number(existingUsers.c) > 0) {
    // Upgrade legacy cartoon DiceBear avatars & CSS/.png covers on existing demo records to studio photography (.jpg)
    for (const [uname, avatarPath] of Object.entries(DEMO_AVATAR_UPGRADES)) {
      db.prepare("UPDATE users SET avatar = ? WHERE username = ? AND (avatar LIKE '%dicebear%' OR avatar LIKE '%.png')").run(
        avatarPath,
        uname
      );
    }
    for (const [roomId, coverPath] of Object.entries(DEMO_ROOM_COVER_UPGRADES)) {
      db.prepare("UPDATE rooms SET cover = ? WHERE id = ? AND (cover LIKE 'linear-gradient%' OR cover LIKE '%.png')").run(
        coverPath,
        roomId
      );
    }
    seedExtras();
    return;
  }

  const now = new Date().toISOString();
  const passHash = bcrypt.hashSync('123456', 8);

  const adminId = 'usr-admin-01';
  const agencyOwnerId = 'usr-agency-01';
  const host1Id = 'usr-host-01';
  const host2Id = 'usr-host-02';
  const host3Id = 'usr-host-03';
  const host4Id = 'usr-host-04';
  const demoUserId = 'usr-demo-01';

  const agency1Id = 'agn-zora-01';
  const agency2Id = 'agn-tash-02';

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, uid, username, display_name, password_hash, avatar, bio, country, gender,
      role, coins, diamonds, wealth_xp, charm_xp, vip_level, active_frame, active_ride,
      active_bubble, agency_id, is_demo, hosted_minutes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    adminId, 100001, 'admin', 'Zora Super Admin', passHash,
    '/assets/avatar-abrorbek.jpg',
    'Platforma boshqaruvchisi', 'UZ', 'male', 'ADMIN',
    250000, 12000, 48000, 15000, 5, 'frame-imperial', 'ride-dragon', 'bubble-gold',
    null, 1, 320, now
  );

  insertUser.run(
    agencyOwnerId, 100002, 'silkroad', 'Abrorbek (Agency)', passHash,
    '/assets/avatar-abrorbek.jpg',
    'Zora Star Agency rahbari • Hostlarni ishga olamiz!', 'UZ', 'male', 'AGENCY',
    45000, 28500, 29500, 18000, 4, 'frame-cyber', 'ride-lambo', 'bubble-neon',
    agency1Id, 1, 840, now
  );

  insertUser.run(
    host1Id, 100003, 'madina_live', 'Madina Star ✨', passHash,
    '/assets/avatar-madina.jpg',
    'Har oqshom jonli qo‘shiqlar va ovozli party 🎤🎶', 'UZ', 'female', 'HOST',
    12800, 34200, 9400, 62000, 3, 'frame-rose', 'ride-unicorn', 'bubble-rose',
    agency1Id, 1, 1460, now
  );

  insertUser.run(
    host2Id, 100004, 'jasur_pk', 'Jasur Beats 🔥', passHash,
    '/assets/avatar-jasur.jpg',
    'PK Battle qiroli! Kim challengga tayyor? ⚡', 'UZ', 'male', 'HOST',
    19400, 26800, 16500, 48000, 3, 'frame-fire', 'ride-jet', 'bubble-neon',
    agency1Id, 1, 1120, now
  );

  insertUser.run(
    host3Id, 100005, 'laylo_voice', 'Laylo & Friends 🌙', passHash,
    '/assets/avatar-laylo.jpg',
    'Toshkent kechalari — suhbat, kulgu va Ludo 🎲', 'UZ', 'female', 'HOST',
    8600, 19400, 6200, 33000, 2, 'frame-cyber', '', 'bubble-rose',
    agency2Id, 1, 980, now
  );

  insertUser.run(
    host4Id, 100006, 'sardor_game', 'Sardor Ludo King 👑', passHash,
    '/assets/avatar-sardor.jpg',
    'Ludo va Lucky Wheel chempionati har kuni!', 'UZ', 'male', 'HOST',
    22000, 15200, 21000, 24000, 2, 'frame-gold', 'ride-lambo', 'bubble-gold',
    agency2Id, 1, 760, now
  );

  insertUser.run(
    demoUserId, 100007, 'mehmon', 'Azizbek VIP', passHash,
    '/assets/avatar-azizbek.jpg',
    'ZoraLive faol ishtirokchisi 🎧', 'UZ', 'male', 'USER',
    15000, 1200, 4200, 1600, 1, 'frame-cyber', 'ride-lambo', 'bubble-neon',
    null, 1, 45, now
  );

  // Agencies
  const insertAgency = db.prepare(`
    INSERT INTO agencies (id, code, name, owner_id, commission_rate, total_earned, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAgency.run(agency1Id, 'ZORA77', 'Zora Star Agency', agencyOwnerId, 0.1, 14800, now);
  insertAgency.run(agency2Id, 'TASH01', 'Toshkent Prime Live', host4Id, 0.1, 8900, now);

  // Rooms
  const insertRoom = db.prepare(`
    INSERT INTO rooms (
      id, room_number, host_id, title, type, theme, cover, country, seat_count,
      is_live, is_featured, total_gifts, viewer_boost, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  insertRoom.run(
    'room-voice-01', 8801, host1Id,
    'Toshkent Kechalari 🎤 Ovozli Party & Tanishuv', 'VOICE', 'galaxy',
    '/assets/stage-galaxy.jpg', 'UZ', 8, 1, 128400, 142, now
  );
  insertRoom.run(
    'room-video-01', 8802, host2Id,
    '🔥 JONLI PK BATTLE: Kim g‘olib bo‘ladi?', 'VIDEO', 'gold',
    '/assets/stage-palace.jpg', 'UZ', 4, 1, 96200, 218, now
  );
  insertRoom.run(
    'room-voice-02', 8803, host3Id,
    '🌙 Suhbat, Musiqa va Tungi Xona (8 Mic)', 'VOICE', 'ocean',
    '/assets/stage-ocean.jpg', 'UZ', 8, 1, 54300, 89, now
  );
  insertRoom.run(
    'room-game-01', 8804, host4Id,
    '🎲 LUDO & LUCKY WHEEL Turnir Xonasi', 'GAME', 'neon',
    '/assets/stage-neon.jpg', 'UZ', 8, 1, 71800, 114, now
  );
  insertRoom.run(
    'room-video-02', 8805, agencyOwnerId,
    '💼 Yangi Hostlar uchun Jonli Savol-Javob (Agency)', 'VIDEO', 'galaxy',
    '/assets/stage-galaxy.jpg', 'UZ', 4, 0, 32100, 64, now
  );

  // Gifts Catalog
  const insertGift = db.prepare(`
    INSERT INTO gifts (id, name, name_uz, icon, category, price, effect_type, accent_color, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const gifts = [
    ['gift-rose', 'Rose', 'Atirgul', '🌹', 'BASIC', 10, 'pulse', '#f43f5e'],
    ['gift-coffee', 'Coffee', 'Qahva', '☕', 'BASIC', 25, 'pulse', '#d97706'],
    ['gift-heart', 'Neon Heart', 'Neon Yurak', '💖', 'BASIC', 50, 'burst', '#ec4899'],
    ['gift-mic', 'Golden Mic', 'Oltin Mikrofon', '🎤', 'BASIC', 99, 'burst', '#eab308'],
    ['gift-clover', 'Lucky Clover', 'Omad Bargi', '🍀', 'LUCKY', 150, 'burst', '#10b981'],
    ['gift-dice', 'Magic Dice', 'Sehrli Zarik', '🎲', 'LUCKY', 300, 'banner', '#8b5cf6'],
    ['gift-ring', 'Diamond Ring', 'Olmos Uzuk', '💍', 'LUCKY', 520, 'banner', '#38bdf8'],
    ['gift-crown', 'Royal Crown', 'Qirol Toji', '👑', 'LUXURY', 999, 'fullscreen', '#facc15'],
    ['gift-car', 'Hypercar', 'Sport Mashina', '🏎️', 'LUXURY', 1999, 'fullscreen', '#ef4444'],
    ['gift-yacht', 'Luxury Yacht', 'Oltin Yaxta', '🛥️', 'LUXURY', 4999, 'fullscreen', '#06b6d4'],
    ['gift-jet', 'Private Jet', 'Shaxsiy Samolyot', '✈️', 'LUXURY', 9999, 'fullscreen', '#6366f1'],
    ['gift-dragon', 'Golden Dragon', 'Oltin Ajdarho', '🐉', 'LUXURY', 19999, 'fullscreen', '#f59e0b'],
  ];
  for (const g of gifts) insertGift.run(...g);

  // Store Items (Frames, Rides, Bubbles, VIP)
  const insertStore = db.prepare(`
    INSERT INTO store_items (id, type, code, name, name_uz, description_uz, price, duration_days, preview_style, vip_tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const storeItems = [
    ['st-fr-cyber', 'FRAME', 'frame-cyber', 'Cyber Cyan', 'Kiber Neon Ramka', 'Moviy neon yorqin aylanuvchi avatar ramkasi', 600, 30, 'ring-cyan', 0],
    ['st-fr-rose', 'FRAME', 'frame-rose', 'Rose Blossom', 'Atirgul Ramka', 'Pushti gulbargli nafis avatar ramkasi', 800, 30, 'ring-rose', 0],
    ['st-fr-fire', 'FRAME', 'frame-fire', 'Inferno Flame', 'Olovli Ramka', 'PK jangchilari uchun olovli oltin ramka', 1200, 30, 'ring-fire', 0],
    ['st-fr-gold', 'FRAME', 'frame-gold', 'Royal Gold', 'Qirollik Oltini', 'Yaltiroq tilla rangli hashamatli ramka', 1800, 30, 'ring-gold', 0],
    ['st-fr-imperial', 'FRAME', 'frame-imperial', 'Imperial SVIP', 'Imperator Ramkasi', 'Eng yuqori darajadagi olmos va oltin ramka', 3500, 30, 'ring-imperial', 0],

    ['st-rd-lambo', 'RIDE', 'ride-lambo', 'Neon Supercar', '🏎️ Neon Sportkar', 'Xonaga kirganda sport mashina banneri chiqadi', 1500, 30, 'ride-lambo', 0],
    ['st-rd-unicorn', 'RIDE', 'ride-unicorn', 'Crystal Pegasus', '🦄 Yulduzli Pegas', 'Xonaga kirganda yulduzli sehrli kirish effekti', 2200, 30, 'ride-unicorn', 0],
    ['st-rd-jet', 'RIDE', 'ride-jet', 'Supersonic Jet', '✈️ Shaxsiy Layner', 'Butun xonaga ko‘rinadigan samolyot kirish banneri', 4000, 30, 'ride-jet', 0],
    ['st-rd-dragon', 'RIDE', 'ride-dragon', 'Golden Dragon', '🐉 Oltin Ajdarho', 'Afsonaviy imperator kirish animatsiyasi', 7500, 30, 'ride-dragon', 0],

    ['st-bb-neon', 'BUBBLE', 'bubble-neon', 'Cyber Chat', 'Neon Chat Pufagi', 'Xona chatida moviy neon fon bilan ajralib turing', 450, 30, 'bubble-neon', 0],
    ['st-bb-rose', 'BUBBLE', 'bubble-rose', 'Velvet Rose', 'Pushti Chat Pufagi', 'Nafis pushti gradient chat xabarlari', 550, 30, 'bubble-rose', 0],
    ['st-bb-gold', 'BUBBLE', 'bubble-gold', 'Royal Gold Chat', 'Oltin VIP Chat', 'Qirollik tilla ramkali chat xabarlari', 1200, 30, 'bubble-gold', 0],

    ['st-vip-1', 'VIP', 'vip-1', 'VIP 1 Silver', 'VIP 1 — Kumush', 'VIP nishon + kunlik bonus + xonada alohida ajralib turish', 1500, 30, 'vip-1', 1],
    ['st-vip-3', 'VIP', 'vip-3', 'VIP 3 Gold', 'VIP 3 — Oltin', 'VIP 3 nishon + kirish banneri + ustuvor mikrofon', 4500, 30, 'vip-3', 3],
    ['st-vip-5', 'VIP', 'vip-5', 'SVIP 5 Imperator', 'SVIP 5 — Imperator', 'Eng yuqori SVIP status + barcha eksklyuziv imtiyozlar', 12000, 30, 'vip-5', 5],
  ];
  for (const item of storeItems) insertStore.run(...item);

  const exp30 = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
  const invStmt = db.prepare(`
    INSERT INTO user_inventory (id, user_id, item_id, item_type, item_code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  invStmt.run(uuid(), demoUserId, 'st-fr-cyber', 'FRAME', 'frame-cyber', exp30, now);
  invStmt.run(uuid(), demoUserId, 'st-rd-lambo', 'RIDE', 'ride-lambo', exp30, now);
  invStmt.run(uuid(), demoUserId, 'st-bb-neon', 'BUBBLE', 'bubble-neon', exp30, now);

  const fStmt = db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)');
  fStmt.run(demoUserId, host1Id, now);
  fStmt.run(demoUserId, host2Id, now);
  fStmt.run(host1Id, demoUserId, now);

  db.prepare(
    `INSERT INTO direct_messages (id, sender_id, receiver_id, content, msg_type, created_at)
     VALUES (?, ?, ?, ?, 'TEXT', ?)`
  ).run(uuid(), host1Id, demoUserId, 'Salom! ZoraLive’ga xush kelibsiz 🎉 Kechki ovozli xonamizga kiring!', now);

  db.prepare(
    `INSERT INTO payout_requests (id, user_id, diamonds_amount, usd_amount, method, destination, kyc_full_name, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
  ).run(uuid(), host1Id, 5000, 50.0, 'USDT_TRC20', 'TY7k9x...92mP4', 'Madina Karimova', now);

  db.prepare(
    `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, created_at)
     VALUES (?, ?, 'COINS', 15000, 15000, 'TOPUP', 'Xush kelibsiz start balansi', ?)`
  ).run(uuid(), demoUserId, now);

  seedExtras();
}
