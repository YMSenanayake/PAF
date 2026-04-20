import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotificationPrefs, categorizeNotif } from '../../hooks/useNotificationPrefs';

const DashboardLayout = () => {
  const { user } = useAuth();
  const { prefs } = useNotificationPrefs();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertToasts, setAlertToasts] = useState([]);
  const prevCountRef = useRef(0);
  const knownIdsRef = useRef(new Set());

  const dismissToast = (id) =>
    setAlertToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (!user?.userId) return;

    const fetchUnread = async () => {
      try {
        const res = await axios.get(`/api/notifications/user/${user.userId}/unread`);
        const notifications = res.data;
        const count = notifications.length;

        // Detect genuinely NEW notifications not seen before
        const newOnes = notifications.filter(n => !knownIdsRef.current.has(n.notificationId));

        if (newOnes.length > 0 && prevCountRef.current > 0) {
          // Only alert if this isn't the very first load (avoid spamming on page refresh)
          newOnes.forEach((n, idx) => {
            // Check category preference before showing toast
            const cat = categorizeNotif(n.message);
            const catEnabled = cat === null || prefs[cat] !== false;

            if (prefs.inAppToasts && catEnabled) {
              const toastId = n.notificationId;
              setAlertToasts(prev => [...prev, { id: toastId, message: n.message }]);
              setTimeout(() => dismissToast(toastId), 6000 + idx * 500);
            }

            // Browser native notification
            if (prefs.browserNotifs && catEnabled &&
                'Notification' in window && Notification.permission === 'granted') {
              new Notification('Smart Campus Hub', {
                body: n.message.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''),
                icon: '/vite.svg',
              });
            }
          });
        }

        // Mark all current IDs as known so we don't re-alert them
        notifications.forEach(n => knownIdsRef.current.add(n.notificationId));
        prevCountRef.current = count;

        // Only count unread notifications from *enabled* categories in the sidebar badge
        const visibleUnread = notifications.filter(n => {
          const cat = categorizeNotif(n.message);
          return cat === null || prefs[cat] !== false;
        }).length;
        setUnreadCount(visibleUnread);
      } catch {
        // ignore — backend might not be running
      }
    };

    // Request browser notification permission once on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user?.userId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar unreadCount={unreadCount} />

      <main className="flex-1 overflow-auto">
        <Outlet context={{ refreshUnread: () => setUnreadCount(c => Math.max(0, c - 1)) }} />
      </main>

      {/* ── Live Notification Toasts ─────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: '360px' }}>
        {alertToasts.map(toast => (
          <div key={toast.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl animate-slide-in"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(99,102,241,0.35)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
            }}>
            {/* Bell icon */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-indigo-300 mb-0.5">New Notification</p>
              <p className="text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
            </div>

            {/* Dismiss */}
            <button onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" className="w-4 h-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;
