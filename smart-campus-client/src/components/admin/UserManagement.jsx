import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = '/api/users';

const roleColors = {
  ADMIN: { color: '#818cf8', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' },
  TECHNICIAN: { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
  USER: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // user object pending deletion

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const res = await axios.get(API);
      setUsers(res.data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId, newRole) => {
    if (userId === currentUser?.userId) {
      showToast("You can't change your own role", 'error');
      return;
    }
    try {
      await axios.put(`${API}/${userId}/role`, null, { params: { role: newRole } });
      showToast(`Role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: newRole } : u));
    } catch { showToast('Failed to update role', 'error'); }
  };

  const deleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await axios.delete(`${API}/${confirmDelete.userId}`);
      showToast(`${confirmDelete.fullName ?? 'User'} removed successfully`);
      setUsers(prev => prev.filter(u => u.userId !== confirmDelete.userId));
    } catch (err) {
      showToast(err.response?.data || 'Failed to delete user', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) => name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>{toast.type === 'success' ? '✓' : '✕'} {toast.text}</div>
      )}

      {/* ── Confirm Delete Modal ─────────────────── */}
      {confirmDelete && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="glass rounded-2xl p-7 w-full max-w-sm animate-fade-in-up"
            style={{ border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-white text-center mb-1">Delete User</h3>
            <p className="text-slate-400 text-xs text-center mb-5 leading-relaxed">
              This will permanently remove <strong className="text-slate-200">{confirmDelete.fullName}</strong> and ALL their bookings, tickets &amp; notifications. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger flex-1" onClick={deleteUser}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin Only
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input id="user-search" type="text" placeholder="Search by name, email or role…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="form-input pl-10" style={{ borderRadius: '12px' }} />
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        {['ADMIN', 'TECHNICIAN', 'USER'].map(role => {
          const count = users.filter(u => u.role === role).length;
          const rc = roleColors[role];
          return (
            <div key={role} className="glass rounded-xl p-4">
              <p className="text-2xl font-bold" style={{ color: rc.color }}>{count}</p>
              <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">{role}s</p>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">👤</p><p className="text-slate-400 text-sm">No users found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>User</th><th>Email</th><th>Current Role</th><th>Change Role</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rc = roleColors[u.role] ?? roleColors.USER;
                  const isSelf = u.userId === currentUser?.userId;
                  return (
                    <tr key={u.userId}>
                      <td className="text-slate-500 text-xs">#{u.userId}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                            {initials(u.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{u.fullName}</p>
                            {isSelf && <p className="text-xs text-indigo-400">You</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-400 text-sm">{u.email}</td>
                      <td>
                        <span className="badge text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {isSelf ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <select
                            id={`role-select-${u.userId}`}
                            defaultValue={u.role}
                            onChange={e => changeRole(u.userId, e.target.value)}
                            className="form-input text-xs py-1.5 px-2"
                            style={{ width: 'auto', minWidth: '130px', borderRadius: '8px' }}
                          >
                            <option value="USER">USER</option>
                            <option value="TECHNICIAN">TECHNICIAN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                      </td>
                      {/* Delete button */}
                      <td onClick={e => e.stopPropagation()}>
                        {isSelf ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <button
                            id={`delete-user-${u.userId}`}
                            title={`Remove ${u.fullName}`}
                            className="btn btn-sm btn-danger px-2.5"
                            onClick={() => setConfirmDelete(u)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center mt-6">
        Role changes take effect immediately on the user's next login
      </p>
    </div>
  );
};

export default UserManagement;
