import { create } from 'zustand';
import type { Category, Participant, RankedParticipant, Tournament } from '@/types/tournament';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type ApiErrorPayload = {
  error?: string;
  details?: Array<{ path?: Array<string | number>; message?: string }>;
};

type ApiParticipant = Omit<Participant, 'category' | 'categoryObj'> & {
  category?: string | Category | null;
  categoryObj?: Category | null;
};

type ApiTournament = Tournament & {
  participants?: ApiParticipant[];
  categories?: Category[];
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La conexion tardo demasiado. Verifica que el servidor este corriendo.');
    }
    throw error;
  } finally {
    window.clearTimeout(id);
  }
};

const normalizeParticipant = (participant: ApiParticipant): Participant => {
  const categoryObj: Category | null = participant.category && typeof participant.category === 'object'
    ? participant.category as Category
    : null;

  return {
    ...participant,
    categoryId: participant.categoryId ?? categoryObj?.id ?? null,
    categoryObj,
    category: typeof participant.category === 'string'
      ? participant.category
      : categoryObj?.name ?? null,
    stats: participant.stats ?? {
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      matchesPlayed: 0,
      rank: null,
    },
  };
};

const normalizeTournament = (tournament: ApiTournament): Tournament => {
  const categories = tournament.categories ?? [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return {
    ...tournament,
    categories,
    participants: (tournament.participants ?? []).map((participant) => {
      const normalized = normalizeParticipant(participant);
      const categoryObj = normalized.categoryObj ?? (normalized.categoryId ? categoryMap.get(normalized.categoryId) ?? null : null);

      return {
        ...normalized,
        categoryObj,
        category: normalized.category ?? categoryObj?.name ?? null,
      };
    }),
    matches: (tournament.matches ?? []).map((match) => ({
      ...match,
      category: match.category ?? (match.categoryId ? categoryMap.get(match.categoryId)?.name ?? null : null),
    })),
  };
};

const parseErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
  if (!payload) return fallback;

  if (payload.error) {
    return payload.error;
  }

  if (payload.details?.length) {
    return payload.details
      .map((detail) => {
        const field = detail.path?.join('.') ?? 'campo';
        return `${field}: ${detail.message ?? 'valor invalido'}`;
      })
      .join('; ');
  }

  return fallback;
};

interface ApiState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  categories: Category[];
  ranking: { ranking: RankedParticipant[]; podium: RankedParticipant[] } | null;
  isLoading: boolean;
  error: string | null;
  fetchTournaments: () => Promise<void>;
  fetchTournament: (id: string) => Promise<void>;
  createTournament: (data: Partial<Tournament>) => Promise<Tournament>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  setCurrentTournament: (tournament: Tournament | null) => void;
  addParticipant: (tournamentId: string, participant: Partial<Participant>) => Promise<void>;
  updateParticipant: (tournamentId: string, participantId: string, data: Partial<Participant>) => Promise<void>;
  removeParticipant: (tournamentId: string, participantId: string) => Promise<void>;
  fetchCategories: (tournamentId: string) => Promise<Category[]>;
  createCategory: (tournamentId: string, data: Partial<Category>) => Promise<Category>;
  updateCategory: (tournamentId: string, categoryId: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (tournamentId: string, categoryId: string) => Promise<void>;
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
  fetchRanking: (tournamentId: string) => Promise<void>;
  clearError: () => void;
  checkHealth: () => Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al cargar torneos'));
      const data = await response.json() as ApiTournament[];
      set({ tournaments: data.map(normalizeTournament), isLoading: false });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
    }
  },

  fetchTournament: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${id}`);
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al cargar torneo'));
      const data = await response.json() as ApiTournament;
      set({ currentTournament: normalizeTournament(data), isLoading: false });
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al crear torneo'));
      const newTournament = normalizeTournament(await response.json() as ApiTournament);
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al actualizar torneo'));
      const updated = normalizeTournament(await response.json() as ApiTournament);
      set((state) => ({
        tournaments: state.tournaments.map((tournament) => (tournament.id === id ? updated : tournament)),
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
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al eliminar torneo'));
      set((state) => ({
        tournaments: state.tournaments.filter((tournament) => tournament.id !== id),
        currentTournament: state.currentTournament?.id === id ? null : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),

  addParticipant: async (tournamentId: string, participant: Partial<Participant>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant),
      });
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al agregar participante'));

      const newParticipant = normalizeParticipant(await response.json() as ApiParticipant);
      set((state) => {
        if (!state.currentTournament) {
          return { isLoading: false };
        }

        const updatedTournament = normalizeTournament({
          ...state.currentTournament,
          participants: [...state.currentTournament.participants, newParticipant],
          currentParticipants: state.currentTournament.currentParticipants + 1,
        });

        return {
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((tournament) => (
            tournament.id === tournamentId ? updatedTournament : tournament
          )),
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al actualizar participante'));

      const updatedParticipant = normalizeParticipant(await response.json() as ApiParticipant);
      set((state) => {
        if (!state.currentTournament) {
          return { isLoading: false };
        }

        const updatedTournament = normalizeTournament({
          ...state.currentTournament,
          participants: state.currentTournament.participants.map((participant) => (
            participant.id === participantId ? updatedParticipant : participant
          )),
        });

        return {
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((tournament) => (
            tournament.id === tournamentId ? updatedTournament : tournament
          )),
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  removeParticipant: async (tournamentId: string, participantId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/participants/${participantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al eliminar participante'));

      set((state) => {
        if (!state.currentTournament) {
          return { isLoading: false };
        }

        const updatedTournament = normalizeTournament({
          ...state.currentTournament,
          participants: state.currentTournament.participants.filter((participant) => participant.id !== participantId),
          currentParticipants: Math.max(state.currentTournament.currentParticipants - 1, 0),
        });

        return {
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((tournament) => (
            tournament.id === tournamentId ? updatedTournament : tournament
          )),
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al generar bracket'));

      const updated = normalizeTournament(await response.json() as ApiTournament);
      set((state) => ({
        currentTournament: updated,
        tournaments: state.tournaments.map((tournament) => (tournament.id === tournamentId ? updated : tournament)),
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al actualizar partido'));

      const updated = normalizeTournament(await response.json() as ApiTournament);
      set((state) => ({
        currentTournament: updated,
        tournaments: state.tournaments.map((tournament) => (tournament.id === tournamentId ? updated : tournament)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: handleError(error), isLoading: false });
      throw error;
    }
  },

  fetchCategories: async (tournamentId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/categories`);
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al cargar categorias'));
      const data = await response.json() as Category[];
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al crear categoria'));

      const created = await response.json() as Category;
      set((state) => ({
        categories: [...state.categories, created],
        currentTournament: state.currentTournament ? {
          ...state.currentTournament,
          categories: [...(state.currentTournament.categories || []), created],
        } : null,
      }));
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al actualizar categoria'));

      const updated = await response.json() as Category;
      set((state) => ({
        categories: state.categories.map((category) => category.id === categoryId ? updated : category),
        currentTournament: state.currentTournament ? normalizeTournament({
          ...state.currentTournament,
          categories: state.currentTournament.categories.map((category) => category.id === categoryId ? updated : category),
        }) : null,
      }));
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
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al eliminar categoria'));

      set((state) => ({
        categories: state.categories.filter((category) => category.id !== categoryId),
        currentTournament: state.currentTournament ? normalizeTournament({
          ...state.currentTournament,
          categories: state.currentTournament.categories.filter((category) => category.id !== categoryId),
          participants: state.currentTournament.participants.map((participant) => (
            participant.categoryId === categoryId
              ? { ...participant, categoryId: null, category: null, categoryObj: null }
              : participant
          )),
        }) : null,
      }));
    } catch (error) {
      set({ error: handleError(error) });
      throw error;
    }
  },

  fetchRanking: async (tournamentId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tournaments/${tournamentId}/ranking`);
      if (!response.ok) throw new Error(await parseErrorMessage(response, 'Error al cargar ranking'));
      const data = await response.json() as { ranking: RankedParticipant[]; podium: RankedParticipant[] };
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



