export interface MythicDragon {
  id: string;
  giftId: string;
  rideCode: string;
  name: string;
  titleUz: string;
  colorUz: string;
  elementUz: string;
  sizeUz: string;
  powerUz: string;
  abilitiesUz: [string, string, string];
  image: string;
  giftPrice: number;
  ridePrice: number;
  accent: string;
  gradient: string;
  vipUnlock?: number;
}

export interface AnimatedFrameMeta {
  id: string;
  code: string;
  nameUz: string;
  badge: string;
  webp: string;
  price: number;
  vipTier?: number;
  accent: string;
}

export interface CrystalEnergyMeta {
  id: string;
  code: string;
  name: string;
  nameUz: string;
  elementUz: string;
  benefitUz: string;
  auraUz: string;
  webp: string;
  price: number;
  bonusCoins: number;
  accent: string;
  gradient: string;
}

export interface VipTierMeta {
  level: number;
  tierName: string;
  tierGroup: 'BRONZE' | 'GOLD' | 'KNIGHT' | 'DIAMOND' | 'DIAMOND_GOLD' | 'COSMIC';
  price: number;
  frameCode: string;
  bubbleCode: string;
  rideCode?: string;
  dragonId?: string;
  hasRingEffect: boolean;
  hasRoomAnimation: boolean;
  hasDivineProfile: boolean;
  rewardsUz: string[];
  badgeGradient: string;
}

export const MYTHIC_DRAGONS: MythicDragon[] = [
  {
    id: 'zepharion',
    giftId: 'gift-dragon-zepharion',
    rideCode: 'ride-dragon-zepharion',
    name: 'Zepharion',
    titleUz: 'Osmon ajdarhosi',
    colorUz: 'Oq va oltin',
    elementUz: 'Havo',
    sizeUz: 'Ulkan',
    powerUz: 'Bo‘ron va osmonni boshqarish',
    abilitiesUz: ['Uchish qobiliyati', 'Bulutlarga shakl berish', 'Momaqaldiroq hujumlari'],
    image: '/assets/dragons/zepharion.jpg',
    giftPrice: 2500,
    ridePrice: 6500,
    accent: '#f59e0b',
    gradient: 'from-amber-200 via-yellow-400 to-amber-600',
    vipUnlock: 9,
  },
  {
    id: 'nythera',
    giftId: 'gift-dragon-nythera',
    rideCode: 'ride-dragon-nythera',
    name: 'Nythera',
    titleUz: 'Kosmik ajdarho',
    colorUz: 'Qora va binafsha',
    elementUz: 'Kosmos',
    sizeUz: 'Cheksiz',
    powerUz: 'Koinot energiyasini boshqarish',
    abilitiesUz: ['Vaqtni sekinlashtirish', 'Qora tuynuk yaratish', 'Yulduzlarni chaqirish'],
    image: '/assets/dragons/nythera.jpg',
    giftPrice: 8888,
    ridePrice: 14500,
    accent: '#a855f7',
    gradient: 'from-purple-600 via-fuchsia-600 to-slate-950',
    vipUnlock: 11,
  },
  {
    id: 'valtor',
    giftId: 'gift-dragon-valtor',
    rideCode: 'ride-dragon-valtor',
    name: 'Valtor',
    titleUz: 'Olov va lava ajdarhosi',
    colorUz: 'Qizil va qora',
    elementUz: 'Olov va lava',
    sizeUz: 'Ulkan',
    powerUz: 'Lava va olovni boshqarish',
    abilitiesUz: ['Vulkanlarni uyg‘otish', 'Olov purkash', 'Kul bo‘ronini hosil qilish'],
    image: '/assets/dragons/valtor.jpg',
    giftPrice: 3500,
    ridePrice: 8500,
    accent: '#ef4444',
    gradient: 'from-red-600 via-orange-600 to-zinc-950',
    vipUnlock: 10,
  },
  {
    id: 'sylvanna',
    giftId: 'gift-dragon-sylvanna',
    rideCode: 'ride-dragon-sylvanna',
    name: 'Sylvanna',
    titleUz: 'Tabiat ajdarhosi',
    colorUz: 'Yashil va jigarrang',
    elementUz: 'Tabiat',
    sizeUz: 'Ulkan',
    powerUz: 'O‘simliklar va hayot energiyasini boshqarish',
    abilitiesUz: ['O‘simliklarni o‘stirish', 'Yaralarni davolash', 'Tabiatni boshqarish'],
    image: '/assets/dragons/sylvanna.jpg',
    giftPrice: 2200,
    ridePrice: 5500,
    accent: '#10b981',
    gradient: 'from-emerald-500 via-green-600 to-amber-900',
  },
  {
    id: 'thalassor',
    giftId: 'gift-dragon-thalassor',
    rideCode: 'ride-dragon-thalassor',
    name: 'Thalassor',
    titleUz: 'Dengiz ajdarhosi',
    colorUz: 'Moviy va feruza',
    elementUz: 'Suv',
    sizeUz: 'Ulkan',
    powerUz: 'Suv va okeanni boshqarish',
    abilitiesUz: ['Sunami hosil qilish', 'Suv ostida nafas olish', 'Dengiz jonzotlarini chaqirish'],
    image: '/assets/dragons/thalassor.jpg',
    giftPrice: 2800,
    ridePrice: 6800,
    accent: '#06b6d4',
    gradient: 'from-cyan-400 via-teal-500 to-blue-800',
  },
  {
    id: 'umbra',
    giftId: 'gift-dragon-umbra',
    rideCode: 'ride-dragon-umbra',
    name: 'Umbra',
    titleUz: 'Soya ajdarhosi',
    colorUz: 'Qora va kulrang',
    elementUz: 'Soya',
    sizeUz: 'Ulkan',
    powerUz: 'Zulmat va xayolotlarni boshqarish',
    abilitiesUz: ['Ongni boshqarish', 'Ko‘rinmas bo‘lish', 'Qo‘rquv tarqatish'],
    image: '/assets/dragons/umbra.jpg',
    giftPrice: 4500,
    ridePrice: 9500,
    accent: '#6366f1',
    gradient: 'from-slate-700 via-indigo-900 to-black',
  },
  {
    id: 'auriel',
    giftId: 'gift-dragon-auriel',
    rideCode: 'ride-dragon-auriel',
    name: 'Auriel',
    titleUz: 'Kristall ajdarhosi',
    colorUz: 'Oltin va kristall',
    elementUz: 'Yorug‘lik va kristall',
    sizeUz: 'Ulkan',
    powerUz: 'Kristall energiyasini boshqarish',
    abilitiesUz: ['Yorug‘lik portlashlari', 'Kristall qalqon yaratish', 'Energiyani tiklash'],
    image: '/assets/dragons/auriel.jpg',
    giftPrice: 5200,
    ridePrice: 11000,
    accent: '#eab308',
    gradient: 'from-yellow-300 via-amber-400 to-cyan-400',
  },
  {
    id: 'drakthar',
    giftId: 'gift-dragon-drakthar',
    rideCode: 'ride-dragon-drakthar',
    name: 'Drakthar',
    titleUz: 'Bo‘ron ajdarhosi',
    colorUz: 'To‘q ko‘k va kumush',
    elementUz: 'Elektr',
    sizeUz: 'Ulkan',
    powerUz: 'Ulkan energiyani boshqarish',
    abilitiesUz: ['Chaqmoq hujumlari', 'Tezlikni oshirish', 'Elektr qalqoni yaratish'],
    image: '/assets/dragons/drakthar.jpg',
    giftPrice: 4200,
    ridePrice: 8900,
    accent: '#3b82f6',
    gradient: 'from-sky-400 via-blue-700 to-slate-900',
  },
  {
    id: 'morvaxis',
    giftId: 'gift-dragon-morvaxis',
    rideCode: 'ride-dragon-morvaxis',
    name: 'Morvaxis',
    titleUz: 'Suyak ajdarhosi',
    colorUz: 'Oq va kulrang',
    elementUz: 'O‘lim',
    sizeUz: 'Ulkan',
    powerUz: 'Jon so‘rib olish',
    abilitiesUz: ['O‘lganlarni tiriltirish', 'Ruhlarni so‘rib olish', 'Suyak zirhi yaratish'],
    image: '/assets/dragons/morvaxis.jpg',
    giftPrice: 6666,
    ridePrice: 12500,
    accent: '#94a3b8',
    gradient: 'from-slate-300 via-slate-600 to-zinc-950',
  },
  {
    id: 'xaldris',
    giftId: 'gift-dragon-xaldris',
    rideCode: 'ride-dragon-xaldris',
    name: 'Xaldris',
    titleUz: 'Elementlar ajdarhosi',
    colorUz: 'Kamalak (barcha ranglar)',
    elementUz: 'Barcha elementlar',
    sizeUz: 'Cheksiz',
    powerUz: 'Muvozanat va uyg‘unlikni boshqarish',
    abilitiesUz: ['Barcha elementlardan foydalanish', 'Shaklini o‘zgartirish', 'Cheksiz energiya'],
    image: '/assets/dragons/xaldris.jpg',
    giftPrice: 19999,
    ridePrice: 29999,
    accent: '#ec4899',
    gradient: 'from-rose-500 via-amber-400 via-emerald-400 to-violet-600',
    vipUnlock: 12,
  },
];

export const ANIMATED_FRAMES: AnimatedFrameMeta[] = [
  { id: 'st-af-bronze-3', code: 'frame-bronze-3', nameUz: 'Bronza #3 G‘olib', badge: 'VIP 1', webp: '/assets/frames/frame-bronze-3.webp', price: 800, vipTier: 1, accent: '#d97706' },
  { id: 'st-af-frost-2', code: 'frame-frost-2', nameUz: 'Muzli #2 Ritsar', badge: 'VIP 2', webp: '/assets/frames/frame-frost-2.webp', price: 1200, vipTier: 2, accent: '#38bdf8' },
  { id: 'st-af-rose-3', code: 'frame-rose-3', nameUz: 'Atirgul Kristall', badge: 'VIP 3', webp: '/assets/frames/frame-rose-3.webp', price: 1500, vipTier: 3, accent: '#fb7185' },
  { id: 'st-af-gold-1', code: 'frame-gold-1', nameUz: 'Qirollik Oltin #1', badge: 'VIP 4', webp: '/assets/frames/frame-gold-1.webp', price: 2200, vipTier: 4, accent: '#eab308' },
  { id: 'st-af-golden-wings', code: 'frame-golden-wings', nameUz: 'Oltin Qanotlar', badge: 'VIP 5', webp: '/assets/frames/frame-golden-wings.webp', price: 2800, vipTier: 5, accent: '#f59e0b' },
  { id: 'st-af-amethyst-spark', code: 'frame-amethyst-spark', nameUz: 'Ametist Uchqun', badge: 'VIP 6', webp: '/assets/frames/frame-amethyst-spark.webp', price: 3200, vipTier: 6, accent: '#a855f7' },
  { id: 'st-af-crystal-violet', code: 'frame-crystal-violet', nameUz: 'Kosmik Binafsha', badge: 'VIP 7', webp: '/assets/frames/frame-crystal-violet.webp', price: 4000, vipTier: 7, accent: '#8b5cf6' },
  { id: 'st-af-emerald-crown', code: 'frame-emerald-crown', nameUz: 'Zumrad Olmos Toj', badge: 'VIP 8', webp: '/assets/frames/frame-emerald-crown.webp', price: 4800, vipTier: 8, accent: '#10b981' },
  { id: 'st-af-palace-gold', code: 'frame-palace-gold', nameUz: 'Saroy Oltini', badge: 'VIP 9', webp: '/assets/frames/frame-palace-gold.webp', price: 5500, vipTier: 9, accent: '#ca8a04' },
  { id: 'st-af-inferno-1', code: 'frame-inferno-1', nameUz: 'Olovli #1 Chempion', badge: 'VIP 10', webp: '/assets/frames/frame-inferno-1.webp', price: 6800, vipTier: 10, accent: '#ef4444' },
  { id: 'st-af-violet-2', code: 'frame-violet-2', nameUz: 'Binafsha Imperator', badge: 'VIP 11', webp: '/assets/frames/frame-violet-2.webp', price: 8500, vipTier: 11, accent: '#c026d3' },
  { id: 'st-af-obsidian-gold', code: 'frame-obsidian-gold', nameUz: 'Kosmik Ilohiy XII', badge: 'VIP 12', webp: '/assets/frames/frame-obsidian-gold.webp', price: 12000, vipTier: 12, accent: '#e11d48' },
];

export const CRYSTAL_ENERGIES: CrystalEnergyMeta[] = [
  {
    id: 'st-cr-amethyst',
    code: 'crystal-amethyst',
    name: 'Amethyst',
    nameUz: 'Binafsha Ametist',
    elementUz: 'Kosmos & Ruhiyat',
    benefitUz: '+25% Xona jozibasi (Charm XP)',
    auraUz: 'Kosmik binafsha qalqon',
    webp: '/assets/crystals/amethyst.webp',
    price: 1800,
    bonusCoins: 180,
    accent: '#9333ea',
    gradient: 'from-purple-600 to-indigo-900',
  },
  {
    id: 'st-cr-citrine',
    code: 'crystal-citrine',
    name: 'Citrine',
    nameUz: 'Oltin Sitrina',
    elementUz: 'Quyosh & Boylik',
    benefitUz: '+20% Kunlik tanga daromadi',
    auraUz: 'Oltin baraka oqimi',
    webp: '/assets/crystals/citrine.webp',
    price: 2400,
    bonusCoins: 240,
    accent: '#f59e0b',
    gradient: 'from-amber-500 to-orange-800',
  },
  {
    id: 'st-cr-pyrite',
    code: 'crystal-pyrite',
    name: 'Pyrite',
    nameUz: 'Oltin Kub Pirit',
    elementUz: 'Temir & Himoya',
    benefitUz: '+15% PK Battle zarba kuchi',
    auraUz: 'Oltin kub zirhi',
    webp: '/assets/crystals/pyrite.webp',
    price: 2800,
    bonusCoins: 280,
    accent: '#eab308',
    gradient: 'from-yellow-600 to-stone-900',
  },
  {
    id: 'st-cr-aventurine',
    code: 'crystal-aventurine',
    name: 'Green Aventurine',
    nameUz: 'Yashil Aventurin',
    elementUz: 'Tabiat & Omad',
    benefitUz: '+30% Lucky Wheel & Ludo omadi',
    auraUz: 'Zumrad g‘alaba to‘lqini',
    webp: '/assets/crystals/aventurine.webp',
    price: 2200,
    bonusCoins: 220,
    accent: '#10b981',
    gradient: 'from-emerald-600 to-teal-900',
  },
];

export const VIP_LEVELS_1_TO_12: VipTierMeta[] = [
  {
    level: 1,
    tierName: 'Bronza I',
    tierGroup: 'BRONZE',
    price: 1000,
    frameCode: 'frame-bronze-3',
    bubbleCode: 'bubble-neon',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Bronza avatar ramkasi', 'Asosiy ism nishoni', 'Statik chat pufagi', '1-daraja kirish effekti'],
    badgeGradient: 'from-amber-700 via-orange-400 to-amber-700 text-white',
  },
  {
    level: 2,
    tierName: 'Bronza II',
    tierGroup: 'BRONZE',
    price: 2000,
    frameCode: 'frame-frost-2',
    bubbleCode: 'bubble-neon',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Muzli #2 ramka', 'Moviy ism nishoni', 'Chat pufagi', '2-daraja kirish effekti'],
    badgeGradient: 'from-sky-600 via-cyan-300 to-blue-700 text-slate-950',
  },
  {
    level: 3,
    tierName: 'Bronza III',
    tierGroup: 'BRONZE',
    price: 3500,
    frameCode: 'frame-rose-3',
    bubbleCode: 'bubble-rose',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Qanotli kristall ramka', 'Oltin bronza nishon', 'Pushti chat pufagi', 'Ustuvor mikrofon navbati'],
    badgeGradient: 'from-amber-600 via-amber-300 to-rose-400 text-slate-950',
  },
  {
    level: 4,
    tierName: 'Oltin Nur IV',
    tierGroup: 'GOLD',
    price: 5500,
    frameCode: 'frame-gold-1',
    bubbleCode: 'bubble-gold',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Yaltiroq oltin #1 ramka', 'Animatsiyali chat pufagi', 'Yorqin (Glowing) status', 'Kunlik +200 tanga bonus'],
    badgeGradient: 'from-yellow-300 via-amber-400 to-orange-500 text-slate-950',
  },
  {
    level: 5,
    tierName: 'Ritsar V',
    tierGroup: 'KNIGHT',
    price: 8000,
    frameCode: 'frame-golden-wings',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-horse',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Oltin qanotli ramka', 'Zirhli Ot (Kirish ulovi)', 'Eksklyuziv sovg‘alar ochiladi', 'Xonada maxsus nishon'],
    badgeGradient: 'from-slate-300 via-indigo-300 to-slate-500 text-slate-950',
  },
  {
    level: 6,
    tierName: 'Mexa VI',
    tierGroup: 'KNIGHT',
    price: 12000,
    frameCode: 'frame-amethyst-spark',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-mecha',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Ametist uchqun ramka', 'Mexa Ajdarho (Rider)', 'Eksklyuziv VIP sovg‘alar', 'Kunlik +500 tanga bonus'],
    badgeGradient: 'from-purple-400 via-fuchsia-300 to-indigo-500 text-slate-950',
  },
  {
    level: 7,
    tierName: 'Olmos VII',
    tierGroup: 'DIAMOND',
    price: 18000,
    frameCode: 'frame-crystal-violet',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-lambo',
    hasRingEffect: true,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Kosmik binafsha ramka', 'Lyuks Sport Avto (Kirish)', 'Maxsus Profil Kartasi', 'Oltin halqa (Ring Effect)'],
    badgeGradient: 'from-cyan-300 via-sky-400 to-indigo-500 text-slate-950',
  },
  {
    level: 8,
    tierName: 'Olmos VIII',
    tierGroup: 'DIAMOND',
    price: 25000,
    frameCode: 'frame-emerald-crown',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-jet',
    hasRingEffect: true,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Zumrad Olmos ramka', 'Kuchaytirilgan Ring Effect', 'Shaxsiy Layner kirishi', 'Profil oltin bezagi'],
    badgeGradient: 'from-emerald-300 via-teal-400 to-cyan-500 text-slate-950',
  },
  {
    level: 9,
    tierName: 'Olmos Oltin IX',
    tierGroup: 'DIAMOND_GOLD',
    price: 35000,
    frameCode: 'frame-palace-gold',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-dragon-zepharion',
    dragonId: 'zepharion',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: false,
    rewardsUz: ['Saroy Oltini ramka', 'Zepharion Osmon Ajdarhosi kirishi', 'Xona bo‘ylab katta animatsiya', 'Kunlik +1,500 tanga bonus'],
    badgeGradient: 'from-amber-200 via-yellow-400 to-emerald-500 text-slate-950',
  },
  {
    level: 10,
    tierName: 'Olmos Oltin X',
    tierGroup: 'DIAMOND_GOLD',
    price: 50000,
    frameCode: 'frame-inferno-1',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-dragon-valtor',
    dragonId: 'valtor',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: false,
    rewardsUz: ['Olovli #1 Chempion ramka', 'Valtor Olov Ajdarhosi animatsiyasi', 'Xona kirish olov effekti', 'PK +20% kuchaytirgich'],
    badgeGradient: 'from-amber-300 via-orange-500 to-red-600 text-white',
  },
  {
    level: 11,
    tierName: 'Kosmik XI',
    tierGroup: 'COSMIC',
    price: 75000,
    frameCode: 'frame-violet-2',
    bubbleCode: 'bubble-cosmic',
    rideCode: 'ride-dragon-nythera',
    dragonId: 'nythera',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: true,
    rewardsUz: ['Binafsha Imperator ramka', 'Nythera Kosmik Transformatsiya', 'Cheksiz VIP Chat Pufagi', 'Ilohiy profil kartasi'],
    badgeGradient: 'from-fuchsia-400 via-purple-600 to-rose-600 text-white',
  },
  {
    level: 12,
    tierName: 'Ilohiy Kosmik XII',
    tierGroup: 'COSMIC',
    price: 120000,
    frameCode: 'frame-obsidian-gold',
    bubbleCode: 'bubble-cosmic',
    rideCode: 'ride-dragon-xaldris',
    dragonId: 'xaldris',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: true,
    rewardsUz: ['VIP 12 Ilohiy Xona Kirishi', 'Xaldris Elementlar Ajdarhosi', 'Kosmik Qirmizi Ramka + Ring Aura', 'Barcha VIP 1–12 imtiyozlari cheksiz'],
    badgeGradient: 'from-amber-200 via-rose-500 to-purple-800 text-white',
  },
];

export const ANIMATED_FRAME_MAP: Record<string, AnimatedFrameMeta> = Object.fromEntries(
  ANIMATED_FRAMES.map((f) => [f.code, f])
);

export const DRAGON_BY_ID: Record<string, MythicDragon> = Object.fromEntries(
  MYTHIC_DRAGONS.map((d) => [d.id, d])
);

export const DRAGON_BY_GIFT_ID: Record<string, MythicDragon> = Object.fromEntries(
  MYTHIC_DRAGONS.map((d) => [d.giftId, d])
);

export const DRAGON_BY_RIDE_CODE: Record<string, MythicDragon> = Object.fromEntries(
  MYTHIC_DRAGONS.map((d) => [d.rideCode, d])
);

export function getAnimatedFrameUrl(code?: string): string | null {
  if (!code) return null;
  return ANIMATED_FRAME_MAP[code]?.webp || null;
}

export function getVipMeta(level: number): VipTierMeta | null {
  if (!level || level <= 0) return null;
  const clamped = Math.min(12, Math.max(1, Math.round(level)));
  return VIP_LEVELS_1_TO_12[clamped - 1] || null;
}
