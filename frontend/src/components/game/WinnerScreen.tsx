'use client';

// Pantalla final del juego — muestra el podio con los 3 primeros lugares
// Hay animaciones de entrada escalonadas para que se vea más espectacular

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import Button from '@/components/ui/Button';

interface ScoreEntry {
  position: number;
  userId: number;
  username: string;
  score: number;
}

interface WinnerScreenProps {
  scoreboard: ScoreEntry[];
  currentUserId: number;
}

export default function WinnerScreen({ scoreboard, currentUserId }: WinnerScreenProps) {
  const router = useRouter();
  const { playWinner } = useSound();
  const winner = scoreboard[0];
  const isWinner = winner?.userId === currentUserId;

  useEffect(() => {
    playWinner();
  }, [playWinner]);

  const podium = [scoreboard[1], scoreboard[0], scoreboard[2]].filter(Boolean);
  const podiumHeights = ['h-28', 'h-36', 'h-20'];
  const podiumLabels = ['#2', '#1', '#3'];
  const podiumPositions = [2, 1, 3];

  return (
    <div className="min-h-screen bg-warm-gradient flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti decorativo (CSS puro) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-sm animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#D4956A', '#C8A882', '#A07850', '#6BAF6B', '#E8A020'][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
              opacity: 0.6,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Título */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-bounce-in">🏆</div>
          <h1 className="text-3xl font-bold text-brown-dark">¡Fin de la partida!</h1>
          {isWinner ? (
            <p className="text-amber-warm font-bold text-lg mt-2">¡Ganaste! ¡Eres el mejor!</p>
          ) : (
            <p className="text-brown/60 mt-2">El ganador es <strong className="text-brown">{winner?.username}</strong></p>
          )}
        </div>

        {/* Podio */}
        {scoreboard.length >= 1 && (
          <div className="flex items-end justify-center gap-3 mb-8 px-4">
            {podium.map((entry, i) => entry && (
              <div key={entry.userId} className="flex flex-col items-center gap-2 flex-1 animate-slide-up"
                style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="text-center">
                  <div className="text-sm font-bold text-brown/50 mb-1">{podiumLabels[i]}</div>
                  <div className={`font-bold text-sm truncate max-w-20 ${entry.userId === currentUserId ? 'text-amber-warm' : 'text-brown-dark'}`}>
                    {entry.username}
                  </div>
                  <div className="text-xs text-brown/60 font-medium">
                    {entry.score.toLocaleString()} pts
                  </div>
                </div>
                <div
                  className={`w-full rounded-t-2xl flex items-center justify-center text-xl font-bold text-cream-50
                    ${i === 1 ? 'bg-amber-warm' : i === 0 ? 'bg-sand' : 'bg-brown-light'}
                    ${podiumHeights[i]}`}
                >
                  #{podiumPositions[i]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resto del ranking */}
        {scoreboard.length > 3 && (
          <div className="card p-4 mb-6">
            <div className="flex flex-col gap-2">
              {scoreboard.slice(3).map((entry) => (
                <div key={entry.userId} className="flex items-center gap-3 text-sm">
                  <span className="text-brown/40 w-6 text-center font-medium">#{entry.position}</span>
                  <span className={`flex-1 font-medium ${entry.userId === currentUserId ? 'text-amber-warm' : 'text-brown-dark'}`}>
                    {entry.username}
                  </span>
                  <span className="text-brown font-bold tabular-nums">{entry.score.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => router.push('/history')}>
            Ver historial
          </Button>
          <Button className="flex-1" onClick={() => router.push('/')}>
            Jugar de nuevo
          </Button>
        </div>
      </div>
    </div>
  );
}
