import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  RefreshCw,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllProfilesFromSupabase,
  syncProfileToSupabase,
} from '../lib/supabaseSync';
import { setStoredUser } from '../lib/api';
import { User } from '../types';
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
    'Yangi Super Admin, Admin, Agent va Hostlarni tayinlash',
  ],
  SUPER_ADMIN: [
    'Jonli efir va ovozli xonalardagi tartibni kuzatish',
    'Admin, Agent va Hostlarni tayinlash',
  ],
  ADMIN: [
    'Faol jonli xonalardagi tartibni kuzatish',
    'Agent va Hostlarni tayinlash',
  ],
  AGENT: [
    'Yangi faol Hostlarni jalb qilish va ulash',
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
  const [members, setMembers] = useState<User[]>([]);
  const [searchQ, setSearchQ] = useState('');
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
      const profiles = await fetchAllProfilesFromSupabase();
      setMembers(profiles || []);
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
    toast(`${target.displayName} → ${getRoleMeta(nextRole).label} etib tayinlandi`, 'success');
  };

  if (!user || myRank === 0) {
    return (
      <div className="min-h-full px-4 py-8 flex flex-col items-center justify-center text-center space-y-3">
        <Shield className="w-10 h-10 text-slate-400" />
        <h1 className="text-base font-black text-slate-900">Boshqaruv paneli yopiq</h1>
        <p className="text-xs font-semibold text-slate-500 max-w-xs">
          Sizga Ega tomonidan lavozim berilganda ushbu panel ochiladi.
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
              <h1 className="text-base font-black text-slate-900">Mening Panelim</h1>
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

      {/* Role Tasks Checklist */}
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

      {/* Subordinate Role Assignment */}
      {assignableRoles.length > 0 && (
        <div className="card-white rounded-3xl p-4 space-y-3">
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>O‘zingizdan past lavozimlarni tayinlash</span>
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
                      <div className="text-xs font-black text-slate-900 truncate">{m.displayName}</div>
                      <div className="text-[10px] font-bold text-slate-500">
                        ID: {m.uid} • <span className="text-slate-700">{targetMeta.label}</span>
                      </div>
                    </div>
                  </div>

                  {canManage ? (
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
    </div>
  );
};
