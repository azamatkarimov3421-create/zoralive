import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Play, Send, Sparkles } from 'lucide-react';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { sfx } from '../lib/sound';

const COLORS = ['#0f172a', '#ff3366', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
const SOLO_WORDS = ['Olma', 'Quyosh', 'Mashina', 'Uy', 'Mushuk', 'Samolyot', 'Yulduz', 'Daraxt', 'Toj', 'Gul'];

interface DrawState {
  active: boolean;
  drawerId: string;
  drawerName: string;
  hint: string;
  solvedBy: string | null;
}

export const DrawGuessGame: React.FC<{ roomId?: string; compact?: boolean }> = ({ roomId, compact = false }) => {
  const { user, updateCoinsLocally, toast } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [brush, setBrush] = useState(4);
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [secretWord, setSecretWord] = useState<string>('');
  const [guess, setGuess] = useState('');
  const [winnerBanner, setWinnerBanner] = useState<string>('');

  const isDrawer = !roomId || !drawState || drawState.drawerId === user?.id;

  const clearCanvas = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (c) c.clearRect(0, 0, cv.width, cv.height);
  };

  const renderStroke = (st: { x0: number; y0: number; x1: number; y1: number; color: string; size: number }) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (!c) return;
    c.strokeStyle = st.color;
    c.lineWidth = st.size;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(st.x0 * cv.width, st.y0 * cv.height);
    c.lineTo(st.x1 * cv.width, st.y1 * cv.height);
    c.stroke();
  };

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const onState = (st: DrawState) => {
      setDrawState(st);
      setWinnerBanner('');
    };
    const onWord = ({ word }: { word: string }) => setSecretWord(word);
    const onStroke = (stroke: any) => renderStroke(stroke);
    const onClear = () => clearCanvas();
    const onSolved = ({ winnerName, word, reward }: { winnerName: string; word: string; reward: number }) => {
      sfx.win();
      setWinnerBanner(`${winnerName} "${word}" so‘zini topdi (+${reward} 🪙)`);
      setDrawState((prev) => (prev ? { ...prev, active: false, solvedBy: winnerName } : prev));
    };
    const onWallet = ({ coins }: { coins: number }) => updateCoinsLocally(coins);

    socket.on('draw:state', onState);
    socket.on('draw:word', onWord);
    socket.on('draw:stroke', onStroke);
    socket.on('draw:clear', onClear);
    socket.on('draw:solved', onSolved);
    socket.on('wallet:updated', onWallet);

    return () => {
      socket.off('draw:state', onState);
      socket.off('draw:word', onWord);
      socket.off('draw:stroke', onStroke);
      socket.off('draw:clear', onClear);
      socket.off('draw:solved', onSolved);
      socket.off('wallet:updated', onWallet);
    };
  }, [roomId]);

  const getRelPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getRelPoint(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !isDrawer || !lastPosRef.current) return;
    const next = getRelPoint(e);
    const stroke = {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: next.x,
      y1: next.y,
      color,
      size: brush,
    };
    renderStroke(stroke);
    if (roomId) getSocket().emit('draw:stroke', { roomId, stroke });
    lastPosRef.current = next;
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  const startRound = () => {
    clearCanvas();
    setWinnerBanner('');
    if (roomId) {
      getSocket().emit('draw:start', { roomId });
    } else {
      const w = SOLO_WORDS[Math.floor(Math.random() * SOLO_WORDS.length)];
      setSecretWord(w);
      setDrawState({
        active: true,
        drawerId: user?.id || 'me',
        drawerName: user?.displayName || 'Siz',
        hint: `${w[0]} _ _ (${w.length})`,
        solvedBy: null,
      });
    }
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    if (roomId) {
      getSocket().emit('draw:guess', { roomId, guess });
    } else if (secretWord && guess.trim().toLowerCase() === secretWord.toLowerCase()) {
      sfx.win();
      toast(`To‘g‘ri: ${secretWord}`, 'success');
      setWinnerBanner(`Topildi: ${secretWord}`);
    }
    setGuess('');
  };

  return (
    <div className="space-y-3">
      {/* Top Bar: Word / Hint + Start */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-[#ff3366] shrink-0" />
          <span className="truncate">
            {isDrawer && secretWord
              ? `So‘z: ${secretWord}`
              : drawState?.active
              ? `${drawState.drawerName}: ${drawState.hint}`
              : 'Chiz va Top'}
          </span>
        </div>
        <button
          onClick={startRound}
          className="px-3 py-1.5 rounded-full btn-brand text-[11px] font-extrabold flex items-center gap-1 shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{drawState?.active ? 'Yangi' : 'Boshlash'}</span>
        </button>
      </div>

      {winnerBanner && (
        <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold text-center">
          🏆 {winnerBanner}
        </div>
      )}

      {/* Touch & Mouse Drawing Canvas */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={380}
          height={compact ? 220 : 280}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full block cursor-crosshair bg-white"
        />
      </div>

      {/* Color & Brush Tools */}
      {isDrawer && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c ? 'border-slate-900 scale-115' : 'border-white shadow-xs'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {[3, 6, 10].map((sz) => (
              <button
                key={sz}
                onClick={() => setBrush(sz)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  brush === sz ? 'bg-slate-900 border-slate-900' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <span
                  className={`rounded-full ${brush === sz ? 'bg-white' : 'bg-slate-700'}`}
                  style={{ width: sz + 2, height: sz + 2 }}
                />
              </button>
            ))}
            <button
              onClick={() => {
                clearCanvas();
                if (roomId) getSocket().emit('draw:clear', { roomId });
              }}
              className="p-2 rounded-full bg-slate-100 text-slate-600"
              title="Tozalash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Guess Input */}
      {roomId && !isDrawer && drawState?.active && (
        <form onSubmit={submitGuess} className="flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="So‘zni toping (+50 🪙)..."
            className="flex-1 px-3.5 py-2 rounded-full bg-slate-100 text-xs text-slate-900 focus:outline-none"
          />
          <button type="submit" className="p-2 rounded-full btn-brand">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
