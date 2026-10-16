import React, { useState, useEffect } from 'react';
import { documentTypeApi } from '../services/documentApi';
import { companyApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Tags, Plus, X, Trash2, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const emptyForm = { name: '', description: '', companyId: '' };

export const CategoriesPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [types, setTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    documentTypeApi.getAll().then(setTypes).finally(() => setLoading(false));
    if (isSuperAdmin) companyApi.getAll().then(setCompanies).catch(() => {});
  }, [isSuperAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (isSuperAdmin && !formData.companyId) return setError('Select which company this category belongs to.');
    setSaving(true);
    setError('');
    try {
      const added = await documentTypeApi.create({
        name: formData.name,
        description: formData.description || undefined,
        companyId: isSuperAdmin ? formData.companyId : undefined,
      });
      setTypes(prev => [...prev, added]);
      setFormData(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`Delete category "${type.name}"? Documents using it will keep their other details but lose this category.`)) return;
    setDeletingId(type.id);
    try {
      await documentTypeApi.remove(type.id);
      setTypes(prev => prev.filter(t => t.id !== type.id));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not delete category.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Tags className="h-5 w-5" />
            </div>
            Categories
          </h1>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
            Document categories used when registering and filtering archived documents.
          </p>
        </div>
        <button
          onClick={() => { setError(''); setShowAddForm(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
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
      ) : types.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
          No categories yet -- add one to start organizing documents.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => (
            <div
              key={type.id}
              className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{type.name}</h3>
                <button
                  onClick={() => handleDelete(type)}
                  disabled={deletingId === type.id}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
                  title="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 flex-1">
                {type.description || 'No description provided.'}
              </p>
              {isSuperAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {companies.find(c => c.id === type.companyId)?.name || 'Unknown company'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  Add Category
                </h2>
                <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} id="category-form" className="space-y-4">
                {isSuperAdmin && (
                  <div>
                    <FieldLabel required>Company</FieldLabel>
                    <select value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} className={`${inputClass} cursor-pointer`} required>
                      <option value="">Select a company…</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <FieldLabel required>Name</FieldLabel>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Finance" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" placeholder="Financial records, invoices, tax filings…" className={`${inputClass} resize-none`} />
                </div>
              </form>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
              <button type="button" onClick={() => setShowAddForm(false)} className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center">
                Cancel
              </button>
              <button type="submit" form="category-form" disabled={saving} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CategoriesPage;
