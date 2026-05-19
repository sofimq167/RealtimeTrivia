'use client';

// Timer visual con barra de progreso y número de segundos restantes
// Cambio el color de la barra según el tiempo: verde → amarillo → rojo
// también reproduce tick sonoro cuando quedan 5 segundos o menos

import { useEffect } from 'react';
import { useSound } from '@/hooks/useSound';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

export default function Timer({ timeLeft, totalTime }: TimerProps) {
  const { playTimerTick } = useSound();
  const percentage = (timeLeft / totalTime) * 100;

  // Solo hago tick en los últimos 5 segundos para no molestar durante toda la pregunta
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) {
      playTimerTick();
    }
  }, [timeLeft, playTimerTick]);

  // El color de la barra depende del tiempo restante
  const barColor =
    percentage > 50
      ? 'bg-success'
      : percentage > 25
        ? 'bg-warning'
        : 'bg-error animate-pulse';

  const textColor =
    percentage > 50
      ? 'text-success'
      : percentage > 25
        ? 'text-warning'
        : 'text-error';

  return (
    <div className="flex items-center gap-4">
      <div className={`text-3xl font-bold tabular-nums w-10 text-right ${textColor}`}>
        {timeLeft}
      </div>
      <div className="flex-1 h-3 bg-beige-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
