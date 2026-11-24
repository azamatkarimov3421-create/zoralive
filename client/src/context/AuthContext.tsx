import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api, getToken, setToken, getStoredUser, setStoredUser } from '../lib/api';
import { resetSocket } from '../lib/socket';
import {
  fetchProfileFromSupabase,
  syncProfileToSupabase,
  registerOrLoginUser,
  findProfileByEmailPrefix,
  mapDbUser,
} from '../lib/supabaseSync';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lang, User } from '../types';
import { translations } from '../i18n/translations';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

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
  loginWithToken: (token: string, u: User) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithUsername: (username: string, displayName?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCoinsLocally: (coins: number) => void;
  logout: () => Promise<void>;
  toast: (text: string, kind?: 'info' | 'success' | 'error') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncBackendJwt(profile: User): Promise<string> {
  try {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!API_BASE && !isLocal) return profile.id;

    const url = API_BASE ? `${API_BASE}/api/auth/sync` : '/api/auth/sync';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data?.token) return data.token;
    }
  } catch {
    // Offline or serverless deployment — fall back to profile ID token
  }
  return profile.id;
}

const AUTH_SCHEMA_KEY = 'zoralive_auth_v2';

function purgeLegacyDemoCacheIfNeeded(): User | null {
  try {
    const tok = getToken();
    const migrated = localStorage.getItem(AUTH_SCHEMA_KEY);
    if (!migrated || (tok && tok.startsWith('demo_token'))) {
      setToken(null);
      setStoredUser(null);
      localStorage.setItem(AUTH_SCHEMA_KEY, '1');
      return null;
    }
    return getStoredUser();
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => purgeLegacyDemoCacheIfNeeded());
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('zoralive_lang') as Lang) || 'uz');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const syncingRef = useRef<string | null>(null);

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

  const applyAuthenticatedProfile = useCallback(async (profile: User, silent = false, isNewSignup = false) => {
    const jwt = await syncBackendJwt(profile);
    setToken(jwt);
    setStoredUser(profile);
    resetSocket();
    setUser(profile);
    if (!silent) {
      toast(
        isNewSignup
          ? `Tabriklaymiz, ${profile.displayName}! Yangi hisob ochildi 🎉`
          : `Xush kelibsiz, ${profile.displayName}!`,
        'success'
      );
    }
  }, [toast]);

  const handleSupabaseAuthUser = useCallback(
    async (authUser: any, customDisplayName?: string, silent = false) => {
      if (!authUser?.id) return;
      if (syncingRef.current === authUser.id) return;
      syncingRef.current = authUser.id;
      try {
        const existing = await fetchProfileFromSupabase(authUser.id);
        const googleAvatar =
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          '';
        if (existing) {
          if (!existing.avatar && googleAvatar) {
            existing.avatar = googleAvatar;
            await syncProfileToSupabase({ id: existing.id, avatar: googleAvatar });
          }
          await applyAuthenticatedProfile(existing, silent, false);
          return;
        }

        const email = String(authUser.email || '').trim();
        const rawName = (
          customDisplayName ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Foydalanuvchi')
        ).trim();
        const avatar = googleAvatar;
        const uid = Math.floor(Math.random() * 800000) + 100000;
        const baseUsername = (email ? email.split('@')[0] : rawName)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 18) || `user_${uid}`;
        const uniqueUsername = `${baseUsername}_${String(uid).slice(-3)}`;

        const newRow = {
          id: authUser.id,
          uid,
          username: uniqueUsername,
          display_name: rawName,
          avatar,
          bio: 'ZoraLive a’zosi',
          coins: 5000,
          diamonds: 0,
          world_gem: 0,
          vip_level: 0,
          rank_level: 1,
          active_frame: '',
          active_ride: '',
          active_bubble: '',
          followers_count: 0,
          following_count: 0,
        };

        await supabase.from('profiles').upsert(newRow, { onConflict: 'id' });

        const mapped = (await fetchProfileFromSupabase(authUser.id)) || mapDbUser(newRow);
        await applyAuthenticatedProfile(mapped, silent, true);
      } catch (e: any) {
        console.warn('handleSupabaseAuthUser error:', e);
      } finally {
        syncingRef.current = null;
      }
    },
    [applyAuthenticatedProfile]
  );

  // Coordinated boot: check Supabase OAuth/session FIRST, then stored user (never hijack with demo user!)
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Show clear message if OAuth returned an error in query OR hash
        if (typeof window !== 'undefined') {
          const rawErr =
            (window.location.search.includes('error_description=') && window.location.search) ||
            (window.location.hash.includes('error_description=') && window.location.hash.replace(/^#/, '?')) ||
            '';
          if (rawErr) {
            const sp = new URLSearchParams(rawErr);
            const desc = sp.get('error_description') || sp.get('error') || 'Google kirish xatoligi';
            toast(`Google xatosi: ${desc}`, 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        if (isSupabaseConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            await handleSupabaseAuthUser(session.user, undefined, true);
            if (mounted) setLoading(false);
            return;
          }
        }

        const stored = purgeLegacyDemoCacheIfNeeded();
        if (stored?.id) {
          const liveProfile = await fetchProfileFromSupabase(stored.id);
          const resolved = liveProfile || stored;
          await applyAuthenticatedProfile(resolved, true);
        } else {
          setUser(null);
        }
      } catch {
        // Keep stored user if offline
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        handleSupabaseAuthUser(session.user, undefined, event === 'TOKEN_REFRESHED');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSupabaseAuthUser, applyAuthenticatedProfile]);

  const refreshUser = useCallback(async () => {
    try {
      const current = getStoredUser();
      if (!current?.id) return;

      const liveProfile = await fetchProfileFromSupabase(current.id);
      if (liveProfile) {
        await syncBackendJwt(liveProfile);
        setUser(liveProfile);
        setStoredUser(liveProfile);
        return;
      }
      if (getToken()) {
        const data = await api<{ user: User }>('/auth/me');
        if (data?.user && data.user.id === current.id) {
          setUser(data.user);
          setStoredUser(data.user);
        }
      }
    } catch {
      // Keep existing stored user on minor errors
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithToken = async (_token: string, u: User) => {
    await applyAuthenticatedProfile(u, false);
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });
      if (error) throw error;
      if (data?.url) {
        try {
          if (window.self !== window.top) {
            window.open(data.url, '_blank');
          } else {
            window.location.assign(data.url);
          }
        } catch {
          window.location.assign(data.url);
        }
      }
    } catch (err: any) {
      toast(err.message || 'Google bilan ulanishda xatolik', 'error');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        // If user registered earlier and Supabase email confirmation isn't completed yet, log them into their real profile
        if (msg.includes('email not confirmed')) {
          const existing = await findProfileByEmailPrefix(email);
          if (existing) {
            await applyAuthenticatedProfile(existing, false);
            return;
          }
        }
        throw error;
      }
      if (data.user) {
        await handleSupabaseAuthUser(data.user);
      }
    } catch (err: any) {
      toast(err.message || 'Email yoki parol noto‘g‘ri', 'error');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('rate limit') || msg.includes('already registered')) {
          const existing = await findProfileByEmailPrefix(email);
          if (existing) {
            await applyAuthenticatedProfile(existing, false);
            return;
          }
          const fallbackProfile = await registerOrLoginUser(email.split('@')[0], name);
          if (fallbackProfile) {
            await applyAuthenticatedProfile(fallbackProfile, false);
            return;
          }
        }
        throw error;
      }
      if (data.user) {
        await handleSupabaseAuthUser(data.user, name);
      }
    } catch (err: any) {
      toast(err.message || 'Ro‘yxatdan o‘tishda xatolik', 'error');
      throw err;
    }
  };

  const loginWithUsername = async (username: string, displayName?: string) => {
    try {
      const profile = await registerOrLoginUser(username, displayName);
      if (profile) {
        await applyAuthenticatedProfile(profile, false);
      } else {
        throw new Error('Foydalanuvchi topilmadi');
      }
    } catch (err: any) {
      toast(err.message || 'Foydalanuvchini yuklashda xatolik', 'error');
      throw err;
    }
  };

  const updateCoinsLocally = (coins: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, coins };
      setStoredUser(updated);
      syncProfileToSupabase({ id: updated.id, coins });
      return updated;
    });
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {}
    setToken(null);
    setStoredUser(null);
    resetSocket();
    setUser(null);
    toast('Hisobdan muvaffaqiyatli chiqildi', 'info');
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
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithUsername,
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
