// GameManager — la máquina de estados del juego
// Este es el "cerebro" del servidor. Controla el flujo completo:
//   waiting → countdown → question → reveal → leaderboard → (loop) → finished
//
// IMPORTANTE: El servidor es la fuente de verdad. Los clientes solo muestran lo que el servidor les dice.
// Esto previene cheating (un cliente no puede mandarse más tiempo o saltarse preguntas).

const questions = require('../data/questions.json');
const roomManager = require('./roomManager');
const { saveGameResult } = require('../routes/history');

// Tiempos en milisegundos para cada fase
const TIMINGS = {
  COUNTDOWN: 3000,   // 3 segundos de cuenta atrás
  QUESTION: 20000,   // 20 segundos para responder
  REVEAL: 3000,      // 3 segundos mostrando la respuesta correcta
  LEADERBOARD: 5000, // 5 segundos viendo el scoreboard entre preguntas
};

const QUESTION_COUNT = 10; // cuántas preguntas por partida

// Puntaje base + bonus por velocidad
function calculatePoints(timeLeftMs, totalTimeMs, useDoublePoints) {
  const basePoints = 1000;
  const speedBonus = Math.round((timeLeftMs / totalTimeMs) * 500);
  const total = basePoints + speedBonus;
  return useDoublePoints ? total * 2 : total;
}

// Mezclo el array de preguntas con Fisher-Yates para que sean aleatorias cada partida
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Para el power-up 50/50: devuelvo los índices de 2 opciones incorrectas a eliminar
function getTwoWrongOptions(correctIndex, totalOptions) {
  const wrongIndices = [];
  for (let i = 0; i < totalOptions; i++) {
    if (i !== correctIndex) wrongIndices.push(i);
  }
  // Mezclo y tomo los 2 primeros
  return shuffle(wrongIndices).slice(0, 2);
}

function startGame(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  // Selecciono las preguntas de la categoría elegida y mezclo
  const allQuestions = questions[room.category] || questions['videojuegos'];
  const selected = shuffle(allQuestions).slice(0, QUESTION_COUNT);

  // Estado del juego — lo guardo en la sala para poder accederlo desde cualquier evento
  room.gameState = {
    questions: selected,
    currentIndex: 0,
    answers: new Map(),   // socketId -> { answerIndex, timeLeft, points }
    activeDoublePoints: new Set(), // sockets con doublePoints activo esta pregunta
    questionStartTime: null,
    timerInterval: null,
    phaseTimeout: null,
  };

  roomManager.setPhase(roomCode, 'countdown');

  // Reinicio puntajes para la nueva partida
  for (const player of room.players.values()) {
    player.score = 0;
  }

  io.to(roomCode).emit('game_start', {
    category: room.category,
    totalQuestions: selected.length,
  });

  // Cuenta atrás: 3, 2, 1...
  let count = 3;
  const countdownInterval = setInterval(() => {
    io.to(roomCode).emit('countdown_tick', { count });
    count--;
    if (count < 0) {
      clearInterval(countdownInterval);
      sendQuestion(io, roomCode);
    }
  }, 1000);
}

function sendQuestion(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  const { gameState } = room;
  const question = gameState.questions[gameState.currentIndex];

  gameState.answers.clear();
  gameState.activeDoublePoints.clear();
  gameState.questionStartTime = Date.now();

  roomManager.setPhase(roomCode, 'question');

  // Envío la pregunta SIN el índice de la respuesta correcta (eso solo lo sabe el servidor)
  io.to(roomCode).emit('question', {
    questionIndex: gameState.currentIndex,
    totalQuestions: gameState.questions.length,
    question: question.question,
    options: question.options,
    timeLimit: TIMINGS.QUESTION / 1000,
  });

  // Timer que hace tick cada segundo para que los clientes actualicen la barra de progreso
  let timeLeft = TIMINGS.QUESTION / 1000;
  gameState.timerInterval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timer_tick', { timeLeft });
    if (timeLeft <= 0) {
      clearInterval(gameState.timerInterval);
    }
  }, 1000);

  // Cuando se acaba el tiempo, pasamos a reveal automáticamente
  gameState.phaseTimeout = setTimeout(() => {
    clearInterval(gameState.timerInterval);
    revealAnswers(io, roomCode);
  }, TIMINGS.QUESTION);
}

function submitAnswer(io, roomCode, socketId, answerIndex) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.phase !== 'question') return;

  const { gameState } = room;

  // Solo acepto la primera respuesta del jugador
  if (gameState.answers.has(socketId)) return;

  const timeElapsed = Date.now() - gameState.questionStartTime;
  const timeLeftMs = Math.max(0, TIMINGS.QUESTION - timeElapsed);

  const question = gameState.questions[gameState.currentIndex];
  const isCorrect = answerIndex === question.correct;

  let points = 0;
  if (isCorrect) {
    const useDouble = gameState.activeDoublePoints.has(socketId);
    points = calculatePoints(timeLeftMs, TIMINGS.QUESTION, useDouble);
    roomManager.updatePlayerScore(roomCode, socketId, points);
  }

  gameState.answers.set(socketId, { answerIndex, isCorrect, points, timeLeftMs });

  // Le confirmo al jugador que recibimos su respuesta (sin decirle si es correcta todavía)
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('answer_received', { points: isCorrect ? points : 0 });
  }

  // Si todos los jugadores conectados ya respondieron, no esperamos el timer — revelamos ya
  const connectedPlayers = roomManager.getPlayersArray(room);
  if (gameState.answers.size >= connectedPlayers.length) {
    clearTimeout(gameState.phaseTimeout);
    clearInterval(gameState.timerInterval);
    revealAnswers(io, roomCode);
  }
}

function activatePowerup(io, roomCode, socketId, powerupType) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  const used = roomManager.usePowerup(roomCode, socketId, powerupType);
  if (!used) return;

  const { gameState } = room;
  const socket = io.sockets.sockets.get(socketId);

  if (powerupType === 'doublePoints') {
    // Marco al jugador para que su próxima respuesta correcta valga el doble
    gameState.activeDoublePoints.add(socketId);
    if (socket) socket.emit('powerup_activated', { type: 'doublePoints' });
  }

  if (powerupType === 'fiftyFifty') {
    const question = gameState.questions[gameState.currentIndex];
    const toHide = getTwoWrongOptions(question.correct, question.options.length);
    // Solo le digo a ESTE jugador cuáles opciones eliminar — no a todos
    if (socket) socket.emit('powerup_activated', { type: 'fiftyFifty', hideOptions: toHide });
  }

  // Notifico a la sala que alguien usó un power-up (sin revelar el tipo al resto)
  const player = room.players.get(socketId);
  io.to(roomCode).emit('powerup_used', { username: player?.username });
}

function revealAnswers(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  const { gameState } = room;
  const question = gameState.questions[gameState.currentIndex];

  roomManager.setPhase(roomCode, 'reveal');

  // Ahora SÍ revelo la respuesta correcta y los resultados de cada jugador
  const answersSummary = {};
  for (const [sid, ans] of gameState.answers) {
    const player = room.players.get(sid);
    if (player) {
      answersSummary[sid] = {
        username: player.username,
        answerIndex: ans.answerIndex,
        isCorrect: ans.isCorrect,
        points: ans.points,
      };
    }
  }

  io.to(roomCode).emit('reveal_answers', {
    correctIndex: question.correct,
    answers: answersSummary,
    scoreboard: getScoreboard(room),
  });

  // Después de mostrar la respuesta, voy al leaderboard
  gameState.phaseTimeout = setTimeout(() => {
    showLeaderboard(io, roomCode);
  }, TIMINGS.REVEAL);
}

function showLeaderboard(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  const { gameState } = room;
  roomManager.setPhase(roomCode, 'leaderboard');

  io.to(roomCode).emit('leaderboard', {
    scoreboard: getScoreboard(room),
    isLastQuestion: gameState.currentIndex >= gameState.questions.length - 1,
  });

  gameState.phaseTimeout = setTimeout(() => {
    gameState.currentIndex++;
    if (gameState.currentIndex >= gameState.questions.length) {
      endGame(io, roomCode);
    } else {
      sendQuestion(io, roomCode);
    }
  }, TIMINGS.LEADERBOARD);
}

function endGame(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  roomManager.setPhase(roomCode, 'finished');

  const scoreboard = getScoreboard(room);
  const winner = scoreboard[0];

  // Persisto los resultados en la base de datos
  const players = scoreboard.map((p, i) => ({
    userId: p.userId,
    username: p.username,
    score: p.score,
    position: i + 1,
  }));

  saveGameResult({
    roomCode,
    category: room.category,
    hostId: room.hostId,
    players,
    winnerId: winner?.userId || null,
    winnerName: winner?.username || null,
  });

  io.to(roomCode).emit('game_over', {
    scoreboard,
    winner,
  });
}

// Devuelve el scoreboard ordenado por puntaje de mayor a menor
function getScoreboard(room) {
  return roomManager.getPlayersArray(room)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      position: i + 1,
      userId: p.userId,
      username: p.username,
      score: p.score,
      powerups: p.powerups,
    }));
}

module.exports = { startGame, submitAnswer, activatePowerup };
