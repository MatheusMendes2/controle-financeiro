import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiTrendingDown, FiGrid, FiBarChart2, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/receitas', icon: FiTrendingUp, label: 'Receitas' },
  { to: '/despesas', icon: FiTrendingDown, label: 'Despesas' },
  { to: '/categorias', icon: FiGrid, label: 'Categorias' },
  { to: '/relatorios', icon: FiBarChart2, label: 'Relatórios' }
];

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
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
              end={item.to === '/'}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
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
