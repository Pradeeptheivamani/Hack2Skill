/**
 * Sidebar.jsx — Collapsible navigation sidebar with role-based menus
 */

import { NavLink } from 'react-router-dom';
import { BarChart3, PenTool, Search, Shield, Building, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Sidebar.css';

const CITIZEN_MENU = [
  { icon: <BarChart3 size={20} />, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: <PenTool size={20} />, labelKey: 'nav.submit',    path: '/submit' },
  { icon: <Search size={20} />, labelKey: 'nav.track',     path: '/track' },
];

const ADMIN_MENU = [
  { icon: <Shield size={20} />, labelKey: 'nav.admin',     path: '/admin' },
  { icon: <BarChart3 size={20} />, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: <PenTool size={20} />, labelKey: 'nav.submit',    path: '/submit' },
];

const DEPT_MENU = [
  { icon: <Building size={20} />, labelKey: 'nav.department', path: '/department' },
  { icon: <BarChart3 size={20} />, labelKey: 'nav.dashboard',  path: '/dashboard' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const menu =
    user?.role === 'admin'             ? ADMIN_MENU :
    user?.role === 'department_officer'? DEPT_MENU  :
    CITIZEN_MENU;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        {/* Department / User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {user?.role === 'admin' ? <><Shield size={14} /> Administrator</> :
               user?.role === 'department_officer' ? <><Building size={14} /> Dept. Officer</> :
               <><User size={14} /> Citizen</>}
            </div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">NAVIGATION</div>
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => window.innerWidth < 1024 && onClose()}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" />

        {/* Bottom actions */}
        <div className="sidebar-bottom">
          <NavLink to="/" className="sidebar-link">
            <span className="sidebar-icon"><Home size={20} /></span>
            <span className="sidebar-label">{t('nav.home')}</span>
          </NavLink>
          <button className="sidebar-link sidebar-logout" onClick={logout}>
            <span className="sidebar-icon"><LogOut size={20} /></span>
            <span className="sidebar-label">{t('nav.logout')}</span>
          </button>
        </div>

        {/* Version tag */}
        <div className="sidebar-version">
          <span>GrievanceAI v1.0</span>
          <span>SIH 2024</span>
        </div>
      </aside>
    </>
  );
}
