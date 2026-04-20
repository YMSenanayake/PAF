import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotificationPrefs, categorizeNotif } from '../hooks/useNotificationPrefs';

const API = '/api/notifications';

const Notifications = () => {
  const { user } = useAuth();
  const { prefs } = useNotificationPrefs();
  const userId = user?.userId;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const res = await axios.get(`${API}/user/${userId}`);
      setNotifications(res.data);
    } catch { showToast('Failed to load notifications', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!userId) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, read: true } : n)
      );
    } catch { showToast('Failed to mark as read', 'error'); }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => axios.put(`${API}/${n.notificationId}/read`).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  // Apply category preference filter first
  const isCategoryEnabled = (n) => {
    const cat = categorizeNotif(n.message);
    return cat === null || prefs[cat] !== false;
  };

  const prefFiltered      = notifications.filter(isCategoryEnabled);
  const hiddenByPrefs     = notifications.length - prefFiltered.length;
  const filtered          = filter === 'ALL' ? prefFiltered : prefFiltered.filter(n => !n.read);
  const unreadCount       = prefFiltered.filter(n => !n.read).length;

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getIcon = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('approved')) return { icon: '✓', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
    if (m.includes('rejected') || m.includes('denied')) return { icon: '✕', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
    if (m.includes('book') || m.includes('reserv')) return { icon: '📅', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' };
    if (m.includes('ticket') || m.includes('incident')) return { icon: '🎫', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
    if (m.includes('resolv') || m.includes('fix')) return { icon: '🔧', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' };
    return { icon: '🔔', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  };

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0
              ? <><span className="text-indigo-400 font-semibold">{unreadCount} unread</span> · {prefFiltered.length} visible</>
              : `${prefFiltered.length} notifications · all caught up`}
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button id="mark-all-read-btn" onClick={markAllAsRead} className="btn btn-secondary text-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mark all read
            </button>
          )}
          <button onClick={load} className="btn btn-secondary text-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
        {[
          { key: 'ALL',    label: `All (${prefFiltered.length})` },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
        ].map(({ key, label }) => (
          <button key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              filter === key
                ? 'text-white border-indigo-500/50'
                : 'text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
            style={filter === key ? { background: 'rgba(99,102,241,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Hidden-by-prefs hint */}
      {hiddenByPrefs > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5 animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8"
            strokeLinecap="round" className="w-4 h-4 shrink-0">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-xs text-amber-400 flex-1">
            <strong>{hiddenByPrefs}</strong> notification{hiddenByPrefs > 1 ? 's are' : ' is'} hidden by your preferences.
          </p>
          <Link to="/dashboard/settings"
            className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 shrink-0">
            Manage Settings →
          </Link>
        </div>
      )}

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-20 text-center animate-fade-in">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-300 font-medium">All caught up!</p>
          <p className="text-slate-500 text-sm mt-1">No {filter === 'UNREAD' ? 'unread ' : ''}notifications at this time</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map((n, i) => {
            const { icon, color, bg } = getIcon(n.message);
            return (
              <div
                key={n.notificationId}
                className={`rounded-2xl px-5 py-4 flex items-start gap-4 transition-all duration-200 animate-fade-in-up ${
                  !n.read
                    ? 'border'
                    : 'border border-white/[0.04]'
                }`}
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'both',
                  background: !n.read ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.03)',
                  borderColor: !n.read ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg mt-0.5"
                  style={{ background: bg, border: `1px solid ${color}33` }}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!n.read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Unread dot + action */}
                <div className="flex items-center gap-3 shrink-0">
                  {!n.read && (
                    <>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
                      <button
                        onClick={() => markAsRead(n.notificationId)}
                        className="btn btn-sm btn-secondary text-xs"
                        style={{ padding: '4px 10px' }}>
                        Mark read
                      </button>
                    </>
                  )}
                  {n.read && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      className="w-4 h-4 text-emerald-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center mt-8 animate-fade-in">
        <p className="text-xs text-slate-600">Auto-refreshes every 10 seconds</p>
      </div>
    </div>
  );
};

export default Notifications;