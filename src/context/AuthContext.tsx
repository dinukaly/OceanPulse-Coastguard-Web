import React, { createContext, useContext, useState, useEffect } from 'react';
import { CoastGuardUser } from '../types/sos';
import { api } from '../services/api';

interface AuthContextType {
  user: CoastGuardUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CoastGuardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('op_cg_user');
    const token = api.getToken();

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.role === 'coastguard') setUser(parsed);
        else api.setToken(null);
      } catch (_) {
        api.setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    if (data.user.role !== 'coastguard') {
      api.setToken(null);
      throw new Error('Access denied: Account role is not authorized for Coastal Guard Emergency Command');
    }
    setUser(data.user);
    localStorage.setItem('op_cg_user', JSON.stringify(data.user));
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    localStorage.removeItem('op_cg_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && api.getToken()),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
