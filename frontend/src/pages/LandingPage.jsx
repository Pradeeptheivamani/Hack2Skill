/**
 * LandingPage.jsx — Premium government landing page with hero, features, steps, CTA
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Activity, Clock, MapPin, Globe, Bell, PenTool, CheckCircle, Building, Search, BarChart3, Users, Zap, Star, Shield, Droplets, HeartPulse, GraduationCap, Scale, Briefcase } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

// Animated counter
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        let start = Date.now();
        const duration = 1800;
        const step = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          setCount(Math.round(ease * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [trackId, setTrackId] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) navigate(`/track/${trackId.trim()}`);
  };

  // Particle canvas effect
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.4 + 0.1,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,80,${p.o})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  const FEATURES = [
    { icon: <Cpu size={28} />, key: 'feature_ai', labelKey: 'landing.feature_ai', descKey: 'landing.feature_ai_desc' },
    { icon: <Activity size={28} />, key: 'feature_track', labelKey: 'landing.feature_track', descKey: 'landing.feature_track_desc' },
    { icon: <Clock size={28} />, key: 'feature_sla', labelKey: 'landing.feature_sla', descKey: 'landing.feature_sla_desc' },
    { icon: <MapPin size={28} />, key: 'feature_map', labelKey: 'landing.feature_map', descKey: 'landing.feature_map_desc' },
    { icon: <Globe size={28} />, key: 'feature_multi', labelKey: 'landing.feature_multi', descKey: 'landing.feature_multi_desc' },
    { icon: <Bell size={28} />, key: 'feature_notify', labelKey: 'landing.feature_notify', descKey: 'landing.feature_notify_desc' },
  ];

  const STEPS = [
    { num: '01', icon: <PenTool size={24} />, titleKey: 'landing.step1_title', descKey: 'landing.step1_desc', color: '#1e3a5f' },
    { num: '02', icon: <Cpu size={24} />, titleKey: 'landing.step2_title', descKey: 'landing.step2_desc', color: '#ff9f1c' },
    { num: '03', icon: <Activity size={24} />, titleKey: 'landing.step3_title', descKey: 'landing.step3_desc', color: '#10b981' },
    { num: '04', icon: <CheckCircle size={24} />, titleKey: 'landing.step4_title', descKey: 'landing.step4_desc', color: '#8b5cf6' },
  ];

  return (
    <motion.div 
      className="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ── Hero Section ── */}
      <section className="hero">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-overlay" />

        <div className="hero-content container animate-fade-up">
          <div className="hero-badge animate-fade-down">
            <span className="hero-badge-dot"></span>
            <Building size={16} /> <span style={{ marginLeft: '4px' }}>{t('landing.hero_badge')}</span>
          </div>

          <h1 className="hero-title font-display">
            {t('landing.hero_title')}<br />
            <span className="hero-title-accent">{t('landing.hero_title_accent')}</span>
          </h1>

          <p className="hero-subtitle animate-fade-up delay-200">
            {t('landing.hero_subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="hero-buttons animate-fade-up delay-300">
            <Link
              to={isAuthenticated ? '/submit' : '/register'}
              className="btn btn-saffron btn-xl"
            >
              <PenTool size={20} /> {t('landing.hero_cta')}
            </Link>
            <Link to="/login" className="btn btn-outline-white btn-xl">
              <Search size={20} /> {t('landing.hero_track')}
            </Link>
          </div>

          {/* Track Complaint inline */}
          <form className="hero-track-form animate-fade-up delay-400" onSubmit={handleTrack}>
            <div className="hero-track-inner">
              <span className="hero-track-icon"><Search size={20} /></span>
              <input
                type="text"
                className="hero-track-input"
                placeholder="Enter Tracking ID (e.g. GRV-123456-AB12)"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Track</button>
            </div>
          </form>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll">
          <div className="scroll-line"></div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="stats-band">
        <div className="container">
          <div className="stats-row">
            {[
              { value: 48250, label: t('landing.stats_complaints'), suffix: '+', icon: <BarChart3 size={24} /> },
              { value: 8,     label: t('landing.stats_departments'), suffix: '',  icon: <Building size={24} /> },
              { value: 36,    label: t('landing.stats_hours'),       suffix: 'h', icon: <Zap size={24} /> },
              { value: 94,    label: t('landing.stats_satisfaction'), suffix: '%', icon: <Star size={24} /> },
            ].map((s, i) => (
              <div key={i} className="stat-item animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-num">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header animate-fade-up">
            <span className="section-tag">✨ FEATURES</span>
            <h2 className="section-title font-display">{t('landing.features_title')}</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.key} className="feature-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{t(f.labelKey)}</h3>
                <p className="feature-desc">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">📌 PROCESS</span>
            <h2 className="section-title font-display">{t('landing.steps_title')}</h2>
          </div>
          <div className="steps-row">
            {STEPS.map((step, i) => (
              <div key={i} className="step-item animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-num" style={{ background: step.color }}>{step.num}</div>
                <div className="step-connector" style={{ display: i < STEPS.length - 1 ? 'block' : 'none' }} />
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{t(step.titleKey)}</h3>
                <p className="step-desc">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Departments ── */}
      <section className="departments-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag"><Building size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'4px'}}/> DEPARTMENTS</span>
            <h2 className="section-title font-display">8 Government Departments</h2>
          </div>
          <div className="dept-grid">
            {[
              { icon: <MapPin size={32} />, name: 'Roads & Infrastructure', code: 'ROAD', color: '#e67e22' },
              { icon: <Droplets size={32} />, name: 'Water & Sanitation',    code: 'WATER', color: '#2980b9' },
              { icon: <Zap size={32} />, name: 'Electricity & Power',   code: 'ELECT', color: '#f39c12' },
              { icon: <HeartPulse size={32} />, name: 'Health & Medical',      code: 'HLTH',  color: '#27ae60' },
              { icon: <GraduationCap size={32} />, name: 'Education',             code: 'EDUC',  color: '#16a085' },
              { icon: <Shield size={32} />, name: 'Police & Law',          code: 'PLCE',  color: '#2c3e50' },
              { icon: <Building size={32} />, name: 'Municipal Corporation', code: 'MUNC',  color: '#1abc9c' },
              { icon: <Briefcase size={32} />, name: 'Revenue & Land',        code: 'RVNU',  color: '#8e44ad' },
            ].map((d, i) => (
              <div key={i} className="dept-card animate-fade-up" style={{ '--dept-color': d.color, animationDelay: `${i * 0.06}s` }}>
                <div className="dept-card-icon">{d.icon}</div>
                <div className="dept-card-name">{d.name}</div>
                <div className="dept-card-code">{d.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="container cta-content animate-fade-up">
          <div className="cta-icon"><Shield size={48} color="white" /></div>
          <h2 className="cta-title font-display">{t('landing.cta_title')}</h2>
          <p className="cta-subtitle">{t('landing.cta_subtitle')}</p>
          <Link
            to={isAuthenticated ? '/submit' : '/register'}
            className="btn btn-saffron btn-xl"
          >
            {t('landing.cta_btn')} →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-icon"><Building size={32} color="white" /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>GrievanceAI</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Government of Tamil Nadu</div>
              </div>
            </div>
            <div className="footer-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/track">Track Complaint</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Government of Tamil Nadu · Built for Smart India Hackathon 2024</p>
            <p>Designed with ❤️ for transparent governance</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
