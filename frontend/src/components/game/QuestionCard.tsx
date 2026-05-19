'use client';

// Tarjeta de pregunta — muestra la pregunta y las 4 opciones de respuesta
// El estado de cada opción puede ser: normal, selected, correct, wrong
// (el estado correcto/incorrecto solo se muestra en fase reveal)

import { useSound } from '@/hooks/useSound';

interface QuestionCardProps {
  question: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number | null;  // null durante la pregunta, número en la fase reveal
  hiddenOptions: number[];       // opciones eliminadas por el power-up 50/50
  onSelect: (index: number) => void;
  phase: 'question' | 'reveal';
}

function getOptionStyle(
  index: number,
  selectedOption: number | null,
  correctOption: number | null,
  phase: 'question' | 'reveal'
) {
  const isSelected = selectedOption === index;
  const isCorrect = correctOption === index;

  if (phase === 'reveal') {
    if (isCorrect) return 'border-success bg-success/10 text-success shadow-none';
    if (isSelected && !isCorrect) return 'border-error bg-error/10 text-error shadow-none';
    return 'border-beige-200 bg-white/30 text-brown/40 shadow-none';
  }

  // Fase question
  if (isSelected) return 'border-brown bg-brown text-cream-50 shadow-warm scale-[1.02]';
  return 'border-beige-200 bg-white hover:border-sand hover:shadow-card hover:-translate-y-0.5 text-brown-dark';
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({
  question,
  options,
  selectedOption,
  correctOption,
  hiddenOptions,
  onSelect,
  phase,
}: QuestionCardProps) {
  const { playCorrect, playWrong } = useSound();

  function handleSelect(index: number) {
    if (phase !== 'question' || selectedOption !== null) return;
    if (hiddenOptions.includes(index)) return;

    onSelect(index);

    // Doy feedback de sonido inmediato solo si ya conozco la respuesta correcta
    // (normalmente no la conozco hasta el reveal, así que este caso es para testing)
  }

  // Cuando llega el reveal, reproduzco el sonido correcto/incorrecto para mi respuesta
  // Esto lo maneja el componente padre (game page) para tener acceso al correctOption

  return (
    <div className="card p-8 animate-fade-in">
      {/* Pregunta */}
      <h2 className="text-xl md:text-2xl font-bold text-brown-dark text-center leading-relaxed mb-8">
        {question}
      </h2>

      {/* Opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isHidden = hiddenOptions.includes(index);
          const style = getOptionStyle(index, selectedOption, correctOption, phase);

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={phase !== 'question' || selectedOption !== null || isHidden}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 font-medium
                          text-left transition-all duration-200 cursor-pointer
                          disabled:cursor-default
                          ${style}
                          ${isHidden ? 'opacity-20 pointer-events-none' : ''}`}
            >
              {/* Letra de la opción */}
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                ${phase === 'reveal' && correctOption === index ? 'bg-success text-white' :
                  phase === 'reveal' && selectedOption === index && correctOption !== index ? 'bg-error text-white' :
                  selectedOption === index ? 'bg-cream-50 text-brown' : 'bg-beige-100 text-brown'}`}
              >
                {OPTION_LABELS[index]}
              </span>
              <span className="text-sm md:text-base leading-snug">{option}</span>

              {/* Indicador de correcto/incorrecto en reveal */}
              {phase === 'reveal' && correctOption === index && (
                <span className="ml-auto text-success text-xl">✓</span>
              )}
              {phase === 'reveal' && selectedOption === index && correctOption !== index && (
                <span className="ml-auto text-error text-xl">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
