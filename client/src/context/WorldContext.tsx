import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  CONTINENTS_10,
  INITIAL_KINGDOMS,
  INITIAL_SELLER_PRODUCTS,
  KingdomMeta,
  MILITARY_RANKS_10,
  SellerShopItem,
} from '../lib/worldEcosystemData';

export interface MiningBaseState {
  continentId: string;
  level: number;
  assignedDragonId: string;
  minedToday: number;
  dailyCap: number;
  refinedCount: number;
}

export interface SellerOrder {
  id: string;
  buyerName: string;
  itemNameUz: string;
  priceCoins: number;
  status: 'KUTILMOQDA' | 'TASDIQLANGAN';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  actionUz: string;
  time: string;
  critical?: boolean;
}

interface WorldPersistedState {
  worldGems: number;
  elements: Record<string, number>;
  rankLevel: number;
  serviceXp: number;
  activeContinentId: string;
  dragonStages: Record<string, number>;
  tamedBeasts: string[];
  miningBases: Record<string, MiningBaseState>;
  kingdoms: KingdomMeta[];
  ownedGearIds: string[];
  equippedGearIds: string[];
  sellerProducts: SellerShopItem[];
  sellerShopOpen: boolean;
  sellerOrders: SellerOrder[];
  sellerRating: number;
  emergencyStopped: boolean;
  managerPermissions: {
    manageAdmins: boolean;
    assignAgents: boolean;
    controlRooms: boolean;
    viewReports: boolean;
    changeOwner: false; // Always false: Manager cannot change Owner!
  };
  auditLogs: AuditLogEntry[];
}

const WORLD_STORAGE_KEY = 'zoralive_world_ecosystem_v2';

function createDefaultMiningBases(): Record<string, MiningBaseState> {
  const bases: Record<string, MiningBaseState> = {};
  CONTINENTS_10.forEach((c, idx) => {
    bases[c.id] = {
      continentId: c.id,
      level: idx < 3 ? 2 : 1,
      assignedDragonId: c.dragonId,
      minedToday: idx < 2 ? 80 : 0,
      dailyCap: c.mineCapacityPerDay,
      refinedCount: idx < 2 ? 12 : 0,
    };
  });
  return bases;
}

function createDefaultElements(): Record<string, number> {
  const el: Record<string, number> = {};
  CONTINENTS_10.forEach((c, idx) => {
    el[c.resourceCode] = idx < 4 ? 65 : 30;
  });
  return el;
}

const DEFAULT_STATE: WorldPersistedState = {
  worldGems: 420,
  elements: createDefaultElements(),
  rankLevel: 6, // Kapitan
  serviceXp: 3850,
  activeContinentId: 'cont-valtor',
  dragonStages: {
    zepharion: 2,
    nythera: 2,
    valtor: 2,
    sylvanna: 1,
    thalassor: 2,
    umbra: 1,
    auriel: 1,
    drakthar: 1,
    morvaxis: 1,
    xaldris: 3,
  },
  tamedBeasts: ['Aero-Grifon', 'Magma Golemi'],
  miningBases: createDefaultMiningBases(),
  kingdoms: INITIAL_KINGDOMS,
  ownedGearIds: ['gear-sword-valtor', 'gear-shield-auriel'],
  equippedGearIds: ['gear-sword-valtor', 'gear-shield-auriel'],
  sellerProducts: INITIAL_SELLER_PRODUCTS,
  sellerShopOpen: true,
  sellerOrders: [
    {
      id: 'ord-1',
      buyerName: 'Sardor Prime',
      itemNameUz: 'Valtor Vulqon Tuxumi',
      priceCoins: 5200,
      status: 'KUTILMOQDA',
      createdAt: 'Bugun 18:10',
    },
    {
      id: 'ord-2',
      buyerName: 'Laylo 🌙',
      itemNameUz: 'Qirollik #1 Animatsiyali Ramka',
      priceCoins: 2200,
      status: 'TASDIQLANGAN',
      createdAt: 'Bugun 16:45',
    },
  ],
  sellerRating: 4.9,
  emergencyStopped: false,
  managerPermissions: {
    manageAdmins: true,
    assignAgents: true,
    controlRooms: true,
    viewReports: true,
    changeOwner: false,
  },
  auditLogs: [
    {
      id: 'log-1',
      actor: 'Loyiha Egasi (Siz)',
      role: 'OWNER',
      actionUz: 'Balkon Ajdarho Jangi va 10 Qit’a tizimi faollashtirildi',
      time: '18:05',
      critical: true,
    },
    {
      id: 'log-2',
      actor: 'Manager Ulug‘bek',
      role: 'MANAGER',
      actionUz: 'Turon Imperiyasiga 2 nafar yangi Agent tayinladi',
      time: '17:40',
    },
    {
      id: 'log-3',
      actor: 'Super Admin Aziz',
      role: 'SUPER_ADMIN',
      actionUz: 'PostgreSQL 24 jadval va WebRTC ovozli server tekshirildi',
      time: '17:12',
    },
  ],
};

interface WorldContextValue {
  state: WorldPersistedState;
  worldCoins: number;
  // Persistent Voice Session (Section 8 & 11)
  voiceConnected: boolean;
  micEnabled: boolean;
  activeVoiceRoomId: string;
  activeVoiceRoomTitle: string;
  onlineVoiceCount: number;
  userPresence: 'OVOZLI_SUHBATDA' | 'OYINDA' | 'JANGDA' | 'MAYNINGDA' | 'ONLINE';
  setUserPresence: (p: 'OVOZLI_SUHBATDA' | 'OYINDA' | 'JANGDA' | 'MAYNINGDA' | 'ONLINE') => void;
  toggleMic: () => void;
  toggleVoiceConnection: () => void;
  joinVoiceRoomMeta: (id: string, title: string) => void;
  // Gameplay actions
  travelToContinent: (continentId: string) => void;
  mineElement: (continentId: string) => void;
  upgradeMine: (continentId: string) => void;
  assignDragonToMine: (continentId: string, dragonId: string) => void;
  refineElement: (continentId: string) => void;
  tameWildBeast: (continentId: string) => void;
  evolveDragon: (dragonId: string) => void;
  recordBattleWin: (coinsReward: number, gemsReward: number, xpReward: number, elementCode?: string) => void;
  conquerTerritory: (targetKingdomId: string, coinsReward: number) => void;
  buySoldierGear: (gearId: string, priceCoins: number, priceGems: number) => void;
  toggleEquipGear: (gearId: string) => void;
  buySellerItem: (itemId: string) => void;
  listNewSellerItem: (item: Omit<SellerShopItem, 'id' | 'sellerName' | 'sellerVip' | 'rating' | 'soldCount'>) => void;
  acceptSellerOrder: (orderId: string) => void;
  promoteRank: (newLevel: number, actorName?: string) => void;
  toggleEmergencyStop: (twoFactorCode: string) => boolean;
  toggleManagerPermission: (key: 'manageAdmins' | 'assignAgents' | 'controlRooms' | 'viewReports') => void;
  addAuditLog: (actor: string, role: string, actionUz: string, critical?: boolean) => void;
}

const WorldContext = createContext<WorldContextValue | null>(null);

export const WorldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCoinsLocally, toast } = useAuth();
  const [state, setState] = useState<WorldPersistedState>(() => {
    try {
      const saved = localStorage.getItem(WORLD_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_STATE;
  });

  const [voiceConnected, setVoiceConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [activeVoiceRoomId, setActiveVoiceRoomId] = useState('room_voice_1');
  const [activeVoiceRoomTitle, setActiveVoiceRoomTitle] = useState('Do‘stlar xonasi');
  const [onlineVoiceCount] = useState(4);
  const [userPresence, setUserPresence] = useState<
    'OVOZLI_SUHBATDA' | 'OYINDA' | 'JANGDA' | 'MAYNINGDA' | 'ONLINE'
  >('OVOZLI_SUHBATDA');

  useEffect(() => {
    try {
      localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const worldCoins = user?.coins ?? 50000;

  const addAuditLog = useCallback((actor: string, role: string, actionUz: string, critical = false) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setState((prev) => ({
      ...prev,
      auditLogs: [{ id: `log-${Date.now()}`, actor, role, actionUz, time, critical }, ...prev.auditLogs.slice(0, 29)],
    }));
  }, []);

  const toggleMic = () => {
    setMicEnabled((v) => {
      toast(!v ? 'Mikrofon yoqildi 🎙️' : 'Mikrofon o‘chirildi 🔇', 'info');
      return !v;
    });
  };

  const toggleVoiceConnection = () => {
    setVoiceConnected((v) => {
      toast(!v ? 'Ovozli aloqa qayta ulandi 🔊' : 'Ovozli xona vaqtincha uzildi', 'info');
      return !v;
    });
  };

  const joinVoiceRoomMeta = (id: string, title: string) => {
    setActiveVoiceRoomId(id);
    setActiveVoiceRoomTitle(title);
    setVoiceConnected(true);
  };

  const travelToContinent = (continentId: string) => {
    const cont = CONTINENTS_10.find((c) => c.id === continentId);
    if (!cont) return;
    setState((prev) => ({ ...prev, activeContinentId: continentId }));
    toast(`${cont.name} qit’asiga yetib keldingiz! (${cont.travelBonusUz})`, 'success');
  };

  const mineElement = (continentId: string) => {
    const cont = CONTINENTS_10.find((c) => c.id === continentId);
    if (!cont) return;
    const base = state.miningBases[continentId];
    if (!base) return;
    if (base.minedToday >= base.dailyCap) {
      toast(`Kunlik limit (${base.dailyCap}) to‘ldi! Cheksiz resurs chiqarish taqiqlanadi.`, 'error');
      return;
    }
    const yieldAmt = Math.min(base.dailyCap - base.minedToday, 20 + base.level * 15);
    setState((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [cont.resourceCode]: (prev.elements[cont.resourceCode] || 0) + yieldAmt,
      },
      miningBases: {
        ...prev.miningBases,
        [continentId]: {
          ...prev.miningBases[continentId],
          minedToday: prev.miningBases[continentId].minedToday + yieldAmt,
        },
      },
    }));
    toast(`+${yieldAmt} ${cont.resourceNameUz} qazib olindi! ${cont.resourceIcon}`, 'success');
  };

  const upgradeMine = (continentId: string) => {
    const base = state.miningBases[continentId];
    if (!base) return;
    const cost = base.level * 1200;
    if (worldCoins < cost) {
      toast(`Shaxtani rivojlantirish uchun ${cost} WORLD COIN kerak`, 'error');
      return;
    }
    updateCoinsLocally(worldCoins - cost);
    setState((prev) => ({
      ...prev,
      miningBases: {
        ...prev.miningBases,
        [continentId]: {
          ...prev.miningBases[continentId],
          level: prev.miningBases[continentId].level + 1,
          dailyCap: prev.miningBases[continentId].dailyCap + 100,
        },
      },
    }));
    toast(`Mayning bazasi ${base.level + 1}-darajaga ko‘tarildi! ⛏️`, 'success');
  };

  const assignDragonToMine = (continentId: string, dragonId: string) => {
    setState((prev) => ({
      ...prev,
      miningBases: {
        ...prev.miningBases,
        [continentId]: {
          ...prev.miningBases[continentId],
          assignedDragonId: dragonId,
        },
      },
    }));
    toast('Maxluq mayning bazasiga biriktirildi! 🐉⛏️', 'success');
  };

  const refineElement = (continentId: string) => {
    const cont = CONTINENTS_10.find((c) => c.id === continentId);
    if (!cont) return;
    const currentAmt = state.elements[cont.resourceCode] || 0;
    if (currentAmt < 20) {
      toast(`Qayta ishlash uchun kamida 20 ta ${cont.resourceNameUz} kerak`, 'error');
      return;
    }
    setState((prev) => ({
      ...prev,
      worldGems: prev.worldGems + 8,
      elements: {
        ...prev.elements,
        [cont.resourceCode]: currentAmt - 20,
      },
      miningBases: {
        ...prev.miningBases,
        [continentId]: {
          ...prev.miningBases[continentId],
          refinedCount: prev.miningBases[continentId].refinedCount + 1,
        },
      },
    }));
    toast(`20x ${cont.resourceNameUz} qayta ishlandi -> +8 WORLD GEM 💎`, 'success');
  };

  const tameWildBeast = (continentId: string) => {
    const cont = CONTINENTS_10.find((c) => c.id === continentId);
    if (!cont) return;
    if (state.tamedBeasts.includes(cont.wildBeastName)) {
      toast(`${cont.wildBeastName} allaqachon siz bilan do‘stlashgan!`, 'info');
      return;
    }
    const elemAmt = state.elements[cont.resourceCode] || 0;
    if (elemAmt < 15) {
      toast(`Do‘stlashtirish uchun 15 ta ${cont.resourceNameUz} kerak!`, 'error');
      return;
    }
    setState((prev) => ({
      ...prev,
      elements: { ...prev.elements, [cont.resourceCode]: elemAmt - 15 },
      tamedBeasts: [...prev.tamedBeasts, cont.wildBeastName],
    }));
    toast(`${cont.wildBeastName} do‘stlashtirildi va jamoangizga qo‘shildi! 🐉🤝`, 'success');
  };

  const evolveDragon = (dragonId: string) => {
    const curStage = state.dragonStages[dragonId] || 1;
    if (curStage >= 3) {
      toast('Bu ajdarho maksimal Afsonaviy (3-bosqich) evolyutsiyaga yetgan! 👑', 'info');
      return;
    }
    const costCoins = curStage * 2500;
    if (worldCoins < costCoins) {
      toast(`Evolyutsiya uchun ${costCoins} WORLD COIN kerak`, 'error');
      return;
    }
    updateCoinsLocally(worldCoins - costCoins);
    setState((prev) => ({
      ...prev,
      dragonStages: { ...prev.dragonStages, [dragonId]: curStage + 1 },
    }));
    toast(`Evolyutsiya muvaffaqiyatli! Ajdarho ${curStage + 1}-bosqichga ko‘tarildi! 🔥✨`, 'success');
  };

  const recordBattleWin = (coinsReward: number, gemsReward: number, xpReward: number, elementCode?: string) => {
    updateCoinsLocally(worldCoins + coinsReward);
    setState((prev) => {
      const nextXp = prev.serviceXp + xpReward;
      let nextRank = prev.rankLevel;
      MILITARY_RANKS_10.forEach((r) => {
        if (nextXp >= r.minServiceXp && r.level > nextRank) nextRank = r.level;
      });
      const nextElems = { ...prev.elements };
      if (elementCode) {
        nextElems[elementCode] = (nextElems[elementCode] || 0) + 18;
      }
      return {
        ...prev,
        worldGems: prev.worldGems + gemsReward,
        serviceXp: nextXp,
        rankLevel: nextRank,
        elements: nextElems,
      };
    });
  };

  const conquerTerritory = (targetKingdomId: string, coinsReward: number) => {
    updateCoinsLocally(worldCoins + coinsReward);
    setState((prev) => ({
      ...prev,
      worldGems: prev.worldGems + 25,
      kingdoms: prev.kingdoms.map((k) => {
        if (k.isPlayerKingdom) {
          return {
            ...k,
            territoriesCount: k.territoriesCount + 1,
            economyCoins: k.economyCoins + coinsReward,
          };
        }
        if (k.id === targetKingdomId && k.territoriesCount > 1) {
          return { ...k, territoriesCount: k.territoriesCount - 1 };
        }
        return k;
      }),
    }));
    addAuditLog(
      user?.displayName || 'General',
      'AGENT',
      `Strategik urush yakunlandi: +1 o‘yin hududi nazorati va +${coinsReward} WORLD COIN qo‘shildi`
    );
  };

  const buySoldierGear = (gearId: string, _priceCoins: number, _priceGems: number) => {
    if (state.ownedGearIds.includes(gearId)) {
      toast('Bu qurol/jihoz inventaringizda mavjud!', 'info');
      return;
    }
    setState((prev) => ({
      ...prev,
      ownedGearIds: [...prev.ownedGearIds, gearId],
      equippedGearIds: [...prev.equippedGearIds, gearId],
    }));
    toast('Harbiy buyum tekinga ochildi va taqildi! ⚔️🛡️', 'success');
  };

  const toggleEquipGear = (gearId: string) => {
    setState((prev) => {
      const equipped = prev.equippedGearIds.includes(gearId);
      return {
        ...prev,
        equippedGearIds: equipped
          ? prev.equippedGearIds.filter((id) => id !== gearId)
          : [...prev.equippedGearIds, gearId],
      };
    });
  };

  const buySellerItem = (itemId: string) => {
    const item = state.sellerProducts.find((p) => p.id === itemId);
    if (!item || item.stock <= 0) return;
    setState((prev) => ({
      ...prev,
      sellerProducts: prev.sellerProducts.map((p) =>
        p.id === itemId ? { ...p, stock: p.stock - 1, soldCount: p.soldCount + 1 } : p
      ),
    }));
    toast(`${item.nameUz} tekinga olindi! 🛍️`, 'success');
  };

  const listNewSellerItem = (
    item: Omit<SellerShopItem, 'id' | 'sellerName' | 'sellerVip' | 'rating' | 'soldCount'>
  ) => {
    const newItem: SellerShopItem = {
      ...item,
      id: `sel-${Date.now()}`,
      sellerName: user?.displayName || 'Mening Do‘konim',
      sellerVip: 'VIP Seller',
      rating: state.sellerRating,
      soldCount: 0,
    };
    setState((prev) => ({
      ...prev,
      sellerProducts: [newItem, ...prev.sellerProducts],
    }));
    toast(`${item.nameUz} Seller Marketga joylandi! 🏪`, 'success');
  };

  const acceptSellerOrder = (orderId: string) => {
    const ord = state.sellerOrders.find((o) => o.id === orderId);
    if (!ord || ord.status === 'TASDIQLANGAN') return;
    updateCoinsLocally(worldCoins + ord.priceCoins);
    setState((prev) => ({
      ...prev,
      sellerOrders: prev.sellerOrders.map((o) => (o.id === orderId ? { ...o, status: 'TASDIQLANGAN' } : o)),
      sellerRating: Math.min(5.0, Number((prev.sellerRating + 0.02).toFixed(2))),
    }));
    toast(`Buyurtma tasdiqlandi! +${ord.priceCoins} WORLD COIN Seller balansiga tushdi.`, 'success');
  };

  const promoteRank = (newLevel: number, actorName = 'Agent') => {
    const clamped = Math.max(1, Math.min(10, newLevel));
    const meta = MILITARY_RANKS_10[clamped - 1];
    setState((prev) => ({ ...prev, rankLevel: clamped }));
    addAuditLog(actorName, 'AGENT', `Harbiy unvon ${clamped}-darajaga (${meta.titleUz}) o‘zgartirildi`);
    toast(`Yangi harbiy unvon: ${meta.badge} ${meta.titleUz}!`, 'success');
  };

  const toggleEmergencyStop = (twoFactorCode: string) => {
    if (twoFactorCode.trim() !== '2026' && twoFactorCode.trim() !== '7777') {
      toast('2-bosqichli tasdiqlash kodi noto‘g‘ri! (Demo kod: 2026)', 'error');
      return false;
    }
    setState((prev) => ({ ...prev, emergencyStopped: !prev.emergencyStopped }));
    addAuditLog(
      'LOYIHA EGASI (SIZ)',
      'OWNER',
      !state.emergencyStopped
        ? 'FAVQULODDA TEXNIK TO‘XTATISH faollashtirildi (2FA tasdiqlandi)'
        : 'Tizim normal ish rejimiga qaytarildi (2FA tasdiqlandi)',
      true
    );
    toast(
      !state.emergencyStopped ? 'Favqulodda texnik to‘xtatish yoqildi!' : 'Tizim qayta ishga tushirildi!',
      'success'
    );
    return true;
  };

  const toggleManagerPermission = (key: 'manageAdmins' | 'assignAgents' | 'controlRooms' | 'viewReports') => {
    setState((prev) => ({
      ...prev,
      managerPermissions: {
        ...prev.managerPermissions,
        [key]: !prev.managerPermissions[key],
        changeOwner: false,
      },
    }));
    addAuditLog('LOYIHA EGASI (SIZ)', 'OWNER', `Manager vakolati (${key}) o‘zgartirildi`, true);
    toast('Manager vakolatlari yangilandi', 'success');
  };

  return (
    <WorldContext.Provider
      value={{
        state,
        worldCoins,
        voiceConnected,
        micEnabled,
        activeVoiceRoomId,
        activeVoiceRoomTitle,
        onlineVoiceCount,
        userPresence,
        setUserPresence,
        toggleMic,
        toggleVoiceConnection,
        joinVoiceRoomMeta,
        travelToContinent,
        mineElement,
        upgradeMine,
        assignDragonToMine,
        refineElement,
        tameWildBeast,
        evolveDragon,
        recordBattleWin,
        conquerTerritory,
        buySoldierGear,
        toggleEquipGear,
        buySellerItem,
        listNewSellerItem,
        acceptSellerOrder,
        promoteRank,
        toggleEmergencyStop,
        toggleManagerPermission,
        addAuditLog,
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};

export function useWorld() {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error('useWorld must be used inside WorldProvider');
  return ctx;
}
