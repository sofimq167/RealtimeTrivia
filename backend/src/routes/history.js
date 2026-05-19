// Rutas para el historial de partidas del usuario
// Solo el usuario logueado puede ver su propio historial (gracias al verifyToken)

const express = require('express');
const { getDB } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/history — devuelve las últimas 20 partidas del usuario autenticado
router.get('/', verifyToken, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    // JOIN entre game_results y games para tener toda la info en una sola consulta
    const history = db.prepare(`
      SELECT
        gr.id,
        g.room_code,
        g.category,
        g.player_count,
        g.winner_name,
        gr.score,
        gr.position,
        g.ended_at
      FROM game_results gr
      JOIN games g ON gr.game_id = g.id
      WHERE gr.user_id = ?
      ORDER BY g.ended_at DESC
      LIMIT 20
    `).all(userId);

    res.json({ history });
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/history/stats — estadísticas generales del usuario
router.get('/stats', verifyToken, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    const stats = db.prepare(`
      SELECT
        COUNT(*)           AS total_games,
        SUM(gr.score)      AS total_score,
        MAX(gr.score)      AS best_score,
        SUM(CASE WHEN gr.position = 1 THEN 1 ELSE 0 END) AS wins
      FROM game_results gr
      WHERE gr.user_id = ?
    `).get(userId);

    res.json({ stats });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Esta función la llama el gameManager cuando termina una partida para persistir los resultados
function saveGameResult({ roomCode, category, hostId, players, winnerId, winnerName }) {
  try {
    const db = getDB();

    const gameInsert = db.prepare(`
      INSERT INTO games (room_code, category, host_id, player_count, winner_id, winner_name, started_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(roomCode, category, hostId, players.length, winnerId, winnerName);

    const gameId = gameInsert.lastInsertRowid;

    // Inserto el resultado de cada jugador de forma síncrona (better-sqlite3 es sync)
    const insertResult = db.prepare(`
      INSERT INTO game_results (game_id, user_id, username, score, position)
      VALUES (?, ?, ?, ?, ?)
    `);

    players.forEach(({ userId, username, score, position }) => {
      insertResult.run(gameId, userId, username, score, position);
    });

    return gameId;
  } catch (err) {
    console.error('Error guardando resultado de partida:', err);
    return null;
  }
}

module.exports = router;
module.exports.saveGameResult = saveGameResult;
