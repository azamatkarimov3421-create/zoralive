import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  Users,
  XCircle,
  Ban,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorld } from '../context/WorldContext';
import {
  closeRoomInSupabase,
  fetchAllProfilesFromSupabase,
  fetchRoomsFromSupabase,
  sendRoomMessageToSupabase,
  syncProfileToSupabase,
} from '../lib/supabaseSync';
import { setStoredUser } from '../lib/api';
import { RoomSummary, User } from '../types';
import { Avatar } from '../components/Avatar';

const ROLE_ORDER: Array<{ role: User['role']; rank: number; label: string; color: string }> = [
  { role: 'USER', rank: 0, label: 'Oddiy Foydalanuvchi', color: 'bg-slate-100 text-slate-700' },
  { role: 'HOST', rank: 1, label: 'Host (Boshlovchi)', color: 'bg-sky-100 text-sky-800' },
  { role: 'AGENT', rank: 2, label: 'Agent', color: 'bg-emerald-100 text-emerald-800' },
  { role: 'AGENCY', rank: 2, label: 'Agency', color: 'bg-emerald-100 text-emerald-800' },
  { role: 'ADMIN', rank: 3, label: 'Admin', color: 'bg-amber-100 text-amber-800' },
  { role: 'SUPER_ADMIN', rank: 4, label: 'Super Admin', color: 'bg-orange-100 text-orange-800' },
  { role: 'MANAGER', rank: 5, label: 'Manager', color: 'bg-violet-100 text-violet-800' },
  { role: 'OWNER', rank: 6, label: 'Owner (Ega)', color: 'bg-rose-100 text-rose-800' },
];

export function getRoleMeta(role?: string) {
  return ROLE_ORDER.find((r) => r.role === role) || ROLE_ORDER[0];
}

const ROLE_TASKS: Record<string, string[]> = {
  MANAGER: [
    'Super Admin va Adminlar faoliyatini nazorat qilish',
    'Barcha jonli xonalarga muhim e’lon yuborish',
    'Yangi Super Admin, Admin, Agent va Hostlarni tayinlash',
  ],
  SUPER_ADMIN: [
    'Jonli efir va ovozli xonalardagi tartibni tekshirish',
    'Qoidabuzar xonalarni yopish va e’lon berish',
    'Admin, Agent va Hostlarni tayinlash',
  ],
  ADMIN: [
    'Faol jonli xonalarga kirib tartibni nazorat qilish',
    'Zarur hollarda muammoli xonalarni yopish',
    'Agent va Hostlarni tayinlash',
  ],
  AGENT: [
    'Yangi faol Hostlarni jalb qilish va ulash',
    'Jonli xonalardagi faollikni kuzatish',
    'Foydalanuvchilarga Host rolini tayinlash',
  ],
  AGENCY: [
    'Agentlik tarkibidagi Hostlarni boshqarish',
    'Jonli efirlar sifatini kuzatish',
  ],
  HOST: [
    'Kamida 1 ta jonli Ovozli yoki Video xona ochish',
    'Xona ishtirokchilari bilan faol muloqot qilish',
  ],
  OWNER: [
    'Butun tizim va barcha boshqaruvchilarni nazorat qilish',
    'Istalgan lavozimga tayinlash va xonalarni boshqarish',
  ],
};

export const StaffRolePanelPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, toast } = useAuth();
  const { state, addAuditLog } = useWorld();
  const [members, setMembers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [loading, setLoading] = useState(true);
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`zoralive_staff_tasks_${user?.id || 'guest'}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const myMeta = getRoleMeta(user?.role);
  const myRank = myMeta.rank;

  const loadData = async () => {
    setLoading(true);
    try {
      const [profiles, live] = await Promise.all([
        fetchAllProfilesFromSupabase(),
        fetchRoomsFromSupabase(),
      ]);
      setMembers(profiles || []);
      setRooms(live || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTask = (taskText: string) => {
    setDoneTasks((prev) => {
      const next = { ...prev, [taskText]: !prev[taskText] };
      try {
        localStorage.setItem(`zoralive_staff_tasks_${user?.id || 'guest'}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const assignableRoles = ROLE_ORDER.filter((r) => r.rank < myRank && r.role !== 'AGENCY');

  const handleAssignRole = async (target: User, nextRole: User['role']) => {
    const targetMeta = getRoleMeta(target.role);
    if (targetMeta.rank >= myRank) {
      toast('Siz o‘zingizdan yuqori yoki teng lavozimdagi foydalanuvchini o‘zgartira olmaysiz', 'error');
      return;
    }
    const updated: User = { ...target, role: nextRole };
    await syncProfileToSupabase({ id: target.id, role: nextRole });
    setMembers((prev) => prev.map((m) => (m.id === target.id ? updated : m)));
    if (user?.id === target.id) {
      setStoredUser(updated);
      await refreshUser();
    }
    addAuditLog(user?.displayName || 'Staff', myMeta.label, `${target.displayName} → ${getRoleMeta(nextRole).label} etib tayinlandi`);
    toast(`${target.displayName} → ${getRoleMeta(nextRole).label} etib tayinlandi`, 'success');
  };

  const handleToggleBan = async (target: User) => {
    const targetMeta = getRoleMeta(target.role);
    if (targetMeta.rank >= myRank) {
      toast('Yuqori yoki teng lavozimni bloklab bo‘lmaydi', 'error');
      return;
    }
    const nextBanned = !target.isBanned;
    const updated: User = { ...target, isBanned: nextBanned };
    await syncProfileToSupabase({ id: target.id, isBanned: nextBanned });
    setMembers((prev) => prev.map((m) => (m.id === target.id ? updated : m)));
    addAuditLog(user?.displayName || 'Staff', myMeta.label, `${target.displayName} ${nextBanned ? 'bloklandi 🚫' : 'blokdan ochildi ✅'}`);
    toast(`${target.displayName} ${nextBanned ? 'bloklandi' : 'blokdan ochildi'}`, nextBanned ? 'error' : 'success');
  };

  const handlePunish = async (target: User) => {
    const targetMeta = getRoleMeta(target.role);
    if (targetMeta.rank >= myRank) {
      toast('Yuqori yoki teng lavozimga jazo berib bo‘lmaydi', 'error');
      return;
    }
    const nextCoins = Math.max(0, (target.coins || 0) - 1000);
    const updated: User = { ...target, coins: nextCoins };
    await syncProfileToSupabase({ id: target.id, coins: nextCoins });
    setMembers((prev) => prev.map((m) => (m.id === target.id ? updated : m)));
    addAuditLog(user?.displayName || 'Staff', myMeta.label, `${target.displayName} ga jazo (-1,000 🪙 jarima) qo‘llandi`);
    toast(`${target.displayName} ga -1,000 🪙 jarima berildi`, 'info');
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = broadcastText.trim();
    if (!text || !user) return;
    await Promise.all(
      rooms.map((r) =>
        sendRoomMessageToSupabase(
          r.id,
          { ...user, displayName: `🛡️ ${myMeta.label} (${user.displayName})` },
          text,
          'SYSTEM'
        )
      )
    );
    setBroadcastText('');
    addAuditLog(user.displayName, myMeta.label, `Xonalarga e’lon yuborildi: "${text}"`);
    toast(`E’lon ${rooms.length} ta xonaga yuborildi`, 'success');
  };

  const handleCloseRoom = async (room: RoomSummary) => {
    await closeRoomInSupabase(room.id);
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    addAuditLog(user?.displayName || 'Staff', myMeta.label, `"${room.title}" xonasi yopildi`);
    toast(`"${room.title}" xonasi yopildi`, 'info');
  };

  if (!user || myRank === 0) {
    return (
      <div className="min-h-full px-4 py-8 flex flex-col items-center justify-center text-center space-y-3">
        <Shield className="w-10 h-10 text-slate-400" />
        <h1 className="text-base font-black text-slate-900">Boshqaruv paneli yopiq</h1>
        <p className="text-xs font-semibold text-slate-500 max-w-xs">
          Sizga Ega yoki yuqori boshqaruvchi tomonidan lavozim berilganda ushbu panel ochiladi.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-black cursor-pointer"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const tasks = ROLE_TASKS[user.role] || ROLE_TASKS.HOST;
  const filteredMembers = members.filter((m) => {
    if (m.id === user.id) return false;
    const q = searchQ.trim().toLowerCase();
    if (!q) return true;
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      String(m.uid).includes(q)
    );
  });

  return (
    <div className="min-h-full px-3.5 pt-3 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/75 backdrop-blur-xl border border-white text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900">Boshqaruv Paneli</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${myMeta.color}`}>
                {myMeta.label}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              Vazifalar va o‘zingizdan past lavozimlarni tayinlash
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-full bg-white/75 backdrop-blur-xl border border-white text-slate-700 cursor-pointer"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Role Tasks Checklist */}
      <div className="card-white rounded-3xl p-4 space-y-2.5">
        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Mening vazifalarim ({myMeta.label})</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => {
            const done = Boolean(doneTasks[task]);
            return (
              <button
                key={task}
                type="button"
                onClick={() => toggleTask(task)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl border flex items-center gap-2.5 transition cursor-pointer ${
                  done
                    ? 'bg-emerald-50/85 border-emerald-200 text-emerald-900'
                    : 'bg-white/60 border-slate-200/80 text-slate-800 hover:bg-white'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={`text-xs font-bold ${done ? 'line-through opacity-75' : ''}`}>{task}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Broadcast & Live Rooms (for Admin+ / Agent / Host) */}
      {myRank >= 3 && (
        <div className="card-white rounded-3xl p-4 space-y-2.5">
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Jonli xonalarga e’lon yuborish</span>
          </div>
          <form onSubmit={handleBroadcast} className="flex gap-2">
            <input
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="E’lon matnini yozing..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-amber-300 text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Yuborish</span>
            </button>
          </form>
        </div>
      )}

      <div className="card-white rounded-3xl p-4 space-y-2.5">
        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-[#ff3366]" />
          <span>Faol jonli xonalar ({rooms.length})</span>
        </div>
        {rooms.length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">Hozircha jonli xonalar yo‘q</p>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 bg-white/75 border border-slate-100 rounded-2xl px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-black text-slate-900 truncate">{r.title}</div>
                  <div className="text-[10px] font-bold text-slate-500">Boshlovchi: {r.hostName}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigate(r.type === 'VIDEO' ? `/video/${r.id}` : `/voice/${r.id}`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black cursor-pointer"
                  >
                    Kirish
                  </button>
                  {myRank >= 3 && (
                    <button
                      onClick={() => handleCloseRoom(r)}
                      className="p-1 rounded-lg bg-rose-100 text-rose-700 cursor-pointer"
                      title="Xonani yopish"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Subordinate Role Assignment (Strictly lower ranks) */}
      {assignableRoles.length > 0 && (
        <div className="card-white rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>O‘zingizdan past lavozimlarni tayinlash</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-2xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Ism, username yoki ID..."
              className="flex-1 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {filteredMembers.map((m) => {
              const targetMeta = getRoleMeta(m.role);
              const canManage = targetMeta.rank < myRank;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 bg-white/75 border border-slate-100 rounded-2xl px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={m.avatar} name={m.displayName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                        <span>{m.displayName}</span>
                        {m.isBanned && (
                          <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black">
                            BLOK
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">
                        ID: {m.uid} • 🪙 {(m.coins || 0).toLocaleString()} • <span className="text-slate-700">{targetMeta.label}</span>
                      </div>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {myRank >= 3 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePunish(m)}
                            className="p-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                            title="Jazo (-1,000 tanga)"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBan(m)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              m.isBanned ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                            title={m.isBanned ? 'Blokdan ochish' : 'Bloklash'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <select
                        value={m.role || 'USER'}
                        onChange={(e) => handleAssignRole(m, e.target.value as User['role'])}
                        className="px-2 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-900 shrink-0 cursor-pointer"
                      >
                        {assignableRoles.map((opt) => (
                          <option key={opt.role} value={opt.role}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="px-2 py-1 rounded-xl bg-slate-100 text-[10px] font-bold text-slate-400 shrink-0">
                      Yuqori/Teng
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Monitoring Feed: Newcomers & Recent Activity */}
      <div className="card-white rounded-3xl p-4 space-y-2.5">
        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Monitoring: Nimalar bo‘lyapti ({state.auditLogs.length})</span>
        </div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
          {state.auditLogs.slice(0, 12).map((log) => (
            <div key={log.id} className="bg-white/70 border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-black text-slate-900 mr-1.5">[{log.actor}]</span>
                <span className="font-semibold text-slate-700">{log.actionUz}</span>
              </div>
              <span className="text-[9.5px] font-bold text-slate-400 shrink-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
