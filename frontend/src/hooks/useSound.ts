'use client';

// Hook para manejar sonidos del juego usando Web Audio API
// No necesito archivos .mp3 — genero los sonidos de forma programática con osciladores.
// Esto es perfecto para un proyecto universitario: cero assets, funciona en todos los browsers.

import { useCallback, useRef } from 'react';

export function useSound() {
  // Creo el AudioContext de forma lazy (no en el useEffect) para evitar la advertencia
  // del browser sobre contextos de audio creados antes de la primera interacción del usuario
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  // Función base para generar un tono
  function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
    try {
      const ctx = getCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade out suave para evitar el "click" al cortar el sonido abruptamente
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Si el browser no soporta Web Audio, simplemente ignoramos el error
    }
  }

  // Sonido de respuesta correcta — dos notas ascendentes, sensación de "bien hecho"
  const playCorrect = useCallback(() => {
    playTone(523, 0.15, 'sine', 0.3); // Do
    setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 120); // Sol
  }, []);

  // Sonido de respuesta incorrecta — tono grave descendente, sensación de "ups"
  const playWrong = useCallback(() => {
    playTone(300, 0.1, 'square', 0.2);
    setTimeout(() => playTone(200, 0.3, 'square', 0.15), 80);
  }, []);

  // Sonido de tiempo agotado — tres pitidos rápidos
  const playTimeUp = useCallback(() => {
    [0, 150, 300].forEach((delay) => {
      setTimeout(() => playTone(440, 0.12, 'square', 0.25), delay);
    });
  }, []);

  // Tick del timer cuando quedan pocos segundos — click seco
  const playTimerTick = useCallback(() => {
    playTone(800, 0.05, 'square', 0.1);
  }, []);

  // Sonido al usar un power-up — tono mágico
  const playPowerup = useCallback(() => {
    [0, 100, 200, 300].forEach((delay, i) => {
      setTimeout(() => playTone(400 + i * 150, 0.1, 'sine', 0.2), delay);
    });
  }, []);

  // Fanfarria del ganador — secuencia de notas festivas
  const playWinner = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.35), i * 150);
    });
    setTimeout(() => playTone(1047, 0.5, 'sine', 0.4), 600);
  }, []);

  // Sonido de mensaje de chat — tono suave discreto
  const playChatMessage = useCallback(() => {
    playTone(660, 0.08, 'sine', 0.15);
  }, []);

  return { playCorrect, playWrong, playTimeUp, playTimerTick, playPowerup, playWinner, playChatMessage };
}
