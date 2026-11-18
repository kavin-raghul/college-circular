import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Axios interceptor for refresh token
  useEffect(() => {
    const api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      withCredentials: true
    });

    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true });
            if (res.data.accessToken) {
              setToken(res.data.accessToken);
              originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
              return axios(originalRequest);
            }
          } catch (err) {
            setUser(null);
            setToken(null);
          }
        }
        return Promise.reject(error);
      }
    );
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }, { withCredentials: true });
    setUser(res.data);
    setToken(res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data));
    localStorage.setItem('token', res.data.accessToken);
  };

  const logout = async () => {
    try {
       await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
       console.error("Logout API failed, continuing local logout", err);
    } finally {
       setUser(null);
       setToken(null);
       localStorage.removeItem('user');
       localStorage.removeItem('token');
    }
  };

  const register = async (userData) => {
    // Hit register endpoint
    await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
    // Auto-login immediately after successful registration
    await login(userData.email, userData.password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
