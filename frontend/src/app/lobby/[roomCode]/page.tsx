'use client';

// Página del lobby (sala de espera) — los jugadores esperan acá hasta que el host inicie
// Uso useEffect para suscribirme a los eventos de socket que actualizan la lista de jugadores

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import PlayerList from '@/components/lobby/PlayerList';
import Chat from '@/components/lobby/Chat';
import RoomSettings from '@/components/lobby/RoomSettings';
import Button from '@/components/ui/Button';

interface Player {
  socketId: string;
  userId: number;
  username: string;
  isHost: boolean;
  score: number;
}

function LobbyContent({ roomCode }: { roomCode: string }) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState('videojuegos');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isHost = players.find(p => p.userId === user?.id)?.isHost ?? false;

  const joinRoom = useCallback(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomCode }, (res: { ok: boolean; players?: Player[]; category?: string; error?: string }) => {
      if (res.ok) {
        setPlayers(res.players || []);
        setCategory(res.category || 'videojuegos');
      } else {
        setError(res.error || 'No se pudo unirse a la sala');
        setTimeout(() => router.push('/'), 2000);
      }
    });
  }, [socket, user, roomCode, router]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    joinRoom();
  }, [socket, isConnected, joinRoom]);

  useEffect(() => {
    if (!socket) return;

    function onPlayersUpdate({ players: p }: { players: Player[] }) {
      setPlayers(p);
    }

    function onCategoryChanged({ category: c }: { category: string }) {
      setCategory(c);
    }

    function onGameStart() {
      setIsStarting(true);
    }

    function onCountdownTick({ count }: { count: number }) {
      setCountdown(count);
    }

    // Cuando empieza la pregunta, navego a la página del juego
    function onQuestion() {
      router.push(`/game/${roomCode}`);
    }

    socket.on('players_update', onPlayersUpdate);
    socket.on('category_changed', onCategoryChanged);
    socket.on('game_start', onGameStart);
    socket.on('countdown_tick', onCountdownTick);
    socket.on('question', onQuestion);

    return () => {
      socket.off('players_update', onPlayersUpdate);
      socket.off('category_changed', onCategoryChanged);
      socket.off('game_start', onGameStart);
      socket.off('countdown_tick', onCountdownTick);
      socket.off('question', onQuestion);
    };
  }, [socket, router, roomCode]);

  function startGame() {
    if (!socket) return;
    socket.emit('start_game', { roomCode });
  }

  async function copyCode() {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-brown/60 hover:text-brown transition-colors text-sm font-medium"
          >
            ← Salir de la sala
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brown/60 font-medium">Código de sala:</span>
            <button onClick={copyCode} className="room-code hover:opacity-80 transition-opacity">
              {roomCode}
            </button>
            {copied && <span className="text-xs text-success font-medium">¡Copiado!</span>}
          </div>
        </div>

        {/* Overlay de countdown */}
        {isStarting && (
          <div className="fixed inset-0 bg-brown-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center animate-bounce-in">
              {countdown !== null && countdown > 0 ? (
                <>
                  <div className="text-9xl font-bold text-amber-warm">{countdown}</div>
                  <p className="text-cream-50 text-xl mt-4 font-medium">¡Prepárate!</p>
                </>
              ) : (
                <div className="text-5xl font-bold text-amber-warm animate-pulse">¡YA!</div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="card bg-error/10 border-error/20 p-4 mb-4 text-center">
            <p className="text-error font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Panel izquierdo: jugadores + configuración */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-brown-dark text-lg">
                  Jugadores ({players.length}/8)
                </h2>
                {!isConnected && (
                  <span className="text-xs text-error font-medium">Reconectando...</span>
                )}
              </div>
              <PlayerList players={players} currentUserId={user?.id ?? 0} />
            </div>

            <RoomSettings roomCode={roomCode} category={category} isHost={isHost} />

            {/* Botón de inicio — solo visible para el host */}
            {isHost && (
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-brown-dark">¿Listos para jugar?</h3>
                    <p className="text-sm text-brown/60">
                      {players.length < 2
                        ? 'Necesitas al menos 2 jugadores (o 1 para probar)'
                        : `${players.length} jugador${players.length > 1 ? 'es' : ''} listo${players.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <Button onClick={startGame} size="lg" className="animate-pulse-warm">
                    Iniciar partida
                  </Button>
                </div>
              </div>
            )}

            {!isHost && (
              <div className="card p-5 text-center">
                <p className="text-brown/60 text-sm">
                  Esperando que el host inicie la partida...
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-sand animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho: chat */}
          <div className="card p-5 flex flex-col" style={{ minHeight: '500px' }}>
            <Chat roomCode={roomCode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string)?.toUpperCase();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
        <div className="w-8 h-8 border-4 border-brown border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return <LobbyContent roomCode={roomCode} />;
}
