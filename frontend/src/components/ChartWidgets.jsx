/**
 * ChartWidgets.jsx — Recharts-based analytics charts
 */

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1e3a5f', '#ff9f1c', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#f59e0b', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
    }}>
      {label && <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4, fontSize: '0.82rem' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.82rem', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Bar Chart
export function ComplaintsByCategory({ data }) {
  const formatted = data.map((d) => ({ name: d._id.toUpperCase(), count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]}>
          {formatted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Line/Area Chart for trend
export function ComplaintTrend({ data }) {
  const formatted = data.map((d) => ({
    date: d._id?.slice(5) || d._id,
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1e3a5f" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="count" name="Complaints"
          stroke="#1e3a5f" strokeWidth={2.5}
          fill="url(#trendGrad)" dot={{ r: 4, fill: '#1e3a5f', strokeWidth: 2, stroke: 'white' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Pie Chart for status distribution
export function StatusPieChart({ data }) {
  const STATUS_COLORS = {
    submitted: '#6366f1', under_review: '#3b82f6', in_progress: '#f59e0b',
    resolved: '#10b981', rejected: '#ef4444', escalated: '#8b5cf6',
  };
  const formatted = data.map((d) => ({
    name: d._id.replace('_', ' ').toUpperCase(),
    value: d.count,
    color: STATUS_COLORS[d._id] || '#9ca3af',
  }));

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={formatted} cx="50%" cy="50%" outerRadius={100}
          dataKey="value" labelLine={false} label={renderLabel}>
          {formatted.map((d, i) => (
            <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Priority Bar Chart
export function PriorityChart({ data }) {
  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const formatted = data.map((d) => ({
    name: d._id.toUpperCase(),
    value: d.count,
    color: PRIORITY_COLORS[d._id] || '#9ca3af',
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]}>
          {formatted.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
