// Helpers para hacer peticiones al backend REST
// Envuelvo fetch para no repetir el header Authorization en cada llamada

import Cookies from 'js-cookie';

const BASE_URL = '/api';

function getHeaders(): HeadersInit {
  const token = Cookies.get('trivia_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data as T;
}

export const api = {
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),
};

// Tipos de respuesta del backend
export interface AuthResponse {
  token: string;
  user: { id: number; username: string; email: string };
}

export interface HistoryItem {
  id: number;
  room_code: string;
  category: string;
  player_count: number;
  winner_name: string;
  score: number;
  position: number;
  ended_at: string;
}

export interface StatsResponse {
  stats: {
    total_games: number;
    total_score: number;
    best_score: number;
    wins: number;
  };
}
