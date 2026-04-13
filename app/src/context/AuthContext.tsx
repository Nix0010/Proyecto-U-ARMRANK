import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'armrank_token';

export type UserRole = 'admin' | 'organizer' | 'athlete' | 'spectator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  country: string | null;
  team: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  country?: string;
  team?: string;
}

const loadToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function apiPost(url: string, body: unknown, token?: string | null) {
  const response = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || 'Error del servidor');
  }

  return response.json();
}

async function apiFetch(url: string, token: string) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Sesion invalida');
  }

  return response.json();
}

async function apiPatch(url: string, body: unknown, token: string) {
  const response = await fetch(`${API_URL}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || 'Error del servidor');
  }

  return response.json();
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = loadToken();
    return {
      user: null,
      token,
      isLoading: Boolean(token),
      isAuthenticated: false,
    };
  });

  useEffect(() => {
    if (!state.token) {
      return;
    }

    let cancelled = false;

    apiFetch('/auth/me', state.token)
      .then((user: AuthUser) => {
        if (cancelled) return;
        setState({ user, token: state.token, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      });

    return () => {
      cancelled = true;
    };
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await apiPost('/auth/login', { email, password });
    saveToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { user, token } = await apiPost('/auth/google', { credential });
    saveToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const { user, token } = await apiPost('/auth/register', data);
    saveToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    if (!state.token) {
      throw new Error('No autenticado');
    }

    const updated = await apiPatch('/auth/me', data, state.token) as AuthUser;
    setState((current) => ({ ...current, user: updated }));
  }, [state.token]);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}

export function useIsOrganizer() {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'organizer';
}
