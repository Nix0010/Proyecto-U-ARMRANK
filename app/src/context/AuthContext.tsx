import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Storage ──────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'armrank_token';

function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

function loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function apiPost(url: string, body: unknown, token?: string | null) {
    const res = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || 'Error del servidor');
    }
    return res.json();
}

async function apiFetch(url: string, token: string) {
    const res = await fetch(`${API_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error fetching user');
    return res.json();
}

async function apiPatch(url: string, body: unknown, token: string) {
    const res = await fetch(`${API_URL}${url}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || 'Error del servidor');
    }
    return res.json();
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // On mount: restore session from localStorage
    useEffect(() => {
        const token = loadToken();
        if (!token) {
            setState((s) => ({ ...s, isLoading: false }));
            return;
        }
        apiFetch('/auth/me', token)
            .then((user: AuthUser) => {
                setState({ user, token, isLoading: false, isAuthenticated: true });
            })
            .catch(() => {
                clearToken();
                setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
            });
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { user, token } = await apiPost('/auth/login', { email, password });
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
        if (!state.token) throw new Error('No autenticado');
        const updated: AuthUser = await apiPatch('/auth/me', data, state.token);
        setState((s) => ({ ...s, user: updated }));
    }, [state.token]);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function useIsAdmin() {
    const { user } = useAuth();
    return user?.role === 'admin';
}

export function useIsOrganizer() {
    const { user } = useAuth();
    return user?.role === 'admin' || user?.role === 'organizer';
}
