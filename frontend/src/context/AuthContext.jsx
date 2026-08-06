import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getTokenExpiry(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearLogoutTimer();
    setUser(null);
    localStorage.removeItem('pharmacy_user');
  }, [clearLogoutTimer]);

  const scheduleLogout = useCallback((token) => {
    clearLogoutTimer();
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      logout();
      return;
    }
    const now = Date.now();
    const delay = expiry - now;
    if (delay <= 0) {
      logout();
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, delay);
  }, [logout, clearLogoutTimer]);

  useEffect(() => {
    const stored = localStorage.getItem('pharmacy_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          const expiry = getTokenExpiry(parsed.token);
          if (expiry && Date.now() >= expiry) {
            localStorage.removeItem('pharmacy_user');
          } else {
            setUser(parsed);
            scheduleLogout(parsed.token);
          }
        }
      } catch {
        localStorage.removeItem('pharmacy_user');
      }
    }
    setLoading(false);

    return () => clearLogoutTimer();
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await authAPI.login(username, password);
    const userData = response.data?.data || response.data;
    setUser(userData);
    localStorage.setItem('pharmacy_user', JSON.stringify(userData));
    scheduleLogout(userData.token);
    return userData;
  }, [scheduleLogout]);

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
