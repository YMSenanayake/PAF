import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = '/api';

const priorityClass = {
  LOW: 'badge badge-approved',
  MEDIUM: 'badge badge-pending',
  HIGH: 'badge badge-rejected',
  CRITICAL: 'badge badge-rejected',
};

const ticketStatusClass = {
  OPEN: 'badge badge-open',
  IN_PROGRESS: 'badge badge-inprogress',
  RESOLVED: 'badge badge-resolved',
};

const Tickets = () => {
  const { user, canResolveTickets, canDeleteTickets, isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resolveModal, setResolveModal] = useState(null); // ticket object
  const [resolveData, setResolveData] = useState({ status: 'IN_PROGRESS', notes: '' });
  const [filter, setFilter] = useState('ALL');
  const [files, setFiles] = useState(null);
  const fileRef = useRef();
  const [expandedId, setExpandedId] = useState(null);
  const [attachmentCache, setAttachmentCache] = useState({}); // ticketId → [{filePath}]
  const [form, setForm] = useState({
    resourceId: '', category: 'HARDWARE', priority: 'MEDIUM', description: '', contactDetails: '',
  });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAttachments = async (ticketId) => {
    if (attachmentCache[ticketId]) return; // already loaded
    try {
      const res = await axios.get(`${API}/tickets/${ticketId}/attachments`);
      setAttachmentCache(prev => ({ ...prev, [ticketId]: res.data }));
    } catch { /* ignore */ }
  };

  const toggleExpand = (ticketId) => {
    const next = expandedId === ticketId ? null : ticketId;
    setExpandedId(next);
    if (next) fetchAttachments(ticketId);
  };

  const load = async () => {
    try {
      // ADMIN and TECHNICIAN see all tickets; regular USER only sees their own
      const ticketUrl = (isAdmin || isTechnician)
        ? `${API}/tickets`
        : `${API}/tickets/user/${user?.userId}`;

      const [t, r] = await Promise.all([
        axios.get(ticketUrl),
        axios.get(`${API}/resources`),
      ]);
      setTickets(t.data);
      setResources(r.data);
    } catch { showToast('Failed to load tickets', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user?.userId) return;
    load();
  }, [user?.userId, isAdmin, isTechnician]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 3) {
      showToast('Maximum 3 images allowed', 'error');
      e.target.value = null;
      setFiles(null);
    } else {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/tickets`, {
        user: { userId: user?.userId ?? 1 },
        resource: { resourceId: parseInt(form.resourceId) },
        category: form.category,
        priority: form.priority,
        description: form.description,
        contactDetails: form.contactDetails,
      });
      const newId = res.data.ticketId;
      if (files && files.length > 0) {
        const fd = new FormData();
        for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
        await axios.post(`${API}/tickets/${newId}/attachments`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      showToast(`Ticket #${newId} submitted successfully!`);
      setShowForm(false);
      setForm({ resourceId: '', category: 'HARDWARE', priority: 'MEDIUM', description: '', contactDetails: '' });
      setFiles(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      showToast(err.response?.data || 'Failed to submit ticket', 'error');
    } finally { setSubmitting(false); }
  };

  const handleResolve = async () => {
    try {
      await axios.put(`${API}/tickets/${resolveModal.ticketId}/resolve`, null, {
        params: { status: resolveData.status, notes: resolveData.notes || undefined },
      });
      showToast('Ticket updated successfully');
      setResolveModal(null);
      setResolveData({ status: 'IN_PROGRESS', notes: '' });
      load();
    } catch { showToast('Failed to update ticket', 'error'); }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await axios.delete(`${API}/tickets/${id}`);
      showToast('Ticket deleted');
      load();
    } catch { showToast('Failed to delete ticket', 'error'); }
  };

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

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

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="glass rounded-2xl p-7 w-full max-w-md animate-fade-in-up"
            style={{ border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <h3 className="text-base font-bold text-white mb-1">Update Ticket #{resolveModal.ticketId}</h3>
            <p className="text-xs text-slate-400 mb-5">{resolveModal.description}</p>
            <div className="space-y-4">
              <div>
                <label className="form-label">New Status</label>
                <select className="form-input" value={resolveData.status}
                  onChange={e => setResolveData({ ...resolveData, status: e.target.value })}>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="form-label">Resolution Notes</label>
                <textarea className="form-input" rows={3} placeholder="Describe what was done…"
                  value={resolveData.notes}
                  onChange={e => setResolveData({ ...resolveData, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn btn-secondary flex-1" onClick={() => setResolveModal(null)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={handleResolve}>Update Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">
            {(isAdmin || isTechnician) ? 'All tickets' : 'Your tickets'} · {tickets.length} total · {tickets.filter(t => t.status === 'OPEN').length} open
          </p>
        </div>
        <button id="new-ticket-btn" onClick={() => setShowForm(v => !v)} className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {showForm ? 'Hide Form' : 'Report Incident'}
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-7 animate-fade-in-up"
          style={{ border: '1px solid rgba(239,68,68,0.15)', boxShadow: '0 8px 32px rgba(239,68,68,0.08)' }}>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Report an Incident</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Resource</label>
              <select id="ticket-resource" className="form-input" required
                value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}>
                <option value="">Select resource…</option>
                {resources.map(r => (
                  <option key={r.resourceId} value={r.resourceId}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select id="ticket-category" className="form-input"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="HARDWARE">Hardware Issue</option>
                <option value="SOFTWARE">Software Issue</option>
                <option value="FACILITY">Facility / Room Issue</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select id="ticket-priority" className="form-input"
                value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Contact Details</label>
              <input id="ticket-contact" type="text" className="form-input" placeholder="Phone or email" required
                value={form.contactDetails} onChange={e => setForm({ ...form, contactDetails: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Issue Description</label>
              <textarea id="ticket-desc" className="form-input" rows={3} required
                placeholder="Describe the problem in detail…"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Evidence Attachments (Max 3 images)</label>
              <input id="ticket-files" ref={fileRef} type="file" multiple accept="image/*"
                onChange={handleFileChange}
                className="form-input text-slate-400 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 file:cursor-pointer" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1"
                style={!submitting ? { background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' } : {}}>
                {submitting ? 'Submitting…' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              filter === s
                ? 'text-white border-indigo-500/50'
                : 'text-slate-400 border-white/[0.06] hover:text-slate-200 hover:border-white/[0.12]'
            }`}
            style={filter === s ? { background: 'rgba(99,102,241,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}>
            {s === 'ALL'
              ? `All (${tickets.length})`
              : `${s.replace('_', ' ')} (${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-3xl mb-3">🎫</p>
            <p className="text-slate-400 text-sm">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Resource</th><th>Category</th><th>Priority</th>
                  <th>Description</th><th>Contact</th><th>Status</th>
                  <th>Resolution</th>
                  {(canResolveTickets || canDeleteTickets) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const hasNotes = t.resolutionNotes && t.resolutionNotes.trim().length > 0;
                  const isExpanded = expandedId === t.ticketId;
                  const attachments = attachmentCache[t.ticketId] || [];
                  const canExpand = hasNotes || (isAdmin || isTechnician); // admins can expand to see attachments even with no notes
                  return (
                    <React.Fragment key={t.ticketId}>
                      <tr
                        className={isExpanded ? 'bg-white/[0.03]' : ''}
                        style={{ cursor: canExpand ? 'pointer' : 'default' }}
                        onClick={() => canExpand && toggleExpand(t.ticketId)}
                      >
                        <td className="text-slate-500 text-xs">#{t.ticketId}</td>
                        <td className="text-white font-medium text-sm">{t.resource?.name ?? '—'}</td>
                        <td className="text-slate-400 text-xs">{t.category}</td>
                        <td><span className={priorityClass[t.priority] ?? 'badge badge-pending'}>{t.priority}</span></td>
                        <td className="text-slate-300 max-w-[140px]">
                          <p className="truncate text-xs">{t.description}</p>
                        </td>
                        <td className="text-slate-400 text-xs">{t.contactDetails}</td>
                        <td><span className={ticketStatusClass[t.status] ?? 'badge badge-open'}>{t.status?.replace('_', ' ')}</span></td>
                        {/* Resolution Notes column */}
                        <td onClick={e => e.stopPropagation()}>
                          {(hasNotes || (isAdmin || isTechnician)) ? (
                            <button
                              onClick={() => toggleExpand(t.ticketId)}
                              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                              style={{ color: isExpanded ? '#818cf8' : '#64748b' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        {(canResolveTickets || canDeleteTickets) && (
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              {canResolveTickets && t.status !== 'RESOLVED' && (
                                <button className="btn btn-sm btn-secondary"
                                  onClick={() => { setResolveModal(t); setResolveData({ status: 'IN_PROGRESS', notes: t.resolutionNotes || '' }); }}>
                                  Update
                                </button>
                              )}
                              {canDeleteTickets && (
                                <button className="btn btn-sm btn-danger px-2.5"
                                  onClick={() => deleteTicket(t.ticketId)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  </svg>
                                </button>
                              )}
                              {!canResolveTickets && !canDeleteTickets && <span className="text-xs text-slate-600">—</span>}
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Details Row: Resolution Notes + Evidence Attachments */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={canResolveTickets || canDeleteTickets ? 9 : 8} className="p-0">
                            <div className="px-6 py-5 space-y-5 animate-fade-in"
                              style={{ background: 'rgba(99,102,241,0.06)', borderLeft: '3px solid #6366f1', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>

                              {/* Resolution Notes */}
                              {hasNotes && (
                                <div className="flex items-start gap-3">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                      <path d="M9 12h6m-6 4h4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#818cf8' }}>Admin / Technician Resolution Notes</p>
                                    <p className="text-sm text-slate-300 leading-relaxed">{t.resolutionNotes}</p>
                                  </div>
                                </div>
                              )}

                              {/* Evidence Attachments — visible to admin/technician */}
                              {(isAdmin || isTechnician) && (
                                <div>
                                  <p className="text-xs font-semibold mb-3" style={{ color: '#f59e0b' }}>📎 Evidence Attachments</p>
                                  {attachments.length === 0 ? (
                                    <p className="text-xs text-slate-500">No attachments uploaded for this ticket.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-3">
                                      {attachments.map(att => {
                                        // filePath is like 'uploads/timestamp_filename.jpg'
                                        const url = '/' + att.filePath.replace(/\\/g, '/');
                                        return (
                                          <a key={att.attachmentId} href={url} target="_blank" rel="noopener noreferrer"
                                            className="block rounded-xl overflow-hidden border-2 transition-all hover:scale-105"
                                            style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
                                            <img src={url} alt={`Evidence ${att.attachmentId}`}
                                              className="w-28 h-28 object-cover"
                                              onError={e => { e.target.style.display='none'; }} />
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* No notes and no attachments visible */}
                              {!hasNotes && !(isAdmin || isTechnician) && (
                                <p className="text-xs text-slate-500">No resolution notes yet.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
