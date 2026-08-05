import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pharmacy_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('pharmacy_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await authAPI.login(username, password);
    const userData = response.data?.data || response.data;
    setUser(userData);
    localStorage.setItem('pharmacy_user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pharmacy_user');
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.roles?.includes('ADMIN'),
    isPharmacist: user?.roles?.includes('PHARMACIST'),
    isSalesperson: user?.roles?.includes('SALESPERSON'),
    hasRole: (role) => user?.roles?.includes(role),
  };

  return (
    <AuthContext.Provider value={value}>
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
