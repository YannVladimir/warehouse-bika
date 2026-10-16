import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { documentTypeApi } from '../services/documentApi';
import { warehouseApi, companyApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { LocationPicker } from '../components/LocationPicker';
import { FolderPlus, FileText, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

export const AddDocumentPage = () => {
  const { addDocument } = useDocuments();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [types, setTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [boxLocationId, setBoxLocationId] = useState('');

  const handoffRef = searchParams.get('ref');
  const handoffTitle = searchParams.get('title');
  const handoffCustodian = searchParams.get('custodian');
  // True when rendered inside an <iframe> (the DMS's own popup embedding /embed/add) -- in that
  // case we notify the parent window on completion instead of navigating to a detail page that
  // wouldn't make sense in a small embedded widget.
  const isEmbedded = window.self !== window.top;

  const [formData, setFormData] = useState({
    documentNumber: '',
    title: handoffTitle || '',
    typeId: '',
    custodian: handoffCustodian || '',
    pages: '',
    archivedDate: '',
    notes: '',
    companyId: '',
    warehouseId: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdDocNumber, setCreatedDocNumber] = useState('');

  // The company this document is actually being created for -- the one picked (super admin) or
  // the user's own (everyone else). Every dropdown that's company-specific filters against this.
  const relevantCompanyId = isSuperAdmin ? formData.companyId : user.companyId;

  useEffect(() => {
    documentTypeApi.getAll().then(setTypes).catch(() => {});
    warehouseApi.getAll().then(setWarehouses).catch(() => {});
    if (isSuperAdmin) companyApi.getAll().then(setCompanies).catch(() => {});
  }, [isSuperAdmin]);

  // A super admin sees every company's types/warehouses mixed together; scope each list down to
  // the company actually selected (plus shared warehouses, which any company can use).
  const availableTypes = useMemo(
    () => types.filter(t => t.companyId === relevantCompanyId),
    [types, relevantCompanyId]
  );
  const availableWarehouses = useMemo(
    () => warehouses.filter(w => !w.companyId || w.companyId === relevantCompanyId),
    [warehouses, relevantCompanyId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleCompanyChange = (e) => {
    // Changing company invalidates any type/warehouse picked for the previous company.
    setFormData(prev => ({ ...prev, companyId: e.target.value, typeId: '', warehouseId: '' }));
    setBoxLocationId('');
  };

  const handleWarehouseChange = (e) => {
    setFormData(prev => ({ ...prev, warehouseId: e.target.value }));
    setBoxLocationId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setError('Document title is required.');
    if (isSuperAdmin && !formData.companyId) return setError('Select which company this document belongs to.');

    try {
      const payload = {
        documentNumber: formData.documentNumber.trim() || undefined,
        title: formData.title.trim(),
        typeId: formData.typeId || undefined,
        custodian: formData.custodian.trim() || undefined,
        pages: formData.pages ? Number(formData.pages) : undefined,
        archivedDate: formData.archivedDate || undefined,
        notes: formData.notes.trim() || undefined,
        boxLocationId: boxLocationId || undefined,
        companyId: isSuperAdmin ? formData.companyId : undefined,
        externalReference: handoffRef || undefined,
      };
      const newDoc = await addDocument(payload);
      setCreatedDocNumber(newDoc.documentNumber);
      setSuccess(true);
      setError('');
      if (isEmbedded) {
        // The server-to-server filing callback (if configured) is the source of truth for the
        // DMS's own record state -- this postMessage is purely so their popup's UI can react
        // immediately (close itself, show its own confirmation) without polling.
        window.parent.postMessage({
          source: 'bika-archive',
          type: 'filing-complete',
          status: 'success',
          documentId: newDoc.id,
          documentNumber: newDoc.documentNumber,
        }, '*');
      } else {
        setTimeout(() => navigate(`/document/${newDoc.id}`), 1500);
      }
    } catch (err) {
      const message = extractErrorMessage(err, 'An error occurred while saving the document.');
      setError(message);
      if (isEmbedded) {
        window.parent.postMessage({
          source: 'bika-archive',
          type: 'filing-complete',
          status: 'error',
          message,
        }, '*');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center space-x-4 mb-8">
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
          <FolderPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">
            Add document to warehouse
          </h1>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
            Register a new archived document and its exact storage location.
          </p>
        </div>
      </div>

      {handoffRef && !success && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/25 dark:text-blue-300 flex items-start space-x-3 shadow-sm">
          <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Filing from the Bika Filing System</p>
            <p className="text-xs mt-0.5 opacity-80">Reference: {handoffRef}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300 flex items-start space-x-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Document registered successfully!</p>
            <p className="text-xs mt-0.5 opacity-80">Redirecting to file sheet for {createdDocNumber}…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-3 animate-fade-in shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <FileText className="h-4 w-4 text-blue-500" />
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Document Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {isSuperAdmin && (
              <div className="md:col-span-2">
                <FieldLabel required>Company</FieldLabel>
                <select name="companyId" value={formData.companyId} onChange={handleCompanyChange} className={`${inputClass} cursor-pointer`} required>
                  <option value="">Select a company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <FieldLabel>Document number</FieldLabel>
              <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="Auto-generated if left blank -- any format" className={`${inputClass} font-mono`} />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select name="typeId" value={formData.typeId} onChange={handleChange} className={`${inputClass} cursor-pointer`} disabled={isSuperAdmin && !formData.companyId}>
                <option value="">No category</option>
                {availableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {isSuperAdmin && formData.companyId && availableTypes.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">This company has no categories yet -- add one under Categories.</p>
              )}
            </div>
            <div className="md:col-span-2">
              <FieldLabel required>Title</FieldLabel>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Annual Financial Report" className={inputClass} required />
            </div>
            <div>
              <FieldLabel>Custodian</FieldLabel>
              <input type="text" name="custodian" value={formData.custodian} onChange={handleChange} placeholder="M. Alvarez" className={inputClass} />
            </div>
            <div>
              <FieldLabel>Pages</FieldLabel>
              <input type="number" name="pages" value={formData.pages} onChange={handleChange} min="0" className={`${inputClass} font-mono`} />
            </div>
            <div>
              <FieldLabel>Archived date</FieldLabel>
              <input type="date" name="archivedDate" value={formData.archivedDate} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Summary notes</FieldLabel>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="Optional notes or context about this archive..." className={`${inputClass} resize-none`} />
            </div>
          </div>
        </div>

        {/* Storage Location: drills down whatever hierarchy this warehouse actually has */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <MapPin className="h-4 w-4 text-blue-500" />
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Storage Location</h4>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Optional -- you can register the document first and assign its shelf location later.
          </p>
          <div className="space-y-4">
            <div className="max-w-sm">
              <FieldLabel>Warehouse</FieldLabel>
              <select
                value={formData.warehouseId}
                onChange={handleWarehouseChange}
                className={`${inputClass} cursor-pointer`}
                disabled={isSuperAdmin && !formData.companyId}
              >
                <option value="">No warehouse selected</option>
                {availableWarehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}{!w.companyId ? ' (Shared)' : ''}</option>
                ))}
              </select>
            </div>

            <LocationPicker warehouseId={formData.warehouseId} onChange={setBoxLocationId} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={success}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {success ? 'Saving…' : 'Register Document'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default AddDocumentPage;
