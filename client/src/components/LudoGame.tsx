import React, { useEffect, useState } from 'react';
import { Dices, Trophy, Play, RotateCcw } from 'lucide-react';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { LudoGameState, LudoPlayer } from '../types';
import { sfx } from '../lib/sound';

const OUTER_RING: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

const START_OFFSET: Record<LudoPlayer['color'], number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const HOME_PATH: Record<LudoPlayer['color'], [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};
const BASE_SPOTS: Record<LudoPlayer['color'], [number, number][]> = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  green: [[1, 10], [1, 13], [4, 10], [4, 13]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  blue: [[10, 1], [10, 4], [13, 1], [13, 4]],
};
const SAFE_TILES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const COLOR_STYLES: Record<LudoPlayer['color'], { bg: string; token: string; border: string }> = {
  red: { bg: 'bg-rose-50', token: 'bg-rose-500', border: 'border-rose-400' },
  green: { bg: 'bg-emerald-50', token: 'bg-emerald-500', border: 'border-emerald-400' },
  yellow: { bg: 'bg-amber-50', token: 'bg-amber-400', border: 'border-amber-400' },
  blue: { bg: 'bg-sky-50', token: 'bg-sky-500', border: 'border-sky-400' },
};

function getTokenCoord(color: LudoPlayer['color'], progress: number, tokenIdx: number): [number, number] {
  if (progress === -1) return BASE_SPOTS[color][tokenIdx];
  if (progress <= 50) return OUTER_RING[(START_OFFSET[color] + progress) % 52];
  return HOME_PATH[color][Math.min(5, progress - 51)];
}

export const LudoGame: React.FC<{ roomId?: string; compact?: boolean }> = ({ roomId, compact = false }) => {
  const { user, updateCoinsLocally, toast } = useAuth();
  const [game, setGame] = useState<LudoGameState | null>(null);
  const [entryFee, setEntryFee] = useState<number>(100);
  const [playerCount, setPlayerCount] = useState<number>(4);

  useEffect(() => {
    const socket = getSocket();
    const onState = (next: LudoGameState) => {
      setGame(next);
      if (next.status === 'FINISHED' && next.winnerId === user?.id) sfx.win();
    };
    const onError = ({ message }: { message: string }) => toast(message, 'error');
    const onWallet = ({ coins }: { coins: number }) => updateCoinsLocally(coins);

    socket.on('ludo:state', onState);
    socket.on('ludo:error', onError);
    socket.on('wallet:updated', onWallet);
    return () => {
      socket.off('ludo:state', onState);
      socket.off('ludo:error', onError);
      socket.off('wallet:updated', onWallet);
    };
  }, [user?.id]);

  if (!game) {
    return (
      <div className="card-white rounded-3xl p-5 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">🎲</div>

        <div className="w-full grid grid-cols-2 gap-2">
          {[2, 4].map((cnt) => (
            <button
              key={cnt}
              onClick={() => setPlayerCount(cnt)}
              className={`py-2.5 rounded-xl text-xs font-extrabold border ${
                playerCount === cnt
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {cnt} o‘yinchi
            </button>
          ))}
        </div>

        <div className="w-full grid grid-cols-4 gap-1.5">
          {[0, 50, 100, 500].map((fee) => (
            <button
              key={fee}
              onClick={() => setEntryFee(fee)}
              className={`py-2 rounded-xl text-xs font-extrabold border ${
                entryFee === fee
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {fee === 0 ? 'Bepul' : `${fee}`}
            </button>
          ))}
        </div>

        <button
          onClick={() => getSocket().emit('ludo:create', { entryFee, roomId, playerCount })}
          className="w-full py-3 rounded-full btn-brand font-extrabold text-sm flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Boshlash ({entryFee * playerCount} 🪙)</span>
        </button>
      </div>
    );
  }

  const currentPlayer = game.players[game.turnIndex];
  const isMyTurn = currentPlayer?.id === user?.id && game.status === 'PLAYING';

  const cellTokens = new Map<string, { player: LudoPlayer; tokenIdx: number; movable: boolean }[]>();
  for (const p of game.players) {
    p.tokens.forEach((progress, idx) => {
      const [r, c] = getTokenCoord(p.color, progress, idx);
      const key = `${r}-${c}`;
      const list = cellTokens.get(key) || [];
      const movable = isMyTurn && p.id === user?.id && game.phase === 'MOVE' && game.validMoves.includes(idx);
      list.push({ player: p, tokenIdx: idx, movable });
      cellTokens.set(key, list);
    });
  }

  const getCellMeta = (r: number, c: number) => {
    if (r < 6 && c < 6) return { cls: 'bg-rose-100', star: false };
    if (r < 6 && c > 8) return { cls: 'bg-emerald-100', star: false };
    if (r > 8 && c > 8) return { cls: 'bg-amber-100', star: false };
    if (r > 8 && c < 6) return { cls: 'bg-sky-100', star: false };
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      return { cls: r === 7 && c === 7 ? 'bg-amber-300' : 'bg-slate-100', star: false, center: r === 7 && c === 7 };
    }
    if (r === 7 && c >= 1 && c <= 5) return { cls: 'bg-rose-200', star: false };
    if (c === 7 && r >= 1 && r <= 5) return { cls: 'bg-emerald-200', star: false };
    if (r === 7 && c >= 9 && c <= 13) return { cls: 'bg-amber-200', star: false };
    if (c === 7 && r >= 9 && r <= 13) return { cls: 'bg-sky-200', star: false };
    if (r === 6 && c === 1) return { cls: 'bg-rose-400', star: true };
    if (r === 1 && c === 8) return { cls: 'bg-emerald-400', star: true };
    if (r === 8 && c === 13) return { cls: 'bg-amber-400', star: true };
    if (r === 13 && c === 6) return { cls: 'bg-sky-400', star: true };
    const ringIdx = OUTER_RING.findIndex(([rr, cc]) => rr === r && cc === c);
    return { cls: 'bg-white', star: ringIdx !== -1 && SAFE_TILES.has(ringIdx) };
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <span className="font-extrabold text-amber-600 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> {game.pot} 🪙
        </span>
        <span className="font-semibold text-slate-600 truncate max-w-[65%]">{game.lastEvent}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {game.players.map((p, idx) => {
          const active = idx === game.turnIndex && game.status === 'PLAYING';
          const st = COLOR_STYLES[p.color];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
                active ? `${st.bg} ${st.border}` : 'bg-white border-slate-200 opacity-70'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${st.token}`} />
              <span className="text-xs font-bold text-slate-800 truncate flex-1">{p.name}</span>
              <span className="text-[10px] font-bold text-slate-500">
                {p.tokens.filter((t) => t === 56).length}/4
              </span>
            </div>
          );
        })}
      </div>

      <div className={`w-full aspect-square ${compact ? 'max-w-[300px]' : 'max-w-[360px]'} mx-auto rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-200 p-[2px]`}>
        <div
          className="grid w-full h-full gap-[1px]"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {Array.from({ length: 225 }).map((_, i) => {
            const r = Math.floor(i / 15);
            const c = i % 15;
            const meta = getCellMeta(r, c);
            const tokensHere = cellTokens.get(`${r}-${c}`) || [];

            return (
              <div key={i} className={`relative flex items-center justify-center ${meta.cls}`}>
                {meta.center && <span className="text-[10px]">🏆</span>}
                {meta.star && tokensHere.length === 0 && <span className="text-[8px] text-slate-400">★</span>}
                {tokensHere.length > 0 && (
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center">
                    {tokensHere.map((tk) => {
                      const st = COLOR_STYLES[tk.player.color];
                      return (
                        <button
                          key={`${tk.player.id}-${tk.tokenIdx}`}
                          type="button"
                          disabled={!tk.movable}
                          onClick={() => tk.movable && getSocket().emit('ludo:move', { gameId: game.gameId, tokenIndex: tk.tokenIdx })}
                          className={`rounded-full border-2 border-white shadow ${st.token} ${
                            tokensHere.length > 1 ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                          } ${tk.movable ? 'animate-bounce ring-2 ring-slate-900 scale-125 cursor-pointer z-20' : ''}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {game.status === 'FINISHED' ? (
        <div className="card-white rounded-2xl p-4 text-center space-y-2">
          <div className="text-sm font-black text-slate-900">🏆 {game.winnerName}</div>
          <button
            onClick={() => setGame(null)}
            className="px-5 py-2 rounded-full btn-brand text-xs font-extrabold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Qayta
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 card-white rounded-2xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center">
              {game.dice ?? '?'}
            </div>
            <div className="text-xs font-extrabold text-slate-800">
              {isMyTurn ? (game.phase === 'ROLL' ? 'Zarik tashlang' : 'Toshni bosing') : currentPlayer?.name}
            </div>
          </div>

          <button
            disabled={!isMyTurn || game.phase !== 'ROLL'}
            onClick={() => {
              sfx.dice();
              getSocket().emit('ludo:roll', { gameId: game.gameId });
            }}
            className="px-4 py-2.5 rounded-full btn-brand font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <Dices className="w-4 h-4" /> Tashlash
          </button>
        </div>
      )}
    </div>
  );
};
