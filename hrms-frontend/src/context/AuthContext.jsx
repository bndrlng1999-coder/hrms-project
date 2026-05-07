import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.email?.endsWith('@nikhilhrms.com')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setUser(parsedUser);
          authAPI.me()
            .then((response) => {
              const freshUser = response.data.data;
              localStorage.setItem('user', JSON.stringify(freshUser));
              setUser(freshUser);
            })
            .catch(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            })
            .finally(() => setLoading(false));
          return;
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email.trim(), password);
      const payload = response.data?.data;
      if (!payload?.user) {
        throw new Error(response.data?.message || 'Login response did not include user details');
      }
      const { token, accessToken, user } = payload;
      const authToken = token || accessToken;
      if (!authToken) {
        throw new Error('Login response did not include an access token');
      }
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    const response = await authAPI.me();
    const freshUser = response.data.data;
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    return freshUser;
  };

  useEffect(() => {
    if (!user) return undefined;

    const refreshSilently = () => {
      authAPI.me()
        .then((response) => {
          const freshUser = response.data.data;
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        })
        .catch(() => {});
    };

    window.addEventListener('focus', refreshSilently);
    const intervalId = window.setInterval(refreshSilently, 60000);

    return () => {
      window.removeEventListener('focus', refreshSilently);
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
