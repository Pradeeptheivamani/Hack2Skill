/**
 * ComplaintCard.jsx — Card for displaying complaint summaries
 */

import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './ComplaintCard.css';

const CATEGORY_ICONS = {
  road: '🛣️', water: '💧', electricity: '⚡', health: '🏥',
  education: '📚', police: '👮', municipal: '🏙️', revenue: '📋', other: '📄',
};

export default function ComplaintCard({ complaint, showUser = false }) {
  const {
    _id, trackingId, title, category, priority, status,
    department, createdAt, slaDeadline, slaBreached, user,
  } = complaint;

  const daysAgo = Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  const slaLeft  = slaDeadline
    ? Math.ceil((new Date(slaDeadline) - Date.now()) / (1000 * 60 * 60))
    : null;

  return (
    <div className={`complaint-card ${slaBreached ? 'sla-breached' : ''}`}>
      {slaBreached && <div className="sla-breach-banner">⚠️ SLA Breached</div>}

      <div className="complaint-card-header">
        <div className="complaint-cat-icon">{CATEGORY_ICONS[category] || '📄'}</div>
        <div className="complaint-meta">
          <h3 className="complaint-title truncate" title={title}>{title}</h3>
          <div className="complaint-id-row">
            <code className="tracking-id">{trackingId}</code>
            {showUser && user && (
              <span className="complaint-user">• {user.name}</span>
            )}
          </div>
        </div>
      </div>

      <div className="complaint-card-body">
        <div className="complaint-badges">
          <StatusBadge status={status} type="status" />
          <StatusBadge status={priority} type="priority" />
        </div>

        <div className="complaint-info-row">
          {department && (
            <span className="complaint-dept" style={{ background: `${department.color}18`, color: department.color }}>
              {department.icon} {department.name}
            </span>
          )}
        </div>

        <div className="complaint-footer">
          <span className="complaint-date">
            📅 {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
          </span>
          {slaLeft !== null && status !== 'resolved' && (
            <span className={`sla-timer ${slaLeft <= 0 ? 'breached' : slaLeft <= 6 ? 'warning' : ''}`}>
              ⏱️ {slaLeft <= 0 ? 'Overdue' : `${slaLeft}h left`}
            </span>
          )}
          <Link to={`/complaints/${_id}`} className="view-btn">View →</Link>
        </div>
      </div>
    </div>
  );
}
