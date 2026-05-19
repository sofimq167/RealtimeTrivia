'use client';

// Componente de power-ups — muestra los power-ups disponibles del jugador
// y los activa cuando el usuario hace clic

interface PowerUpsProps {
  powerups: { doublePoints: number; fiftyFifty: number };
  onUse: (type: 'doublePoints' | 'fiftyFifty') => void;
  disabled: boolean;
  activeDoublePoints: boolean;
}

const POWERUP_INFO = {
  doublePoints: {
    label: '2x Puntos',
    description: 'Duplica los puntos de tu próxima respuesta correcta',
    activeColor: 'bg-warning/20 border-warning text-warning',
    inactiveColor: 'bg-white border-beige-200 text-brown hover:border-sand',
  },
  fiftyFifty: {
    label: '50/50',
    description: 'Elimina 2 respuestas incorrectas',
    activeColor: 'bg-success/20 border-success text-success',
    inactiveColor: 'bg-white border-beige-200 text-brown hover:border-sand',
  },
};

export default function PowerUps({ powerups, onUse, disabled, activeDoublePoints }: PowerUpsProps) {
  return (
    <div className="flex gap-3">
      {(Object.keys(POWERUP_INFO) as Array<'doublePoints' | 'fiftyFifty'>).map((type) => {
        const info = POWERUP_INFO[type];
        const count = powerups[type];
        const isActive = type === 'doublePoints' && activeDoublePoints;
        const isUsed = count <= 0;

        return (
          <button
            key={type}
            onClick={() => !isUsed && !disabled && onUse(type)}
            disabled={isUsed || disabled}
            title={info.description}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-medium text-sm
                        transition-all duration-200 flex-1 justify-center
                        ${isActive
                          ? info.activeColor + ' animate-pulse-warm'
                          : isUsed
                            ? 'bg-beige-100 border-beige-100 text-brown/30 cursor-not-allowed'
                            : info.inactiveColor + ' cursor-pointer hover:-translate-y-0.5 shadow-card'
                        }`}
          >
            <span>{info.label}</span>
            {!isUsed && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${isActive ? 'bg-warning text-white' : 'bg-beige-200 text-brown'}`}>
                ×{count}
              </span>
            )}
            {isUsed && <span className="text-xs opacity-50">Usado</span>}
          </button>
        );
      })}
    </div>
  );
}
