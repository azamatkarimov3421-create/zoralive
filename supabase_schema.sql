-- ==============================================================================
-- ZORALIVE SUPABASE TO'LIQ BAZA TUZILISHI (SCHEMA + SEED)
-- Ushbu skriptni Supabase SQL Editor bo'limiga tashlab, "Run" tugmasini bosing!
-- ==============================================================================

-- 1. PROFILES (Foydalanuvchilar va Hamyon)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- auth.users(id) yoki maxsus ID
  uid BIGINT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '/assets/avatar-abrorbek.jpg',
  bio TEXT DEFAULT 'ZoraLive VIP a’zosi',
  country TEXT DEFAULT 'UZ',
  gender TEXT DEFAULT 'male',
  role TEXT DEFAULT 'USER',
  coins BIGINT DEFAULT 50000,
  diamonds BIGINT DEFAULT 4200,
  world_gem BIGINT DEFAULT 465,
  vip_level INTEGER DEFAULT 12,
  rank_level INTEGER DEFAULT 6,
  active_frame TEXT DEFAULT 'frame-gold-1',
  active_ride TEXT DEFAULT 'ride-dragon-xaldris',
  active_bubble TEXT DEFAULT 'bubble-cosmic',
  followers_count INTEGER DEFAULT 340,
  following_count INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SOVG'ALAR KATALOGI (Gifts Catalog)
CREATE TABLE IF NOT EXISTS public.gifts_catalog (
  id TEXT PRIMARY KEY,
  name_uz TEXT NOT NULL,
  price_coins BIGINT NOT NULL,
  diamonds_award BIGINT NOT NULL,
  icon_url TEXT NOT NULL,
  animation_type TEXT DEFAULT 'standard', -- standard, dragon_3d, cinematic, fullscreen
  vip_min INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JONLI EFIR XONALARI (Live Rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Suhbat va Jonli Efir',
  cover_image TEXT,
  is_live BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 1,
  total_diamonds BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JONLI CHAT VA SOVG'ALAR XABARLARI (Room Messages)
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  vip_level INTEGER DEFAULT 0,
  badge TEXT DEFAULT '',
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'CHAT', -- CHAT, GIFT, SYSTEM, JOIN, PK
  gift_id TEXT REFERENCES public.gifts_catalog(id),
  gift_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOVG'A TRANZAKSIYALARI
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES public.rooms(id),
  sender_id TEXT REFERENCES public.profiles(id),
  receiver_id TEXT REFERENCES public.profiles(id),
  gift_id TEXT REFERENCES public.gifts_catalog(id),
  gift_count INTEGER DEFAULT 1,
  total_coins BIGINT NOT NULL,
  total_diamonds BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVENTAR (Sotib olingan ramka, ajdarho va bezaklar)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_code TEXT NOT NULL,
  is_equipped BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OILA VA KLANLAR
CREATE TABLE IF NOT EXISTS public.families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  badge TEXT DEFAULT '👑',
  owner_id TEXT REFERENCES public.profiles(id),
  member_count INTEGER DEFAULT 1,
  level INTEGER DEFAULT 1,
  total_diamonds BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- DASTLABKI MA'LUMOTLARNI JOYLASH (SEED DATA)
-- ==============================================================================

-- Boshlang'ich Foydalanuvchilar (Abrorbek VIP va Madina Host)
INSERT INTO public.profiles (id, uid, username, display_name, avatar, bio, coins, diamonds, vip_level, rank_level, active_frame, active_ride)
VALUES 
  ('user_vip_1', 100888, 'vip_abrorbek', 'Abrorbek (VIP)', '/assets/avatar-abrorbek.jpg', 'ZoraLive VIP foydalanuvchisi. Live suhbat, Ajdarholar va Ludo o‘yinlari!', 50000, 4200, 12, 6, 'frame-gold-1', 'ride-dragon-xaldris'),
  ('user_host_1', 100222, 'madina_live', 'Madina 🎵', '/assets/avatar-madina.jpg', 'Har kuni 20:00 da jonli gitara va qo‘shiqlar!', 18500, 34200, 10, 4, 'frame-inferno-1', 'ride-dragon-valtor')
ON CONFLICT (id) DO NOTHING;

-- Sovg'alar katalogi
INSERT INTO public.gifts_catalog (id, name_uz, price_coins, diamonds_award, icon_url, animation_type, vip_min)
VALUES
  ('gift_rose', 'Atirgul 🌹', 10, 5, '/assets/gift-rose.jpg', 'standard', 0),
  ('gift_heart', 'Yurak 💖', 50, 25, '/assets/gift-heart.jpg', 'standard', 0),
  ('gift_ring', 'Olmos Uzuk 💍', 500, 250, '/assets/gift-ring.jpg', 'standard', 1),
  ('gift_crown', 'Shohona Toj 👑', 2500, 1250, '/assets/gift-crown.jpg', 'fullscreen', 4),
  ('gift_car', 'Sport Avto 🏎️', 5000, 2500, '/assets/gift-car.jpg', 'fullscreen', 6),
  ('gift_yacht', 'Katta Yaxta 🛥️', 10000, 5000, '/assets/gift-yacht.jpg', 'fullscreen', 8),
  ('gift_dragon', 'Zepharion Osmon Ajdarhosi 🐉', 35000, 17500, '/assets/gift-dragon.jpg', 'dragon_3d', 9),
  ('gift_xaldris', 'Xaldris Elementlar Ajdarhosi 🐲', 75000, 37500, '/assets/gift-dragon.jpg', 'cinematic', 12)
ON CONFLICT (id) DO NOTHING;

-- Jonli Efir Xonalari
INSERT INTO public.rooms (id, host_id, title, category, cover_image, is_live, viewer_count, total_diamonds)
VALUES
  ('room_madina', 'user_host_1', 'Gitara Kechasi & Shirin Suhbat 🎵✨', 'Musiqa va Suhbat', '/assets/avatar-madina.jpg', true, 142, 12800)
ON CONFLICT (id) DO NOTHING;

-- Oila / Klanlar
INSERT INTO public.families (id, name, tag, badge, owner_id, member_count, level, total_diamonds)
VALUES
  ('clan_sherlar', 'Sherlar Imperiyasi', 'SHER', '🦁', 'user_vip_1', 48, 5, 2450000)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- REALTIME YOQISH
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;

-- ==============================================================================
-- XAVFSIZLIK QOIDALARI (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public read on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public all on room_messages" ON public.room_messages FOR ALL USING (true);
CREATE POLICY "Allow public read on gifts_catalog" ON public.gifts_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public all on gift_transactions" ON public.gift_transactions FOR ALL USING (true);
CREATE POLICY "Allow public all on inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow public read on families" ON public.families FOR SELECT USING (true);
