import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Lang, User } from '../types';

export const AuthPage: React.FC = () => {
  const { loginWithToken, lang, setLang, toast } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { username, password }
          : { username, displayName: displayName || username, password, agencyCode };
      const res = await api<{ token: string; user: User }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      loginWithToken(res.token, res.user);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const quickDemo = async (preset: 'user' | 'host' | 'agency' | 'admin') => {
    setBusy(true);
    try {
      const res = await api<{ token: string; user: User }>('/auth/demo', {
        method: 'POST',
        body: JSON.stringify({ preset }),
      });
      loginWithToken(res.token, res.user);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 flex gap-1 bg-slate-100 rounded-full p-1">
        {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
              lang === l ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center">
          <img src="/icon.svg" alt="ZoraLive" className="w-14 h-14 rounded-2xl mb-3 shadow-md" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ZoraLive</h1>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-full">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-full text-xs font-extrabold ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-full text-xs font-extrabold ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Username"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366]"
          />
          {mode === 'register' && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ism"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366]"
            />
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Parol"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366]"
          />
          {mode === 'register' && (
            <input
              value={agencyCode}
              onChange={(e) => setAgencyCode(e.target.value)}
              placeholder="Agency ID (ixtiyoriy)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366]"
            />
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-full btn-brand font-extrabold text-sm active:scale-98 transition disabled:opacity-60"
          >
            {busy ? '...' : mode === 'login' ? 'Kirish' : 'Hisob yaratish'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'user', label: 'VIP Mehmon', img: '/assets/avatar-azizbek.jpg' },
              { id: 'host', label: 'Madina Host', img: '/assets/avatar-madina.jpg' },
              { id: 'agency', label: 'Agentlik', img: '/assets/avatar-abrorbek.jpg' },
              { id: 'admin', label: 'Admin', img: '/assets/avatar-sardor.jpg' },
            ].map((d) => (
              <button
                key={d.id}
                disabled={busy}
                onClick={() => quickDemo(d.id as any)}
                className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition"
              >
                <img src={d.img} alt={d.label} className="w-7 h-7 rounded-full object-cover object-top" />
                <span className="text-xs font-bold text-slate-800 truncate">{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
