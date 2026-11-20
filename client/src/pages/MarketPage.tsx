import React, { useState } from 'react';
import {
  Store,
  Sword,
  Coins,
  Gem,
  Sparkles,
  Star,
  Plus,
  CheckCircle2,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { useWorld } from '../context/WorldContext';
import { CONTINENTS_10, SOLDIER_INVENTORY_CATALOG } from '../lib/worldEcosystemData';

export const MarketPage: React.FC = () => {
  const {
    state,
    worldCoins,
    buySoldierGear,
    toggleEquipGear,
    buySellerItem,
    listNewSellerItem,
    acceptSellerOrder,
  } = useWorld();

  const [tab, setTab] = useState<'MARKET' | 'GEAR' | 'SELLER'>('MARKET');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'EGG' | 'FRAME' | 'ELEMENT' | 'GIFT'>('EGG');
  const [newPrice, setNewPrice] = useState('1500');

  const totalElements = Object.values(state.elements).reduce((acc, v) => acc + v, 0);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    listNewSellerItem({
      nameUz: newName.trim(),
      category: newCategory,
      icon: newCategory === 'EGG' ? '🥚' : newCategory === 'FRAME' ? '🖼️' : newCategory === 'ELEMENT' ? '💎' : '🎁',
      image:
        newCategory === 'EGG'
          ? '/assets/dragons/auriel.jpg'
          : newCategory === 'FRAME'
          ? '/assets/frames/frame-gold-1.webp'
          : '/assets/crystals/citrine.webp',
      priceCoins: Math.max(100, Number(newPrice) || 1000),
      priceGems: Math.max(5, Math.round((Number(newPrice) || 1000) / 150)),
      stock: 5,
    });
    setNewName('');
  };

  return (
    <div className="bg-white min-h-full pb-6">
      {/* 3-Currency Virtual Economy Header (Section 9) */}
      <div className="px-3.5 pt-3 pb-2.5 bg-white border-b border-slate-100 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-2xl bg-amber-50 border border-amber-200/80">
            <div className="text-[9px] font-black text-amber-700 flex items-center gap-1">
              <Coins className="w-3 h-3" /> WORLD COIN
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{worldCoins.toLocaleString()}</div>
          </div>

          <div className="p-2 rounded-2xl bg-purple-50 border border-purple-200/80">
            <div className="text-[9px] font-black text-purple-700 flex items-center gap-1">
              <Gem className="w-3 h-3" /> WORLD GEM
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{state.worldGems.toLocaleString()}</div>
          </div>

          <div className="p-2 rounded-2xl bg-cyan-50 border border-cyan-200/80">
            <div className="text-[9px] font-black text-cyan-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ELEMENT
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{totalElements.toLocaleString()}</div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-full">
          {(
            [
              ['MARKET', '🛍️ Market'],
              ['GEAR', '⚔️ Askar Inventari'],
              ['SELLER', '🏪 Seller Do‘kon'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`py-1.5 rounded-full text-[11px] font-extrabold transition ${
                tab === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SELLER MARKETPLACE */}
      {tab === 'MARKET' && (
        <div className="px-3.5 pt-3 space-y-3">
          {/* 10 Elements Quick Inventory Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CONTINENTS_10.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shrink-0"
              >
                {c.resourceIcon} {c.resourceNameUz.split(' ')[0]}: <b>{state.elements[c.resourceCode] || 0}</b>
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {state.sellerProducts.map((item) => (
              <div key={item.id} className="card-white rounded-2xl overflow-hidden flex flex-col border border-slate-200/80">
                <div className="relative h-28 bg-slate-950 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.nameUz} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{item.icon}</span>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[8.5px] font-black">
                    {item.sellerVip}
                  </span>
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/65 text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> {item.rating}
                  </span>
                </div>

                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-tight line-clamp-2">{item.nameUz}</div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      🏪 {item.sellerName} • Qoldiq: {item.stock}
                    </div>
                  </div>

                  <button
                    disabled={item.stock <= 0}
                    onClick={() => buySellerItem(item.id)}
                    className="w-full py-1.5 rounded-full btn-brand text-[11px] font-black disabled:opacity-40"
                  >
                    {item.stock > 0 ? `🪙 ${item.priceCoins.toLocaleString()}` : 'Tugadi'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[10px] font-semibold text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              WORLD COIN, WORLD GEM va ELEMENT alohida virtual hisoblarda yuritiladi. Dastlabki versiyada pul tikish va haqiqiy naqd pulga almashtirish bo‘lmaydi.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: SOLDIER INVENTORY (8 CATEGORIES — Section 7) */}
      {tab === 'GEAR' && (
        <div className="px-3.5 pt-3 space-y-2.5">
          <div className="rounded-2xl p-3 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <Sword className="w-4 h-4 text-amber-400" />
                <span>Askar va Maxluq Virtual Inventari</span>
              </div>
              <p className="text-[10.5px] text-slate-300 mt-0.5">
                Qilich, Qalqon, Kamon, Zirh, Element qurollari, Egar, Maxluq zirhi va Maxsus kiyimlar
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
              {state.equippedGearIds.length} taqilgan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SOLDIER_INVENTORY_CATALOG.map((g) => {
              const owned = state.ownedGearIds.includes(g.id);
              const equipped = state.equippedGearIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  className={`card-white rounded-2xl p-3 flex flex-col justify-between gap-2 border ${
                    equipped ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{g.icon}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black">
                        {g.categoryUz}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-1.5 leading-tight">{g.nameUz}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                      ⚔️ +{g.powerBonus} • 🛡️ +{g.defenseBonus}
                    </div>
                    <div className="text-[9.5px] font-semibold text-amber-600 mt-0.5">Element: {g.elementUz}</div>
                  </div>

                  {owned ? (
                    <button
                      onClick={() => toggleEquipGear(g.id)}
                      className={`w-full py-1.5 rounded-full text-[11px] font-black transition ${
                        equipped
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {equipped ? '✓ Taqilgan' : 'Taqish'}
                    </button>
                  ) : (
                    <button
                      onClick={() => buySoldierGear(g.id, g.priceCoins, g.priceGems)}
                      className="w-full py-1.5 rounded-full btn-brand text-[10.5px] font-black"
                    >
                      🪙 {g.priceCoins} + 💎 {g.priceGems}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SELLER VIRTUAL SHOP & ORDERS (Section 9) */}
      {tab === 'SELLER' && (
        <div className="px-3.5 pt-3 space-y-3">
          {/* Seller Status Header */}
          <div className="rounded-3xl p-3.5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black">Mening Virtual Do‘konim</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                  VIP SELLER
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Reyting: ⭐ {state.sellerRating} • Mahsulotlar: {state.sellerProducts.length} • Profil ramkalari va Tuxumlar
              </p>
            </div>
          </div>

          {/* Add New Product Form */}
          <form onSubmit={handleCreateListing} className="card-white rounded-2xl p-3 space-y-2 border border-slate-200/80">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#ff3366]" />
              <span>Yangi mahsulot joylash va narx belgilash</span>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mahsulot nomi (masalan: Nythera Kosmik Tuxumi)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="EGG">🥚 Maxluq tuxumi</option>
                <option value="FRAME">🖼️ Profil ramkasi</option>
                <option value="ELEMENT">💎 Element to‘plami</option>
                <option value="GIFT">🎁 VIP Sovg‘a</option>
              </select>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Narx (WORLD COIN)"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <button type="submit" className="w-full py-2 rounded-full btn-brand text-xs font-black">
              Do‘konga joylash
            </button>
          </form>

          {/* Orders & Sales History */}
          <div className="card-white rounded-2xl p-3 space-y-2 border border-slate-200/80">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Buyurtmalar va Savdo Tarixi</span>
            </div>
            <div className="space-y-2">
              {state.sellerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{ord.itemNameUz}</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Xaridor: {ord.buyerName} • {ord.createdAt} • 🪙 {ord.priceCoins.toLocaleString()}
                    </div>
                  </div>
                  {ord.status === 'KUTILMOQDA' ? (
                    <button
                      onClick={() => acceptSellerOrder(ord.id)}
                      className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0"
                    >
                      Qabul qilish
                    </button>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sotildi
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
