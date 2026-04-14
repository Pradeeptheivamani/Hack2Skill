/**
 * StatCard.jsx — Animated statistics card for dashboards
 */

import { useEffect, useRef, useState } from 'react';
import './StatCard.css';

// Animated counter hook
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

export default function StatCard({ title, value, icon, color, change, suffix = '', prefix = '', loading }) {
  const count = useCounter(loading ? 0 : Number(value) || 0);

  return (
    <div className={`stat-card animate-fade-up`} style={{ '--card-color': color }}>
      <div className="stat-card-top">
        <div>
          <p className="stat-card-title">{title}</p>
          <div className="stat-card-value">
            {prefix}
            {loading ? <div className="skeleton" style={{ width: 60, height: 36, display: 'inline-block' }}></div> : count}
            {suffix}
          </div>
          {change !== undefined && (
            <p className={`stat-card-change ${change >= 0 ? 'up' : 'down'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className="stat-card-icon">
          {icon}
        </div>
      </div>
      <div className="stat-card-bar">
        <div className="stat-card-bar-fill" />
      </div>
    </div>
  );
}
