'use client';

// Configuración de la sala — solo el host puede cambiar la categoría
// El cambio se emite por socket para que todos los jugadores vean la categoría actualizada

import { useSocket } from '@/context/SocketContext';

interface RoomSettingsProps {
  roomCode: string;
  category: string;
  isHost: boolean;
}

const CATEGORIES = [
  { id: 'videojuegos', label: 'Videojuegos', emoji: '🎮' },
  { id: 'peliculas', label: 'Películas', emoji: '🎬' },
];

export default function RoomSettings({ roomCode, category, isHost }: RoomSettingsProps) {
  const { socket } = useSocket();

  function changeCategory(newCategory: string) {
    if (!socket || !isHost) return;
    socket.emit('set_category', { roomCode, category: newCategory });
  }

  return (
    <div className="card-warm p-5">
      <h3 className="text-sm font-semibold text-brown mb-3">
        🏷️ Categoría de preguntas
      </h3>
      <div className="flex gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => changeCategory(cat.id)}
            disabled={!isHost}
            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2
                        transition-all duration-200 font-medium text-sm
                        ${category === cat.id
                          ? 'border-brown bg-brown text-cream-50 shadow-warm'
                          : 'border-beige-200 bg-white/70 text-brown hover:border-sand'
                        }
                        ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
      {!isHost && (
        <p className="text-xs text-brown/40 mt-3 text-center">
          Solo el host puede cambiar la categoría
        </p>
      )}
    </div>
  );
}
