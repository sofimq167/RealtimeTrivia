'use client';

// Página principal del juego — recibe todos los eventos del servidor y los traduce a UI
// La lógica de estado aquí es la más compleja del proyecto: hay que manejar
// varias fases (pregunta, reveal, leaderboard, fin) y no perder eventos entre renders.

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import QuestionCard from '@/components/game/QuestionCard';
import Timer from '@/components/game/Timer';
import Scoreboard from '@/components/game/Scoreboard';
import PowerUps from '@/components/game/PowerUps';
import WinnerScreen from '@/components/game/WinnerScreen';
import Chat from '@/components/lobby/Chat';
import { useSound } from '@/hooks/useSound';

interface ScoreEntry {
  position: number;
  userId: number;
  username: string;
  score: number;
  powerups?: { doublePoints: number; fiftyFifty: number };
}

interface QuestionData {
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  timeLimit: number;
}

type GamePhase = 'loading' | 'question' | 'reveal' | 'leaderboard' | 'finished';

function GameContent({ roomCode }: { roomCode: string }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const { playCorrect, playWrong, playTimeUp } = useSound();

  // Estado principal del juego
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [finalScoreboard, setFinalScoreboard] = useState<ScoreEntry[]>([]);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [activeDoublePoints, setActiveDoublePoints] = useState(false);

  // Power-ups del jugador actual (los sincronizo con el scoreboard que manda el servidor)
  const [myPowerups, setMyPowerups] = useState({ doublePoints: 1, fiftyFifty: 1 });

  const myEntry = scoreboard.find(p => p.userId === user?.id);

  // Actualizo mis power-ups cada vez que llega el scoreboard
  useEffect(() => {
    if (myEntry?.powerups) {
      setMyPowerups(myEntry.powerups);
    }
  }, [myEntry]);

  useEffect(() => {
    if (!socket) return;

    // Llega una nueva pregunta
    function onQuestion(data: QuestionData) {
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setSelectedOption(null);
      setCorrectOption(null);
      setHiddenOptions([]);
      setPointsEarned(null);
      setActiveDoublePoints(false);
      setPhase('question');
    }

    // Tick del timer — el servidor es la fuente de verdad del tiempo
    function onTimerTick({ timeLeft: t }: { timeLeft: number }) {
      setTimeLeft(t);
    }

    // El servidor revela la respuesta correcta y los resultados
    function onRevealAnswers({ correctIndex, answers, scoreboard: sb }: {
      correctIndex: number;
      answers: Record<string, { username: string; answerIndex: number; isCorrect: boolean; points: number }>;
      scoreboard: ScoreEntry[];
    }) {
      setCorrectOption(correctIndex);
      setScoreboard(sb);
      setPhase('reveal');

      // Busco MI respuesta para saber si acerté o no
      const mySocketId = socket?.id;
      const myAnswer = mySocketId ? answers[mySocketId] : null;
      if (myAnswer) {
        setPointsEarned(myAnswer.points);
        if (myAnswer.isCorrect) playCorrect();
        else playWrong();
      } else {
        // No respondí a tiempo
        playTimeUp();
      }
    }

    // Muestra el scoreboard entre preguntas
    function onLeaderboard({ scoreboard: sb, isLastQuestion: isLast }: {
      scoreboard: ScoreEntry[];
      isLastQuestion: boolean;
    }) {
      setScoreboard(sb);
      setIsLastQuestion(isLast);
      setPhase('leaderboard');
    }

    // Fin del juego
    function onGameOver({ scoreboard: sb }: { scoreboard: ScoreEntry[] }) {
      setFinalScoreboard(sb);
      setPhase('finished');
    }

    // Confirmación de mi respuesta (feedback inmediato sin revelar si es correcta)
    function onAnswerReceived() {
      // El usuario ya ve su opción seleccionada — no necesito hacer nada más aquí
    }

    // Power-up activado para mí
    function onPowerupActivated({ type, hideOptions }: { type: string; hideOptions?: number[] }) {
      if (type === 'doublePoints') {
        setActiveDoublePoints(true);
      }
      if (type === 'fiftyFifty' && hideOptions) {
        setHiddenOptions(hideOptions);
      }
    }

    socket.on('question', onQuestion);
    socket.on('timer_tick', onTimerTick);
    socket.on('reveal_answers', onRevealAnswers);
    socket.on('leaderboard', onLeaderboard);
    socket.on('game_over', onGameOver);
    socket.on('answer_received', onAnswerReceived);
    socket.on('powerup_activated', onPowerupActivated);

    return () => {
      socket.off('question', onQuestion);
      socket.off('timer_tick', onTimerTick);
      socket.off('reveal_answers', onRevealAnswers);
      socket.off('leaderboard', onLeaderboard);
      socket.off('game_over', onGameOver);
      socket.off('answer_received', onAnswerReceived);
      socket.off('powerup_activated', onPowerupActivated);
    };
  }, [socket, playCorrect, playWrong, playTimeUp]);

  const handleAnswer = useCallback((index: number) => {
    if (!socket || !currentQuestion) return;
    setSelectedOption(index);
    socket.emit('submit_answer', { roomCode, answerIndex: index });
  }, [socket, currentQuestion, roomCode]);

  const handlePowerup = useCallback((type: 'doublePoints' | 'fiftyFifty') => {
    if (!socket) return;
    socket.emit('use_powerup', { roomCode, powerupType: type });
  }, [socket, roomCode]);

  // Pantalla de fin de juego
  if (phase === 'finished') {
    return <WinnerScreen scoreboard={finalScoreboard} currentUserId={user?.id ?? 0} />;
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <div className="max-w-4xl mx-auto px-4 py-4">

        {/* Header del juego */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-brown">RealtimeTrivia</span>
            {currentQuestion && (
              <span className="text-sm text-brown/60 font-medium">
                Pregunta {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
              </span>
            )}
          </div>
          {/* Mi puntaje actual */}
          <div className="card px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-brown/60">Mi puntaje:</span>
            <span className="font-bold text-brown tabular-nums">
              {myEntry?.score.toLocaleString() ?? 0} pts
            </span>
          </div>
        </div>

        {/* Loading inicial */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brown border-t-transparent rounded-full animate-spin" />
            <p className="text-brown/60">Cargando partida...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Fase de pregunta o reveal */}
            {(phase === 'question' || phase === 'reveal') && currentQuestion && (
              <>
                {/* Barra de progreso de preguntas */}
                <div className="flex gap-1">
                  {Array.from({ length: currentQuestion.totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-500
                        ${i < currentQuestion.questionIndex ? 'bg-brown' :
                          i === currentQuestion.questionIndex ? 'bg-amber-warm' : 'bg-beige-200'}`}
                    />
                  ))}
                </div>

                {/* Timer */}
                {phase === 'question' && (
                  <div className="card px-5 py-4">
                    <Timer timeLeft={timeLeft} totalTime={currentQuestion.timeLimit} />
                  </div>
                )}

                {/* Power-ups — solo disponibles durante la pregunta y si no respondí */}
                {phase === 'question' && selectedOption === null && (
                  <PowerUps
                    powerups={myPowerups}
                    onUse={handlePowerup}
                    disabled={false}
                    activeDoublePoints={activeDoublePoints}
                  />
                )}

                {/* Feedback de puntos ganados */}
                {phase === 'reveal' && pointsEarned !== null && (
                  <div className={`text-center py-3 rounded-2xl font-bold text-lg animate-bounce-in
                    ${pointsEarned > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {pointsEarned > 0 ? `+${pointsEarned.toLocaleString()} puntos 🎉` : 'Sin puntos esta vez 😔'}
                  </div>
                )}
                {phase === 'reveal' && pointsEarned === null && (
                  <div className="text-center py-3 rounded-2xl font-bold text-lg bg-beige-100 text-brown/60 animate-bounce-in">
                    ⏱️ No respondiste a tiempo
                  </div>
                )}

                {/* Tarjeta de pregunta */}
                <QuestionCard
                  question={currentQuestion.question}
                  options={currentQuestion.options}
                  selectedOption={selectedOption}
                  correctOption={phase === 'reveal' ? correctOption : null}
                  hiddenOptions={hiddenOptions}
                  onSelect={handleAnswer}
                  phase={phase}
                />

                {/* Estado de mi respuesta */}
                {phase === 'question' && (
                  <div className="text-center">
                    {selectedOption !== null ? (
                      <p className="text-brown/60 text-sm font-medium animate-fade-in">
                        Respuesta enviada — esperando a los demás...
                      </p>
                    ) : (
                      <p className="text-brown/40 text-sm">Selecciona una respuesta antes de que se acabe el tiempo</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Fase de leaderboard entre preguntas */}
            {phase === 'leaderboard' && (
              <div className="animate-slide-up">
                <Scoreboard
                  scoreboard={scoreboard}
                  currentUserId={user?.id ?? 0}
                  isLastQuestion={isLastQuestion}
                />
                {!isLastQuestion && (
                  <p className="text-center text-brown/50 text-sm mt-4 animate-pulse">
                    Próxima pregunta en unos segundos...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Panel lateral: scoreboard mini + chat */}
          <div className="flex flex-col gap-4">
            {/* Mini scoreboard lateral */}
            {(phase === 'question' || phase === 'reveal') && scoreboard.length > 0 && (
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-brown/60 uppercase tracking-wide mb-3">Puntajes</h3>
                <div className="flex flex-col gap-1.5">
                  {scoreboard.slice(0, 5).map((entry, i) => (
                    <div key={entry.userId} className={`flex items-center gap-2 text-sm
                      ${entry.userId === user?.id ? 'font-bold text-brown' : 'text-brown/70'}`}>
                      <span className="text-xs w-4 text-center">#{i + 1}</span>
                      <span className="flex-1 truncate">{entry.username}</span>
                      <span className="tabular-nums text-xs">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat lateral durante el juego */}
            <div className="card p-4 flex flex-col" style={{ minHeight: '300px' }}>
              <Chat roomCode={roomCode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
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

  return <GameContent roomCode={roomCode} />;
}
