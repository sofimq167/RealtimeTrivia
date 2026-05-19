'use client';

interface Player {
  socketId: string;
  userId: number;
  username: string;
  isHost: boolean;
  score: number;
}

interface PlayerListProps {
  players: Player[];
  currentUserId: number;
}

// Paleta de colores para los avatares generados — uno por jugador según su posición
const AVATAR_COLORS = [
  'bg-amber-warm text-white',
  'bg-brown text-cream-50',
  'bg-sand text-brown-dark',
  'bg-brown-light text-cream-50',
  'bg-beige-300 text-brown-dark',
  'bg-brown-deep text-cream-50',
  'bg-success text-white',
  'bg-error text-white',
];

export default function PlayerList({ players, currentUserId }: PlayerListProps) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((player, index) => {
        const isMe = player.userId === currentUserId;
        const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];

        return (
          <div
            key={player.socketId}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
              ${isMe ? 'bg-amber-warm/10 border border-amber-warm/30' : 'bg-white/50 border border-beige-100'}`}
          >
            {/* Avatar con inicial del nombre */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
              {player.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold truncate ${isMe ? 'text-brown' : 'text-brown-dark'}`}>
                  {player.username}
                </span>
                {isMe && (
                  <span className="text-xs bg-amber-warm/20 text-amber-warm px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Tú
                  </span>
                )}
                {player.isHost && (
                  <span className="text-xs bg-brown/10 text-brown px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Host
                  </span>
                )}
              </div>
            </div>

            {/* Indicador de conexión */}
            <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0 animate-pulse-warm" />
          </div>
        );
      })}

      {/* Slots vacíos para mostrar cuántos jugadores pueden entrar todavía */}
      {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-beige-200"
        >
          <div className="w-10 h-10 rounded-full bg-beige-100 flex-shrink-0" />
          <span className="text-brown/30 text-sm font-medium">Esperando jugador...</span>
        </div>
      ))}
    </div>
  );
}
