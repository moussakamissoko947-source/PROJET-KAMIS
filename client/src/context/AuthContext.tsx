import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StorageUsage } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  storage: StorageUsage | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, storageData: StorageUsage) => void;
  logout: () => Promise<void>;
  updateStorage: (newStorage: StorageUsage) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setStorage(data.storage);
    } catch {
      setUser(null);
      setStorage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData: User, storageData: StorageUsage) => {
    setUser(userData);
    setStorage(storageData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setStorage(null);
    }
  }, []);

  const updateStorage = useCallback((newStorage: StorageUsage) => {
    setStorage(newStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        storage,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateStorage,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
