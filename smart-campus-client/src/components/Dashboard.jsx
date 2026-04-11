import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

/* ─── tiny stat card ─────────────────────────────── */
const StatCard = ({ label, value, icon, color, subLabel, delay = 0 }) => (
  <div
    className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Live</span>
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value ?? '—'}</p>
    <p className="text-sm font-semibold text-slate-300">{label}</p>
    {subLabel && <p className="text-xs text-slate-500 mt-0.5">{subLabel}</p>}
  </div>
);

/* ─── custom tooltip ─────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 rounded-xl text-xs text-slate-200 shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ─── Dashboard ──────────────────────────────────── */
const Dashboard = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const [resources, setResources]     = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [tickets, setTickets]         = useState([]);
  const [unread, setUnread]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      try {
        const userId = user.userId;
        const isStaff = isAdmin || isTechnician;

        const [r, b, t, n] = await Promise.all([
          axios.get('/api/resources'),
          // Staff sees all; regular USER sees only their own
          isStaff ? axios.get('/api/bookings') : axios.get(`/api/bookings/user/${userId}`),
          isStaff ? axios.get('/api/tickets')  : axios.get(`/api/tickets/user/${userId}`),
          axios.get(`/api/notifications/user/${userId}/unread`),
        ]);
        setResources(r.data);
        setBookings(b.data);
        setTickets(t.data);
        setUnread(n.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId, isAdmin, isTechnician]);

  /* ── derived stats ── */
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const openTickets     = tickets.filter(t => t.status === 'OPEN').length;

  /* ── chart data ── */
  const resourcePopularity = resources.map(r => ({
    name: r.name?.length > 14 ? r.name.slice(0, 14) + '…' : r.name,
    bookings: bookings.filter(b => b.resource?.resourceId === r.resourceId).length,
  }));

  const ticketStatus = [
    { name: 'Open',        value: tickets.filter(t => t.status === 'OPEN').length,        fill: '#ef4444' },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length,  fill: '#6366f1' },
    { name: 'Resolved',    value: tickets.filter(t => t.status === 'RESOLVED').length,     fill: '#10b981' },
  ].filter(d => d.value > 0);

  const bookingTrend = (() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Build a map: dayName -> { bookings, resolved }
    const map = {};
    dayNames.forEach(d => { map[d] = { bookings: 0, resolved: 0 }; });

    bookings.forEach(b => {
      if (!b.bookingDate) return;
      // Skip rejected / cancelled — they shouldn't appear as activity
      if (b.status === 'REJECTED' || b.status === 'CANCELLED') return;
      const dayIndex = new Date(b.bookingDate).getDay(); // 0=Sun … 6=Sat
      const dayName  = dayNames[dayIndex];
      map[dayName].bookings += 1;
      if (b.status === 'APPROVED' || b.status === 'COMPLETED') {
        map[dayName].resolved += 1;
      }
    });

    // Return Mon–Sun order
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
      day: d,
      bookings: map[d].bookings,
      resolved: map[d].resolved,
    }));
  })();

  /* ── recent bookings ── */
  const recentBookings = [...bookings]
    .sort((a, b) => b.bookingId - a.bookingId)
    .slice(0, 5);

  const statusClass = {
    PENDING:  'badge badge-pending',
    APPROVED: 'badge badge-approved',
    REJECTED: 'badge badge-rejected',
    CANCELLED:'badge badge-rejected',
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => <div key={i} className="shimmer h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Live metrics from your Smart Campus backend</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 stagger">
        <StatCard
          label="Total Resources"
          value={resources.length}
          subLabel={`${resources.filter(r => r.status === 'ACTIVE').length} active`}
          color="#06b6d4"
          delay={50}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Pending Bookings"
          value={pendingBookings}
          subLabel={`${bookings.length} total`}
          color="#f59e0b"
          delay={100}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Open Tickets"
          value={openTickets}
          subLabel={`${tickets.length} total`}
          color="#ef4444"
          delay={150}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M9 12h6M9 16h4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Unread Alerts"
          value={unread.length}
          subLabel="Notifications"
          color="#6366f1"
          delay={200}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart — resource popularity */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Resource Popularity</h2>
          <p className="text-xs text-slate-500 mb-5">Bookings per resource</p>
          {resourcePopularity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No booking data yet</p>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourcePopularity} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie chart — ticket status */}
        <div className="glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Ticket Status</h2>
          <p className="text-xs text-slate-500 mb-5">Current distribution</p>
          {ticketStatus.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No ticket data yet</p>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={4} dataKey="value">
                    {ticketStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Area chart — booking trend */}
      <div className="glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Weekly Activity</h2>
        <p className="text-xs text-slate-500 mb-5">
          {isAdmin ? `All users' bookings across the week` : 'Your bookings across the week'}
        </p>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingTrend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" name="Bookings" />
              <Area type="monotone" dataKey="resolved" stroke="#06b6d4" strokeWidth={2} fill="url(#grad2)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Recent Bookings</h2>
            <p className="text-xs text-slate-500">Latest booking requests</p>
          </div>
          <a href="/dashboard/bookings" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">View all →</a>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Resource</th><th>Date</th><th>Time</th><th>Purpose</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.bookingId}>
                    <td className="text-slate-500">#{b.bookingId}</td>
                    <td className="text-white font-medium">{b.resource?.name ?? '—'}</td>
                    <td>{b.bookingDate ?? '—'}</td>
                    <td className="text-slate-400">{b.startTime?.slice(0,5)} – {b.endTime?.slice(0,5)}</td>
                    <td className="text-slate-400">{b.purpose}</td>
                    <td><span className={statusClass[b.status] ?? 'badge badge-pending'}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;