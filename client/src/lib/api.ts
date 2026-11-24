import { DEMO_USERS, MOCK_FAMILIES, MOCK_GIFTS, MOCK_MOMENTS, MOCK_ROOMS } from './mockData';
import { ANIMATED_FRAMES, MYTHIC_DRAGONS, VIP_LEVELS_1_TO_12 } from './mythicCatalog';
import {
  syncProfileToSupabase,
  fetchAllProfilesFromSupabase,
  fetchRoomsFromSupabase,
  createRoomInSupabase,
  closeRoomInSupabase,
  fetchGiftsFromSupabase,
  fetchFamiliesFromSupabase,
  createFamilyInSupabase,
} from './supabaseSync';
import { RoomSummary, User } from '../types';

const TOKEN_KEY = 'zoralive_token';
const USER_KEY = 'zoralive_user';
const OWNED_KEY = 'zoralive_owned_codes';
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function getOwnedCodes(): string[] {
  const u = getStoredUser();
  const key = u?.id ? `${OWNED_KEY}_${u.id}` : OWNED_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      const base = new Set(parsed);
      if (u?.activeFrame) base.add(u.activeFrame);
      if (u?.activeRide) base.add(u.activeRide);
      if (u?.activeBubble) base.add(u.activeBubble);
      return Array.from(base);
    }
  } catch {
    // ignore
  }
  const initial = new Set<string>();
  if (u?.activeFrame) initial.add(u.activeFrame);
  if (u?.activeRide) initial.add(u.activeRide);
  if (u?.activeBubble) initial.add(u.activeBubble);
  return Array.from(initial);
}

function addOwnedCode(code: string): void {
  if (!code) return;
  const u = getStoredUser();
  const key = u?.id ? `${OWNED_KEY}_${u.id}` : OWNED_KEY;
  const set = new Set(getOwnedCodes());
  set.add(code);
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

const WHEEL_SECTORS = [
  { id: 's1', label: '0.5x', icon: '🍀', multiplier: 0.5, color: '#64748b' },
  { id: 's2', label: '1.5x', icon: '🪙', multiplier: 1.5, color: '#0ea5e9' },
  { id: 's3', label: '2x', icon: '💎', multiplier: 2, color: '#10b981' },
  { id: 's4', label: '0x', icon: '💨', multiplier: 0, color: '#334155' },
  { id: 's5', label: '3x', icon: '🔥', multiplier: 3, color: '#f97316' },
  { id: 's6', label: '5x', icon: '👑', multiplier: 5, color: '#eab308' },
  { id: 's7', label: '1.2x', icon: '⭐', multiplier: 1.2, color: '#8b5cf6' },
  { id: 's8', label: '10x', icon: '🐉', multiplier: 10, color: '#ff3366' },
];

// In-memory state for client mock & local offline database
const LOCAL_DB_KEY = 'zoralive_local_database_v2';

let mockRooms: RoomSummary[] = [...MOCK_ROOMS];
let mockMoments = [...MOCK_MOMENTS];
let mockFamilies = [...MOCK_FAMILIES];
let mockMyFamilyId: string | null = 'clan_sherlar';
let mockLedger: Array<{ id: string; currency: string; amount: number; description: string; created_at: string }> = [
  { id: 'tx1', currency: 'COINS', amount: 50000, description: 'VIP Start Balansi', created_at: new Date().toISOString() },
  { id: 'tx2', currency: 'COINS', amount: -2500, description: 'Sovg‘a: Zepharion', created_at: new Date().toISOString() },
];
let mockClaimedTasks = new Set<string>(['t4']);
let mockWheelRecent = [
  { id: 'w1', display_name: 'Laylo 🌙', bet_amount: 100, sector_label: '5x', multiplier: 5, win_amount: 500 },
  { id: 'w2', display_name: 'Sardor Prime', bet_amount: 500, sector_label: '10x', multiplier: 10, win_amount: 5000 },
];
let mockFollows = new Set<string>(['user_host_1', 'user_admin_1']);
let mockComments: Record<string, any[]> = {
  m1: [
    { id: 'c1', display_name: 'Laylo 🌙', content: 'Valtor olov effekti dahshat chiqdi! 🔥🐉' },
    { id: 'c2', display_name: 'Sardor Prime', content: 'Zo‘r efir bo‘ldi!' },
  ],
  m2: [{ id: 'c3', display_name: 'Madina 🎵', content: 'VIP 12 muborak bo‘lsin! 👑✨' }],
};

export function loadLocalDb() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.rooms)) mockRooms = data.rooms;
      if (Array.isArray(data.moments)) mockMoments = data.moments;
      if (Array.isArray(data.families)) mockFamilies = data.families;
      if (Array.isArray(data.ledger)) mockLedger = data.ledger;
      if (data.myFamilyId !== undefined) mockMyFamilyId = data.myFamilyId;
      if (Array.isArray(data.claimedTasks)) mockClaimedTasks = new Set(data.claimedTasks);
      if (Array.isArray(data.follows)) mockFollows = new Set(data.follows);
      if (data.comments) mockComments = data.comments;
    }
  } catch (e) {
    console.warn('Failed to load local DB:', e);
  }
}

export function saveLocalDb() {
  try {
    const data = {
      rooms: mockRooms,
      moments: mockMoments,
      families: mockFamilies,
      ledger: mockLedger,
      myFamilyId: mockMyFamilyId,
      claimedTasks: Array.from(mockClaimedTasks),
      follows: Array.from(mockFollows),
      comments: mockComments,
    };
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save local DB:', e);
  }
}

if (typeof window !== 'undefined') {
  loadLocalDb();
  // Live Supabase initialization: fetch live rooms and families
  fetchRoomsFromSupabase().then((rooms) => {
    if (rooms && rooms.length) mockRooms = rooms;
  });
  fetchFamiliesFromSupabase().then((fams) => {
    if (fams && fams.length) {
      mockFamilies = fams.map((f: any) => ({
        id: f.id,
        tag: f.tag,
        name: f.name,
        badge: f.badge || '👑',
        level: Number(f.level) || 1,
        member_count: Number(f.member_count) || 1,
        honor_xp: 1000,
        leader_name: f.profiles?.display_name || 'Lider',
        members: [],
      }));
    }
  });
}

function buildMockStoreItems() {
  const owned = new Set(getOwnedCodes());
  return [
    // 12 Animated Frames
    ...ANIMATED_FRAMES.map((f) => ({
      id: f.id,
      type: 'FRAME',
      code: f.code,
      name: f.nameUz,
      name_uz: f.nameUz,
      price: f.price,
      vip_tier: f.vipTier || 0,
      owned: owned.has(f.code),
    })),
    // Classic Rides + VIP 5-8 Riders + All 10 Dragon Rides
    { id: 'st-rd-horse', type: 'RIDE', code: 'ride-horse', name_uz: '🐎 Zirhli Ritsar Oti (VIP 5)', price: 1800, vip_tier: 5, owned: owned.has('ride-horse'), image: '/assets/gift-crown.jpg' },
    { id: 'st-rd-mecha', type: 'RIDE', code: 'ride-mecha', name_uz: '🦾 Mexa Ajdarho (VIP 6)', price: 2800, vip_tier: 6, owned: owned.has('ride-mecha'), image: '/assets/gift-dragon.jpg' },
    { id: 'st-rd-lambo', type: 'RIDE', code: 'ride-lambo', name_uz: '🏎️ Lyuks Sport Avto (VIP 7)', price: 3500, vip_tier: 7, owned: owned.has('ride-lambo'), image: '/assets/gift-car.jpg' },
    { id: 'st-rd-jet', type: 'RIDE', code: 'ride-jet', name_uz: '✈️ Shaxsiy Layner (VIP 8)', price: 4800, vip_tier: 8, owned: owned.has('ride-jet'), image: '/assets/gift-yacht.jpg' },
    ...MYTHIC_DRAGONS.map((d) => ({
      id: `st-drg-${d.id}`,
      type: 'RIDE',
      code: d.rideCode,
      name_uz: `🐉 ${d.name} (${d.titleUz})`,
      price: d.ridePrice,
      vip_tier: d.vipUnlock || 0,
      owned: owned.has(d.rideCode),
      image: d.image,
    })),
    // Chat Bubbles
    { id: 'st-bb-neon', type: 'BUBBLE', code: 'bubble-neon', name_uz: 'Neon Chat Pufagi', price: 450, vip_tier: 1, owned: owned.has('bubble-neon') },
    { id: 'st-bb-rose', type: 'BUBBLE', code: 'bubble-rose', name_uz: 'Pushti Chat Pufagi', price: 650, vip_tier: 3, owned: owned.has('bubble-rose') },
    { id: 'st-bb-gold', type: 'BUBBLE', code: 'bubble-gold', name_uz: 'Oltin Animatsiyali Chat', price: 1200, vip_tier: 4, owned: owned.has('bubble-gold') },
    { id: 'st-bb-cosmic', type: 'BUBBLE', code: 'bubble-cosmic', name_uz: 'Cheksiz Kosmik VIP Chat', price: 4500, vip_tier: 11, owned: owned.has('bubble-cosmic') },
    // VIP 1-12
    ...VIP_LEVELS_1_TO_12.map((v) => ({
      id: `st-vip-${v.level}`,
      type: 'VIP',
      code: `vip-${v.level}`,
      name_uz: `VIP ${v.level} — ${v.tierName}`,
      price: v.price,
      vip_tier: v.level,
      owned: false,
    })),
  ];
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const isCapacitor =
    typeof window !== 'undefined' &&
    (Boolean((window as any).Capacitor) ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && !window.location.port));

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If inside Capacitor on Android/iOS without remote backend, or offline:
  // immediately serve fast local database with 0ms latency for buttery-smooth 60fps performance!
  if (isCapacitor && !API_BASE) {
    return handleMockRequest<T>(cleanPath, options);
  }

  // If deployed remotely (Vercel) without external backend, immediately serve fast mock
  if (!API_BASE && !isLocal) {
    return handleMockRequest<T>(cleanPath, options);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const targetUrl = API_BASE ? `${API_BASE}/api${cleanPath}` : `/api${cleanPath}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data as T;
    }
  } catch {
    // Network error, 404/405/500, or timeout - proceed to mock
  }

  return await handleMockRequest<T>(cleanPath, options);
}

async function handleMockRequest<T>(rawPath: string, options: RequestInit): Promise<T> {
  const result = await executeMockRequest<T>(rawPath, options);
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    saveLocalDb();
  }
  return result;
}

async function executeMockRequest<T>(rawPath: string, options: RequestInit): Promise<T> {
  const [path, queryStr] = rawPath.split('?');
  const params = new URLSearchParams(queryStr || '');
  const method = (options.method || 'GET').toUpperCase();
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  const currentUser: User = getStoredUser() || { ...DEMO_USERS.user };

  // 1. Auth routes
  if (path === '/auth/me') {
    return { user: currentUser } as unknown as T;
  }

  if (path === '/auth/login' || path === '/auth/register') {
    const username = (body.username || 'foydalanuvchi').trim();
    const uid = Math.floor(Math.random() * 800000) + 100000;
    const newUser: User = {
      id: `user_${Date.now()}`,
      uid,
      username: username.toLowerCase(),
      displayName: (body.displayName || username).trim(),
      avatar: '',
      bio: 'ZoraLive a’zosi',
      country: 'UZ',
      gender: 'other',
      role: 'USER',
      coins: 5000,
      diamonds: 0,
      wealthXp: 200,
      charmXp: 0,
      wealthLevel: 1,
      wealthProgress: 13,
      wealthNextXp: 1500,
      charmLevel: 1,
      charmProgress: 0,
      charmNextXp: 1200,
      vipLevel: 0,
      vipExpiresAt: null,
      activeFrame: '',
      activeRide: '',
      activeBubble: '',
      agencyId: null,
      isBanned: false,
      hostedMinutes: 0,
      followersCount: 0,
      followingCount: 0,
    };
    setStoredUser(newUser);
    setToken(newUser.id);
    return { token: newUser.id, user: newUser } as unknown as T;
  }

  if (path === '/auth/demo') {
    const preset = (body.preset || 'user') as keyof typeof DEMO_USERS;
    const selected = { ...(DEMO_USERS[preset] || DEMO_USERS.user) };
    setStoredUser(selected);
    setToken(`demo_token_${preset}`);
    return { token: `demo_token_${preset}`, user: selected } as unknown as T;
  }

  // 2. Rooms
  if (path.startsWith('/rooms')) {
    if (path === '/rooms' && method === 'POST') {
      const newRoom: RoomSummary = {
        id: `room_${Date.now()}`,
        roomNumber: Math.floor(Math.random() * 8000) + 1000,
        title: body.title || 'Yangi Ovozli Xona',
        type: body.type === 'VIDEO' ? 'VIDEO' : body.type === 'GAME' ? 'GAME' : 'VOICE',
        theme: body.theme || 'gold',
        cover: '/assets/stage-palace.jpg',
        country: 'UZ',
        hostId: currentUser.id,
        hostName: currentUser.displayName,
        hostAvatar: currentUser.avatar,
        hostFrame: currentUser.activeFrame || '',
        hostVip: currentUser.vipLevel || 0,
        hostUid: currentUser.uid || 100888,
        seatCount: body.seatCount || 8,
        isLive: true,
        isFeatured: true,
        totalGifts: 0,
        viewerCount: 1,
        hasPk: false,
        occupiedSeats: 1,
      };
      mockRooms.unshift(newRoom);
      createRoomInSupabase(currentUser, newRoom.title, newRoom.type, newRoom.id);
      return { room: newRoom } as unknown as T;
    }

    if (path.endsWith('/close')) {
      const m = path.match(/^\/rooms\/([^/?]+)\/close$/);
      if (m?.[1]) {
        mockRooms = mockRooms.filter((r) => r.id !== m[1]);
        closeRoomInSupabase(m[1]);
      }
      return { ok: true } as unknown as T;
    }

    if (path.endsWith('/report')) {
      return { ok: true } as unknown as T;
    }

    const roomIdMatch = path.match(/^\/rooms\/([^/?]+)/);
    if (roomIdMatch) {
      const rId = roomIdMatch[1];
      const found = mockRooms.find((r) => r.id === rId) || mockRooms[0];
      return {
        room: {
          ...found,
          notice: `Xush kelibsiz! ${found.title} — sovg‘alar va jonli suhbatlar 🐉✨`,
          isFollowing: mockFollows.has(found.hostId),
          host: {
            id: found.hostId,
            displayName: found.hostName,
            avatar: found.hostAvatar,
            activeFrame: found.hostFrame,
            vipLevel: found.hostVip,
          },
        },
      } as unknown as T;
    }

    const typeFilter = params.get('type');
    const q = (params.get('q') || '').toLowerCase().trim();
    const onlyFollowing = params.get('following') === '1';

    const supaRooms = await fetchRoomsFromSupabase();
    let list = supaRooms && supaRooms.length > 0 ? supaRooms : [...mockRooms];
    if (onlyFollowing) list = list.filter((r) => mockFollows.has(r.hostId));
    else if (typeFilter && typeFilter !== 'ALL') list = list.filter((r) => r.type === typeFilter);
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.hostName.toLowerCase().includes(q) ||
          String(r.roomNumber).includes(q)
      );
    }
    return { rooms: list } as unknown as T;
  }

  // 3. Store & Gifts
  if (path === '/store/gifts') {
    const liveGifts = await fetchGiftsFromSupabase();
    if (liveGifts && liveGifts.length > 0) {
      return { gifts: liveGifts } as unknown as T;
    }
    return { gifts: MOCK_GIFTS } as unknown as T;
  }

  if (path === '/store/items') {
    return { items: buildMockStoreItems() } as unknown as T;
  }

  if (path === '/store/buy') {
    const items = buildMockStoreItems();
    const found = items.find((i) => i.id === body.itemId || i.code === body.code);
    const price = Number(found?.price ?? body.price ?? 0);
    const itemType = found?.type || body.itemType;
    const code = found?.code || body.code;

    if (currentUser.coins < price) {
      throw new Error('Tangalar yetarli emas — Hamyondan yoki Ega Panelidan to‘ldiring');
    }

    currentUser.coins -= price;
    currentUser.wealthXp = (currentUser.wealthXp || 0) + price;

    if (itemType === 'VIP') {
      const tierNum = Number(found?.vip_tier || String(code).replace('vip-', '') || 1);
      const vipMeta = VIP_LEVELS_1_TO_12[Math.min(12, Math.max(1, tierNum)) - 1];
      currentUser.vipLevel = tierNum;
      if (vipMeta) {
        currentUser.activeFrame = vipMeta.frameCode;
        currentUser.activeBubble = vipMeta.bubbleCode;
        addOwnedCode(vipMeta.frameCode);
        addOwnedCode(vipMeta.bubbleCode);
      }
    } else if (itemType === 'FRAME' && code) {
      currentUser.activeFrame = code;
      addOwnedCode(code);
    } else if (itemType === 'RIDE' && code) {
      currentUser.activeRide = code;
      addOwnedCode(code);
    } else if (itemType === 'BUBBLE' && code) {
      currentUser.activeBubble = code;
      addOwnedCode(code);
    }

    mockLedger.unshift({
      id: `tx_${Date.now()}`,
      currency: 'COINS',
      amount: -price,
      description: `Do‘kon: ${found?.name_uz || code}`,
      created_at: new Date().toISOString(),
    });
    setStoredUser(currentUser);
    syncProfileToSupabase(currentUser);
    return { ok: true, user: currentUser } as unknown as T;
  }

  if (path === '/store/equip') {
    const { itemType, itemCode } = body;
    if (itemType === 'FRAME') currentUser.activeFrame = itemCode || '';
    else if (itemType === 'RIDE') currentUser.activeRide = itemCode || '';
    else if (itemType === 'BUBBLE') currentUser.activeBubble = itemCode || '';
    setStoredUser(currentUser);
    syncProfileToSupabase(currentUser);
    return { ok: true, user: currentUser } as unknown as T;
  }

  // 4. Lucky Wheel
  if (path === '/games/wheel/config') {
    return { sectors: WHEEL_SECTORS, recent: mockWheelRecent } as unknown as T;
  }

  if (path === '/games/wheel/spin') {
    const bet = Math.max(10, Number(body.bet || 50));
    if (currentUser.coins < bet) throw new Error('Tangalar yetarli emas');
    const sectorIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const sector = WHEEL_SECTORS[sectorIndex];
    const winAmount = Math.round(bet * sector.multiplier);
    currentUser.coins = currentUser.coins - bet + winAmount;
    setStoredUser(currentUser);
    mockWheelRecent.unshift({
      id: `w_${Date.now()}`,
      display_name: currentUser.displayName,
      bet_amount: bet,
      sector_label: sector.label,
      multiplier: sector.multiplier,
      win_amount: winAmount,
    });
    mockWheelRecent = mockWheelRecent.slice(0, 12);
    return { sectorIndex, sector, bet, winAmount, coins: currentUser.coins } as unknown as T;
  }

  // 5. Moments
  if (path === '/moments') {
    if (method === 'POST') {
      const newM = {
        id: `m_${Date.now()}`,
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        frame: currentUser.activeFrame || 'frame-gold-1',
        vipLevel: currentUser.vipLevel || 4,
        content: body.content || '',
        imageUrl: body.imageUrl || '',
        likesCount: 0,
        commentsCount: 0,
        liked: false,
        createdAt: new Date().toISOString(),
      };
      mockMoments.unshift(newM);
      return { moment: newM } as unknown as T;
    }
    return { moments: mockMoments } as unknown as T;
  }

  const momentLikeMatch = path.match(/^\/moments\/([^/]+)\/like$/);
  if (momentLikeMatch) {
    const m = mockMoments.find((x) => x.id === momentLikeMatch[1]);
    if (m) {
      m.liked = !m.liked;
      m.likesCount += m.liked ? 1 : -1;
      return { liked: m.liked } as unknown as T;
    }
    return { liked: true } as unknown as T;
  }

  const momentCommentMatch = path.match(/^\/moments\/([^/]+)\/comments$/);
  if (momentCommentMatch) {
    const mid = momentCommentMatch[1];
    if (method === 'POST') {
      const comment = {
        id: `c_${Date.now()}`,
        display_name: currentUser.displayName,
        content: body.content || body.text || 'Ajoyib!',
        created_at: new Date().toISOString(),
      };
      mockComments[mid] = [...(mockComments[mid] || []), comment];
      const m = mockMoments.find((x) => x.id === mid);
      if (m) m.commentsCount += 1;
      return { comment } as unknown as T;
    }
    return { comments: mockComments[mid] || [] } as unknown as T;
  }

  // 6. Families / Clans
  if (path.startsWith('/families')) {
    if (path === '/families/create') {
      const clan = {
        id: `clan_${Date.now()}`,
        tag: (body.tag || 'NEW').toUpperCase().slice(0, 4),
        name: body.name || 'Yangi Klan',
        badge: body.badge || '👑',
        level: 1,
        member_count: 1,
        honor_xp: 1000,
        leader_name: currentUser.displayName,
        members: [
          {
            id: currentUser.id,
            display_name: currentUser.displayName,
            avatar: currentUser.avatar,
            vip_level: currentUser.vipLevel,
            wealth_xp: currentUser.wealthXp,
          },
        ],
      };
      mockFamilies.unshift(clan);
      mockMyFamilyId = clan.id;
      createFamilyInSupabase(clan.name, clan.tag, currentUser);
      return { family: clan } as unknown as T;
    }
    if (path === '/families/leave') {
      mockMyFamilyId = null;
      return { ok: true } as unknown as T;
    }
    const joinMatch = path.match(/^\/families\/([^/]+)\/join$/);
    if (joinMatch) {
      mockMyFamilyId = joinMatch[1];
      return { ok: true } as unknown as T;
    }
    const supaFamilies = await fetchFamiliesFromSupabase();
    const familyList = supaFamilies && supaFamilies.length > 0 ? supaFamilies : mockFamilies;
    const myFamily = familyList.find((f: any) => f.id === mockMyFamilyId) || null;
    return { families: familyList, myFamily } as unknown as T;
  }

  // 7. Tasks
  if (path === '/tasks') {
    const baseTasks = [
      { id: 't1', code: 'daily_checkin', title: 'Kundalik kirish bonusi', reward: 500, claimed: mockClaimedTasks.has('t1') },
      { id: 't2', code: 'watch_5m', title: '5 daqiqa jonli efir ko‘rish', reward: 350, claimed: mockClaimedTasks.has('t2') },
      { id: 't3', code: 'send_dragon', title: '1 ta Ajdarho sovg‘a yuborish', reward: 1000, claimed: mockClaimedTasks.has('t3') },
      { id: 't4', code: 'play_ludo', title: 'Ludo yoki Wheel o‘ynash', reward: 400, claimed: mockClaimedTasks.has('t4') },
    ];
    return { tasks: baseTasks } as unknown as T;
  }

  if (path === '/tasks/claim') {
    const code = body.code || body.taskId || 't1';
    mockClaimedTasks.add(code);
    const reward = 500;
    currentUser.coins += reward;
    setStoredUser(currentUser);
    mockLedger.unshift({
      id: `tx_${Date.now()}`,
      currency: 'COINS',
      amount: reward,
      description: 'Kundalik vazifa mukofoti',
      created_at: new Date().toISOString(),
    });
    return { reward, coins: currentUser.coins } as unknown as T;
  }

  // 8. Wallet
  if (path === '/wallet') {
    return {
      coins: currentUser.coins,
      diamonds: currentUser.diamonds,
      ledger: mockLedger,
    } as unknown as T;
  }

  if (path === '/wallet/topup') {
    const added = Number(body.coins || body.amount || 5000);
    currentUser.coins += added;
    setStoredUser(currentUser);
    syncProfileToSupabase(currentUser);
    mockLedger.unshift({
      id: `tx_${Date.now()}`,
      currency: 'COINS',
      amount: added,
      description: `${body.provider || 'Click'} orqali to‘ldirish`,
      created_at: new Date().toISOString(),
    });
    return { added, coins: currentUser.coins } as unknown as T;
  }

  if (path === '/wallet/exchange') {
    const diamonds = Number(body.diamonds || 100);
    if (currentUser.diamonds < diamonds) throw new Error('Olmoslar yetarli emas');
    const coinsGain = diamonds * 2;
    currentUser.diamonds -= diamonds;
    currentUser.coins += coinsGain;
    setStoredUser(currentUser);
    syncProfileToSupabase(currentUser);
    mockLedger.unshift({
      id: `tx_${Date.now()}`,
      currency: 'COINS',
      amount: coinsGain,
      description: `${diamonds} 💎 almashtirildi`,
      created_at: new Date().toISOString(),
    });
    return { coinsGain, coins: currentUser.coins, diamonds: currentUser.diamonds } as unknown as T;
  }

  if (path === '/wallet/withdraw') {
    const diamonds = Number(body.diamonds || 500);
    if (currentUser.diamonds < diamonds) throw new Error('Olmoslar yetarli emas');
    currentUser.diamonds -= diamonds;
    setStoredUser(currentUser);
    return { usdAmount: Number((diamonds / 100).toFixed(2)), success: true } as unknown as T;
  }

  // 9. Agency
  if (path.startsWith('/agency')) {
    return {
      agency: {
        id: 'agency_tashkent',
        name: 'Tashkent Stars',
        code: 'ZORA77',
        commission_rate: 0.1,
        total_earned: 14800,
        members: Object.values(DEMO_USERS).slice(0, 4),
      },
    } as unknown as T;
  }

  // 10. Users, Leaderboard & Directory
  if (path === '/users/leaderboard') {
    const type = params.get('type') || 'wealth';
    if (type === 'agency') {
      return {
        agencies: [
          { id: 'ag1', name: 'Zora Star Agency', code: 'ZORA77', total_earned: 148000, member_count: 24 },
          { id: 'ag2', name: 'Toshkent Prime', code: 'TASH01', total_earned: 96500, member_count: 18 },
        ],
      } as unknown as T;
    }
    const liveProfiles = await fetchAllProfilesFromSupabase();
    const baseList = liveProfiles.length > 0 ? liveProfiles : Object.values(DEMO_USERS);
    const users = [...baseList].sort((a, b) =>
      type === 'charm' ? b.charmXp - a.charmXp : b.wealthXp - a.wealthXp
    );
    return { users } as unknown as T;
  }

  if (path === '/users/directory') {
    const q = (params.get('q') || '').toLowerCase();
    const liveProfiles = await fetchAllProfilesFromSupabase();
    const baseList = liveProfiles.length > 0 ? liveProfiles : Object.values(DEMO_USERS);
    const list = baseList
      .filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      .map((u) => ({ ...u, isFollowing: mockFollows.has(u.id) }));
    return { users: list } as unknown as T;
  }

  const followMatch = path.match(/^\/users\/([^/]+)\/follow$/);
  if (followMatch) {
    const tid = followMatch[1];
    if (mockFollows.has(tid)) {
      mockFollows.delete(tid);
      return { following: false } as unknown as T;
    }
    mockFollows.add(tid);
    return { following: true } as unknown as T;
  }

  if (path === '/users/profile') {
    Object.assign(currentUser, {
      displayName: body.displayName || currentUser.displayName,
      bio: body.bio !== undefined ? body.bio : currentUser.bio,
      avatar: body.avatar || currentUser.avatar,
    });
    setStoredUser(currentUser);
    syncProfileToSupabase({
      id: currentUser.id,
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      avatar: currentUser.avatar,
    });
    return { user: currentUser } as unknown as T;
  }

  // 11. Messages
  if (path === '/messages/conversations') {
    return {
      conversations: [
        { peer: DEMO_USERS.host, lastMessage: 'Salom! Kechki efirga kiring 🎤', updatedAt: new Date().toISOString() },
        { peer: DEMO_USERS.admin, lastMessage: 'VIP 12 va Ajdarholar muborak! 🐉', updatedAt: new Date().toISOString() },
      ],
    } as unknown as T;
  }

  const dmMatch = path.match(/^\/messages\/([^/]+)$/);
  if (dmMatch) {
    return {
      messages: [
        {
          id: 'dm1',
          sender_id: dmMatch[1],
          receiver_id: currentUser.id,
          content: 'Assalomu alaykum! ZoraLive’ga xush kelibsiz 🐉✨',
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
      ],
    } as unknown as T;
  }

  // 12. Admin
  if (path.startsWith('/admin')) {
    return {
      stats: {
        users: 1420,
        liveRooms: mockRooms.length,
        totalGifts: 284000,
        pendingPayouts: 1,
        openReports: 1,
      },
      users: Object.values(DEMO_USERS),
      rooms: mockRooms,
      payouts: [
        { id: 'p1', display_name: 'Madina 🎵', usd_amount: 150, diamonds_amount: 15000, method: 'USDT_TRC20', status: 'PENDING' },
      ],
      reports: [
        { id: 'rep1', reporter_name: 'Laylo 🌙', reason: 'Spam xabar', status: 'PENDING' },
      ],
    } as unknown as T;
  }

  return {} as unknown as T;
}
