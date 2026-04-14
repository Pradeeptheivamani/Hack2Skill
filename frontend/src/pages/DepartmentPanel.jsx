/**
 * DepartmentPanel.jsx — Department officer complaint management panel
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import './DepartmentPanel.css';

const STATUS_OPTIONS = [
  { value: 'under_review', label: '🔍 Mark Under Review' },
  { value: 'in_progress',  label: '⚙️ Mark In Progress' },
  { value: 'resolved',     label: '✅ Mark Resolved' },
  { value: 'rejected',     label: '❌ Reject Complaint' },
  { value: 'escalated',    label: '🔺 Escalate' },
];

export default function DepartmentPanel() {
  const { user } = useAuth();
  const { on }   = useSocket();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats]           = useState({ pending: 0, inProgress: 0, resolved: 0, highPriority: 0, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [statusFilter, setSFilter]  = useState('all');
  const [priorityFilter, setPFilter]= useState('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Update modal state
  const [updating, setUpdating]     = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', note: '' });
  const [newAlert, setNewAlert]     = useState(null);

  useEffect(() => { fetchComplaints(); }, [statusFilter, priorityFilter, page]);

  // Real-time new assignment notification
  useEffect(() => {
    const cleanup = on('new_assignment', ({ trackingId, priority }) => {
      setNewAlert({ trackingId, priority });
      setTimeout(() => setNewAlert(null), 5000);
      fetchComplaints();
    });
    return cleanup;
  }, [on]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter !== 'all')   params.status   = statusFilter;
      if (priorityFilter !== 'all') params.priority  = priorityFilter;
      const { data } = await api.get('/departments/my-complaints', { params });
      setComplaints(data.complaints);
      setStats(data.stats);
      setTotalPages(data.pagination?.pages || 1);
    } catch {}
    setLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!updateForm.status) return;
    setUpdating(true);
    try {
      await api.put(`/departments/complaints/${selected._id}/status`, updateForm);
      setSelected(null);
      setUpdateForm({ status: '', note: '' });
      fetchComplaints();
    } catch {}
    setUpdating(false);
  };

  // SLA timer display
  const getSlaDisplay = (slaDeadline, status) => {
    if (!slaDeadline || status === 'resolved') return null;
    const hoursLeft = Math.ceil((new Date(slaDeadline) - Date.now()) / (1000 * 60 * 60));
    if (hoursLeft <= 0) return { text: 'OVERDUE', color: 'var(--error)' };
    if (hoursLeft <= 6) return { text: `${hoursLeft}h left`, color: 'var(--warning)' };
    return { text: `${hoursLeft}h left`, color: 'var(--success)' };
  };

  const CATEGORY_ICONS = {
    road: '🛣️', water: '💧', electricity: '⚡', health: '🏥',
    education: '📚', police: '👮', municipal: '🏙️', revenue: '📋', other: '📄',
  };

  return (
    <div className="dept-panel">
      {/* New complaint alert */}
      {newAlert && (
        <div className="dept-alert animate-fade-down">
          🔔 New complaint assigned: <strong>{newAlert.trackingId}</strong> —
          <StatusBadge status={newAlert.priority} type="priority" />
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            🏢 Department Panel
          </h1>
          <p className="page-subtitle">
            {user?.department?.name ? `Managing complaints for ${user.department.name}` : 'Manage assigned complaints'}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchComplaints}>⟳ Refresh</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Assigned"  value={stats.total}       icon="📋" color="var(--navy-500)"  loading={loading} />
        <StatCard title="Pending"         value={stats.pending}      icon="⏳" color="var(--warning)"   loading={loading} />
        <StatCard title="In Progress"     value={stats.inProgress}   icon="⚙️" color="var(--info)"      loading={loading} />
        <StatCard title="Resolved"        value={stats.resolved}     icon="✅" color="var(--success)"   loading={loading} />
        <StatCard title="High Priority"   value={stats.highPriority} icon="🔴" color="var(--error)"     loading={loading} />
      </div>

      {/* Filters */}
      <div className="dept-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              {['all','submitted','under_review','in_progress','resolved'].map((s) => (
                <button
                  key={s}
                  className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => { setSFilter(s); setPage(1); }}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <div className="filter-chips">
              {['all','high','medium','low'].map((p) => (
                <button
                  key={p}
                  className={`filter-chip priority-chip ${priorityFilter === p ? 'active' : ''} ${p !== 'all' ? `chip-${p}` : ''}`}
                  onClick={() => { setPFilter(p); setPage(1); }}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No complaints assigned</div>
        </div>
      ) : (
        <>
          <div className="dept-complaints-grid">
            {complaints.map((c, i) => {
              const sla = getSlaDisplay(c.slaDeadline, c.status);
              return (
                <div
                  key={c._id}
                  className={`dept-complaint-card animate-fade-up ${c.slaBreached ? 'breached' : ''}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="dcc-header">
                    <div className="dcc-icon">{CATEGORY_ICONS[c.category] || '📄'}</div>
                    <div className="dcc-meta">
                      <div className="dcc-title" title={c.title}>{c.title}</div>
                      <code className="tracking-id">{c.trackingId}</code>
                    </div>
                    {sla && (
                      <div className="sla-badge" style={{ color: sla.color, borderColor: sla.color }}>
                        ⏱️ {sla.text}
                      </div>
                    )}
                  </div>

                  <div className="dcc-body">
                    <p className="dcc-desc">{c.description.substring(0, 100)}...</p>
                    <div className="dcc-badges">
                      <StatusBadge status={c.status} />
                      <StatusBadge status={c.priority} type="priority" />
                    </div>
                    {c.location?.address && (
                      <div className="dcc-location">
                        📍 {c.location.address}, {c.location.district}
                      </div>
                    )}
                  </div>

                  <div className="dcc-footer">
                    <span className="dcc-date">📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                    <div className="dcc-actions">
                      {c.user && !c.isAnonymous && (
                        <span className="dcc-user">👤 {c.user.name}</span>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSelected(c); setUpdateForm({ status: c.status, note: '' }); }}
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <span className="page-info">Page {page} / {totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Status Update Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy-600)' }}>
                ⚙️ Update Complaint Status
              </h3>
              <button className="btn-ghost" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="complaint-modal-info">
                <div><span className="review-label">Tracking ID</span><code className="tracking-id">{selected.trackingId}</code></div>
                <div><span className="review-label">Current Status</span><StatusBadge status={selected.status} /></div>
                <div><span className="review-label">Title</span><span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selected.title}</span></div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">New Status</label>
                <div className="status-options">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className={`status-option ${updateForm.status === s.value ? 'selected' : ''}`}
                      onClick={() => setUpdateForm((p) => ({ ...p, status: s.value }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Note <span className="form-hint">(optional)</span></label>
                <textarea
                  className="form-control"
                  placeholder="Add a note about the action taken..."
                  value={updateForm.note}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, note: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleStatusUpdate}
                disabled={!updateForm.status || updating}
              >
                {updating ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Updating...</> : '✅ Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
