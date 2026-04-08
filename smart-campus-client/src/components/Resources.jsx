import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = '/api/resources';

const Resources = () => {
  const { canManageResources } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', type: '', capacity: '', location: '', status: 'ACTIVE' });
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const res = await axios.get(API);
      setResources(res.data);
    } catch { showToast('Failed to load resources', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(API, { ...form, capacity: parseInt(form.capacity) });
      showToast('Resource added successfully!');
      setShowModal(false);
      setForm({ name: '', type: '', capacity: '', location: '', status: 'ACTIVE' });
      load();
    } catch { showToast('Failed to add resource', 'error'); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async (r) => {
    const newStatus = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axios.put(`${API}/${r.resourceId}/status`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      load();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const deleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await axios.delete(`${API}/${id}`);
      showToast('Resource deleted');
      load();
    } catch { showToast('Failed to delete resource', 'error'); }
  };

  const filtered = resources.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  const typeIcon = (type) => {
    const t = type?.toLowerCase() ?? '';
    if (t.includes('lab')) return '🔬';
    if (t.includes('room') || t.includes('meeting')) return '🏛️';
    if (t.includes('projector') || t.includes('equipment')) return '📽️';
    if (t.includes('hall') || t.includes('auditorium')) return '🎭';
    return '🏢';
  };

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="text-slate-400 text-sm mt-1">
            {resources.length} facilities &amp; assets · {resources.filter(r => r.status === 'ACTIVE').length} active
          </p>
        </div>
        {canManageResources && (
          <button id="add-resource-btn" onClick={() => setShowModal(true)} className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M12 5v14M5 12h14" /></svg>
            Add Resource
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input id="resource-search" type="text" placeholder="Search by name, type or location…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="form-input pl-10" style={{ borderRadius: '12px' }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center animate-fade-in">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-slate-400 text-sm">No resources found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
          {filtered.map((r, i) => (
            <div key={r.resourceId} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {typeIcon(r.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm leading-tight">{r.name}</h3>
                    <p className="text-xs text-slate-500">{r.type}</p>
                  </div>
                </div>
                <span className={`badge ${r.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{r.status}</span>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-3.5 h-3.5 text-slate-500 shrink-0">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  Capacity: <span className="text-slate-300">{r.capacity} people</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500 shrink-0">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-slate-300">{r.location}</span>
                </div>
              </div>

              {/* Admin actions only */}
              {canManageResources && (
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(r)}
                    className={`btn btn-sm flex-1 ${r.status === 'ACTIVE' ? 'btn-secondary' : 'btn-success'}`}>
                    {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteResource(r.resourceId)} className="btn btn-sm btn-danger px-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal — Admin only */}
      {showModal && canManageResources && (
        <div className="modal-backdrop animate-fade-in" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass rounded-3xl p-8 w-full max-w-lg animate-fade-in-up shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Add New Resource</h2>
                <p className="text-xs text-slate-500 mt-0.5">Register a new facility or asset</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Resource Name</label>
                  <input id="res-name" className="form-input" placeholder="e.g. Lab A" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <input id="res-type" className="form-input" placeholder="e.g. Computer Lab" required
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Capacity</label>
                  <input id="res-capacity" type="number" min="1" className="form-input" placeholder="30" required
                    value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select id="res-status" className="form-input"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input id="res-location" className="form-input" placeholder="e.g. Block C, Floor 2" required
                  value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Saving…' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;