// Middleware para verificar JWT en las rutas protegidas
// El JWT viaja en el header Authorization: Bearer <token>
// Si el token es válido, adjunto el usuario decodificado al objeto req para usarlo en los controllers

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Si no hay header, el usuario no está autenticado — punto
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  // El formato esperado es "Bearer eyJhbGci..."
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, email }
    next();
  } catch (err) {
    // Si el token expiró o está manipulado, rechazamos
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

// Esta función la uso en el socket handler para verificar el token que mandan los clientes
// al conectarse por WebSocket (no viene en headers normales sino en el handshake)
function verifyTokenString(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { verifyToken, verifyTokenString };
