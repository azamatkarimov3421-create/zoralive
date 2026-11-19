import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, getStoredUser, setStoredUser } from '../lib/api';
import { resetSocket } from '../lib/socket';
import { Lang, User } from '../types';
import { translations } from '../i18n/translations';

interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  loginWithToken: (token: string, u: User) => void;
  refreshUser: () => Promise<void>;
  updateCoinsLocally: (coins: number) => void;
  logout: () => void;
  toast: (text: string, kind?: 'info' | 'success' | 'error') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('zoralive_lang') as Lang) || 'uz');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string, kind: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('zoralive_lang', l);
  };

  const t = useCallback(
    (key: string) => translations[lang]?.[key] || translations.uz[key] || key,
    [lang]
  );

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      return;
    }
    try {
      const data = await api<{ user: User }>('/auth/me');
      if (data?.user) {
        setUser(data.user);
        setStoredUser(data.user);
      }
    } catch {
      // Keep existing stored user on minor errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithToken = (token: string, u: User) => {
    setToken(token);
    setStoredUser(u);
    resetSocket();
    setUser(u);
  };

  const updateCoinsLocally = (coins: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, coins };
      setStoredUser(updated);
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setStoredUser(null);
    resetSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        lang,
        setLang,
        t,
        loginWithToken,
        refreshUser,
        updateCoinsLocally,
        logout,
        toast,
      }}
    >
      {children}
      {/* Floating Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-2xl border backdrop-blur-xl text-center transition-all ${
              item.kind === 'error'
                ? 'bg-rose-500/90 border-rose-300/40 text-white'
                : item.kind === 'success'
                ? 'bg-emerald-500/90 border-emerald-300/40 text-white'
                : 'bg-slate-900/90 border-cyan-400/35 text-cyan-50'
            }`}
          >
            {item.text}
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
