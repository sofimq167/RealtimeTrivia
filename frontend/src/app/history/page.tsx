'use client';

// Historial de partidas del usuario — muestra las últimas 20 partidas y estadísticas globales

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, HistoryItem, StatsResponse } from '@/lib/api';
import Button from '@/components/ui/Button';

const CATEGORY_LABELS: Record<string, string> = {
  videojuegos: '🎮 Videojuegos',
  peliculas: '🎬 Películas',
};

const POSITION_STYLES: Record<number, string> = {
  1: 'bg-amber-warm/20 text-amber-warm border border-amber-warm/30',
  2: 'bg-sand/20 text-sand-dark border border-sand/30',
  3: 'bg-brown-light/10 text-brown-light border border-brown-light/20',
};

export default function HistoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.get<{ history: HistoryItem[] }>('/history'),
      api.get<StatsResponse>('/history/stats'),
    ]).then(([histRes, statsRes]) => {
      setHistory(histRes.history);
      setStats(statsRes.stats);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (isLoading || (!user && !isLoading)) {
    if (!user && !isLoading) router.push('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
        <div className="w-8 h-8 border-4 border-brown border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brown-dark">Mi Historial</h1>
            <p className="text-brown/60 text-sm mt-1">Partidas de <strong>{user?.username}</strong></p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/')}>
            ← Volver al inicio
          </Button>
        </div>

        {/* Estadísticas globales */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Partidas', value: stats.total_games, emoji: '🎮' },
              { label: 'Victorias', value: stats.wins, emoji: '🏆' },
              { label: 'Mejor puntaje', value: (stats.best_score || 0).toLocaleString(), emoji: '⭐' },
              { label: 'Puntos totales', value: (stats.total_score || 0).toLocaleString(), emoji: '💯' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center animate-slide-up">
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="text-xl font-bold text-brown-dark">{stat.value}</div>
                <div className="text-xs text-brown/50 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de partidas */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-brown border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-brown-dark mb-2">Sin partidas todavía</h2>
            <p className="text-brown/60 mb-6">¡Crea una sala y empieza a jugar!</p>
            <Button onClick={() => router.push('/')}>Jugar ahora</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item) => {
              const posStyle = POSITION_STYLES[item.position] || 'bg-beige-100 text-brown/60 border border-beige-200';
              return (
                <div key={item.id} className="card p-5 flex items-center gap-4 animate-fade-in">
                  {/* Posición */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${posStyle}`}>
                    {item.position === 1 ? '🥇' : item.position === 2 ? '🥈' : item.position === 3 ? '🥉' : `#${item.position}`}
                  </div>

                  {/* Info de la partida */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-brown-dark text-sm">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className="text-xs text-brown/40">—</span>
                      <span className="text-xs text-brown/50 font-mono">#{item.room_code}</span>
                    </div>
                    <div className="text-xs text-brown/50 mt-0.5">
                      {item.player_count} jugadores · {formatDate(item.ended_at)}
                      {item.winner_name && (
                        <> · Ganó <strong className="text-brown">{item.winner_name}</strong></>
                      )}
                    </div>
                  </div>

                  {/* Puntaje */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-brown tabular-nums">{item.score.toLocaleString()}</div>
                    <div className="text-xs text-brown/40">puntos</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
