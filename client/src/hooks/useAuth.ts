import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  avatar_url: string | null;
  cargo: string | null;
  role: string;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
  cargo?: string | null;
  avatar_url?: string | null;
}

// A sessão é mantida por um cookie httpOnly e fica salva no banco (tabela
// `sessions`). Nada é guardado em memória nem no localStorage: ao recarregar
// a página, o cookie reautentica consultando o banco.

async function authRequest<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Envia e recebe cookies de sessão
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Sinais do login social no fragmento da URL (#novo = acabou de entrar).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('novo=') || hash.includes('auth_error=')) {
      const params = new URLSearchParams(hash.slice(1));
      if (params.get('novo')) setJustLoggedIn(true);
      const err = params.get('auth_error');
      if (err) setOauthError(err);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Reautentica pela sessão salva no banco (cookie httpOnly) ao carregar a página.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUser(data.user);
        }
      } catch { /* servidor offline */ }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authRequest<{ user: AuthUser }>('/api/auth/login', { email, password });
    setUser(data.user);
    setJustLoggedIn(true);
  }, []);

  // Cria a conta, mas NÃO autentica o fluxo leva o usuário à tela de login.
  const register = useCallback(async (name: string, email: string, password: string, cargo?: string) => {
    await authRequest('/api/auth/register', { name, email, password, cargo });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignora */ }
    setUser(null);
    setJustLoggedIn(false);
  }, []);

  // fetch autenticado o cookie de sessão vai automaticamente (mesma origem).
  const authedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
    return data;
  }, []);

  const updateProfile = useCallback(async (fields: ProfileUpdate) => {
    const data = await authedFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(fields) });
    setUser((data as { user: AuthUser }).user);
    return (data as { user: AuthUser }).user;
  }, [authedFetch]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authedFetch('/api/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  }, [authedFetch]);

  const deleteAccount = useCallback(async () => {
    try {
      await authedFetch('/api/auth/me', { method: 'DELETE' });
    } finally {
      setUser(null);
      setJustLoggedIn(false);
    }
  }, [authedFetch]);

  return {
    user,
    loading,
    oauthError,
    clearOauthError: () => setOauthError(null),
    justLoggedIn,
    clearJustLoggedIn: () => setJustLoggedIn(false),
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
  };
}
