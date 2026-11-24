import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Users, Radio, Gift, Plus, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user, toast } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'users' | 'rooms' | 'gifts' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [newGift, setNewGift] = useState({
    nameUz: '',
    icon: '💎',
    category: 'LUXURY',
    price: 750,
    effectType: 'fullscreen',
    accentColor: '#ff3366',
  });

  const load = async () => {
    setLoading(true);
    try {
      setData(await api('/admin/dashboard'));
    } catch (err: any) {
      toast(err.message, 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    load();
  }, [user?.role]);

  if (loading && !data) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400">...</div>;
  }

  const stats = data?.stats || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-[#ff3366]" />
          <h1 className="text-base font-black">ZoraLive Admin</h1>
        </div>
        <button onClick={load} className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yangilash
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Foydalanuvchilar', val: stats.totalUsers, icon: Users },
          { label: 'Jonli xonalar', val: stats.activeRooms, icon: Radio },
          { label: 'Sovg‘alar', val: data?.gifts?.length || 0, icon: Gift },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{k.label}</span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1.5">{k.val}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          ['overview', 'Umumiy'],
          ['users', `Foydalanuvchilar (${data?.users?.length || 0})`],
          ['rooms', `Xonalar (${data?.rooms?.length || 0})`],
          ['gifts', `Sovg‘alar (${data?.gifts?.length || 0})`],
          ['reports', `Shikoyatlar (${stats.openReports || 0})`],
        ].map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`px-3.5 py-2 rounded-full text-xs font-extrabold ${
              tab === k ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase">Agentliklar</h3>
            {(data?.agencies || []).map((a: any) => (
              <div key={a.id} className="flex justify-between py-2 border-b border-slate-100 text-xs last:border-0">
                <span className="font-bold">{a.name} ({a.code})</span>
                <span className="font-extrabold text-amber-600">💎 {Number(a.total_earned).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Tangalar</span>
              <span className="font-black">🪙 {Number(stats.totalTopupCoins || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Sovg‘a aylanmasi</span>
              <span className="font-black">🎁 {Number(stats.totalGiftsVolume || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">Foydalanuvchi</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Tangalar</th>
                <th className="py-2 pr-3">Olmoslar</th>
                <th className="py-2">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.users || []).map((u: any) => (
                <tr key={u.id}>
                  <td className="py-2.5 pr-3 font-bold">{u.displayName} <span className="text-slate-400 font-normal">#{u.uid}</span></td>
                  <td className="py-2.5 pr-3">{u.role}</td>
                  <td className="py-2.5 pr-3 font-bold text-amber-600">{u.coins.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 font-bold text-sky-600">{u.diamonds.toLocaleString()}</td>
                  <td className="py-2.5 flex gap-1.5">
                    <button
                      onClick={async () => {
                        await api(`/admin/users/${u.id}/coins`, { method: 'POST', body: JSON.stringify({ amount: 5000 }) });
                        load();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold"
                    >
                      +5k
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={async () => {
                          await api(`/admin/users/${u.id}/ban`, { method: 'POST' });
                          load();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold"
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rooms' && (
        <div className="grid md:grid-cols-2 gap-3">
          {(data?.rooms || []).map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">{r.title}</div>
                <div className="text-[11px] text-slate-400">{r.host_name} • {r.type}</div>
              </div>
              <button
                onClick={async () => {
                  await api(`/admin/rooms/${r.id}/toggle`, { method: 'POST' });
                  load();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${
                  r.is_live ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {r.is_live ? 'Yopish' : 'Yoqish'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'gifts' && (
        <div className="space-y-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api('/admin/gifts', { method: 'POST', body: JSON.stringify(newGift) });
              setNewGift({ ...newGift, nameUz: '' });
              load();
            }}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 grid grid-cols-2 md:grid-cols-6 gap-2"
          >
            <input
              required
              value={newGift.nameUz}
              onChange={(e) => setNewGift({ ...newGift, nameUz: e.target.value })}
              placeholder="Nom"
              className="col-span-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            />
            <input
              required
              value={newGift.icon}
              onChange={(e) => setNewGift({ ...newGift, icon: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center"
            />
            <input
              type="number"
              required
              value={newGift.price}
              onChange={(e) => setNewGift({ ...newGift, price: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            />
            <select
              value={newGift.category}
              onChange={(e) => setNewGift({ ...newGift, category: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <option value="BASIC">Oddiy</option>
              <option value="LUCKY">Lucky</option>
              <option value="LUXURY">Luxury</option>
            </select>
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Qo‘sh
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {(data?.gifts || []).map((g: any) => (
              <div key={g.id} className="bg-white rounded-2xl p-3 border border-slate-200/80 flex items-center gap-2.5">
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <div className="text-xs font-extrabold">{g.name_uz}</div>
                  <div className="text-[11px] text-amber-600 font-bold">🪙 {g.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-2">
          {(data?.reports || []).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
              Shikoyatlar yo‘q
            </div>
          ) : (
            (data?.reports || []).map((rp: any) => (
              <div key={rp.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold">{rp.reason}</div>
                  <div className="text-slate-400">{rp.reporter_name}</div>
                </div>
                {rp.status === 'OPEN' ? (
                  <button
                    onClick={async () => {
                      await api(`/admin/reports/${rp.id}/resolve`, { method: 'POST', body: JSON.stringify({ status: 'RESOLVED' }) });
                      load();
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold"
                  >
                    Yopish
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">{rp.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
