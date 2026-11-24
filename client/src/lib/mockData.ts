import { GiftItem } from '../types';
import { MYTHIC_DRAGONS } from './mythicCatalog';

export const MOCK_GIFTS: GiftItem[] = [
  // Basic
  { id: 'gift-rose', name: 'Rose', name_uz: 'Atirgul', icon: '🌹', category: 'BASIC', price: 0, effect_type: 'pulse', accent_color: '#f43f5e' },
  { id: 'gift-coffee', name: 'Coffee', name_uz: 'Qahva', icon: '☕', category: 'BASIC', price: 0, effect_type: 'pulse', accent_color: '#d97706' },
  { id: 'gift-heart', name: 'Neon Heart', name_uz: 'Neon Yurak', icon: '💖', category: 'BASIC', price: 0, effect_type: 'burst', accent_color: '#ec4899' },
  { id: 'gift-mic', name: 'Golden Mic', name_uz: 'Oltin Mikrofon', icon: '🎤', category: 'BASIC', price: 0, effect_type: 'burst', accent_color: '#eab308' },
  // Lucky
  { id: 'gift-clover', name: 'Lucky Clover', name_uz: 'Omad Bargi', icon: '🍀', category: 'LUCKY', price: 0, effect_type: 'burst', accent_color: '#10b981' },
  { id: 'gift-dice', name: 'Magic Dice', name_uz: 'Sehrli Zarik', icon: '🎲', category: 'LUCKY', price: 0, effect_type: 'banner', accent_color: '#8b5cf6' },
  { id: 'gift-ring', name: 'Diamond Ring', name_uz: 'Olmos Uzuk', icon: '💍', category: 'LUCKY', price: 0, effect_type: 'banner', accent_color: '#38bdf8' },
  // Classic Luxury
  { id: 'gift-crown', name: 'Royal Crown', name_uz: 'Qirol Toji', icon: '👑', category: 'LUXURY', price: 0, effect_type: 'fullscreen', accent_color: '#facc15' },
  { id: 'gift-car', name: 'Hypercar', name_uz: 'Sport Mashina', icon: '🏎️', category: 'LUXURY', price: 0, effect_type: 'fullscreen', accent_color: '#ef4444' },
  { id: 'gift-yacht', name: 'Luxury Yacht', name_uz: 'Oltin Yaxta', icon: '🛥️', category: 'LUXURY', price: 0, effect_type: 'fullscreen', accent_color: '#06b6d4' },
  { id: 'gift-dragon', name: 'Golden Dragon', name_uz: 'Oltin Ajdarho', icon: '🐉', category: 'LUXURY', price: 0, effect_type: 'fullscreen', accent_color: '#f59e0b' },
  // All 10 Mythical Dragons!
  ...MYTHIC_DRAGONS.map((d): GiftItem => ({
    id: d.giftId,
    name: d.name,
    name_uz: `${d.name} (${d.titleUz})`,
    icon: '🐉',
    category: 'LUXURY',
    price: d.giftPrice,
    effect_type: 'fullscreen',
    accent_color: d.accent,
  })),
];
