'use client';

// Context de autenticación — comparte el estado del usuario logueado en toda la app
// Uso Context en lugar de Zustand/Redux porque para este proyecto es más que suficiente
// y no quiero agregar dependencias innecesarias

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar, reviso si hay un token guardado en cookie para mantener la sesión
  useEffect(() => {
    const savedToken = Cookies.get('trivia_token');
    const savedUser = Cookies.get('trivia_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // Si la cookie está corrupta, limpio todo
        Cookies.remove('trivia_token');
        Cookies.remove('trivia_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Guardo en cookies (no localStorage) para que sea accesible desde SSR si lo necesito después
    Cookies.set('trivia_token', newToken, { expires: 7 });
    Cookies.set('trivia_user', JSON.stringify(newUser), { expires: 7 });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    Cookies.remove('trivia_token');
    Cookies.remove('trivia_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
