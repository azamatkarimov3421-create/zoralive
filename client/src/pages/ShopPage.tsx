import React, { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Sparkles, Gem, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MythicVaultSection } from '../components/MythicVaultSection';

export const ShopPage: React.FC = () => {
  const { user, toast } = useAuth();
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStore = async () => {
    try {
      const data = await api<{ items: any[] }>('/store/items');
      setStoreItems(data.items || []);
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
    <div className="bg-white min-h-full px-3.5 pt-3 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff3366] to-amber-500 text-white flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Savdo Markazi</h1>
            <p className="text-[10.5px] font-semibold text-slate-500">Ajdarholar, VIP va shohona sikenlar</p>
          </div>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shadow-2xs">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Highlights Banner */}
      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white border border-amber-400/30 flex items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>VIP & Mythic Sikenlar Do‘koni</span>
          </div>
          <div className="text-xs font-extrabold text-white">
            Istalgan ajdarho, VIP daraja yoki ramkani alohida tanlab xarid qiling
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow">
            100% Onlayn
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
          initialFilter="DRAGON"
        />
      )}
    </div>
  );
};
