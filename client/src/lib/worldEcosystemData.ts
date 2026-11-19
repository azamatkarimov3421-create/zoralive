import { MYTHIC_DRAGONS, MythicDragon } from './mythicCatalog';

export interface ContinentMeta {
  id: string;
  dragonId: string;
  name: string;
  titleUz: string;
  resourceNameUz: string;
  resourceCode: string;
  resourceIcon: string;
  terrainUz: string;
  travelBonusUz: string;
  wildBeastName: string;
  wildBeastPower: number;
  wildBeastDescUz: string;
  mineCapacityPerDay: number;
  color: string;
  gradient: string;
  image: string;
  mapX: number;
  mapY: number;
}

export interface KingdomMeta {
  id: string;
  nameUz: string;
  flag: string;
  continentId: string;
  rulerName: string;
  commanderName: string;
  agentsCount: number;
  soldiersCount: number;
  economyCoins: number;
  miningBasesCount: number;
  territoriesCount: number;
  defenseLevel: number;
  defenseStructuresUz: string[];
  color: string;
  isPlayerKingdom?: boolean;
}

export interface MilitaryRankMeta {
  level: number;
  titleUz: string;
  badge: string;
  minServiceXp: number;
  perksUz: string;
}

export interface SoldierGearItem {
  id: string;
  category:
    | 'QILICH'
    | 'QALQON'
    | 'KAMON'
    | 'ZIRH'
    | 'ELEMENT_QUROL'
    | 'EGAR'
    | 'MAXLUQ_ZIRHI'
    | 'MAXSUS_KIYIM';
  categoryUz: string;
  nameUz: string;
  icon: string;
  elementUz: string;
  powerBonus: number;
  defenseBonus: number;
  priceCoins: number;
  priceGems: number;
  requiredElementCode?: string;
  requiredElementQty?: number;
}

export interface SellerShopItem {
  id: string;
  sellerName: string;
  sellerVip: 'VIP Seller' | 'Verified Seller' | 'Master Seller';
  rating: number;
  category: 'GIFT' | 'EGG' | 'FRAME' | 'GEAR' | 'ELEMENT';
  nameUz: string;
  icon: string;
  image?: string;
  priceCoins: number;
  priceGems: number;
  stock: number;
  soldCount: number;
}

export interface FriendPresence {
  id: string;
  name: string;
  avatar: string;
  rankUz: string;
  status: 'ONLINE' | 'OYINDA' | 'JANGDA' | 'MAYNINGDA' | 'OVOZLI_SUHBATDA' | 'BAND' | 'OFFLINE';
  statusLabelUz: string;
  locationUz: string;
  micOn?: boolean;
}

// 10 Continents & Elemental Mining Resources (Section 6)
export const CONTINENTS_10: ContinentMeta[] = [
  {
    id: 'cont-zepharion',
    dragonId: 'zepharion',
    name: 'Zepharion',
    titleUz: 'Osmon va Bo‘ron Qit’asi',
    resourceNameUz: 'Havo kristali',
    resourceCode: 'EL_AIR',
    resourceIcon: '🌪️',
    terrainUz: 'Suzuvchi bulut qoyalari',
    travelBonusUz: 'Zepharion havoda +80% tez uchadi',
    wildBeastName: 'Aero-Grifon',
    wildBeastPower: 1450,
    wildBeastDescUz: 'Bo‘ron qanotli osmon qo‘riqchisi',
    mineCapacityPerDay: 500,
    color: '#38bdf8',
    gradient: 'from-sky-500 to-amber-400',
    image: '/assets/dragons/zepharion.jpg',
    mapX: 22,
    mapY: 18,
  },
  {
    id: 'cont-nythera',
    dragonId: 'nythera',
    name: 'Nythera',
    titleUz: 'Kosmik Bo‘shliq Qit’asi',
    resourceNameUz: 'Kosmik kristall',
    resourceCode: 'EL_COSMOS',
    resourceIcon: '🌌',
    terrainUz: 'Yulduzli tumanlik orollari',
    travelBonusUz: 'Nythera fazoviy portal orqali sayohat qiladi',
    wildBeastName: 'Yulduzli Astral Bo‘ri',
    wildBeastPower: 2100,
    wildBeastDescUz: 'Vaqt oqimini sekinlashtiruvchi maxluq',
    mineCapacityPerDay: 450,
    color: '#a855f7',
    gradient: 'from-purple-700 to-indigo-950',
    image: '/assets/dragons/nythera.jpg',
    mapX: 50,
    mapY: 14,
  },
  {
    id: 'cont-valtor',
    dragonId: 'valtor',
    name: 'Valtor',
    titleUz: 'Vulqon va Lava Qit’asi',
    resourceNameUz: 'Olov kristali',
    resourceCode: 'EL_FIRE',
    resourceIcon: '🔥',
    terrainUz: 'Qaynoq magma tog‘lari',
    travelBonusUz: 'Valtor vulqonli hududlarda to‘siqsiz harakatlanadi',
    wildBeastName: 'Magma Golemi',
    wildBeastPower: 1780,
    wildBeastDescUz: 'Qaynoq lava zirhli dev',
    mineCapacityPerDay: 600,
    color: '#ef4444',
    gradient: 'from-red-600 to-orange-500',
    image: '/assets/dragons/valtor.jpg',
    mapX: 78,
    mapY: 22,
  },
  {
    id: 'cont-sylvanna',
    dragonId: 'sylvanna',
    name: 'Sylvanna',
    titleUz: 'Hayot va O‘rmon Qit’asi',
    resourceNameUz: 'Tabiat kristali',
    resourceCode: 'EL_NATURE',
    resourceIcon: '🌿',
    terrainUz: 'Qadimiy zumrad daraxtzor',
    travelBonusUz: 'Sylvanna o‘rmonlarda jonni +35% tiklaydi',
    wildBeastName: 'Zumrad Ent-Qoplon',
    wildBeastPower: 1390,
    wildBeastDescUz: 'Ildiz va barglar bilan yarani davolovchi maxluq',
    mineCapacityPerDay: 550,
    color: '#10b981',
    gradient: 'from-emerald-600 to-lime-500',
    image: '/assets/dragons/sylvanna.jpg',
    mapX: 18,
    mapY: 46,
  },
  {
    id: 'cont-thalassor',
    dragonId: 'thalassor',
    name: 'Thalassor',
    titleUz: 'Okean va Dengiz Qit’asi',
    resourceNameUz: 'Suv kristali',
    resourceCode: 'EL_WATER',
    resourceIcon: '🌊',
    terrainUz: 'Chuqur marjon arxipelagi',
    travelBonusUz: 'Thalassor suvda +90% tez suzadi',
    wildBeastName: 'Kraken-Leviafan',
    wildBeastPower: 1680,
    wildBeastDescUz: 'Sunami to‘lqinlarini chaqiruvchi dengiz maxluqi',
    mineCapacityPerDay: 550,
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-700',
    image: '/assets/dragons/thalassor.jpg',
    mapX: 42,
    mapY: 44,
  },
  {
    id: 'cont-umbra',
    dragonId: 'umbra',
    name: 'Umbra',
    titleUz: 'Zulmat va Soya Qit’asi',
    resourceNameUz: 'Soya kristali',
    resourceCode: 'EL_SHADOW',
    resourceIcon: '🌑',
    terrainUz: 'Tungi tuman daralari',
    travelBonusUz: 'Umbra soya ichida ko‘rinmas harakat qiladi',
    wildBeastName: 'TungiXayolot Panterasi',
    wildBeastPower: 1720,
    wildBeastDescUz: 'Raqib ongini chalg‘ituvchi soya yirtqichi',
    mineCapacityPerDay: 480,
    color: '#64748b',
    gradient: 'from-slate-800 to-purple-950',
    image: '/assets/dragons/umbra.jpg',
    mapX: 66,
    mapY: 48,
  },
  {
    id: 'cont-auriel',
    dragonId: 'auriel',
    name: 'Auriel',
    titleUz: 'Billur va Nur Qit’asi',
    resourceNameUz: 'Yorug‘lik kristali',
    resourceCode: 'EL_LIGHT',
    resourceIcon: '✨',
    terrainUz: 'Oltin prizma cho‘qqilari',
    travelBonusUz: 'Auriel yorug‘lik qalqoni bilan himoyalanadi',
    wildBeastName: 'Oltin Feniks-Qo‘riqchi',
    wildBeastPower: 1850,
    wildBeastDescUz: 'Billur qanotli muqaddas nur qushi',
    mineCapacityPerDay: 520,
    color: '#eab308',
    gradient: 'from-amber-400 to-yellow-600',
    image: '/assets/dragons/auriel.jpg',
    mapX: 84,
    mapY: 54,
  },
  {
    id: 'cont-drakthar',
    dragonId: 'drakthar',
    name: 'Drakthar',
    titleUz: 'Chaqmoq va Elektr Qit’asi',
    resourceNameUz: 'Elektr kristali',
    resourceCode: 'EL_ELECTRIC',
    resourceIcon: '⚡',
    terrainUz: 'Magnit momaqaldiroq qoyalari',
    travelBonusUz: 'Drakthar chaqmoq tezligida (+100%) ko‘chadi',
    wildBeastName: 'Momaguldurak Yo‘lbarsi',
    wildBeastPower: 1890,
    wildBeastDescUz: 'Elektr yoyi bilan zarba beruvchi yirtqich',
    mineCapacityPerDay: 520,
    color: '#3b82f6',
    gradient: 'from-blue-600 to-indigo-900',
    image: '/assets/dragons/drakthar.jpg',
    mapX: 25,
    mapY: 76,
  },
  {
    id: 'cont-morvaxis',
    dragonId: 'morvaxis',
    name: 'Morvaxis',
    titleUz: 'Suyak va Ruhlar Qit’asi',
    resourceNameUz: 'Ruh kristali',
    resourceCode: 'EL_SPIRIT',
    resourceIcon: '💀',
    terrainUz: 'Qadimiy suyak qal’alari',
    travelBonusUz: 'Morvaxis qadimiy ruhlar energiyasini yig‘adi',
    wildBeastName: 'Suyak Zirhli Skorpion',
    wildBeastPower: 1960,
    wildBeastDescUz: 'O‘lmas suyak qalqonli qo‘riqchi',
    mineCapacityPerDay: 440,
    color: '#94a3b8',
    gradient: 'from-slate-600 to-zinc-900',
    image: '/assets/dragons/morvaxis.jpg',
    mapX: 54,
    mapY: 78,
  },
  {
    id: 'cont-xaldris',
    dragonId: 'xaldris',
    name: 'Xaldris',
    titleUz: 'Barcha Elementlar Markazi',
    resourceNameUz: 'Universal kristall',
    resourceCode: 'EL_UNIVERSAL',
    resourceIcon: '🌈',
    terrainUz: 'Kamalak Imperator Saroyi',
    travelBonusUz: 'Xaldris barcha 10 qit’ada cheksiz harakatlanadi',
    wildBeastName: 'Kamalak Qilin-Ajdar',
    wildBeastPower: 2600,
    wildBeastDescUz: '10 elementni birlashtirgan afsonaviy mavjudot',
    mineCapacityPerDay: 400,
    color: '#ec4899',
    gradient: 'from-rose-500 via-amber-400 to-cyan-500',
    image: '/assets/dragons/xaldris.jpg',
    mapX: 80,
    mapY: 80,
  },
];

// Kingdoms on the Unified World Map (Section 5)
export const INITIAL_KINGDOMS: KingdomMeta[] = [
  {
    id: 'k-turon',
    nameUz: 'Turon Imperiyasi',
    flag: '🦅',
    continentId: 'cont-xaldris',
    rulerName: 'Loyiha Egasi (Siz)',
    commanderName: 'General Sardor',
    agentsCount: 14,
    soldiersCount: 1280,
    economyCoins: 940000,
    miningBasesCount: 8,
    territoriesCount: 12,
    defenseLevel: 10,
    defenseStructuresUz: ['Balkon Olov Minorasi', 'Billur Qalqon Gumbazi', 'Chaqmoq Darvozasi'],
    color: '#f59e0b',
    isPlayerKingdom: true,
  },
  {
    id: 'k-valtor',
    nameUz: 'Valtor Olov Qirolligi',
    flag: '🔥',
    continentId: 'cont-valtor',
    rulerName: 'Hukmdor Amirxon',
    commanderName: 'Polkovnik Jasur',
    agentsCount: 9,
    soldiersCount: 860,
    economyCoins: 540000,
    miningBasesCount: 6,
    territoriesCount: 8,
    defenseLevel: 8,
    defenseStructuresUz: ['Magma Devori', 'Vulqon Katapultasi'],
    color: '#ef4444',
  },
  {
    id: 'k-thalassor',
    nameUz: 'Thalassor Okean Davlati',
    flag: '🌊',
    continentId: 'cont-thalassor',
    rulerName: 'Qirolicha Laylo',
    commanderName: 'Mayor Dilshod',
    agentsCount: 8,
    soldiersCount: 740,
    economyCoins: 480000,
    miningBasesCount: 5,
    territoriesCount: 7,
    defenseLevel: 7,
    defenseStructuresUz: ['Sunami To‘g‘oni', 'Muz Qalqoni'],
    color: '#06b6d4',
  },
  {
    id: 'k-nythera',
    nameUz: 'Nythera Kosmik Ittifoqi',
    flag: '🌌',
    continentId: 'cont-nythera',
    rulerName: 'Lord Abrorbek',
    commanderName: 'Podpolkovnik Ulug‘bek',
    agentsCount: 11,
    soldiersCount: 950,
    economyCoins: 690000,
    miningBasesCount: 7,
    territoriesCount: 9,
    defenseLevel: 9,
    defenseStructuresUz: ['Gravitatsiya Minorasi', 'Yulduz Qopqoni'],
    color: '#a855f7',
  },
  {
    id: 'k-sylvanna',
    nameUz: 'Sylvanna Zumrad Davlati',
    flag: '🌿',
    continentId: 'cont-sylvanna',
    rulerName: 'Malika Madina',
    commanderName: 'Kapitan Otabek',
    agentsCount: 7,
    soldiersCount: 620,
    economyCoins: 410000,
    miningBasesCount: 5,
    territoriesCount: 6,
    defenseLevel: 7,
    defenseStructuresUz: ['Qadimiy Ildiz Qal’asi', 'Hayot Bulog‘i'],
    color: '#10b981',
  },
];

// 10 Military Ranks (Section 7)
export const MILITARY_RANKS_10: MilitaryRankMeta[] = [
  { level: 1, titleUz: 'Rekrut', badge: '🪖', minServiceXp: 0, perksUz: 'Boshlang‘ich askar inventari va mashg‘ulot' },
  { level: 2, titleUz: 'Oddiy askar', badge: '⚔️', minServiceXp: 200, perksUz: 'Davlat janglarida qatnashish huquqi' },
  { level: 3, titleUz: 'Kichik serjant', badge: '🛡️', minServiceXp: 500, perksUz: '+5% Mayning tezligi va kichik guruh' },
  { level: 4, titleUz: 'Serjant', badge: '🎖️', minServiceXp: 1000, perksUz: '+10% Himoya va element qayta ishlash' },
  { level: 5, titleUz: 'Leytenant', badge: '⭐', minServiceXp: 2000, perksUz: 'Vzvod komandiri va maxluq egari' },
  { level: 6, titleUz: 'Kapitan', badge: '⭐⭐', minServiceXp: 3500, perksUz: 'Batalyon boshqaruvi va +15% Jang kuchi' },
  { level: 7, titleUz: 'Mayor', badge: '🦅', minServiceXp: 5500, perksUz: 'Qit’a garnizoni nazorati' },
  { level: 8, titleUz: 'Podpolkovnik', badge: '👑⚔️', minServiceXp: 8000, perksUz: 'Maxsus ajdarho zirhi va elit bo‘linma' },
  { level: 9, titleUz: 'Polkovnik', badge: '🔥👑', minServiceXp: 12000, perksUz: 'Davlat fronti qo‘mondoni' },
  { level: 10, titleUz: 'General', badge: '🐉👑', minServiceXp: 18000, perksUz: 'Oliy Harbiy Qo‘mondon • Barcha armiya nazorati' },
];

// 8 App Governance Roles (Section 7 & 10)
export const APP_GOVERNANCE_ROLES = [
  {
    code: 'OWNER',
    titleUz: 'LOYIHA EGASI — SIZ',
    badge: '👑',
    descUz: 'Yakuniy va mutlaq egalik nazorati. Manager sizning ruxsatingizsiz egani o‘zgartira olmaydi.',
    color: 'from-amber-400 via-yellow-500 to-rose-500',
  },
  {
    code: 'MANAGER',
    titleUz: 'MANAGER',
    badge: '🏛️',
    descUz: 'Eng katta tayinlangan operatsion rahbar. Barcha bo‘limlarning kundalik boshqaruvi.',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    code: 'SUPER_ADMIN',
    titleUz: 'SUPER ADMIN',
    badge: '🛡️',
    descUz: 'Texnik va tizim boshqaruvi, serverlar, xavfsizlik va 24 ta ma’lumotlar bazasi jadvali.',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    code: 'ADMIN',
    titleUz: 'ADMIN',
    badge: '⚖️',
    descUz: 'Umumiy moderatsiya, chat va xonalar nazorati, bloklash va shikoyatlar.',
    color: 'from-emerald-600 to-teal-500',
  },
  {
    code: 'AGENT',
    titleUz: 'AGENT',
    badge: '🎖️',
    descUz: 'Davlat va harbiy nazorat, askarlar unvonlari (1-10) va jang guruhlari.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    code: 'HOST',
    titleUz: 'HOST',
    badge: '🎤',
    descUz: 'Tadbirlar va janglar tashkilotchisi, turnir jadvali va e’lonlar.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    code: 'BOSHLOVCHI',
    titleUz: 'BOSHLOVCHI',
    badge: '📣',
    descUz: 'Yangi askarlarni taklif qilish, ro‘yxatdan o‘tkazish va davlatga biriktirish.',
    color: 'from-cyan-500 to-sky-600',
  },
  {
    code: 'ASKAR',
    titleUz: 'ASKARLAR',
    badge: '⚔️',
    descUz: 'Foydalanuvchilar, ajdarho chavandozlari, konchilar va davlat jangchilari.',
    color: 'from-slate-600 to-slate-800',
  },
] as const;

// Soldier Inventory Items (8 Categories — Section 7)
export const SOLDIER_INVENTORY_CATALOG: SoldierGearItem[] = [
  {
    id: 'gear-sword-valtor',
    category: 'QILICH',
    categoryUz: 'Qilich',
    nameUz: 'Valtor Olov Qilichi',
    icon: '🗡️',
    elementUz: 'Olov',
    powerBonus: 320,
    defenseBonus: 40,
    priceCoins: 2500,
    priceGems: 15,
    requiredElementCode: 'EL_FIRE',
    requiredElementQty: 25,
  },
  {
    id: 'gear-shield-auriel',
    category: 'QALQON',
    categoryUz: 'Qalqon',
    nameUz: 'Auriel Billur Qalqoni',
    icon: '🛡️',
    elementUz: 'Yorug‘lik',
    powerBonus: 60,
    defenseBonus: 380,
    priceCoins: 2400,
    priceGems: 15,
    requiredElementCode: 'EL_LIGHT',
    requiredElementQty: 25,
  },
  {
    id: 'gear-bow-zepharion',
    category: 'KAMON',
    categoryUz: 'Kamon',
    nameUz: 'Zepharion Bo‘ron Kamoni',
    icon: '🏹',
    elementUz: 'Havo',
    powerBonus: 290,
    defenseBonus: 50,
    priceCoins: 2200,
    priceGems: 12,
    requiredElementCode: 'EL_AIR',
    requiredElementQty: 20,
  },
  {
    id: 'gear-armor-morvaxis',
    category: 'ZIRH',
    categoryUz: 'Zirh',
    nameUz: 'Morvaxis Suyak Zirhi',
    icon: '🥋',
    elementUz: 'Ruh',
    powerBonus: 110,
    defenseBonus: 420,
    priceCoins: 3200,
    priceGems: 20,
    requiredElementCode: 'EL_SPIRIT',
    requiredElementQty: 30,
  },
  {
    id: 'gear-elem-drakthar',
    category: 'ELEMENT_QUROL',
    categoryUz: 'Element qurollari',
    nameUz: 'Drakthar Chaqmoq Nayzasi',
    icon: '⚡',
    elementUz: 'Elektr',
    powerBonus: 450,
    defenseBonus: 90,
    priceCoins: 4200,
    priceGems: 28,
    requiredElementCode: 'EL_ELECTRIC',
    requiredElementQty: 40,
  },
  {
    id: 'gear-saddle-xaldris',
    category: 'EGAR',
    categoryUz: 'Maxluq uchun egar',
    nameUz: 'Oltin Imperator Egari',
    icon: '🐎',
    elementUz: 'Universal',
    powerBonus: 240,
    defenseBonus: 260,
    priceCoins: 3800,
    priceGems: 25,
    requiredElementCode: 'EL_UNIVERSAL',
    requiredElementQty: 20,
  },
  {
    id: 'gear-beastarmor-nythera',
    category: 'MAXLUQ_ZIRHI',
    categoryUz: 'Maxluq zirhi',
    nameUz: 'Nythera Kosmik Ajdar Zirhi',
    icon: '🐉',
    elementUz: 'Kosmos',
    powerBonus: 390,
    defenseBonus: 520,
    priceCoins: 5500,
    priceGems: 40,
    requiredElementCode: 'EL_COSMOS',
    requiredElementQty: 45,
  },
  {
    id: 'gear-outfit-general',
    category: 'MAXSUS_KIYIM',
    categoryUz: 'Maxsus kiyimlar',
    nameUz: 'General Parad Libosi',
    icon: '👑',
    elementUz: 'Universal',
    powerBonus: 300,
    defenseBonus: 300,
    priceCoins: 4800,
    priceGems: 35,
  },
];

// Seller Marketplace Products (Section 9)
export const INITIAL_SELLER_PRODUCTS: SellerShopItem[] = [
  {
    id: 'sel-egg-zepharion',
    sellerName: 'DragonMaster Uz',
    sellerVip: 'VIP Seller',
    rating: 4.9,
    category: 'EGG',
    nameUz: 'Zepharion Oltin Tuxumi',
    icon: '🥚',
    image: '/assets/dragons/zepharion.jpg',
    priceCoins: 4500,
    priceGems: 30,
    stock: 8,
    soldCount: 142,
  },
  {
    id: 'sel-egg-valtor',
    sellerName: 'Tashkent Forge',
    sellerVip: 'Master Seller',
    rating: 5.0,
    category: 'EGG',
    nameUz: 'Valtor Vulqon Tuxumi',
    icon: '🥚',
    image: '/assets/dragons/valtor.jpg',
    priceCoins: 5200,
    priceGems: 35,
    stock: 5,
    soldCount: 98,
  },
  {
    id: 'sel-frame-gold1',
    sellerName: 'Luxury Studio',
    sellerVip: 'VIP Seller',
    rating: 4.9,
    category: 'FRAME',
    nameUz: 'Qirollik #1 Animatsiyali Ramka',
    icon: '🖼️',
    image: '/assets/frames/frame-gold-1.webp',
    priceCoins: 2200,
    priceGems: 15,
    stock: 20,
    soldCount: 310,
  },
  {
    id: 'sel-elem-pack',
    sellerName: 'Konchi General',
    sellerVip: 'Verified Seller',
    rating: 4.8,
    category: 'ELEMENT',
    nameUz: '100x Olov va Kosmik Kristall To‘plami',
    icon: '💎',
    image: '/assets/crystals/amethyst.webp',
    priceCoins: 1800,
    priceGems: 10,
    stock: 35,
    soldCount: 215,
  },
];

// Friend Statuses in Voice Room & World (Section 8)
export const FRIEND_PRESENCE_LIST: FriendPresence[] = [
  {
    id: 'fr-1',
    name: 'Madina 🎵',
    avatar: '/assets/avatar-madina.jpg',
    rankUz: 'Kapitan',
    status: 'OVOZLI_SUHBATDA',
    statusLabelUz: 'Ovozli suhbatda',
    locationUz: 'Do‘stlar xonasi (Mikrofon yoqilgan)',
    micOn: true,
  },
  {
    id: 'fr-2',
    name: 'Sardor Prime',
    avatar: '/assets/avatar-sardor.jpg',
    rankUz: 'General',
    status: 'JANGDA',
    statusLabelUz: 'Jangda',
    locationUz: 'Balkon Arenasi: Valtor vs Thalassor',
    micOn: true,
  },
  {
    id: 'fr-3',
    name: 'Abrorbek 🐉',
    avatar: '/assets/avatar-abrorbek.jpg',
    rankUz: 'Polkovnik',
    status: 'MAYNINGDA',
    statusLabelUz: 'Mayningda',
    locationUz: 'Nythera Qit’asi • Kosmik Shaxta #3',
    micOn: true,
  },
  {
    id: 'fr-4',
    name: 'Laylo 🌙',
    avatar: '/assets/avatar-laylo.jpg',
    rankUz: 'Leytenant',
    status: 'OYINDA',
    statusLabelUz: 'O‘yinda',
    locationUz: 'Xaldris Qit’asi bo‘ylab sayohatda',
    micOn: false,
  },
  {
    id: 'fr-5',
    name: 'Jasur VIP',
    avatar: '/assets/avatar-jasur.jpg',
    rankUz: 'Mayor',
    status: 'ONLINE',
    statusLabelUz: 'Online',
    locationUz: 'Seller Marketda savdo qilmoqda',
    micOn: false,
  },
  {
    id: 'fr-6',
    name: 'Dilshod Bek',
    avatar: '/assets/avatar-azizbek.jpg',
    rankUz: 'Serjant',
    status: 'BAND',
    statusLabelUz: 'Band',
    locationUz: 'Harbiy Kengash yig‘ilishida',
    micOn: false,
  },
  {
    id: 'fr-7',
    name: 'Otabek',
    avatar: '/assets/avatar-sardor.jpg',
    rankUz: 'Oddiy askar',
    status: 'OFFLINE',
    statusLabelUz: 'Offline',
    locationUz: '20 daqiqa oldin faol edi',
    micOn: false,
  },
];

// 24 Database Tables (Section 12)
export const DATABASE_24_TABLES = [
  { table: 'Users', purposeUz: 'Foydalanuvchilar va yagona akkaunt sessiyasi', rows: 14820 },
  { table: 'Profiles', purposeUz: 'Profillar, avatarlar va ramkalar', rows: 14820 },
  { table: 'Roles', purposeUz: '8 ta boshqaruv lavozimi (Owner -> Askar)', rows: 8 },
  { table: 'Permissions', purposeUz: 'Xavfsizlik va rol ruxsatlari', rows: 64 },
  { table: 'ChatRooms', purposeUz: 'Chat va do‘stlar xonalari', rows: 420 },
  { table: 'VoiceRooms', purposeUz: 'WebRTC ovozli suhbat xonalari', rows: 185 },
  { table: 'VoiceParticipants', purposeUz: 'Ovozli xona faol a’zolari', rows: 1240 },
  { table: 'Messages', purposeUz: 'Real-vaqt WebSocket xabarlari', rows: 894000 },
  { table: 'Continents', purposeUz: '10 ta afsonaviy qit’a', rows: 10 },
  { table: 'Kingdoms', purposeUz: 'Davlatlar va ularning hukmdorlari', rows: 25 },
  { table: 'Territories', purposeUz: 'Egallanadigan o‘yin hududlari', rows: 120 },
  { table: 'Beasts', purposeUz: '20 ta maxluq (10 Ajdarho + 10 Qit’a maxluqi)', rows: 20 },
  { table: 'UserBeasts', purposeUz: 'Foydalanuvchi maxluqlari va evolyutsiyasi', rows: 38400 },
  { table: 'BeastSkills', purposeUz: 'Balkon olov va element hujum qobiliyatlari', rows: 80 },
  { table: 'Inventories', purposeUz: 'Askar inventari (Qilich, Qalqon, Zirh, Egar)', rows: 92500 },
  { table: 'MiningBases', purposeUz: 'Kunlik limitli mayning shaxtalari', rows: 6400 },
  { table: 'Resources', purposeUz: '10 xil qazib olinadigan element kristallari', rows: 10 },
  { table: 'Battles', purposeUz: 'Balkon 1v1 va Davlatlararo strategik janglar', rows: 45200 },
  { table: 'Armies', purposeUz: 'Harbiy bo‘linmalar va 1-10 unvonlar', rows: 310 },
  { table: 'Gifts', purposeUz: 'Ajdarho, Tuxum, Element va VIP sovg‘alar', rows: 48 },
  { table: 'Market', purposeUz: 'Seller virtual do‘konlari va mahsulotlar', rows: 2850 },
  { table: 'Wallets', purposeUz: 'WORLD COIN, WORLD GEM va ELEMENT hisoblari', rows: 14820 },
  { table: 'Transactions', purposeUz: 'Audit qilinadigan barcha virtual amaliyotlar', rows: 312000 },
];

export const TECH_STACK_SPECS = [
  { systemUz: 'Android va iPhone', tech: 'Flutter', status: 'FAOL' },
  { systemUz: 'Web ilova', tech: 'Next.js / React', status: 'FAOL' },
  { systemUz: 'Backend', tech: 'NestJS', status: 'FAOL' },
  { systemUz: 'Ma’lumotlar bazasi', tech: 'PostgreSQL (24 jadval)', status: 'FAOL' },
  { systemUz: 'Chat', tech: 'WebSocket', status: 'FAOL' },
  { systemUz: 'Ovozli aloqa', tech: 'WebRTC', status: 'FAOL' },
  { systemUz: 'O‘yin xaritasi va Jang', tech: 'Phaser / PixiJS Canvas', status: 'FAOL' },
  { systemUz: 'Real vaqt kesh', tech: 'Redis', status: 'FAOL' },
  { systemUz: 'Fayllar va Animatsiya', tech: 'S3-compatible storage', status: 'FAOL' },
  { systemUz: '7 ta Boshqaruv paneli', tech: 'React Owner/Manager Suite', status: 'FAOL' },
];
