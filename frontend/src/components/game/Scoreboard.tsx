'use client';

// Scoreboard parcial que se muestra entre preguntas
// Los puestos 1, 2, 3 tienen estilos especiales para hacer el ranking más visual

interface ScoreEntry {
  position: number;
  userId: number;
  username: string;
  score: number;
}

interface ScoreboardProps {
  scoreboard: ScoreEntry[];
  currentUserId: number;
  isLastQuestion?: boolean;
}

const POSITION_STYLES = [
  { bg: 'bg-amber-warm/20 border-amber-warm/40', text: 'text-amber-warm', label: '#1', size: 'text-lg' },
  { bg: 'bg-sand/20 border-sand/40', text: 'text-sand-dark', label: '#2', size: 'text-base' },
  { bg: 'bg-brown-light/10 border-brown-light/30', text: 'text-brown-light', label: '#3', size: 'text-base' },
];

export default function Scoreboard({ scoreboard, currentUserId, isLastQuestion }: ScoreboardProps) {
  return (
    <div className="card p-6 animate-slide-up">
      <h2 className="text-xl font-bold text-brown-dark text-center mb-5">
        {isLastQuestion ? 'Clasificación Final' : 'Clasificación Parcial'}
      </h2>

      <div className="flex flex-col gap-2">
        {scoreboard.map((entry, i) => {
          const isMe = entry.userId === currentUserId;
          const posStyle = POSITION_STYLES[i] || null;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all duration-300
                ${posStyle
                  ? `${posStyle.bg} border-opacity-50`
                  : 'bg-white/50 border-beige-100'
                }
                ${isMe ? 'ring-2 ring-brown/30' : ''}`}
            >
              {/* Posición */}
              <div className="w-8 text-center flex-shrink-0">
                <span className={`text-sm font-bold ${posStyle ? posStyle.text : 'text-brown/40'}`}>
                  {posStyle ? posStyle.label : `#${entry.position}`}
                </span>
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <span className={`font-semibold truncate block ${posStyle ? posStyle.text : 'text-brown-dark'} ${posStyle?.size ?? 'text-sm'}`}>
                  {entry.username}
                  {isMe && <span className="text-xs font-normal text-brown/50 ml-2">(tú)</span>}
                </span>
              </div>

              {/* Puntos */}
              <div className={`font-bold tabular-nums flex-shrink-0 ${posStyle ? posStyle.text : 'text-brown'}`}>
                {entry.score.toLocaleString()} pts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
