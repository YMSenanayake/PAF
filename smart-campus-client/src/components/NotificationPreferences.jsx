import React, { useState } from 'react';
import { useNotificationPrefs, DEFAULT_PREFS } from '../hooks/useNotificationPrefs';
import { useAuth } from '../context/AuthContext';

/* ── Toggle switch ──────────────────────────────────────────────────────────── */
const Toggle = ({ id, checked, onChange }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="relative inline-flex items-center shrink-0 cursor-pointer transition-all duration-300"
    style={{
      width: '44px', height: '24px',
      borderRadius: '12px',
      background: checked
        ? 'linear-gradient(135deg, #6366f1, #06b6d4)'
        : 'rgba(255,255,255,0.1)',
      border: `1px solid ${checked ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)'}`,
      boxShadow: checked ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
    }}
  >
    <span
      className="absolute transition-all duration-300"
      style={{
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: '#fff',
        left: checked ? '22px' : '3px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}
    />
  </button>
);

/* ── Preference card ─────────────────────────────────────────────────────────── */
const PrefCard = ({ id, icon, title, description, checked, onChange, accent = '#6366f1', adminOnly = false, role }) => {
  const hidden = adminOnly && role === 'USER';
  if (hidden) return null;
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
      style={{
        background: checked ? `${accent}12` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? `${accent}30` : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{ background: checked ? `${accent}20` : 'rgba(255,255,255,0.05)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          {adminOnly && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
              Staff only
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
};

/* ── Section header ──────────────────────────────────────────────────────────── */
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-3 mt-6 first:mt-0">
    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
    {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
  </div>
);

/* ── Main component ──────────────────────────────────────────────────────────── */
const NotificationPreferences = () => {
  const { user } = useAuth();
  const { prefs, setPref, resetPrefs } = useNotificationPrefs();
  const [saved, setSaved] = useState(false);
  const role = user?.role ?? 'USER';

  const handleToggle = (key, value) => {
    setPref(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetPrefs();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const masterOff = !prefs.inAppToasts && !prefs.browserNotifs;

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notification Preferences</h1>
            <p className="text-slate-400 text-sm mt-1">
              Choose which notifications you want to receive
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold animate-fade-in"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" className="w-3.5 h-3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </div>
          )}
        </div>
      </div>

      {/* Delivery methods */}
      <div className="glass rounded-2xl p-5 mb-5 animate-fade-in-up"
        style={{ border: '1px solid rgba(99,102,241,0.15)', animationDelay: '40ms', animationFillMode: 'both' }}>
        <SectionHeader title="Delivery Methods" subtitle="How notifications are delivered to you" />
        <div className="space-y-3">
          <PrefCard
            id="pref-in-app"
            icon="🔔"
            title="In-app Alerts"
            description="Pop-up toasts appear in the bottom-right corner while you browse the dashboard"
            checked={prefs.inAppToasts}
            onChange={v => handleToggle('inAppToasts', v)}
            accent="#6366f1"
            role={role}
          />
          <PrefCard
            id="pref-browser"
            icon="🖥️"
            title="Browser Notifications"
            description="Native OS push notifications — works even when the tab is in the background"
            checked={prefs.browserNotifs}
            onChange={v => handleToggle('browserNotifs', v)}
            accent="#06b6d4"
            role={role}
          />
        </div>
        {masterOff && (
          <div className="mt-3 px-4 py-3 rounded-xl text-xs text-amber-400 flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" className="w-4 h-4 shrink-0">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            All delivery methods are disabled — you won't receive any alerts.
          </div>
        )}
      </div>

      {/* Booking notifications */}
      <div className="glass rounded-2xl p-5 mb-5 animate-fade-in-up"
        style={{ border: '1px solid rgba(99,102,241,0.15)', animationDelay: '80ms', animationFillMode: 'both' }}>
        <SectionHeader title="Booking Notifications" />
        <div className="space-y-3">
          <PrefCard
            id="pref-booking-status"
            icon="📅"
            title="Booking Status Updates"
            description="When your booking is approved, rejected, or cancelled by an administrator"
            checked={prefs.bookingStatus}
            onChange={v => handleToggle('bookingStatus', v)}
            accent="#10b981"
            role={role}
          />
          <PrefCard
            id="pref-booking-requests"
            icon="📋"
            title="New Booking Requests"
            description="When a user submits a new booking that needs your approval"
            checked={prefs.bookingRequests}
            onChange={v => handleToggle('bookingRequests', v)}
            accent="#f59e0b"
            adminOnly={true}
            role={role}
          />
        </div>
      </div>

      {/* Ticket notifications */}
      <div className="glass rounded-2xl p-5 mb-6 animate-fade-in-up"
        style={{ border: '1px solid rgba(99,102,241,0.15)', animationDelay: '120ms', animationFillMode: 'both' }}>
        <SectionHeader title="Ticket Notifications" />
        <div className="space-y-3">
          <PrefCard
            id="pref-ticket-status"
            icon="🎫"
            title="Ticket Status Updates"
            description="When your ticket is marked as in-progress or resolved by a technician"
            checked={prefs.ticketStatus}
            onChange={v => handleToggle('ticketStatus', v)}
            accent="#8b5cf6"
            role={role}
          />
          <PrefCard
            id="pref-ticket-alerts"
            icon="🚨"
            title="New Ticket Alerts"
            description="When a user reports a new maintenance or hardware ticket"
            checked={prefs.ticketAlerts}
            onChange={v => handleToggle('ticketAlerts', v)}
            accent="#ef4444"
            adminOnly={true}
            role={role}
          />
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
        <p className="text-xs text-slate-600">
          Preferences are saved automatically and stored locally in your browser
        </p>
        <button onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
