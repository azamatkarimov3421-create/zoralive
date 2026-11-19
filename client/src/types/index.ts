export type Lang = 'uz' | 'ru' | 'en';

export interface User {
  id: string;
  uid: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  country: string;
  gender: string;
  role: 'USER' | 'HOST' | 'AGENCY' | 'ADMIN';
  coins: number;
  diamonds: number;
  wealthXp: number;
  charmXp: number;
  wealthLevel: number;
  wealthProgress: number;
  wealthNextXp: number;
  charmLevel: number;
  charmProgress: number;
  charmNextXp: number;
  vipLevel: number;
  vipExpiresAt: string | null;
  activeFrame: string;
  activeRide: string;
  activeBubble: string;
  agencyId: string | null;
  isBanned: boolean;
  hostedMinutes: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  agency?: any;
  inventory?: any[];
}

export interface RoomSummary {
  id: string;
  roomNumber: number;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostFrame: string;
  hostVip: number;
  hostUid: number;
  title: string;
  type: 'VOICE' | 'VIDEO' | 'GAME';
  theme: string;
  cover: string;
  country: string;
  seatCount: number;
  isLive: boolean;
  isFeatured: boolean;
  totalGifts: number;
  viewerCount: number;
  hasPk: boolean;
  occupiedSeats: number;
}

export interface SeatState {
  index: number;
  userId: string | null;
  socketId: string | null;
  displayName: string;
  avatar: string;
  frame: string;
  vipLevel: number;
  isMuted: boolean;
  isLocked: boolean;
  isSpeaking: boolean;
  isDemoBot?: boolean;
}

export interface PkState {
  active: boolean;
  leftHostId: string;
  leftName: string;
  leftAvatar: string;
  leftScore: number;
  rightHostId: string;
  rightName: string;
  rightAvatar: string;
  rightScore: number;
  endsAt: number;
  durationSec: number;
  winner: 'left' | 'right' | 'draw' | null;
}

export interface RoomChatMessage {
  id: string;
  type: 'CHAT' | 'SYSTEM' | 'GIFT';
  userId?: string;
  displayName?: string;
  avatar?: string;
  wealthLevel?: number;
  vipLevel?: number;
  bubble?: string;
  text: string;
  createdAt: string;
}

export interface GiftItem {
  id: string;
  name: string;
  name_uz: string;
  icon: string;
  category: 'BASIC' | 'LUCKY' | 'LUXURY';
  price: number;
  effect_type: 'pulse' | 'burst' | 'banner' | 'fullscreen';
  accent_color: string;
}

export interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  effectType: string;
  accentColor: string;
  category: string;
  quantity: number;
  totalCost: number;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderVip: number;
  receiverId: string;
  receiverName: string;
  roomTotalGifts: number;
}

export interface LudoPlayer {
  id: string;
  name: string;
  avatar: string;
  color: 'red' | 'green' | 'yellow' | 'blue';
  isBot: boolean;
  tokens: [number, number, number, number];
}

export interface LudoGameState {
  gameId: string;
  roomId?: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  entryFee: number;
  pot: number;
  players: LudoPlayer[];
  turnIndex: number;
  dice: number | null;
  phase: 'ROLL' | 'MOVE';
  validMoves: number[];
  winnerId: string | null;
  winnerName: string | null;
  lastEvent: string;
  updatedAt: number;
}
