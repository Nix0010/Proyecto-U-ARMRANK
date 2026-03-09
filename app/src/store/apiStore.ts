import { create } from 'zustand';
import type { Tournament, Participant, Category, RankedParticipant } from '@/types/tournament';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper para fetch con timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado. Verifica que el servidor esté corriendo.');
    }
    throw error;
  }
};

interface ApiState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  categories: Category[];
  ranking: { ranking: RankedParticipant[]; podium: RankedParticipant[] } | null;
  isLoading: boolean;
  error: string | null;

  // Tournament Actions
  fetchTournaments: () => Promise<void>;
  fetchTournament: (id: string) => Promise<void>;
  createTournament: (data: Partial<Tournament>) => Promise<Tournament>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  setCurrentTournament: (tournament: Tournament | null) => void;

  // Participants
  addParticipant: (tournamentId: string, participant: Partial<Participant>) => Promise<void>;
  updateParticipant: (tournamentId: string, participantId: string, data: Partial<Participant>) => Promise<void>;
  removeParticipant: (tournamentId: string, participantId: string) => Promise<void>;

  // Categories
  fetchCategories: (tournamentId: string) => Promise<Category[]>;
  createCategory: (tournamentId: string, data: Partial<Category>) => Promise<Category>;
  updateCategory: (tournamentId: string, categoryId: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (tournamentId: string, categoryId: string) => Promise<void>;

  // Bracket
  generateBracket: (tournamentId: string) => Promise<void>;
  advanceMatch: (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    score1?: number,
    score2?: number,
    resultType?: string,
    arm?: string
  ) => Promise<void>;

  // Ranking
  fetchRanking: (tournamentId: string) => Promise<void>;

  clearError: () => void;
  checkHealth: () => Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

// Helper para manejar errores
const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
};

export const useApiStore = create<ApiState>()((set) => ({
  tournaments: [],
  currentTournament: null,
  categories: [],
  ranking: null,
  isLoading: false,
  error: null,

  fetchTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments`);
      if (!response.ok) throw new Error('Error al cargar torneos');
      const data = await response.json();
      set({ tournaments: data, isLoading: false });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
    }
  },

  fetchTournament: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${id}`);
      if (!response.ok) throw new Error('Error al cargar torneo');
      const data = await response.json();
      set({ currentTournament: data, isLoading: false });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
    }
  },

  createTournament: async (data: Partial<Tournament>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear torneo');
      const newTournament = await response.json();
      set((state) => ({
        tournaments: [newTournament, ...state.tournaments],
        currentTournament: newTournament,
        isLoading: false,
      }));
      return newTournament;
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  updateTournament: async (id: string, data: Partial<Tournament>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar torneo');
      const updated = await response.json();
      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === id ? updated : t)),
        currentTournament: state.currentTournament?.id === id ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  deleteTournament: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar torneo');
      set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id),
        currentTournament: state.currentTournament?.id === id ? null : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  setCurrentTournament: (tournament) => {
    set({ currentTournament: tournament });
  },

  addParticipant: async (tournamentId: string, participant: Partial<Participant>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const newParticipant = await response.json();

      set((state) => {
        if (!state.currentTournament) return state;
        return {
          currentTournament: {
            ...state.currentTournament,
            participants: [...state.currentTournament.participants, newParticipant],
            currentParticipants: state.currentTournament.currentParticipants + 1,
          },
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage = handleError(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateParticipant: async (tournamentId: string, participantId: string, data: Partial<Participant>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const updatedParticipant = await response.json();

      set((state) => {
        if (!state.currentTournament) return state;
        return {
          currentTournament: {
            ...state.currentTournament,
            participants: state.currentTournament.participants.map((p) =>
              p.id === participantId ? updatedParticipant : p
            ),
          },
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage = handleError(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeParticipant: async (tournamentId: string, participantId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar participante');

      set((state) => {
        if (!state.currentTournament) return state;
        return {
          currentTournament: {
            ...state.currentTournament,
            participants: state.currentTournament.participants.filter((p) => p.id !== participantId),
            currentParticipants: state.currentTournament.currentParticipants - 1,
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  generateBracket: async (tournamentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar bracket');
      }

      const updated = await response.json();

      set((state) => ({
        currentTournament: updated,
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  advanceMatch: async (tournamentId, matchId, winnerId, score1, score2, resultType, arm) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, score1, score2, resultType: resultType || null, arm: arm || null }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar partido');
      }

      const updated = await response.json();

      set((state) => ({
        currentTournament: updated,
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  // ─── Category Actions ───────────────────────────────────────────────────────

  fetchCategories: async (tournamentId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/categories`);
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data: Category[] = await response.json();
      set({ categories: data });
      return data;
    } catch (error) {
      set({ error: handleError(error) });
      return [];
    }
  },

  createCategory: async (tournamentId, data) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear categoría');
      }
      const created: Category = await response.json();
      set((state) => ({ categories: [...state.categories, created] }));
      // Also update currentTournament.categories if it exists
      set((state) => {
        if (!state.currentTournament) return state;
        return {
          currentTournament: {
            ...state.currentTournament,
            categories: [...(state.currentTournament.categories || []), created],
          },
        };
      });
      return created;
    } catch (error) {
      set({ error: handleError(error) });
      throw error;
    }
  },

  updateCategory: async (tournamentId, categoryId, data) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar categoría');
      const updated: Category = await response.json();
      set((state) => ({ categories: state.categories.map(c => c.id === categoryId ? updated : c) }));
    } catch (error) {
      set({ error: handleError(error) });
      throw error;
    }
  },

  deleteCategory: async (tournamentId, categoryId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar categoría');
      set((state) => ({
        categories: state.categories.filter(c => c.id !== categoryId),
        currentTournament: state.currentTournament ? {
          ...state.currentTournament,
          categories: (state.currentTournament.categories || []).filter(c => c.id !== categoryId),
        } : null,
      }));
    } catch (error) {
      set({ error: handleError(error) });
      throw error;
    }
  },

  // ─── Ranking ─────────────────────────────────────────────────────────────────

  fetchRanking: async (tournamentId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/ranking`);
      if (!response.ok) throw new Error('Error al cargar ranking');
      const data = await response.json();
      set({ ranking: data });
    } catch (error) {
      set({ error: handleError(error) });
    }
  },

  clearError: () => set({ error: null }),

  checkHealth: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/health`, {}, 5000);
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      return { ok: false, error: handleError(error) };
    }
  },
}));
