import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const hasSession = localStorage.getItem('has_session') === 'true';

      // If user never logged in or explicitly logged out, do not make blind refresh requests
      if (!token && !hasSession) {
        setUser(null);
        return;
      }

      if (token) {
        try {
          const { data } = await authApi.getProfile();
          if (data.data) {
            setUser(data.data);
            localStorage.setItem('has_session', 'true');
            return;
          }
        } catch {
          // Token expired or invalid, fall through to silent refresh
        }
      }

      // If user has a valid active session flag, attempt silent refresh via 7-day HttpOnly cookie
      if (hasSession || token) {
        try {
          const refreshRes = await authApi.refresh();
          const newToken = (refreshRes.data as any)?.data?.accessToken;

          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            localStorage.setItem('has_session', 'true');
            const profileRes = await authApi.getProfile();
            if (profileRes.data?.data) {
              setUser(profileRes.data.data);
              return;
            }
          }
        } catch {
          // 7-day session expired or revoked
        }
      }

      // No valid active session
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('has_session');
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('has_session');
    }
  }, []);

  // Initial session restoration on startup
  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  // Multi-tab auth state synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'auth_event' || e.key === 'has_session') {
        const currentToken = localStorage.getItem('accessToken');
        const currentHasSession = localStorage.getItem('has_session') === 'true';
        if (!currentToken && !currentHasSession) {
          setUser(null);
          queryClient.clear();
        } else {
          refreshProfile();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient, refreshProfile]);

  const login = async (email: string, password: string): Promise<User> => {
    queryClient.clear();
    const { data } = await authApi.login({ email, password });
    if (data.data) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('has_session', 'true');
      localStorage.setItem('auth_event', `login_${Date.now()}`);
      setUser(data.data.user);
      return data.data.user;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors on server
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('has_session');
      localStorage.setItem('auth_event', `logout_${Date.now()}`);
      setUser(null);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
