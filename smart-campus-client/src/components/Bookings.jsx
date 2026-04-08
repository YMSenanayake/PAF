import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

const API = '/api';

const statusClass = {
  PENDING: 'badge badge-pending', APPROVED: 'badge badge-approved',
  REJECTED: 'badge badge-rejected', CANCELLED: 'badge badge-rejected',
};

const Bookings = () => {
  const { user, canApproveBookings, isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [qrModal, setQrModal] = useState(null);     // booking object for QR display
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({
    resourceId: '', bookingDate: '', startTime: '', endTime: '', purpose: '', expectedAttendees: '',
  });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const [b, r] = await Promise.all([
        // Admin sees all bookings, regular user sees own
        isAdmin ? axios.get(`${API}/bookings`) : axios.get(`${API}/bookings/user/${user?.userId ?? 1}`),
        axios.get(`${API}/resources`),
      ]);
      setBookings(b.data);
      setResources(r.data);
    } catch { showToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user || !isAdmin) load(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/bookings`, {
        user: { userId: user?.userId ?? 1 },
        resource: { resourceId: parseInt(form.resourceId) },
        bookingDate: form.bookingDate,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        purpose: form.purpose,
        expectedAttendees: parseInt(form.expectedAttendees),
      });
      showToast('Booking requested! Status: PENDING');
      setShowForm(false);
      setForm({ resourceId: '', bookingDate: '', startTime: '', endTime: '', purpose: '', expectedAttendees: '' });
      load();
    } catch (err) {
      showToast(err.response?.data || 'Failed to create booking', 'error');
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (id, status, adminReason = null) => {
    try {
      const params = { status };
      if (adminReason) params.adminReason = adminReason;
      await axios.put(`${API}/bookings/${id}/status`, null, { params });
      showToast(`Booking ${status.toLowerCase()}`);
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>{toast.type === 'success' ? '✓' : '✕'} {toast.text}</div>
      )}
      {/* ── QR Code Modal ─────────────────────────── */}
      {qrModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setQrModal(null)}>
          <div className="glass rounded-2xl p-7 w-full max-w-md animate-fade-in-up"
            style={{ border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Booking QR Code</h3>
                <p className="text-xs text-slate-400 mt-0.5">Show this to staff at the venue</p>
              </div>
              <button onClick={() => setQrModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR */}
            <div className="flex justify-center mb-5">
              <div className="p-5 rounded-2xl" style={{ background: '#ffffff0d', border: '1px solid rgba(255,255,255,0.1)' }}>
                <QRCodeSVG
                  value={`booking:${qrModal.bookingId}`}
                  size={180}
                  bgColor="transparent"
                  fgColor="#e2e8f0"
                  level="M"
                />
              </div>
            </div>

            {/* Details summary */}
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID</span>
                <span className="text-white font-bold">#{qrModal.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resource</span>
                <span className="text-slate-200">{qrModal.resource?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-200">{qrModal.bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="text-slate-200">{qrModal.startTime?.slice(0,5)} – {qrModal.endTime?.slice(0,5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-400 font-semibold">✅ {qrModal.status}</span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-600">
              Staff will scan this QR or enter <strong className="text-slate-400">#{qrModal.bookingId}</strong> on the Verify screen
            </p>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="glass rounded-2xl p-7 w-full max-w-md animate-fade-in-up"
            style={{ border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <h3 className="text-base font-bold text-white mb-1">Reject Booking #{rejectModal}</h3>
            <p className="text-xs text-slate-400 mb-4">Provide a reason (optional)</p>
            <textarea className="form-input mb-4" rows={3} placeholder="e.g. Resource unavailable for maintenance…"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn btn-danger flex-1" onClick={() => updateStatus(rejectModal, 'REJECTED', rejectReason)}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin ? 'All bookings' : 'Your bookings'} · {bookings.filter(b => b.status === 'PENDING').length} pending
          </p>
        </div>
        <button id="new-booking-btn" onClick={() => setShowForm(v => !v)} className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M12 5v14M5 12h14" /></svg>
          {showForm ? 'Hide Form' : 'New Booking'}
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-7 animate-fade-in-up"
          style={{ border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 8px 32px rgba(99,102,241,0.1)' }}>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Request a Booking</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Resource</label>
              <select id="booking-resource" className="form-input" required
                value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}>
                <option value="">Select resource…</option>
                {resources.filter(r => r.status === 'ACTIVE').map(r => (
                  <option key={r.resourceId} value={r.resourceId}>{r.name} (cap: {r.capacity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input id="booking-date" type="date" className="form-input" required
                value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Start Time</label>
              <input id="booking-start" type="time" className="form-input" required
                value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input id="booking-end" type="time" className="form-input" required
                value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Purpose</label>
              <input id="booking-purpose" type="text" className="form-input" placeholder="e.g. Team meeting" required
                value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Expected Attendees</label>
              <input id="booking-attendees" type="number" min="1" className="form-input" required
                value={form.expectedAttendees} onChange={e => setForm({ ...form, expectedAttendees: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? 'Submitting…' : 'Submit Booking Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              filter === s ? 'text-white border-indigo-500/50' : 'text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
            style={filter === s ? { background: 'rgba(99,102,241,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}>
            {s === 'ALL' ? `All (${bookings.length})` : `${s} (${bookings.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">📅</p><p className="text-slate-400 text-sm">No bookings found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Resource</th><th>Date</th><th>Time</th>
                  <th>Purpose</th><th>Attendees</th><th>Status</th><th>QR</th>
                  {canApproveBookings && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.bookingId}>
                    <td className="text-slate-500 text-xs">#{b.bookingId}</td>
                    <td><span className="text-white font-medium text-sm">{b.resource?.name ?? '—'}</span></td>
                    <td className="text-slate-300">{b.bookingDate}</td>
                    <td className="text-slate-400 text-xs">{b.startTime?.slice(0,5)} – {b.endTime?.slice(0,5)}</td>
                    <td className="text-slate-300 max-w-[140px] truncate">{b.purpose}</td>
                    <td className="text-slate-400 text-center">{b.expectedAttendees}</td>
                    <td><span className={statusClass[b.status] ?? 'badge badge-pending'}>{b.status}</span></td>
                    {/* QR button — always shown for APPROVED bookings */}
                    <td>
                      {b.status === 'APPROVED' || b.status === 'CHECKED_IN' ? (
                        <button
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                          onClick={() => setQrModal(b)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                            strokeLinecap="round" className="w-3.5 h-3.5">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                          </svg>
                          QR
                        </button>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    {canApproveBookings && (
                      <td>
                        {b.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-success" onClick={() => updateStatus(b.bookingId, 'APPROVED')}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => setRejectModal(b.bookingId)}>Reject</button>
                          </div>
                        )}
                        {b.status === 'APPROVED' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(b.bookingId, 'CANCELLED')}>Cancel</button>
                        )}
                        {(b.status === 'REJECTED' || b.status === 'CANCELLED') && <span className="text-xs text-slate-600">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role hint for non-admins */}
      {!canApproveBookings && (
        <p className="text-xs text-slate-600 text-center mt-4">Booking approvals are handled by an Admin</p>
      )}
    </div>
  );
};

export default Bookings;
