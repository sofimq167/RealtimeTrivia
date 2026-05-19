import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

export const metadata: Metadata = {
  title: 'RealtimeTrivia — Juega con tus amigos',
  description: 'Plataforma de trivia multijugador en tiempo real con categorías de videojuegos y películas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-warm-gradient min-h-screen font-poppins antialiased">
        {/* Un solo AuthProvider + SocketProvider para toda la app — así el socket
            sobrevive las navegaciones entre páginas y no se recrea al cambiar de ruta */}
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
