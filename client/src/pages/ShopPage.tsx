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
    <div className="bg-white min-h-full px-3.5 pt-3 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff3366] to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 leading-tight truncate">Savdo Markazi</h1>
            <p className="text-[10.5px] font-semibold text-slate-500 truncate">VIP Panellar va Afsonaviy Ajdarho</p>
          </div>
        </div>

        {/* User Balance + Convenient Savdo History Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-extrabold transition cursor-pointer ${
              historyOpen
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-slate-100 border-slate-200/80 text-slate-700 hover:bg-slate-200'
            }`}
            title="Savdo va to‘lovlar tarixi"
          >
            <History className="w-3.5 h-3.5" />
            <span>Tarix</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Savdo & To'lovlar Tarixi Panel */}
      {historyOpen && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-xs">
          <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#ff3366]" />
              <span>Savdo va to‘lovlar tarixi</span>
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {shopHistory.length === 0 ? (
            <div className="px-3.5 py-5 text-center text-xs font-semibold text-slate-400">
              Hozircha savdo yoki to‘lov tarixi yo‘q
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto bg-white">
              {shopHistory.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-xs px-3.5 py-2.5">
                  <span className="font-semibold text-slate-700 truncate pr-2">{tx.description}</span>
                  <span
                    className={`font-extrabold shrink-0 ${
                      tx.amount > 0 ? 'text-emerald-600' : tx.amount === 0 ? 'text-slate-500' : 'text-rose-600'
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
      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white border border-amber-400/30 flex items-center justify-between gap-3 shadow-sm">
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
