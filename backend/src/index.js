// Punto de entrada del servidor — acá junto todo: Express + Socket.io
// Separo el servidor HTTP de Express para que Socket.io pueda compartirlo
// (si creara el socket sobre express directamente, tendría problemas con CORS)

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const { setupSocketHandlers } = require('./socket/socketHandler');
const { getDB } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Socket.io sobre el mismo servidor HTTP — así no necesito otro puerto
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware de Express
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Inicializo la base de datos al arrancar (crea tablas si no existen)
getDB();

// Rutas REST
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSockets
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  console.log(`WebSockets listos`);
  console.log(`Base de datos SQLite inicializada\n`);
});
