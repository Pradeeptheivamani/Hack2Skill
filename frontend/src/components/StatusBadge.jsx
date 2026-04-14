/**
 * StatusBadge.jsx — Dynamic status and priority badges
 */

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const statusMap = {
    submitted:    { class: 'badge-submitted',    label: 'Submitted',    icon: '📤' },
    under_review: { class: 'badge-under-review', label: 'Under Review', icon: '🔍' },
    in_progress:  { class: 'badge-in-progress',  label: 'In Progress',  icon: '⚙️' },
    resolved:     { class: 'badge-resolved',     label: 'Resolved',     icon: '✅' },
    rejected:     { class: 'badge-rejected',     label: 'Rejected',     icon: '❌' },
    escalated:    { class: 'badge-escalated',    label: 'Escalated',    icon: '🔺' },
  };

  const priorityMap = {
    high:   { class: 'badge-high',   label: 'High',   icon: '🔴' },
    medium: { class: 'badge-medium', label: 'Medium', icon: '🟡' },
    low:    { class: 'badge-low',    label: 'Low',    icon: '🟢' },
  };

  const map = type === 'priority' ? priorityMap : statusMap;
  const item = map[status] || { class: '', label: status, icon: '⚪' };

  return (
    <span className={`badge ${item.class}`}>
      <span>{item.icon}</span>
      {item.label}
    </span>
  );
}
