import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { disconnectSocket } from '@/services/socket';
import type { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: () => {}, logout: () => {}, refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('mch_access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get<{ success: boolean; data: User }>('/auth/me');
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = (accessToken: string, refreshToken: string, u: User) => {
    localStorage.setItem('mch_access_token', accessToken);
    localStorage.setItem('mch_refresh_token', refreshToken);
    setUser(u);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('mch_access_token');
    localStorage.removeItem('mch_refresh_token');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
