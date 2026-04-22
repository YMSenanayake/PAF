import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';

const API = '/api/bookings';

/**
 * Admin / Technician booking verification screen.
 * - Enter a booking ID manually (or scan a QR code with a phone app)
 * - Shows full booking details and confirms check-in.
 */
const BookingVerify = () => {
  const { canApproveBookings, isTechnician } = useAuth();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!bookingId.trim()) return;
    setLoading(true);
    setError('');
    setBooking(null);
    setCheckedIn(false);
    try {
      // Fetch all bookings and find the one matching the ID
      const res = await axios.get(API);
      const found = res.data.find(b => String(b.bookingId) === String(bookingId.trim()));
      if (!found) {
        setError(`No booking found with ID #${bookingId}`);
      } else {
        setBooking(found);
      }
    } catch {
      setError('Failed to fetch booking. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCheckIn = async () => {
    // Mark booking as CHECKED_IN by setting a special status
    try {
      await axios.put(`${API}/${booking.bookingId}/status`, null, {
        params: { status: 'CHECKED_IN' },
      });
      setCheckedIn(true);
      setBooking(prev => ({ ...prev, status: 'CHECKED_IN' }));
    } catch {
      setError('Failed to confirm check-in.');
    }
  };

  const statusMeta = {
    APPROVED:    { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: '✅' },
    PENDING:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳' },
    REJECTED:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
    CANCELLED:   { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', icon: '🚫' },
    CHECKED_IN:  { color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  icon: '📍' },
  };

  /** Returns true if the booking's end date-time is already in the past */
  const isExpired = (b) => {
    if (!b?.bookingDate || !b?.endTime) return false;
    const endDateTime = new Date(`${b.bookingDate}T${b.endTime}`);
    return endDateTime < new Date();
  };

  /** Returns true if the booking's start date-time is in the future */
  const isTooEarly = (b) => {
    if (!b?.bookingDate || !b?.startTime) return false;
    const startDateTime = new Date(`${b.bookingDate}T${b.startTime}`);
    return new Date() < startDateTime;
  };

  const sm = booking ? (statusMeta[booking.status] ?? statusMeta.PENDING) : null;
  const expired = booking ? isExpired(booking) : false;
  const tooEarly = booking ? isTooEarly(booking) : false;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Booking Verification</h1>
        <p className="text-slate-400 text-sm mt-1">
          Scan a QR code or enter a booking ID to verify check-in
        </p>
      </div>

      {/* Lookup Form */}
      <div className="glass rounded-2xl p-6 mb-6 animate-fade-in-up"
        style={{ border: '1px solid rgba(99,102,241,0.2)', animationDelay: '50ms', animationFillMode: 'both' }}>
        <form onSubmit={lookup} className="flex gap-3">
          <div className="flex-1 relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <path d="M3 9h3V3H3v6zM3 21h3v-6H3v6zM15 3h3v6h-3V3zM15 15h3v6h-3v-6zM9 9h6v6H9V9z"/>
              <path d="M9 3h3v3H9V3zM3 15h3v3H3v-3zM12 15h3v3h-3v-3zM12 9h3v3h-3V9z"/>
            </svg>
            <input
              id="verify-booking-id"
              type="number"
              min="1"
              placeholder="Enter Booking ID (e.g. 5)"
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              className="form-input pl-10 w-full"
              style={{ borderRadius: '12px' }}
            />
          </div>
          <button type="submit" disabled={loading || !bookingId}
            className="btn btn-primary px-6">
            {loading ? 'Looking up…' : 'Verify'}
          </button>
        </form>
        {error && (
          <p className="text-red-400 text-xs mt-3 flex items-center gap-2">
            <span>✕</span> {error}
          </p>
        )}
      </div>

      {/* Booking Details Card */}
      {booking && (
        <div className="glass rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ border: `1px solid ${sm.border}`, animationDelay: '80ms', animationFillMode: 'both' }}>

          {/* Status Banner */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ background: sm.bg, borderBottom: `1px solid ${sm.border}` }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{sm.icon}</span>
              <span className="font-bold text-sm" style={{ color: sm.color }}>
                {booking.status}
              </span>
            </div>
            <span className="text-xs text-slate-400">Booking #{booking.bookingId}</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-4">
              <InfoRow label="Resource" value={booking.resource?.name ?? '—'} icon="🏛️" />
              <InfoRow label="Date" value={booking.bookingDate} icon="📅" />
              <InfoRow label="Time"
                value={`${booking.startTime?.slice(0,5)} – ${booking.endTime?.slice(0,5)}`}
                icon="⏰" />
              <InfoRow label="Purpose" value={booking.purpose} icon="📋" />
              <InfoRow label="Attendees" value={booking.expectedAttendees} icon="👥" />
              {booking.user && (
                <InfoRow label="Booked by"
                  value={booking.user.fullName ?? booking.user.email ?? `User #${booking.user.userId}`}
                  icon="👤" />
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-2xl" style={{ background: '#ffffff11', border: '1px solid rgba(255,255,255,0.1)' }}>
                <QRCodeSVG
                  value={`booking:${booking.bookingId}`}
                  size={140}
                  bgColor="transparent"
                  fgColor="#e2e8f0"
                  level="M"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                QR encodes Booking #{booking.bookingId}
              </p>
            </div>
          </div>

          {/* Check-in Action */}
          <div className="px-6 pb-6">
            {checkedIn || booking.status === 'CHECKED_IN' ? (
              <div className="flex items-center justify-center gap-3 py-4 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-indigo-300 font-bold text-sm">Check-in Confirmed!</p>
                  <p className="text-slate-400 text-xs">This booking has been successfully verified</p>
                </div>
              </div>

            ) : expired ? (
              /* ── EXPIRED — block check-in ── */
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-red-400 font-bold text-sm">Booking Expired</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    This booking ended on <strong className="text-slate-300">{booking.bookingDate}</strong> at{' '}
                    <strong className="text-slate-300">{booking.endTime?.slice(0,5)}</strong>. Check-in is not allowed.
                  </p>
                </div>
              </div>

            ) : tooEarly ? (
              /* ── TOO EARLY — block check-in ── */
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <p className="text-amber-400 font-bold text-sm">Too Early for Check-in</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    This booking starts on <strong className="text-slate-300">{booking.bookingDate}</strong> at{' '}
                    <strong className="text-slate-300">{booking.startTime?.slice(0,5)}</strong>. Check-in is not allowed yet.
                  </p>
                </div>
              </div>

            ) : booking.status === 'APPROVED' ? (
              <button id="confirm-checkin-btn" onClick={confirmCheckIn}
                className="btn btn-primary w-full py-3 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                ✅ Confirm Check-in
              </button>
            ) : (
              <div className="text-center py-3 text-sm text-slate-500">
                This booking is <strong style={{ color: sm.color }}>{booking.status}</strong> — check-in not available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help text */}
      {!booking && !error && (
        <div className="glass rounded-2xl p-8 text-center animate-fade-in"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-4xl mb-3">📲</div>
          <p className="text-slate-300 text-sm font-medium mb-1">How to verify a booking</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Ask the user to show their booking QR code, then enter the booking ID above.
            <br />For APPROVED bookings, click <strong className="text-slate-300">Confirm Check-in</strong> to mark attendance.
          </p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3">
    <span className="text-base shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-200">{value ?? '—'}</p>
    </div>
  </div>
);

export default BookingVerify;
