import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Receitas from './components/Receitas';
import Despesas from './components/Despesas';
import Categorias from './components/Categorias';
import Relatorios from './components/Relatorios';
import Admin from './components/Admin';
import Login from './components/Login';
import Register from './components/Register';

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  return usuario ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/receitas" element={<PrivateRoute><Layout><Receitas /></Layout></PrivateRoute>} />
      <Route path="/despesas" element={<PrivateRoute><Layout><Despesas /></Layout></PrivateRoute>} />
      <Route path="/categorias" element={<PrivateRoute><Layout><Categorias /></Layout></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><Layout><Admin /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
