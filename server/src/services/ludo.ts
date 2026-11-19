export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoPlayer {
  id: string;
  name: string;
  avatar: string;
  color: LudoColor;
  isBot: boolean;
  // Each of 4 tokens has progress:
  // -1 = in base yard
  // 0..50 = on shared 52-tile ring (relative to color start offset)
  // 51..55 = on colored home stretch (5 steps)
  // 56 = finished in home center!
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
  validMoves: number[]; // token indices 0..3
  winnerId: string | null;
  winnerName: string | null;
  lastEvent: string;
  updatedAt: number;
}

export const COLOR_ORDER: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
export const START_OFFSET: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};
// Global ring indices (0..51) where tokens cannot be captured
export const SAFE_GLOBAL_TILES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export function toGlobalTile(color: LudoColor, progress: number): number | null {
  if (progress < 0 || progress > 50) return null;
  return (START_OFFSET[color] + progress) % 52;
}

export function createLudoGame(
  gameId: string,
  host: { id: string; name: string; avatar: string },
  entryFee = 100,
  roomId?: string
): LudoGameState {
  return {
    gameId,
    roomId,
    status: 'WAITING',
    entryFee,
    pot: entryFee,
    players: [
      {
        id: host.id,
        name: host.name,
        avatar: host.avatar,
        color: 'red',
        isBot: false,
        tokens: [-1, -1, -1, -1],
      },
    ],
    turnIndex: 0,
    dice: null,
    phase: 'ROLL',
    validMoves: [],
    winnerId: null,
    winnerName: null,
    lastEvent: `${host.name} Ludo stolini ochdi`,
    updatedAt: Date.now(),
  };
}

export function addLudoPlayer(
  state: LudoGameState,
  player: { id: string; name: string; avatar: string; isBot?: boolean }
): LudoGameState {
  if (state.status !== 'WAITING') return state;
  if (state.players.some((p) => p.id === player.id)) return state;
  if (state.players.length >= 4) return state;

  const color = COLOR_ORDER[state.players.length];
  state.players.push({
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    color,
    isBot: Boolean(player.isBot),
    tokens: [-1, -1, -1, -1],
  });
  state.pot = state.entryFee * state.players.length;
  state.lastEvent = `${player.name} o‘yinga qo‘shildi`;
  state.updatedAt = Date.now();
  return state;
}

export function fillWithBotsAndStart(state: LudoGameState, targetPlayers = 4): LudoGameState {
  const botNames = ['Bot Amir', 'Bot Malika', 'Bot Timur', 'Bot Zilola'];
  const count = Math.max(2, Math.min(4, targetPlayers));
  let bIdx = 0;
  while (state.players.length < count) {
    const color = COLOR_ORDER[state.players.length];
    const name = botNames[bIdx % botNames.length];
    bIdx++;
    state.players.push({
      id: `bot-${state.gameId}-${state.players.length}`,
      name,
      avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      color,
      isBot: true,
      tokens: [-1, -1, -1, -1],
    });
  }
  state.pot = state.entryFee * state.players.length;
  state.status = 'PLAYING';
  state.turnIndex = 0;
  state.phase = 'ROLL';
  state.dice = null;
  state.validMoves = [];
  state.lastEvent = `O‘yin boshlandi! Navbat: ${state.players[0].name}`;
  state.updatedAt = Date.now();
  return state;
}

export function computeValidMoves(player: LudoPlayer, dice: number): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 4; i++) {
    const pos = player.tokens[i];
    if (pos === -1) {
      if (dice === 6) moves.push(i);
    } else if (pos < 56 && pos + dice <= 56) {
      moves.push(i);
    }
  }
  return moves;
}

export function rollLudoDice(state: LudoGameState, playerId: string): {
  state: LudoGameState;
  autoSkipped: boolean;
} {
  if (state.status !== 'PLAYING' || state.phase !== 'ROLL') {
    return { state, autoSkipped: false };
  }
  const current = state.players[state.turnIndex];
  if (!current || current.id !== playerId) {
    return { state, autoSkipped: false };
  }

  const dice = Math.floor(Math.random() * 6) + 1;
  state.dice = dice;
  const moves = computeValidMoves(current, dice);

  if (moves.length === 0) {
    state.lastEvent = `${current.name} ${dice} tashladi — yurish yo‘q`;
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    state.phase = 'ROLL';
    state.validMoves = [];
    state.updatedAt = Date.now();
    return { state, autoSkipped: true };
  }

  state.phase = 'MOVE';
  state.validMoves = moves;
  state.lastEvent = `${current.name} ${dice} tashladi! Toshni tanlang`;
  state.updatedAt = Date.now();
  return { state, autoSkipped: false };
}

export function moveLudoToken(
  state: LudoGameState,
  playerId: string,
  tokenIndex: number
): { state: LudoGameState; captured: boolean; finished: boolean } {
  if (state.status !== 'PLAYING' || state.phase !== 'MOVE' || state.dice === null) {
    return { state, captured: false, finished: false };
  }
  const current = state.players[state.turnIndex];
  if (!current || current.id !== playerId) {
    return { state, captured: false, finished: false };
  }
  if (!state.validMoves.includes(tokenIndex)) {
    return { state, captured: false, finished: false };
  }

  const dice = state.dice;
  const oldPos = current.tokens[tokenIndex];
  const newPos = oldPos === -1 ? 0 : oldPos + dice;
  current.tokens[tokenIndex] = newPos;

  let captured = false;
  let reachedHome = newPos === 56;
  const globalPos = toGlobalTile(current.color, newPos);

  if (globalPos !== null && !SAFE_GLOBAL_TILES.has(globalPos)) {
    for (const other of state.players) {
      if (other.id === current.id) continue;
      for (let t = 0; t < 4; t++) {
        const otherGlobal = toGlobalTile(other.color, other.tokens[t]);
        if (otherGlobal === globalPos) {
          other.tokens[t] = -1;
          captured = true;
          state.lastEvent = `💥 ${current.name} ${other.name} toshini urib tushirdi!`;
        }
      }
    }
  }

  // Check victory
  const allHome = current.tokens.every((p) => p === 56);
  if (allHome) {
    state.status = 'FINISHED';
    state.winnerId = current.id;
    state.winnerName = current.name;
    state.phase = 'ROLL';
    state.validMoves = [];
    state.lastEvent = `🏆 ${current.name} Ludo g‘olibi bo‘ldi! (+${state.pot} tanga)`;
    state.updatedAt = Date.now();
    return { state, captured, finished: true };
  }

  if (!captured) {
    if (reachedHome) {
      state.lastEvent = `🎯 ${current.name} toshni marraga olib kirdi! Yana yurish!`;
    } else if (oldPos === -1) {
      state.lastEvent = `🚀 ${current.name} yangi toshni chiqardi!`;
    } else {
      state.lastEvent = `${current.name} toshni ${dice} katak surdi`;
    }
  }

  // Extra turn on 6, capture, or reaching home
  const extraTurn = dice === 6 || captured || reachedHome;
  if (!extraTurn) {
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
  }

  state.phase = 'ROLL';
  state.validMoves = [];
  state.updatedAt = Date.now();
  return { state, captured, finished: false };
}

export function chooseBotToken(state: LudoGameState): number {
  const player = state.players[state.turnIndex];
  const dice = state.dice || 1;
  const moves = state.validMoves;
  if (moves.length === 0) return 0;

  // Priority: 1) reach home, 2) capture opponent, 3) exit base, 4) move furthest token
  let bestToken = moves[0];
  let bestScore = -1000;

  for (const idx of moves) {
    const pos = player.tokens[idx];
    const nextPos = pos === -1 ? 0 : pos + dice;
    let score = nextPos;

    if (nextPos === 56) score += 500;
    if (pos === -1) score += 120;

    const gTile = toGlobalTile(player.color, nextPos);
    if (gTile !== null) {
      if (SAFE_GLOBAL_TILES.has(gTile)) score += 60;
      for (const other of state.players) {
        if (other.id === player.id) continue;
        for (let t = 0; t < 4; t++) {
          if (toGlobalTile(other.color, other.tokens[t]) === gTile && !SAFE_GLOBAL_TILES.has(gTile)) {
            score += 300;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestToken = idx;
    }
  }

  return bestToken;
}
