'use client';

// Página de inicio — el jugador elige si crear o unirse a una sala
// Si no está logueado, lo mando al login

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function HomeContent() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  function createRoom() {
    if (!socket) return;
    setIsCreating(true);
    setError('');

    socket.emit('create_room', (res: { ok: boolean; roomCode?: string; error?: string }) => {
      setIsCreating(false);
      if (res.ok && res.roomCode) {
        router.push(`/lobby/${res.roomCode}`);
      } else {
        setError(res.error || 'No se pudo crear la sala');
      }
    });
  }

  function joinRoom() {
    if (!socket || !joinCode.trim()) return;
    setIsJoining(true);
    setError('');

    socket.emit('join_room', { roomCode: joinCode.toUpperCase() }, (res: { ok: boolean; roomCode?: string; error?: string }) => {
      setIsJoining(false);
      if (res.ok && res.roomCode) {
        router.push(`/lobby/${res.roomCode}`);
      } else {
        setError(res.error || 'Código inválido');
      }
    });
  }

  return (
    <div className="min-h-screen bg-warm-gradient flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brown">RealtimeTrivia</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-brown font-medium">
            Hola, <strong>{user?.username}</strong>
          </span>
          <Button variant="secondary" size="sm" onClick={() => router.push('/history')}>
            Historial
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>
            Salir
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-10">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-brown-dark leading-tight">
            Trivia en<br />
            <span className="text-amber-warm">tiempo real</span>
          </h1>
          <p className="mt-4 text-brown/70 text-lg max-w-md mx-auto">
            Crea una sala, invita a tus amigos y demuestra quién sabe más sobre videojuegos y películas.
          </p>
          {!isConnected && (
            <p className="mt-2 text-sm text-error font-medium">
               Conectando al servidor...
            </p>
          )}
        </div>

        {/* Cards de acción */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl animate-slide-up">
          {/* Crear sala */}
          <div className="card flex-1 p-8 flex flex-col items-center gap-5 text-center">
            <div>
              <h2 className="text-xl font-bold text-brown-dark">Crear sala</h2>
              <p className="text-sm text-brown/60 mt-1">Sé el anfitrión y elige la categoría</p>
            </div>
            <Button
              className="w-full"
              onClick={createRoom}
              isLoading={isCreating}
              disabled={!isConnected}
            >
              Crear sala nueva
            </Button>
          </div>

          {/* Unirse a sala */}
          <div className="card flex-1 p-8 flex flex-col items-center gap-5 text-center">
            <div>
              <h2 className="text-xl font-bold text-brown-dark">Unirse</h2>
              <p className="text-sm text-brown/60 mt-1">Ingresa el código de la sala</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Input
                placeholder="Ej: ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                maxLength={6}
                className="text-center text-lg tracking-widest font-bold"
              />
              <Button
                className="w-full"
                variant="accent"
                onClick={joinRoom}
                isLoading={isJoining}
                disabled={!isConnected || joinCode.length < 6}
              >
                Unirse a la sala
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-error font-medium animate-pop">{error}</p>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-brown/40 text-xs">
        Proyecto universitario — RealtimeTrivia 2024
      </footer>
    </div>
  );
}

// Envuelvo HomeContent en SocketProvider porque la página home necesita el socket
export default function HomePage() {
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

  return <HomeContent />;
}
