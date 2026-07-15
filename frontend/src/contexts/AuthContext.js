import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me').then(r => {
        setUsuario(r.data.usuario);
      }).catch(() => {
        setToken(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  async function login(email, senha) {
    const res = await api.post('/auth/login', { email, senha });
    setToken(res.data.token);
    setUsuario(res.data.usuario);
    localStorage.setItem('token', res.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  }

  async function register(nome, email, senha) {
    const res = await api.post('/auth/register', { nome, email, senha });
    setToken(res.data.token);
    setUsuario(res.data.usuario);
    localStorage.setItem('token', res.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  }

  function logout() {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
