import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'PHARMACY' | 'INSPECTOR';
  status: string;
  walletAddress?: string;
  entity?: {
    id: string;
    orgName: string;
    licenseNo: string;
    walletAddress?: string;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('pharmatrace_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('pharmatrace_token')
  );

  const login = (accessToken: string, userData: AuthUser) => {
    localStorage.setItem('pharmatrace_token', accessToken);
    localStorage.setItem('pharmatrace_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pharmatrace_token');
    localStorage.removeItem('pharmatrace_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
