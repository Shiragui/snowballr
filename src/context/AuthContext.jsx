import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schwab, setSchwab] = useState({ configured: false, connected: false });

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshSchwab = useCallback(async () => {
    try {
      const status = await api.schwabStatus();
      setSchwab(status);
    } catch {
      setSchwab({ configured: false, connected: false });
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshUser(), refreshSchwab()]).finally(() => setLoading(false));
  }, [refreshUser, refreshSchwab]);

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSchwab({ configured: false, connected: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        schwab,
        refreshUser,
        refreshSchwab,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
