export type DragonThemeId =
  | 'black-gold'
  | 'purple-neon'
  | 'ice-blue'
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

export const DEFAULT_DRAGON_THEME_ID: DragonThemeId = 'black-gold';

export const DRAGON_THEMES: DragonThemeSpec[] = [
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
    id: 'ice-blue',
    emoji: '🔵',
    nameUz: 'Muz-ko‘k',
    shortUz: 'Muz',
    taglineUz: 'Sovuq va hashamatli',
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
    emoji: '🌌',
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
