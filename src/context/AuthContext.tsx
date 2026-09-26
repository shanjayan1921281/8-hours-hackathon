import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api.js';

export interface User {
  role: 'admin' | 'team';
  id?: number;
  username?: string;
  teamCode?: string;
  teamName?: string;
  selectedProblemId?: number | null;
  selectedAt?: string | null;
  assignedProblem?: {
    code: string;
    title: string;
    category: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAdmin: (username: string, password: string) => Promise<void>;
  loginTeam: (teamCode: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User | null }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginAdmin = async (username: string, password: string) => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      localStorage.setItem('hackathon_token', res.token);
    }
    setUser(res.user);
  };

  const loginTeam = async (teamCode: string, password: string) => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/team/login', {
      method: 'POST',
      body: JSON.stringify({ teamCode, password })
    });
    if (res.token) {
      localStorage.setItem('hackathon_token', res.token);
    }
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error', e);
    }
    localStorage.removeItem('hackathon_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginTeam, logout, refreshUser }}>
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
