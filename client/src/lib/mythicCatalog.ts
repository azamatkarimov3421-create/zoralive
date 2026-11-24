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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
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
    giftPrice: 0,
    ridePrice: 0,
    accent: '#ec4899',
    gradient: 'from-rose-500 via-amber-400 via-emerald-400 to-violet-600',
  },
];

export const ANIMATED_FRAMES: AnimatedFrameMeta[] = [
  { id: 'st-af-obsidian-gold', code: 'frame-obsidian-gold', nameUz: 'Bronza Boshlang‘ich #3', badge: 'VIP 1', webp: '/assets/frames/frame-obsidian-gold.webp', price: 0, vipTier: 1, accent: '#b45309' },
  { id: 'st-af-crystal-violet', code: 'frame-crystal-violet', nameUz: 'Binafsha Kristall #2', badge: 'VIP 2', webp: '/assets/frames/frame-crystal-violet.webp', price: 0, vipTier: 2, accent: '#8b5cf6' },
  { id: 'st-af-palace-gold', code: 'frame-palace-gold', nameUz: 'Oltin Zirh #1', badge: 'VIP 3', webp: '/assets/frames/frame-palace-gold.webp', price: 0, vipTier: 3, accent: '#eab308' },
  { id: 'st-af-bronze-3', code: 'frame-bronze-3', nameUz: 'Bronza Ritsar #3', badge: 'VIP 4', webp: '/assets/frames/frame-bronze-3.webp', price: 0, vipTier: 4, accent: '#d97706' },
  { id: 'st-af-frost-2', code: 'frame-frost-2', nameUz: 'Muzli Glatsial #2', badge: 'VIP 5', webp: '/assets/frames/frame-frost-2.webp', price: 0, vipTier: 5, accent: '#38bdf8' },
  { id: 'st-af-inferno-1', code: 'frame-inferno-1', nameUz: 'Olovli Oltin #1', badge: 'VIP 6', webp: '/assets/frames/frame-inferno-1.webp', price: 0, vipTier: 6, accent: '#ef4444' },
  { id: 'st-af-golden-wings', code: 'frame-golden-wings', nameUz: 'Oltin Qanotlar & Yulduz', badge: 'VIP 7', webp: '/assets/frames/frame-golden-wings.webp', price: 0, vipTier: 7, accent: '#f59e0b' },
  { id: 'st-af-emerald-crown', code: 'frame-emerald-crown', nameUz: 'Zumrad Ajdarho Toji', badge: 'VIP 8', webp: '/assets/frames/frame-emerald-crown.webp', price: 0, vipTier: 8, accent: '#10b981' },
  { id: 'st-af-amethyst-spark', code: 'frame-amethyst-spark', nameUz: 'Oqqush & Ametist Toji', badge: 'VIP 9', webp: '/assets/frames/frame-amethyst-spark.webp', price: 0, vipTier: 9, accent: '#a855f7' },
  { id: 'st-af-rose-3', code: 'frame-rose-3', nameUz: 'Atirgul Imperator #3', badge: 'VIP 10', webp: '/assets/frames/frame-rose-3.webp', price: 0, vipTier: 10, accent: '#fb7185' },
  { id: 'st-af-violet-2', code: 'frame-violet-2', nameUz: 'Kosmik Binafsha Hukmdor #2', badge: 'VIP 11', webp: '/assets/frames/frame-violet-2.webp', price: 0, vipTier: 11, accent: '#c026d3' },
  { id: 'st-af-gold-1', code: 'frame-gold-1', nameUz: 'Ilohiy Oltin Ajdarho Shohi #1', badge: 'VIP 12', webp: '/assets/frames/frame-gold-1.webp', price: 0, vipTier: 12, accent: '#eab308' },
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
    price: 0,
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
    price: 0,
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
    price: 0,
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
    price: 0,
    bonusCoins: 220,
    accent: '#10b981',
    gradient: 'from-emerald-600 to-teal-900',
  },
];

export const VIP_LEVELS_1_TO_12: VipTierMeta[] = [
  {
    level: 1,
    tierName: 'Bronza Qalqon I',
    tierGroup: 'BRONZE',
    price: 0,
    frameCode: 'frame-obsidian-gold',
    bubbleCode: 'bubble-neon',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Boshlang‘ich bronza ramka #3', 'Asosiy ism nishoni', 'Statik chat pufagi', '1-daraja kirish effekti'],
    badgeGradient: 'from-amber-700 via-orange-400 to-amber-700 text-white',
  },
  {
    level: 2,
    tierName: 'Binafsha Kristall II',
    tierGroup: 'BRONZE',
    price: 0,
    frameCode: 'frame-crystal-violet',
    bubbleCode: 'bubble-neon',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Binafsha kristall ramka #2', 'Moviy-binafsha ism nishoni', 'Chat pufagi', '2-daraja kirish effekti'],
    badgeGradient: 'from-purple-600 via-violet-400 to-indigo-700 text-white',
  },
  {
    level: 3,
    tierName: 'Oltin Zirh III',
    tierGroup: 'BRONZE',
    price: 0,
    frameCode: 'frame-palace-gold',
    bubbleCode: 'bubble-rose',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Oltin zirh ramka #1', 'Yaltiroq bronza nishon', 'Pushti chat pufagi', 'Ustuvor mikrofon navbati'],
    badgeGradient: 'from-amber-600 via-amber-300 to-yellow-400 text-slate-950',
  },
  {
    level: 4,
    tierName: 'Bronza Ritsar IV',
    tierGroup: 'GOLD',
    price: 0,
    frameCode: 'frame-bronze-3',
    bubbleCode: 'bubble-gold',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Qalin Bronza Ritsar ramkasi #3', 'G‘olib toj nishoni', 'Animatsiyali chat pufagi', 'Kunlik +200 tanga bonus'],
    badgeGradient: 'from-amber-600 via-orange-400 to-yellow-500 text-slate-950',
  },
  {
    level: 5,
    tierName: 'Muzli Glatsial V',
    tierGroup: 'KNIGHT',
    price: 0,
    frameCode: 'frame-frost-2',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-horse',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Qalin Muzli Glatsial ramkasi #2', 'Zirhli Ot (Kirish ulovi)', 'Moviy muz nurlari', 'Xonada maxsus nishon'],
    badgeGradient: 'from-sky-400 via-cyan-300 to-blue-600 text-slate-950',
  },
  {
    level: 6,
    tierName: 'Olovli Oltin VI',
    tierGroup: 'KNIGHT',
    price: 0,
    frameCode: 'frame-inferno-1',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-mecha',
    hasRingEffect: false,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Qalin Olovli Oltin ramkasi #1', 'Mexa Ajdarho (Rider)', 'Olovli toj effekti', 'Kunlik +500 tanga bonus'],
    badgeGradient: 'from-amber-400 via-orange-500 to-red-600 text-white',
  },
  {
    level: 7,
    tierName: 'Oltin Qanotlar VII',
    tierGroup: 'DIAMOND',
    price: 0,
    frameCode: 'frame-golden-wings',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-lambo',
    hasRingEffect: true,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Katta Oltin Qanotlar ramkasi', 'Lyuks Sport Avto (Kirish)', 'Maxsus Profil Kartasi', 'Oltin halqa (Ring Aura)'],
    badgeGradient: 'from-amber-300 via-yellow-400 to-purple-600 text-slate-950',
  },
  {
    level: 8,
    tierName: 'Zumrad Ajdarho VIII',
    tierGroup: 'DIAMOND',
    price: 0,
    frameCode: 'frame-emerald-crown',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-jet',
    hasRingEffect: true,
    hasRoomAnimation: false,
    hasDivineProfile: false,
    rewardsUz: ['Ulkan Zumrad Ajdarho Toji ramkasi', 'Kuchaytirilgan Yashil Ring Aura', 'Shaxsiy Layner kirishi', 'Profil oltin bezagi'],
    badgeGradient: 'from-emerald-300 via-teal-400 to-cyan-500 text-slate-950',
  },
  {
    level: 9,
    tierName: 'Oqqush Qirolicha IX',
    tierGroup: 'DIAMOND_GOLD',
    price: 0,
    frameCode: 'frame-amethyst-spark',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-dragon-zepharion',
    dragonId: 'zepharion',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: false,
    rewardsUz: ['Hashamatli Oqqush & Ametist Toji', 'Zepharion Osmon Ajdarhosi kirishi', 'Xona bo‘ylab binafsha gul animatsiyasi', 'Kunlik +1,500 tanga bonus'],
    badgeGradient: 'from-purple-300 via-fuchsia-400 to-violet-700 text-white',
  },
  {
    level: 10,
    tierName: 'Atirgul Imperator X',
    tierGroup: 'DIAMOND_GOLD',
    price: 0,
    frameCode: 'frame-rose-3',
    bubbleCode: 'bubble-gold',
    rideCode: 'ride-dragon-valtor',
    dragonId: 'valtor',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: false,
    rewardsUz: ['Ulkan Shohona Tojli Atirgul ramkasi #3', 'Valtor Olov Ajdarhosi animatsiyasi', 'Shohona qanotlar effekti', 'PK +20% kuchaytirgich'],
    badgeGradient: 'from-rose-400 via-pink-500 to-amber-500 text-white',
  },
  {
    level: 11,
    tierName: 'Kosmik Hukmdor XI',
    tierGroup: 'COSMIC',
    price: 0,
    frameCode: 'frame-violet-2',
    bubbleCode: 'bubble-cosmic',
    rideCode: 'ride-dragon-nythera',
    dragonId: 'nythera',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: true,
    rewardsUz: ['Ulkan Kosmik Binafsha Diadema & Qanotlar #2', 'Nythera Kosmik Transformatsiya', 'Yulduzli Ring Aura', 'Ilohiy profil kartasi'],
    badgeGradient: 'from-violet-400 via-purple-600 to-fuchsia-600 text-white',
  },
  {
    level: 12,
    tierName: 'Ilohiy Ajdarho Shohi XII',
    tierGroup: 'COSMIC',
    price: 0,
    frameCode: 'frame-gold-1',
    bubbleCode: 'bubble-cosmic',
    rideCode: 'ride-dragon-xaldris',
    dragonId: 'xaldris',
    hasRingEffect: true,
    hasRoomAnimation: true,
    hasDivineProfile: true,
    rewardsUz: ['ENG KATTA Shohona Oltin Ajdarho Toji #1', 'Xaldris Elementlar Ajdarhosi', 'To‘liq Aylanuvchi Kamalak-Oltin Ring Aura', 'Barcha VIP 1–12 imtiyozlari cheksiz'],
    badgeGradient: 'from-amber-200 via-yellow-400 to-rose-500 text-slate-950',
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
