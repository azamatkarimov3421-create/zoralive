import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Swords,
  Pickaxe,
  Crown,
  Shield,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowUpCircle,
  HeartHandshake,
  Store,
  Flame,
  Info,
} from 'lucide-react';
import { CONTINENTS_10 } from '../lib/worldEcosystemData';
import { MYTHIC_DRAGONS } from '../lib/mythicCatalog';
import { useWorld } from '../context/WorldContext';
import { useAuth } from '../context/AuthContext';
import { sfx } from '../lib/sound';

const WAR_STEPS = [
  '1. Urush e’lon qilindi',
  '2. Davlatlar tayyorgarlik ko‘rmoqda',
  '3. Askarlar armiyasi yig‘ilmoqda',
  '4. Afsonaviy ajdarholar va maxluqlar tanlandi',
  '5. Strategik Balkon Jangi boshlandi!',
  '6. Natija avtomatik hisoblanmoqda...',
  '7. G‘olib davlat hudud nazoratini qo‘lga kiritdi!',
  '8. Mukofotlar o‘yin balansiga qo‘shildi (+2,400 Coin, +25 Gem)',
];

export const WorldMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useAuth();
  const {
    state,
    travelToContinent,
    mineElement,
    upgradeMine,
    assignDragonToMine,
    refineElement,
    tameWildBeast,
    conquerTerritory,
    setUserPresence,
  } = useWorld();

  const [tab, setTab] = useState<'CONTINENTS' | 'KINGDOMS' | 'MINING'>('CONTINENTS');
  const [selectedContId, setSelectedContId] = useState<string>(state.activeContinentId);
  const [warTargetId, setWarTargetId] = useState<string | null>(null);
  const [warStep, setWarStep] = useState<number>(-1);

  useEffect(() => {
    setUserPresence(tab === 'MINING' ? 'MAYNINGDA' : 'OYINDA');
    return () => setUserPresence('OVOZLI_SUHBATDA');
  }, [tab, setUserPresence]);

  const selectedCont = CONTINENTS_10.find((c) => c.id === selectedContId) || CONTINENTS_10[0];
  const isHere = state.activeContinentId === selectedCont.id;
  const isTamed = state.tamedBeasts.includes(selectedCont.wildBeastName);
  const activeElementCount = state.elements[selectedCont.resourceCode] || 0;

  const startKingdomWar = (targetId: string) => {
    if (warStep >= 0 && warStep < WAR_STEPS.length - 1) return;
    setWarTargetId(targetId);
    setWarStep(0);
    sfx.pkHorn();
    let step = 0;
    const iv = window.setInterval(() => {
      step += 1;
      setWarStep(step);
      if (step >= WAR_STEPS.length - 1) {
        window.clearInterval(iv);
        conquerTerritory(targetId, 2400);
        sfx.win();
        toast('🏰 G‘alaba! Yangi o‘yin hududi Turon Imperiyasi nazoratiga o‘tdi!', 'success');
      }
    }, 650);
  };

  return (
    <div className="bg-white min-h-full pb-6">
      {/* Sticky Sub-Tabs */}
      <div className="px-3.5 pt-2.5 pb-2 border-b border-slate-100 bg-white sticky top-[46px] z-30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(
            [
              ['CONTINENTS', '🗺️ 10 Qit’a'],
              ['KINGDOMS', '🏰 Davlatlar'],
              ['MINING', '⛏️ Mayning'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition ${
                tab === k ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          🐉 {state.tamedBeasts.length + 10}/20 Maxluq
        </span>
      </div>

      {/* TAB 1: 10 CONTINENTS INTERACTIVE WORLD MAP */}
      {tab === 'CONTINENTS' && (
        <div className="px-3.5 pt-3 space-y-3">
          {/* Interactive World Map Canvas */}
          <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md">
            <img
              src="/assets/stage-ocean.jpg"
              alt="Umumiy Dunyo Xaritasi"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-indigo-950/35 to-slate-950/85" />

            <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[10px] font-black text-white border border-white/15">
                🌍 Bitta Katta Umumiy Dunyo • 10 ta Qit’a
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9.5px] font-black">
                Joy: {CONTINENTS_10.find((c) => c.id === state.activeContinentId)?.name}
              </span>
            </div>

            {/* 10 Clickable Continent Pins */}
            {CONTINENTS_10.map((c) => {
              const selected = c.id === selectedContId;
              const current = c.id === state.activeContinentId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContId(c.id)}
                  style={{ left: `${c.mapX}%`, top: `${c.mapY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-transform ${
                    selected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 shadow-lg relative ${
                      selected
                        ? 'border-amber-300 ring-4 ring-amber-400/35'
                        : current
                        ? 'border-emerald-400'
                        : 'border-white/75'
                    }`}
                  >
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <span
                    className={`mt-0.5 px-1.5 py-[1px] rounded-full text-[8.5px] font-black whitespace-nowrap shadow ${
                      selected ? 'bg-amber-400 text-slate-950' : 'bg-slate-950/80 text-white'
                    }`}
                  >
                    {c.resourceIcon} {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Continent Details & Wild Beast Encounter */}
          <div className="card-white rounded-3xl overflow-hidden border border-slate-200/80">
            <div className="relative h-32 bg-slate-900">
              <img src={selectedCont.image} alt={selectedCont.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/35 to-transparent" />
              <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${selectedCont.gradient}`}>
                  {selectedCont.resourceIcon} {selectedCont.resourceNameUz}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/55 text-amber-300 text-[10px] font-black">
                  Ombor: {activeElementCount}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                <div className="text-base font-black leading-tight">{selectedCont.name} — {selectedCont.titleUz}</div>
                <div className="text-[11px] text-amber-200 font-semibold">{selectedCont.travelBonusUz}</div>
              </div>
            </div>

            <div className="p-3.5 space-y-3">
              {/* Travel Action */}
              <div className="flex items-center gap-2">
                <button
                  disabled={isHere}
                  onClick={() => travelToContinent(selectedCont.id)}
                  className={`flex-1 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    isHere ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-brand'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{isHere ? 'Siz shu qit’adasiz ✓' : `${selectedCont.name} qit’asiga uchish / sayohat`}</span>
                </button>
                <button
                  onClick={() => setTab('MINING')}
                  className="px-3.5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black flex items-center gap-1"
                >
                  <Pickaxe className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kon</span>
                </button>
              </div>

              {/* Continent Special Wild Beast (Combat or Befriend) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase">Qit’aning Maxsus Maxluqi</div>
                    <div className="text-sm font-black text-slate-900">{selectedCont.wildBeastName}</div>
                    <div className="text-[11px] text-slate-500">{selectedCont.wildBeastDescUz}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-[#ff3366] text-[11px] font-black">
                    ⚔️ {selectedCont.wildBeastPower}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/battle')}
                    className="py-2 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kurashish (Balkon)</span>
                  </button>
                  <button
                    disabled={isTamed}
                    onClick={() => tameWildBeast(selectedCont.id)}
                    className={`py-2 rounded-full text-[11px] font-black flex items-center justify-center gap-1 ${
                      isTamed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>{isTamed ? 'Do‘stlashgan ✓' : `Do‘stlashtirish (15 ${selectedCont.resourceIcon})`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KINGDOMS & 8-STEP STRATEGIC TERRITORY WAR (Section 5) */}
      {tab === 'KINGDOMS' && (
        <div className="px-3.5 pt-3 space-y-3">
          {/* Active 8-Step War Progress Box */}
          {warStep >= 0 && (
            <div className="rounded-3xl p-3.5 bg-slate-950 text-white border border-amber-400/40 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Swords className="w-4 h-4" /> Strategik Hudud Urushi Jarayoni
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {warStep + 1}/{WAR_STEPS.length}
                </span>
              </div>
              <div className="space-y-1">
                {WAR_STEPS.slice(0, warStep + 1).map((st, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal / Game Territory Clarity Notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-sky-50 border border-sky-200/80 text-[10.5px] font-semibold text-sky-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              Egallangan yerlar faqat o‘yin ichidagi hududlar hisoblanadi, haqiqiy ko‘chmas mulk emas. Natija avtomatik hisoblanadi va mukofotlar o‘yin balansiga qo‘shiladi.
            </span>
          </div>

          {/* All 5 Kingdoms Cards */}
          <div className="space-y-2.5">
            {state.kingdoms.map((k) => (
              <div
                key={k.id}
                className={`card-white rounded-3xl p-3.5 space-y-2.5 border ${
                  k.isPlayerKingdom ? 'border-amber-400 ring-2 ring-amber-200/60' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {k.flag}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">{k.nameUz}</span>
                        {k.isPlayerKingdom && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                            SIZNING DAVLAT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        👑 Hukmdor: {k.rulerName} • 🎖️ Qo‘mondon: {k.commanderName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Kingdom Metrics */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                    <div className="text-[9.5px] font-bold text-slate-400">Askar / Agent</div>
                    <div className="text-xs font-black text-slate-900">
                      {k.soldiersCount} / {k.agentsCount}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                    <div className="text-[9.5px] font-bold text-slate-400">Hudud / Kon</div>
                    <div className="text-xs font-black text-slate-900">
                      {k.territoriesCount} yer • {k.miningBasesCount} kon
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                    <div className="text-[9.5px] font-bold text-slate-400">Iqtisodiyot</div>
                    <div className="text-xs font-black text-amber-600">🪙 {(k.economyCoins / 1000).toFixed(0)}k</div>
                  </div>
                </div>

                {/* Defense Structures */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-0.5 mr-1">
                    <Shield className="w-3 h-3 text-emerald-500" /> Himoya (L{k.defenseLevel}):
                  </span>
                  {k.defenseStructuresUz.map((ds) => (
                    <span key={ds} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9.5px] font-bold">
                      {ds}
                    </span>
                  ))}
                </div>

                {!k.isPlayerKingdom && (
                  <button
                    onClick={() => startKingdomWar(k.id)}
                    disabled={warTargetId === k.id && warStep >= 0 && warStep < WAR_STEPS.length - 1}
                    className="w-full py-2.5 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Urush e’lon qilish va Hudud egallash</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MINING & 10 ELEMENTAL CRYSTALS PRODUCTION (Section 6) */}
      {tab === 'MINING' && (
        <div className="px-3.5 pt-3 space-y-3">
          {/* Header Info & Daily Cap Rule */}
          <div className="rounded-2xl p-3 bg-slate-900 text-white flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <Pickaxe className="w-4 h-4 text-amber-400" />
                <span>10 ta Qit’a Shaxtalari & Element Qayta Ishlash</span>
              </div>
              <p className="text-[10.5px] text-slate-300 mt-0.5">
                Har bir mayning bazasi kunlik limitga ega. Cheksiz resurs chiqarish taqiqlanadi.
              </p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shrink-0 flex items-center gap-1"
            >
              <Store className="w-3 h-3" />
              <span>Sotish</span>
            </button>
          </div>

          {/* All 10 Mining Bases */}
          <div className="space-y-2.5">
            {CONTINENTS_10.map((c) => {
              const base = state.miningBases[c.id];
              const stock = state.elements[c.resourceCode] || 0;
              const capPct = Math.min(100, Math.round((base.minedToday / base.dailyCap) * 100));
              const upgradeCost = base.level * 1200;

              return (
                <div key={c.id} className="card-white rounded-2xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <span>{c.resourceIcon} {c.name}</span>
                          <span className="px-1.5 py-[1px] rounded-full bg-slate-100 text-slate-600 text-[9px]">
                            Shaxta L{base.level}
                          </span>
                        </div>
                        <div className="text-[10.5px] font-bold text-slate-500">
                          {c.resourceNameUz} • Zaxira: <span className="text-slate-900 font-black">{stock}</span>
                        </div>
                      </div>
                    </div>

                    <select
                      value={base.assignedDragonId}
                      onChange={(e) => assignDragonToMine(c.id, e.target.value)}
                      className="px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700"
                    >
                      {MYTHIC_DRAGONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          🐉 {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Daily Limit Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Kunlik ishlab chiqarish chegarasi</span>
                      <span>
                        {base.minedToday} / {base.dailyCap}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all`}
                        style={{ width: `${capPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions: Mine / Upgrade / Refine */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => mineElement(c.id)}
                      className="py-1.5 rounded-full bg-slate-900 text-white text-[10.5px] font-black flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Pickaxe className="w-3 h-3 text-amber-300" />
                      <span>Qazish</span>
                    </button>
                    <button
                      onClick={() => refineElement(c.id)}
                      className="py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10.5px] font-black flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>20→8💎</span>
                    </button>
                    <button
                      onClick={() => upgradeMine(c.id)}
                      className="py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-black flex items-center justify-center gap-1"
                    >
                      <ArrowUpCircle className="w-3 h-3" />
                      <span>L+ ({upgradeCost})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
