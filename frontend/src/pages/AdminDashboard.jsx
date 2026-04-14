/**
 * AdminDashboard.jsx — Full analytics and complaint management panel
 */

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import { ComplaintsByCategory, ComplaintTrend, StatusPieChart, PriorityChart } from '../components/ChartWidgets';
import './AdminDashboard.css';

const TABS = ['📊 Overview', '📋 Complaints', '🗺️ Map View', '👥 Users'];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { on } = useSocket();

  const [activeTab, setActiveTab]     = useState(0);
  const [analytics, setAnalytics]     = useState(null);
  const [complaints, setComplaints]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers]             = useState([]);
  const [mapData, setMapData]         = useState([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [assignModal, setAssignModal] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [newComplaints, setNewComplaints] = useState(0);

  useEffect(() => {
    fetchAnalytics();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === 1) fetchComplaints();
    if (activeTab === 2) fetchMapData();
    if (activeTab === 3) fetchUsers();
  }, [activeTab, filters, page]);

  // Real-time new complaint notifications
  useEffect(() => {
    const cleanup = on('new_complaint', () => {
      setNewComplaints((p) => p + 1);
    });
    return cleanup;
  }, [on]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data.analytics);
    } catch {}
    setLoading(false);
  };

  const fetchComplaints = async () => {
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await api.get('/admin/complaints', { params });
      setComplaints(data.complaints);
      setTotalPages(data.pagination.pages || 1);
    } catch {}
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.departments);
    } catch {}
  };

  const fetchMapData = async () => {
    try {
      const { data } = await api.get('/admin/map-data');
      setMapData(data.complaints);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {}
  };

  const handleAssign = async () => {
    if (!selectedDept) return;
    try {
      await api.put(`/admin/complaints/${assignModal._id}/assign`, { departmentId: selectedDept });
      setAssignModal(null);
      fetchComplaints();
      fetchAnalytics();
    } catch {}
  };

  const handleRefresh = () => {
    fetchAnalytics();
    setNewComplaints(0);
  };

  const ov = analytics?.overview;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">🛡️ Admin Dashboard</h1>
          <p className="page-subtitle">System-wide complaint management and analytics</p>
        </div>
        <div className="admin-header-actions">
          {newComplaints > 0 && (
            <div className="new-alert animate-fade-down" onClick={handleRefresh}>
              🔔 {newComplaints} new complaint{newComplaints > 1 ? 's' : ''}! Click to refresh
            </div>
          )}
          <button className="btn btn-outline btn-sm" onClick={handleRefresh}>⟳ Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((tab, i) => (
          <button
            key={i}
            className={`admin-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Overview ── */}
      {activeTab === 0 && (
        <div className="animate-fade-up">
          {/* Stats */}
          <div className="stats-grid">
            <StatCard title="Total Complaints" value={ov?.totalComplaints  || 0} icon="📊" color="var(--navy-500)"  loading={loading} />
            <StatCard title="Resolved"          value={ov?.resolvedComplaints||0} icon="✅" color="var(--success)"   loading={loading} />
            <StatCard title="Pending"           value={ov?.pendingComplaints ||0} icon="⏳" color="var(--warning)"   loading={loading} />
            <StatCard title="High Priority"     value={ov?.highPriority     ||0} icon="🔴" color="var(--error)"     loading={loading} />
            <StatCard title="SLA Breached"      value={ov?.slaBreached      ||0} icon="⚠️" color="#8b5cf6"          loading={loading} />
            <StatCard title="Citizens"          value={ov?.totalUsers       ||0} icon="👥" color="var(--info)"      loading={loading} />
            <StatCard title="Resolution Rate"   value={ov?.resolutionRate   ||0} icon="📈" color="var(--success)"   loading={loading} suffix="%" />
            <StatCard title="Escalated"         value={ov?.escalatedComplaints||0}icon="🔺" color="#f59e0b"         loading={loading} />
          </div>

          {/* Charts row */}
          {analytics && (
            <div className="charts-grid">
              <div className="chart-card card">
                <div className="card-header">
                  <h3 className="chart-title">📊 Complaints by Category</h3>
                </div>
                <div className="card-body">
                  <ComplaintsByCategory data={analytics.byCategory} />
                </div>
              </div>

              <div className="chart-card card">
                <div className="card-header">
                  <h3 className="chart-title">🟡 Status Distribution</h3>
                </div>
                <div className="card-body">
                  <StatusPieChart data={analytics.byStatus} />
                </div>
              </div>

              <div className="chart-card card span-2">
                <div className="card-header">
                  <h3 className="chart-title">📈 30-Day Trend</h3>
                </div>
                <div className="card-body">
                  <ComplaintTrend data={analytics.trend} />
                </div>
              </div>

              <div className="chart-card card">
                <div className="card-header">
                  <h3 className="chart-title">🔴 Priority Breakdown</h3>
                </div>
                <div className="card-body">
                  <PriorityChart data={analytics.byPriority} />
                </div>
              </div>

              {/* Department Performance */}
              <div className="chart-card card">
                <div className="card-header">
                  <h3 className="chart-title">🏛️ Department Performance</h3>
                </div>
                <div className="card-body">
                  <div className="dept-perf-list">
                    {analytics.deptPerformance.map((d) => {
                      const total = d.stats.totalAssigned || 1;
                      const pct   = Math.round((d.stats.totalResolved / total) * 100);
                      return (
                        <div key={d._id} className="dept-perf-item">
                          <span className="dept-perf-icon">{d.icon}</span>
                          <div className="dept-perf-info">
                            <div className="dept-perf-name">{d.name}</div>
                            <div className="progress" style={{ marginTop: 6 }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, background: d.color }} />
                            </div>
                          </div>
                          <div className="dept-perf-stats">
                            <span className="dept-stat-green">{d.stats.totalResolved}</span>
                            <span className="dept-stat-sep">/</span>
                            <span>{d.stats.totalAssigned}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 1: Complaints ── */}
      {activeTab === 1 && (
        <div className="animate-fade-up">
          {/* Filters */}
          <div className="admin-filters card">
            <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
              <div className="filters-row">
                <div className="search-box">
                  <span>🔍</span>
                  <input
                    className="search-input"
                    placeholder="Search by ID or title..."
                    value={filters.search}
                    onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <select className="filter-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select className="filter-select" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select className="filter-select" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">All Categories</option>
                  {['road','water','electricity','health','education','police','municipal','revenue','other'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); fetchComplaints(); }}>
                  Apply
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status:'', priority:'', category:'', search:'' })}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>No complaints found</td></tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id}>
                      <td><code className="tracking-id">{c.trackingId}</code></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.title}>{c.title}</td>
                      <td><span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--navy-500)' }}>{c.category}</span></td>
                      <td><StatusBadge status={c.priority} type="priority" /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.department ? <span style={{ fontSize: '0.82rem' }}>{c.department.icon} {c.department.name}</span> : <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Unassigned</span>}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setAssignModal(c); setSelectedDept(c.department?._id || ''); }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <span className="page-info">Page {page} / {totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Map View ── */}
      {activeTab === 2 && (
        <div className="animate-fade-up">
          <div className="map-info-bar">
            <span>📍 Showing {mapData.length} geotagged complaints</span>
            <div className="map-legend">
              <span className="legend-dot" style={{ background: '#ef4444' }}></span> High
              <span className="legend-dot" style={{ background: '#f59e0b' }}></span> Medium
              <span className="legend-dot" style={{ background: '#10b981' }}></span> Low
            </div>
          </div>
          <MapView complaints={mapData} height="520px" />
        </div>
      )}

      {/* ── Tab 3: Users ── */}
      {activeTab === 3 && (
        <div className="animate-fade-up">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>{u.email}</td>
                    <td style={{ fontSize: '0.82rem' }}>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-escalated' : u.role === 'department_officer' ? 'badge-in-progress' : 'badge-submitted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{u.department?.name || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Assign Department Modal ── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy-600)' }}>
                🏛️ Assign Department
              </h3>
              <button className="btn-ghost" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                Assigning complaint: <strong>{assignModal.trackingId}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Select Department</label>
                <select
                  className="form-control"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedDept}>
                ✅ Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
