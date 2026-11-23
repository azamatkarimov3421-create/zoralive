export type DragonThemeId =
  | 'twin-ice-dragons'
  | 'ice-blue'
  | 'diamond-citadel'
  | 'sapphire-aurora'
  | 'black-gold'
  | 'purple-neon'
  | 'fire-red'
  | 'emerald-green'
  | 'cosmic-galaxy';

export interface DragonThemeSpec {
  id: DragonThemeId;
  emoji: string;
  nameUz: string;
  shortUz: string;
  taglineUz: string;
  bgImage: string;
  crownStroke: string;
  crownGlow: string;
  dragonGlow: string;
  borderColor: string;
  cardShadow: string;
  activePillClass: string;
  accentDot: string;
}

export const DEFAULT_DRAGON_THEME_ID: DragonThemeId = 'twin-ice-dragons';

export const DRAGON_THEMES: DragonThemeSpec[] = [
  {
    id: 'twin-ice-dragons',
    emoji: '🐲',
    nameUz: 'Qo‘sh Muz Ajdari',
    shortUz: 'Qo‘sh Ajdar',
    taglineUz: 'Ikkita ulug‘vor muz ajdari va billur spayrlar',
    bgImage: '/assets/dragon-themes/twin-ice-dragons.jpg',
    crownStroke: '#67e8f9',
    crownGlow: 'rgba(6, 182, 212, 0.95)',
    dragonGlow: 'rgba(34, 211, 238, 0.55)',
    borderColor: 'rgba(34, 211, 238, 0.85)',
    cardShadow: '0 10px 32px -6px rgba(6, 182, 212, 0.52), inset 0 0 24px rgba(34, 211, 238, 0.2)',
    activePillClass: 'bg-cyan-500/30 border-cyan-300 text-cyan-100 shadow-[0_0_14px_rgba(6,182,212,0.6)]',
    accentDot: '#06b6d4',
  },
  {
    id: 'ice-blue',
    emoji: '❄️',
    nameUz: 'Muz Qasri',
    shortUz: 'Muz Qasri',
    taglineUz: 'Loyiha egasiga yoqqan asl billur ustunlar',
    bgImage: '/assets/dragon-themes/ice-blue.jpg',
    crownStroke: '#7dd3fc',
    crownGlow: 'rgba(56, 189, 248, 0.95)',
    dragonGlow: 'rgba(56, 189, 248, 0.45)',
    borderColor: 'rgba(56, 189, 248, 0.78)',
    cardShadow: '0 10px 32px -6px rgba(14, 165, 233, 0.48), inset 0 0 24px rgba(56, 189, 248, 0.18)',
    activePillClass: 'bg-sky-400/25 border-sky-300 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.55)]',
    accentDot: '#0ea5e9',
  },
  {
    id: 'diamond-citadel',
    emoji: '💎',
    nameUz: 'Olmos Qasr',
    shortUz: 'Olmos Billur',
    taglineUz: 'Yorqin olmos spayrlar va yulduzli arktika',
    bgImage: '/assets/dragon-themes/diamond-citadel.jpg',
    crownStroke: '#e0f2fe',
    crownGlow: 'rgba(186, 230, 253, 0.95)',
    dragonGlow: 'rgba(125, 211, 252, 0.45)',
    borderColor: 'rgba(186, 230, 253, 0.82)',
    cardShadow: '0 10px 32px -6px rgba(56, 189, 248, 0.48), inset 0 0 24px rgba(186, 230, 253, 0.22)',
    activePillClass: 'bg-sky-300/30 border-white text-white shadow-[0_0_14px_rgba(224,242,254,0.65)]',
    accentDot: '#38bdf8',
  },
  {
    id: 'sapphire-aurora',
    emoji: '🌌',
    nameUz: 'Safir Qutb Yog‘dusi',
    shortUz: 'Qutb Nuri',
    taglineUz: 'Moviy-feruza qutb yog‘dusi va safir kristallari',
    bgImage: '/assets/dragon-themes/sapphire-aurora.jpg',
    crownStroke: '#38bdf8',
    crownGlow: 'rgba(14, 165, 233, 0.95)',
    dragonGlow: 'rgba(45, 212, 191, 0.5)',
    borderColor: 'rgba(56, 189, 248, 0.8)',
    cardShadow: '0 10px 32px -6px rgba(14, 165, 233, 0.52), inset 0 0 24px rgba(45, 212, 191, 0.2)',
    activePillClass: 'bg-teal-500/30 border-teal-300 text-teal-100 shadow-[0_0_14px_rgba(20,184,166,0.6)]',
    accentDot: '#14b8a6',
  },
  {
    id: 'black-gold',
    emoji: '🟡',
    nameUz: 'Qora-oltin',
    shortUz: 'Oltin',
    taglineUz: 'VIP va premium ko‘rinish',
    bgImage: '/assets/dragon-themes/black-gold.jpg',
    crownStroke: '#fde047',
    crownGlow: 'rgba(250, 204, 21, 0.92)',
    dragonGlow: 'rgba(245, 158, 11, 0.45)',
    borderColor: 'rgba(251, 191, 36, 0.72)',
    cardShadow: '0 10px 32px -6px rgba(245, 158, 11, 0.42), inset 0 0 24px rgba(245, 158, 11, 0.16)',
    activePillClass: 'bg-amber-400/25 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    accentDot: '#f59e0b',
  },
  {
    id: 'purple-neon',
    emoji: '🟣',
    nameUz: 'Binafsha',
    shortUz: 'Binafsha',
    taglineUz: 'Neon, futuristik',
    bgImage: '/assets/dragon-themes/purple-neon.jpg',
    crownStroke: '#d8b4fe',
    crownGlow: 'rgba(192, 132, 252, 0.95)',
    dragonGlow: 'rgba(168, 85, 247, 0.5)',
    borderColor: 'rgba(192, 132, 252, 0.75)',
    cardShadow: '0 10px 32px -6px rgba(168, 85, 247, 0.48), inset 0 0 24px rgba(168, 85, 247, 0.18)',
    activePillClass: 'bg-purple-500/30 border-purple-300 text-purple-100 shadow-[0_0_12px_rgba(192,132,252,0.55)]',
    accentDot: '#a855f7',
  },
  {
    id: 'fire-red',
    emoji: '🔴',
    nameUz: 'Olovli',
    shortUz: 'Olovli',
    taglineUz: 'Kuchli va agressiv',
    bgImage: '/assets/dragon-themes/fire-red.jpg',
    crownStroke: '#fdba74',
    crownGlow: 'rgba(249, 115, 22, 0.95)',
    dragonGlow: 'rgba(239, 68, 68, 0.5)',
    borderColor: 'rgba(249, 115, 22, 0.78)',
    cardShadow: '0 10px 32px -6px rgba(239, 68, 68, 0.48), inset 0 0 24px rgba(249, 115, 22, 0.18)',
    activePillClass: 'bg-orange-500/30 border-orange-300 text-orange-100 shadow-[0_0_12px_rgba(249,115,22,0.55)]',
    accentDot: '#ef4444',
  },
  {
    id: 'emerald-green',
    emoji: '🟢',
    nameUz: 'Zumrad-yashil',
    shortUz: 'Zumrad',
    taglineUz: 'Ajdarho mavzusiga mos',
    bgImage: '/assets/dragon-themes/emerald-green.jpg',
    crownStroke: '#86efac',
    crownGlow: 'rgba(74, 222, 128, 0.95)',
    dragonGlow: 'rgba(16, 185, 129, 0.48)',
    borderColor: 'rgba(52, 211, 153, 0.75)',
    cardShadow: '0 10px 32px -6px rgba(16, 185, 129, 0.45), inset 0 0 24px rgba(16, 185, 129, 0.18)',
    activePillClass: 'bg-emerald-500/30 border-emerald-300 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.55)]',
    accentDot: '#10b981',
  },
  {
    id: 'cosmic-galaxy',
    emoji: '🪐',
    nameUz: 'Kosmik',
    shortUz: 'Kosmik',
    taglineUz: 'Galaktika uslubi',
    bgImage: '/assets/dragon-themes/cosmic-galaxy.jpg',
    crownStroke: '#e879f9',
    crownGlow: 'rgba(217, 70, 239, 0.95)',
    dragonGlow: 'rgba(192, 38, 211, 0.48)',
    borderColor: 'rgba(217, 70, 239, 0.75)',
    cardShadow: '0 10px 32px -6px rgba(139, 92, 246, 0.5), inset 0 0 24px rgba(217, 70, 239, 0.18)',
    activePillClass: 'bg-fuchsia-500/30 border-fuchsia-300 text-fuchsia-100 shadow-[0_0_12px_rgba(217,70,239,0.55)]',
    accentDot: '#c026d3',
  },
];

export function getDragonTheme(id?: string | null): DragonThemeSpec {
  return DRAGON_THEMES.find((t) => t.id === id) || DRAGON_THEMES[0];
}
