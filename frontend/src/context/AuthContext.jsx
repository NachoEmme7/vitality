import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vitality_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vitality_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest('/auth/me')
      .then((res) => {
        setUser(res.user);
        localStorage.setItem('vitality_user', JSON.stringify(res.user));
      })
      .catch(() => {
        localStorage.removeItem('vitality_token');
        localStorage.removeItem('vitality_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginSuccess = (token, userData) => {
    localStorage.setItem('vitality_token', token);
    localStorage.setItem('vitality_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vitality_token');
    localStorage.removeItem('vitality_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
