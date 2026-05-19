// Configuración de la base de datos SQLite
// Elegí SQLite porque es perfecto para desarrollo: no necesita instalar nada extra,
// todo queda en un archivo .db y mejor-sqlite3 es síncrono (más simple que promises).

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../trivia.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    // WAL mode hace que las lecturas no bloqueen las escrituras — básico para multi-usuario
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  // Creo las tablas solo si no existen, así no pierdo datos al reiniciar el servidor
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    UNIQUE NOT NULL,
      email      TEXT    UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code    TEXT    NOT NULL,
      category     TEXT    NOT NULL,
      host_id      INTEGER,
      player_count INTEGER DEFAULT 0,
      winner_id    INTEGER,
      winner_name  TEXT,
      started_at   DATETIME,
      ended_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id)   REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id  INTEGER NOT NULL,
      user_id  INTEGER NOT NULL,
      username TEXT    NOT NULL,
      score    INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

module.exports = { getDB };
