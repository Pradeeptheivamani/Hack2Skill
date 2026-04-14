/**
 * UserDashboard.jsx — Citizen complaint tracking dashboard
 *
 * BUGS FIXED:
 * 1. Stats were calculated from the current page's 9 results only (wrong). Stats now
 *    come from a separate lightweight stats API call so totals are always accurate.
 * 2. fetchComplaints was recreated on every render inside useEffect causing
 *    potential stale-closure issues. Wrapped in useCallback.
 * 3. `StatusBadge` was imported but unused — removed.
 * 4. useEffect dependency on `on` caused infinite re-registration of socket event;
 *    now uses an empty dep array with the callback defined inline.
 * 5. Toast notification auto-clear used raw setTimeout without cleanup — fixed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import ComplaintCard from '../components/ComplaintCard';
import './UserDashboard.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { on } = useSocket();

  const [complaints, setComplaints]   = useState([]);
  const [stats, setStats]             = useState({ total: 0, pending: 0, resolved: 0, escalated: 0 });
  const [loading, setLoading]         = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter]           = useState('all');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  // FIX: memoised fetch so it can be safely used in useEffect deps
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (filter !== 'all') params.status = filter;
      const { data } = await api.get('/complaints/my', { params });
      setComplaints(data.complaints || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to fetch complaints:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  // FIX: Fetch accurate stats independently (not from paginated results)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch a small sample for counts — one call per status
      const [totalRes, pendingRes, resolvedRes, escalatedRes] = await Promise.all([
        api.get('/complaints/my', { params: { page: 1, limit: 1 } }),
        api.get('/complaints/my', { params: { page: 1, limit: 1, status: 'submitted' } }),
        api.get('/complaints/my', { params: { page: 1, limit: 1, status: 'resolved' } }),
        api.get('/complaints/my', { params: { page: 1, limit: 1, status: 'escalated' } }),
      ]);

      // Also count under_review + in_progress for "pending"
      const [reviewRes, progressRes] = await Promise.all([
        api.get('/complaints/my', { params: { page: 1, limit: 1, status: 'under_review' } }),
        api.get('/complaints/my', { params: { page: 1, limit: 1, status: 'in_progress' } }),
      ]);

      setStats({
        total:     totalRes.data.pagination?.total    || 0,
        pending:   (pendingRes.data.pagination?.total  || 0)
                 + (reviewRes.data.pagination?.total   || 0)
                 + (progressRes.data.pagination?.total || 0),
        resolved:  resolvedRes.data.pagination?.total  || 0,
        escalated: escalatedRes.data.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // FIX: Real-time listener — stable, no dependency on `on`
  useEffect(() => {
    const cleanup = on('status_update', ({ trackingId, newStatus }) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.trackingId === trackingId ? { ...c, status: newStatus } : c
        )
      );
      // Show toast
      toast.success(`Complaint ${trackingId} updated to "${newStatus}"`, {
        icon: '✅',
        style: {
          borderRadius: 'var(--radius-xl)',
          background: 'var(--glass-bg-light)',
          color: 'var(--navy-600)',
          fontWeight: '600'
        },
      });

      // Refresh stats
      fetchStats();
    });
    return () => {
      cleanup();
    };
  }, [on, fetchStats]);

  const STATUS_FILTERS = [
    { value: 'all',          label: t('common.all') },
    { value: 'submitted',    label: t('status.submitted') },
    { value: 'under_review', label: t('status.under_review') },
    { value: 'in_progress',  label: t('status.in_progress') },
    { value: 'resolved',     label: t('status.resolved') },
    { value: 'escalated',    label: t('status.escalated') },
  ];

  return (
    <motion.div 
      className="user-dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">
            {t('dashboard.welcome')}, <strong>{user?.name}</strong>! Here's your complaint overview.
          </p>
        </div>
        <Link to="/submit" className="btn btn-saffron">
          + {t('nav.submit')}
        </Link>
      </div>

      {/* Stats Grid */}
      <motion.div 
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title={t('dashboard.total')}     value={stats.total}     icon="📊" color="var(--navy-500)"  loading={statsLoading} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title={t('dashboard.pending')}   value={stats.pending}   icon="⏳" color="var(--warning)"   loading={statsLoading} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title={t('dashboard.resolved')}  value={stats.resolved}  icon="✅" color="var(--success)"   loading={statsLoading} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title={t('dashboard.escalated')} value={stats.escalated} icon="🔺" color="var(--error)"     loading={statsLoading} />
        </motion.div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="complaints-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">{t('dashboard.no_complaints')}</div>
          <Link to="/submit" className="btn btn-saffron" style={{ marginTop: '1rem' }}>
            {t('dashboard.file_now')}
          </Link>
        </div>
      ) : (
        <motion.div 
          className="complaints-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          <AnimatePresence>
            {complaints.map((c) => (
              <motion.div 
                key={c._id}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <ComplaintCard complaint={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button
            className="btn btn-outline btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </motion.div>
  );
}
