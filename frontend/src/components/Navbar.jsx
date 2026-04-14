/**
 * Navbar.jsx — Top navigation bar with language switch, notifications, user menu
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Building, Globe, CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, BarChart3, Shield, PenTool, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import './Navbar.css';

export default function Navbar({ onMenuToggle, sidebarOpen }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const notifRef   = useRef();
  const profileRef = useRef();

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/auth/notifications');
      setNotifications(data.notifications.slice(0, 10));
      setUnreadCount(data.notifications.filter((n) => !n.read).length);
    } catch {}
  };

  const markAllRead = async () => {
    await api.put('/auth/notifications/read');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isOnDashboard = location.pathname !== '/';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left: Hamburger + Logo */}
        <div className="navbar-left">
          {isOnDashboard && isAuthenticated && (
            <button className="nav-hamburger" onClick={onMenuToggle} aria-label="Toggle sidebar">
              <span></span><span></span><span></span>
            </button>
          )}
          <Link to="/" className="navbar-brand">
            <div className="brand-icon"><Building size={24} color="var(--saffron-400)" /></div>
            <div className="brand-text">
              <span className="brand-name">GrievanceAI</span>
              <span className="brand-sub">Tamil Nadu Govt</span>
            </div>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right">
          {/* Language Toggle */}
          <button className="lang-toggle" onClick={toggleLang} title="Switch Language">
            <span className="lang-flag"><Globe size={18} /></span>
            <span className="lang-label">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="icon-btn notif-btn"
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); markAllRead(); }}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown animate-fade-down">
                    <div className="notif-header">
                      <span>Notifications</span>
                      <span className="notif-count">{notifications.length}</span>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className={`notif-item ${n.read ? '' : 'unread'} notif-${n.type}`}>
                            <div className="notif-icon">
                              {n.type === 'success' ? <CheckCircle size={16} /> : n.type === 'error' ? <XCircle size={16} /> : n.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="notif-content">
                              <p className="notif-msg">{n.message}</p>
                              <span className="notif-time">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="profile-wrapper" ref={profileRef}>
                <button className="profile-btn" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}>
                  <div className="profile-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="profile-name">{user?.name?.split(' ')[0]}</span>
                  <span className="profile-caret"><ChevronDown size={16} /></span>
                </button>
                {profileOpen && (
                  <div className="profile-dropdown animate-fade-down">
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar-lg">{user?.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="profile-full-name">{user?.name}</div>
                        <div className="profile-email">{user?.email}</div>
                        <span className="badge badge-under-review" style={{ fontSize: '0.7rem' }}>{user?.role}</span>
                      </div>
                    </div>
                    <div className="profile-dropdown-menu">
                      <Link to="/dashboard" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <BarChart3 size={16} /> {t('nav.dashboard')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                          <Shield size={16} /> {t('nav.admin')}
                        </Link>
                      )}
                      {user?.role === 'department_officer' && (
                        <Link to="/department" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                          <Building size={16} /> {t('nav.department')}
                        </Link>
                      )}
                      <Link to="/submit" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <PenTool size={16} /> {t('nav.submit')}
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item danger" onClick={handleLogout}>
                        <LogOut size={16} /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-saffron btn-sm">{t('nav.register')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
