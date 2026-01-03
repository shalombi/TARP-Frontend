'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  emailVerified?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; message: string; magicLink?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }

    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await checkAuth();
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    setUser(null);
    return false;
  };

  useEffect(() => {
    checkAuth().finally(() => setLoading(false));

    // Set up automatic token refresh
    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // Refresh every 14 minutes (before 15min expiry)

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string): Promise<{ success: boolean; message: string; magicLink?: string }> => {
    try {
      const response = await fetch(`${API}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Failed to send magic link' };
    }
  };

  const loginWithPassword = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh user data
        await checkAuth();
        return { success: true };
      }
      
      return { success: false, message: data.message || 'Invalid email or password' };
    } catch (error) {
      return { success: false, message: 'Failed to login. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithPassword,
        logout,
        refreshToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

