import React, { useState, useEffect } from 'react';
import { companyApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { Building2, Plus, X, User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const emptyForm = { name: '', email: '', phone: '', industry: '' };

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Pull fresh companies from the source DMS whenever this page is opened, instead of on a
    // fixed background schedule -- falls back to whatever's already saved if the sync itself fails
    // (e.g. the source system is unreachable), so the page still shows something.
    companyApi.sync()
      .catch(() => companyApi.getAll())
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const newCompany = await companyApi.create(formData);
      setCompanies(prev => [...prev, newCompany]);
      setFormData(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create company.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Building2 className="h-5 w-5" />
            </div>
            Companies
          </h1>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
            Manage partner companies and legal entities registered in Bika Archive.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
          No companies registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                    {company.name}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  {company.industry || 'General'}
                </span>
              </div>

              <div className="space-y-2.5 my-4 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{company.email}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{company.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${company.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>{company.active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-auto pt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Registered {company.createdAt?.slice(0, 10)}
                </span>
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
                  Add New Company
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

              <form onSubmit={handleSubmit} id="company-form" className="space-y-5">
                <div>
                  <FieldLabel required>Company Name</FieldLabel>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Vertex Legal Group" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@vertexlegal.com" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0234" className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Industry</FieldLabel>
                  <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="Legal" className={inputClass} />
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
                form="company-form"
                disabled={saving}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CompaniesPage;
