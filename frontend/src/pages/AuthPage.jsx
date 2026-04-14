/**
 * AuthPage.jsx — Login and Register with premium UI
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './AuthPage.css';

export default function AuthPage({ mode = 'login' }) {
  const { login, register }   = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate               = useNavigate();

  const isLogin = mode === 'login';

  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', preferredLanguage: 'en' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await login(form.email, form.password)
        : await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, preferredLanguage: form.preferredLanguage });

      // Redirect based on role
      const role = data.user?.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'department_officer') navigate('/department');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || (isLogin ? 'Invalid credentials.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        className="auth-card-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-logo">🏛️</div>
            <h1 className="auth-hero-title font-display">
              AI Grievance Management System
            </h1>
          <p className="auth-hero-sub">
            Empowering citizens with transparent, AI-powered government grievance redressal.
          </p>

          <div className="auth-features">
            {[
              { icon: '🤖', text: 'AI-powered complaint classification' },
              { icon: '⚡', text: 'Real-time status notifications' },
              { icon: '🗺️', text: 'Location-based complaint mapping' },
              { icon: '🌐', text: 'Tamil & English multilingual support' },
            ].map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          </div>
        </div>


      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          {/* Lang toggle */}
          <div className="auth-lang">
            <button className="lang-toggle" onClick={toggleLang}>
              {lang === 'en' ? '🇮🇳 தமிழ்' : '🇬🇧 English'}
            </button>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-title font-display">
              {isLogin ? t('auth.login_title') : t('auth.register_title')}
            </h2>
            <p className="auth-subtitle">
              {isLogin ? t('auth.login_subtitle') : t('auth.register_subtitle')}
            </p>
          </div>

          {error && (
            <div className="auth-error animate-fade-down">
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">{t('auth.name')}</label>
                <input
                  name="name" type="text"
                  className="form-control"
                  placeholder="e.g. Arjun Krishnaswamy"
                  value={form.name} onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                name="email" type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">{t('auth.phone')}</label>
                <input
                  name="phone" type="tel"
                  className="form-control"
                  placeholder="9876543210"
                  value={form.phone} onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <div className="password-wrapper">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={form.password} onChange={handleChange}
                  required minLength={6}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">{t('auth.confirm_password')}</label>
                  <input
                    name="confirmPassword" type="password"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={form.confirmPassword} onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('auth.lang_pref')}</label>
                  <select name="preferredLanguage" className="form-control" value={form.preferredLanguage} onChange={handleChange}>
                    <option value="en">English</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn auth-submit-btn w-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> {t('common.loading')}</>
              ) : (
                isLogin ? t('auth.login_btn') : t('auth.register_btn')
              )}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? (
              <>{t('auth.no_account')} <Link to="/register" className="auth-link">{t('auth.register_btn')}</Link></>
            ) : (
              <>{t('auth.have_account')} <Link to="/login" className="auth-link">{t('auth.login_btn')}</Link></>
            )}
          </div>

          {/* Demo credentials */}
          <div className="demo-creds">
            <div className="demo-creds-title">🧪 Demo Credentials</div>
            <div className="demo-grid">
              <div className="demo-item">
                <strong>Admin:</strong> admin@grievance.gov.in / admin123
              </div>
              <div className="demo-item">
                <strong>Citizen:</strong> Register a new account
              </div>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
