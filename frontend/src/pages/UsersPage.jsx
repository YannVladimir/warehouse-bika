import React, { useState, useEffect } from 'react';
import { userApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, X, Mail, UserCheck, UserX, Calendar, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const ROLE_LABELS = { SUPER_ADMIN: 'Super Admin', COMPANY_ADMIN: 'Company Admin', USER: 'User' };

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  COMPANY_ADMIN: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  USER: 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400',
};

const emptyForm = { fullName: '', email: '', password: '', role: 'USER' };

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const assignableRoles = isSuperAdmin ? ['SUPER_ADMIN', 'COMPANY_ADMIN', 'USER'] : ['COMPANY_ADMIN', 'USER'];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    userApi.getAll().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || formData.password.length < 8) return;
    setSaving(true);
    setError('');
    try {
      const added = await userApi.create(formData);
      setUsers(prev => [...prev, added]);
      setFormData(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create user.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (targetUser) => {
    setBusyUserId(targetUser.id);
    try {
      const updated = targetUser.active
        ? await userApi.deactivate(targetUser.id)
        : await userApi.activate(targetUser.id);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update user status.'));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Users className="h-5 w-5" />
            </div>
            User Accounts
          </h1>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
            Control administrative user accounts, security roles, and system permission levels.
          </p>
        </div>
        <button
          onClick={() => { setError(''); setShowAddForm(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {error && !showAddForm && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350 text-sm">
                    {u.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                      {u.fullName}
                    </h3>
                    {u.companyName && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                        {u.companyName}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </div>

              <div className="space-y-2.5 my-4 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {u.active ? <UserCheck className="h-3.5 w-3.5 text-slate-400" /> : <UserX className="h-3.5 w-3.5 text-slate-400" />}
                  <span>
                    Status:{' '}
                    <span className={u.active ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  {u.lastLoginAt ? `Last login ${u.lastLoginAt.slice(0, 10)}` : 'Never logged in'}
                </span>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={busyUserId === u.id}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                      u.active
                        ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Form Drawer */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  Add New User
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} id="user-form" className="space-y-5">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Kevin Patel" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="k.patel@bikaarchive.com" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel required>Temporary Password</FieldLabel>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" className={inputClass} required minLength={8} />
                </div>
                <div>
                  <FieldLabel>System Role</FieldLabel>
                  <select name="role" value={formData.role} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                    {assignableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={saving}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersPage;
