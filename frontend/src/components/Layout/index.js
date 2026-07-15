import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiTrendingDown, FiGrid, FiBarChart2 } from 'react-icons/fi';

const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/receitas', icon: FiTrendingUp, label: 'Receitas' },
  { to: '/despesas', icon: FiTrendingDown, label: 'Despesas' },
  { to: '/categorias', icon: FiGrid, label: 'Categorias' },
  { to: '/relatorios', icon: FiBarChart2, label: 'Relatórios' }
];

function Layout({ children }) {
  const location = useLocation();

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
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
