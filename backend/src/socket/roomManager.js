// RoomManager — maneja el estado de las salas en memoria
// Las salas existen solo mientras el servidor está corriendo (no persistimos esto en DB)
// porque no tiene sentido: si el servidor cae, la partida termina igual.
//
// Estructura de una sala:
// {
//   code: "ABC123",
//   hostId: "userId",
//   category: "videojuegos" | "peliculas",
//   players: Map<socketId, PlayerInfo>,
//   phase: "waiting" | "countdown" | "question" | "reveal" | "leaderboard" | "finished",
//   gameState: {...} (lo maneja gameManager)
// }

const rooms = new Map(); // roomCode -> Room

function generateCode() {
  // Genero un código de 6 caracteres alfanumérico en mayúsculas — fácil de compartir
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1 para evitar confusiones
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code)); // me aseguro de que sea único
  return code;
}

function createRoom(hostSocketId, hostUser) {
  const code = generateCode();
  const room = {
    code,
    hostId: hostUser.id,
    hostSocketId,
    category: 'videojuegos', // categoría por defecto
    players: new Map(),
    phase: 'waiting',
    chatMessages: [],
    gameState: null,
  };

  // El creador ya entra como primer jugador
  room.players.set(hostSocketId, {
    socketId: hostSocketId,
    userId: hostUser.id,
    username: hostUser.username,
    score: 0,
    isHost: true,
    isConnected: true,
    powerups: { doublePoints: 1, fiftyFifty: 1 }, // cada jugador tiene 1 de cada power-up
  });

  rooms.set(code, room);
  return room;
}

function joinRoom(code, socketId, user) {
  const room = rooms.get(code);
  if (!room) return { error: 'Sala no encontrada' };
  if (room.phase !== 'waiting') return { error: 'La partida ya comenzó' };
  if (room.players.size >= 8) return { error: 'La sala está llena (máximo 8 jugadores)' };

  // Si el usuario ya estaba en la sala (reconexión), actualizo su socketId
  for (const [sid, player] of room.players) {
    if (player.userId === user.id) {
      room.players.delete(sid);
      player.socketId = socketId;
      player.isConnected = true;
      room.players.set(socketId, player);
      return { room, isReconnection: true };
    }
  }

  room.players.set(socketId, {
    socketId,
    userId: user.id,
    username: user.username,
    score: 0,
    isHost: false,
    isConnected: true,
    powerups: { doublePoints: 1, fiftyFifty: 1 },
  });

  return { room, isReconnection: false };
}

function leaveRoom(socketId) {
  // Busco la sala a la que pertenece este socket
  for (const [code, room] of rooms) {
    if (room.players.has(socketId)) {
      const player = room.players.get(socketId);
      player.isConnected = false;

      // Si no quedan jugadores conectados, elimino la sala
      const connectedPlayers = [...room.players.values()].filter(p => p.isConnected);
      if (connectedPlayers.length === 0) {
        rooms.delete(code);
        return { code, room, deleted: true };
      }

      // Si el host se va, transfiero el rol al siguiente jugador
      if (player.isHost && connectedPlayers.length > 0) {
        player.isHost = false;
        const newHost = connectedPlayers[0];
        newHost.isHost = true;
        room.hostId = newHost.userId;
        room.hostSocketId = newHost.socketId;
      }

      return { code, room, deleted: false, player };
    }
  }
  return null;
}

function getRoom(code) {
  return rooms.get(code);
}

function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return null;
}

// Convierte el Map de jugadores a array para enviarlo por WebSocket (JSON no serializa Maps)
function getPlayersArray(room) {
  return [...room.players.values()].filter(p => p.isConnected);
}

function setCategory(code, category) {
  const room = rooms.get(code);
  if (room) room.category = category;
}

function setPhase(code, phase) {
  const room = rooms.get(code);
  if (room) room.phase = phase;
}

function updatePlayerScore(code, socketId, points) {
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.get(socketId);
  if (player) player.score += points;
}

function usePowerup(code, socketId, powerupType) {
  const room = rooms.get(code);
  if (!room) return false;
  const player = room.players.get(socketId);
  if (!player) return false;
  if (!player.powerups[powerupType] || player.powerups[powerupType] <= 0) return false;
  player.powerups[powerupType]--;
  return true;
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomBySocketId,
  getPlayersArray,
  setCategory,
  setPhase,
  updatePlayerScore,
  usePowerup,
};
