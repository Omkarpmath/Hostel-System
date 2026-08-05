import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '@/api/auth.api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True only for the local, API-free role preview. */
  isPreviewMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  devSignIn?: (role: User['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PREVIEW_USER_KEY = 'bmsce-preview-user';

function getPreviewUser(): User | null {
  const storedUser = localStorage.getItem(PREVIEW_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(PREVIEW_USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const previewUser = getPreviewUser();
    if (previewUser) {
      setUser(previewUser);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await authApi.getProfile();
      if (data.data) {
        setUser(data.data);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    if (data.data) {
      localStorage.setItem('accessToken', data.data.accessToken);
      setUser(data.data.user);
    }
  };

  // Temporary dev sign-in helper for local UI testing
  const devSignIn = (role: User['role']) => {
    const mockUser: User = {
      id: `dev-${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@dev.local`,
      role: role as User['role'],
      firstName: role.charAt(0) + role.slice(1).toLowerCase(),
      lastName: 'Dev',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Preview users intentionally never receive an API token. This keeps the
    // role preview usable without a seeded database or running backend.
    localStorage.removeItem('accessToken');
    localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = async () => {
    const isPreviewSession = Boolean(getPreviewUser());
    try {
      if (!isPreviewSession) await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem(PREVIEW_USER_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isPreviewMode: Boolean(getPreviewUser()),
        login,
        logout,
        refreshProfile,
        devSignIn,
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
