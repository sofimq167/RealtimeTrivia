// SocketHandler — el router de eventos de WebSocket
// Acá conecto los eventos de Socket.io con la lógica de roomManager y gameManager.
// Cada 'io.on("connection")' crea una nueva sesión para ese cliente específico.
// Los eventos son bidireccionales: el cliente emite y el servidor responde (y viceversa).

const { verifyTokenString } = require('../middleware/auth');
const roomManager = require('./roomManager');
const { startGame, submitAnswer, activatePowerup } = require('./gameManager');

function setupSocketHandlers(io) {
  // Middleware de Socket.io: verifico el JWT antes de aceptar la conexión WebSocket
  // El token viene en el handshake (auth.token que manda el cliente al conectarse)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Autenticación requerida'));

    const user = verifyTokenString(token);
    if (!user) return next(new Error('Token inválido'));

    // Adjunto el usuario al socket para usarlo en los eventos
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.user.username} (${socket.id})`);

    // ──────────────────────────────────────────
    // GESTIÓN DE SALAS
    // ──────────────────────────────────────────

    // Crear una sala nueva
    socket.on('create_room', (callback) => {
      const room = roomManager.createRoom(socket.id, socket.user);
      socket.join(room.code); // Socket.io room — así puedo hacer io.to(code).emit()

      callback({
        ok: true,
        roomCode: room.code,
        players: roomManager.getPlayersArray(room),
      });

      console.log(`Sala creada: ${room.code} por ${socket.user.username}`);
    });

    // Unirse a una sala existente con código
    socket.on('join_room', ({ roomCode }, callback) => {
      const result = roomManager.joinRoom(roomCode, socket.id, socket.user);

      if (result.error) {
        return callback({ ok: false, error: result.error });
      }

      socket.join(roomCode);
      const players = roomManager.getPlayersArray(result.room);

      callback({ ok: true, roomCode, players, category: result.room.category });

      // Notifico a TODOS en la sala que hay un nuevo jugador
      io.to(roomCode).emit('players_update', { players });

      // Le mando el historial del chat al recién llegado
      socket.emit('chat_history', { messages: result.room.chatMessages });

      console.log(`${socket.user.username} se unio a la sala ${roomCode}`);
    });

    // Cambiar la categoría de la partida (solo el host puede)
    socket.on('set_category', ({ roomCode, category }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;
      if (room.hostId !== socket.user.id) return; // solo el host

      roomManager.setCategory(roomCode, category);
      io.to(roomCode).emit('category_changed', { category });
    });

    // ──────────────────────────────────────────
    // CHAT
    // ──────────────────────────────────────────

    socket.on('send_chat', ({ roomCode, message }) => {
      if (!message?.trim() || message.length > 200) return;

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      const chatMsg = {
        userId: socket.user.id,
        username: socket.user.username,
        message: message.trim(),
        timestamp: Date.now(),
      };

      // Guardo los últimos 50 mensajes en memoria para mostrarlos al reconectarse
      room.chatMessages.push(chatMsg);
      if (room.chatMessages.length > 50) room.chatMessages.shift();

      io.to(roomCode).emit('chat_message', chatMsg);
    });

    // ──────────────────────────────────────────
    // FLUJO DEL JUEGO
    // ──────────────────────────────────────────

    // El host inicia la partida
    socket.on('start_game', ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;
      if (room.hostId !== socket.user.id) return;
      if (room.phase !== 'waiting') return;
      if (room.players.size < 1) return; // mínimo 1 jugador para desarrollo/pruebas

      startGame(io, roomCode);
    });

    // El jugador envía su respuesta
    socket.on('submit_answer', ({ roomCode, answerIndex }) => {
      if (typeof answerIndex !== 'number') return;
      submitAnswer(io, roomCode, socket.id, answerIndex);
    });

    // El jugador usa un power-up
    socket.on('use_powerup', ({ roomCode, powerupType }) => {
      const validTypes = ['doublePoints', 'fiftyFifty'];
      if (!validTypes.includes(powerupType)) return;
      activatePowerup(io, roomCode, socket.id, powerupType);
    });

    // ──────────────────────────────────────────
    // DESCONEXIÓN
    // ──────────────────────────────────────────

    socket.on('disconnect', () => {
      const result = roomManager.leaveRoom(socket.id);
      if (!result) return;

      console.log(`${socket.user.username} se desconecto de la sala ${result.code}`);

      if (!result.deleted) {
        const room = roomManager.getRoom(result.code);
        if (room) {
          io.to(result.code).emit('players_update', {
            players: roomManager.getPlayersArray(room),
          });
          io.to(result.code).emit('chat_message', {
            userId: null,
            username: 'Sistema',
            message: `${socket.user.username} se desconectó`,
            timestamp: Date.now(),
            isSystem: true,
          });
        }
      }
    });
  });
}

module.exports = { setupSocketHandlers };
