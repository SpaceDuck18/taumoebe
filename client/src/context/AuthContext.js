'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('taumoeba_token');
    const savedUser = localStorage.getItem('taumoeba_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('taumoeba_token');
        localStorage.removeItem('taumoeba_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('taumoeba_token', token);
    localStorage.setItem('taumoeba_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
    return userData;
  };

  const register = async (formData) => {
    const response = await authAPI.register(formData);
    const { token, user: userData } = response.data;

    localStorage.setItem('taumoeba_token', token);
    localStorage.setItem('taumoeba_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('taumoeba_token');
    localStorage.removeItem('taumoeba_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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

export default AuthContext;
