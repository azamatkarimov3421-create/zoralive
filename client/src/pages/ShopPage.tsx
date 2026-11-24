import React, { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Sparkles, History, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MythicVaultSection } from '../components/MythicVaultSection';

export const ShopPage: React.FC = () => {
  const { user, toast } = useAuth();
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [shopHistory, setShopHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStore = async () => {
    try {
      const [itemsRes, walletRes] = await Promise.all([
        api<{ items: any[] }>('/store/items'),
        api<{ ledger?: any[] }>('/wallet').catch(() => ({ ledger: [] })),
      ]);
      setStoreItems(itemsRes.items || []);
      setShopHistory(walletRes.ledger || []);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, []);

  return (
    <div className="bg-transparent min-h-full px-3.5 pt-3 pb-24 space-y-4">
      {/* Translucent Crystal Header */}
      <div className="rounded-3xl bg-white/58 backdrop-blur-2xl border-2 border-white/90 px-3.5 py-3 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,0.95)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff2d68] to-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 leading-tight truncate">Savdo Markazi</h1>
            <p className="text-[11px] font-bold text-slate-500 truncate">VIP Panellar va Afsonaviy Ajdarho</p>
          </div>
        </div>

        {/* User Balance + Convenient Savdo History Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-[11px] font-black transition cursor-pointer ${
              historyOpen
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white/70 border-white/90 text-slate-800 hover:bg-white shadow-2xs'
            }`}
            title="Savdo va to‘lovlar tarixi"
          >
            <History className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>Tarix</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-md border-2 border-amber-300/70 text-amber-900 text-xs font-black shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Savdo & To'lovlar Tarixi Panel */}
      {historyOpen && (
        <div className="rounded-3xl border-2 border-white/90 bg-white/70 backdrop-blur-2xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-white/50 border-b border-white/80 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#ff3366]" />
              <span>Savdo va to‘lovlar tarixi</span>
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {shopHistory.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">
              Hozircha savdo yoki to‘lov tarixi yo‘q
            </div>
          ) : (
            <div className="divide-y divide-slate-200/40 max-h-60 overflow-y-auto">
              {shopHistory.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-xs px-4 py-2.5">
                  <span className="font-bold text-slate-700 truncate pr-2">{tx.description}</span>
                  <span
                    className={`font-black shrink-0 ${
                      tx.amount > 0 ? 'text-emerald-600' : tx.amount === 0 ? 'text-slate-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.amount === 0 ? 'Tekin' : `${tx.amount > 0 ? `+${tx.amount}` : tx.amount} ${tx.currency === 'COINS' ? '🪙' : '💎'}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Highlights Banner */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-slate-950/90 via-purple-950/88 to-indigo-950/90 backdrop-blur-xl text-white border-2 border-amber-300/40 flex items-center justify-between gap-3 shadow-lg">
        <div className="space-y-0.5">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>VIP Panellar & Ajdarho</span>
          </div>
          <div className="text-xs font-extrabold text-white">
            VIP 1–12 panellar va afsonaviy ajdarhoni xarid qiling
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black shadow">
            100% Tekin
          </span>
        </div>
      </div>

      {/* Main Interactive Shop: MythicVaultSection */}
      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Savdo buyumlari yuklanmoqda...
        </div>
      ) : (
        <MythicVaultSection
          storeItems={storeItems}
          onReloadStore={loadStore}
          initialFilter="VIP"
        />
      )}
    </div>
  );
};
