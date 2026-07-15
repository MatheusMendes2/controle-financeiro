import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiTrendingDown, FiGrid, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

function Layout({ children }) {
  const { usuario, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Finanças</h1>
          <span>Controle Financeiro</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FiHome /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/receitas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FiTrendingUp /><span>Receitas</span>
          </NavLink>
          <NavLink to="/despesas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FiTrendingDown /><span>Despesas</span>
          </NavLink>
          <NavLink to="/categorias" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FiGrid /><span>Categorias</span>
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FiBarChart2 /><span>Relatórios</span>
          </NavLink>
          {usuario?.admin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <FiSettings /><span>Manutenção</span>
            </NavLink>
          )}
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
          <div style={{ padding: '8px 16px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{usuario?.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{usuario?.email}</div>
          </div>
          <button className="nav-item" onClick={logout}>
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
