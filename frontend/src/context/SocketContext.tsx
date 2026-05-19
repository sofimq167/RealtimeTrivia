'use client';

// Context del Socket — mantiene UNA sola conexión WebSocket para toda la app
// Es importante que sea una sola instancia: si creo el socket en cada componente,
// se multiplican las conexiones y el servidor se vuelve loco con eventos duplicados.

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Solo conecto el socket si el usuario está autenticado
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Si ya hay una conexión activa con el mismo token, no reconecto
    if (socketRef.current?.connected) return;

    // El token va en el handshake — así el servidor lo verifica antes de aceptar la conexión
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // websocket primero, polling como fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Error de conexión WebSocket:', err.message);
      setIsConnected(false);
    });

    // Limpieza: desconecto cuando el componente se desmonta o cambia el token
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
