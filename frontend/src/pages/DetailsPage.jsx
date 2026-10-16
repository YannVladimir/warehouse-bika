import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { documentApi, documentTypeApi } from '../services/documentApi';
import { warehouseApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { statusMeta, STATUS_META } from '../utils/documentDisplay';
import { LocationPicker } from '../components/LocationPicker';
import {
  ArrowLeft, FileText, Copy, Check, Pencil, X, AlertCircle,
  MapPin, Layers, Box, Building, User, Calendar, Notebook, Tag, Send
} from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children}
  </label>
);

const MetaRow = ({ icon: Icon, label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div className="flex items-center space-x-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium">
        <Icon className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm text-right max-w-[55%] truncate">
        {value}
      </span>
    </div>
  );
};

// Generic over any hierarchy depth: [Warehouse, ...segments] rather than fixed warehouse/zone/shelf/box.
const LocationTree = ({ location }) => {
  const levels = [
    { label: 'Warehouse', value: location.warehouseName },
    ...location.segments.map((s) => ({ label: s.nodeType, value: s.name })),
  ];

  return (
    <div className="relative">
      <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800" />
      <div className="space-y-2">
        {levels.map(({ label, value }, index) => {
          const isLast = index === levels.length - 1;
          return (
            <div key={index} className="relative flex items-center" style={{ paddingLeft: `${index * 16}px` }}>
              <div
                className={`absolute flex items-center justify-center ${
                  isLast
                    ? 'w-[14px] h-[14px] -left-[7px] rounded-full bg-blue-600 dark:bg-blue-500 ring-2 ring-white dark:ring-slate-900'
                    : 'w-[10px] h-[10px] -left-[5px] rounded-full bg-blue-300 dark:bg-blue-700 ring-2 ring-white dark:ring-slate-900'
                }`}
              />
              <div className={`ml-5 flex-1 flex items-center space-x-3 px-4 py-3.5 rounded-xl border transition-all ${
                isLast
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-sm shadow-blue-100 dark:shadow-blue-900/20'
                  : 'bg-white border-slate-100 dark:bg-slate-800/60 dark:border-slate-800'
              }`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isLast
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {isLast ? <Box className="h-4.5 w-4.5" /> : <Layers className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase block ${
                    isLast ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {label}
                  </span>
                  <span className={`text-sm font-extrabold mt-0.5 block ${
                    isLast ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectDocument } = useDocuments();
  const { user } = useAuth();
  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'COMPANY_ADMIN';

  const [doc, setDoc] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');

  const [statusSaving, setStatusSaving] = useState(false);

  const [types, setTypes] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationWarehouseId, setLocationWarehouseId] = useState('');
  const [pendingBoxLocationId, setPendingBoxLocationId] = useState('');
  const [locationError, setLocationError] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setNotFound(false);
    if (id) {
      selectDocument(id)
        .then((found) => { if (!cancelled) setDoc(found); })
        .catch(() => { if (!cancelled) setNotFound(true); });
    }
    return () => { cancelled = true; };
  }, [id, selectDocument]);

  useEffect(() => {
    if (!doc || !canManage) return;
    documentTypeApi.getAll().then(list => setTypes(list.filter(t => t.companyId === doc.companyId))).catch(() => {});
    warehouseApi.getAll().then(list => setWarehouses(list.filter(w => !w.companyId || w.companyId === doc.companyId))).catch(() => {});
  }, [doc, canManage]);

  const handleCopy = () => {
    if (!doc?.location) return;
    const path = [doc.location.warehouseName, ...doc.location.segments.map((s) => s.name)].join(' → ');
    navigator.clipboard.writeText(path)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setActionError('');
    setStatusSaving(true);
    try {
      const updated = await documentApi.updateStatus(doc.id, newStatus);
      setDoc(updated);
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not update status.'));
    } finally {
      setStatusSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      title: doc.title,
      typeId: doc.typeId || '',
      custodian: doc.custodian || '',
      pages: doc.pages ?? '',
      archivedDate: doc.archivedDate || '',
      notes: doc.notes || '',
    });
    setEditError('');
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return setEditError('Title is required.');
    setSavingEdit(true);
    setEditError('');
    try {
      const updated = await documentApi.update(doc.id, {
        title: editForm.title.trim(),
        typeId: editForm.typeId || undefined,
        custodian: editForm.custodian.trim() || undefined,
        pages: editForm.pages ? Number(editForm.pages) : undefined,
        archivedDate: editForm.archivedDate || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setDoc(prev => ({ ...prev, ...updated }));
      setShowEditForm(false);
    } catch (err) {
      setEditError(extractErrorMessage(err, 'Could not save changes.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const openLocationForm = () => {
    setLocationWarehouseId(doc.location?.warehouseId || '');
    setPendingBoxLocationId(doc.boxLocationId || '');
    setLocationError('');
    setShowLocationForm(true);
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    setLocationError('');
    try {
      const updated = await documentApi.updateLocation(doc.id, pendingBoxLocationId || null);
      setDoc(updated);
      setShowLocationForm(false);
    } catch (err) {
      setLocationError(extractErrorMessage(err, 'Could not update location.'));
    } finally {
      setSavingLocation(false);
    }
  };

  if (notFound) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Document not found</h2>
        <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">The requested document doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 mt-6 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to search</span>
        </button>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
      </div>
    );
  }

  const badgeStyle = statusMeta(doc.status);
  const segments = doc.location?.segments || [];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to search</span>
        </button>
        {canManage && (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Details
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                {doc.documentNumber}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1 leading-snug">
                {doc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2">
                <span className="flex items-center space-x-1.5">
                  <Building className="h-3.5 w-3.5" />
                  <span>{doc.companyName}</span>
                </span>
                {doc.sourceSystem && (
                  <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Send className="h-3 w-3" />
                    <span>Filed via Bika Filing System</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="self-start md:self-center">
              <select
                value={doc.status}
                onChange={handleStatusChange}
                disabled={statusSaving}
                className={`appearance-none cursor-pointer flex items-center px-3.5 py-2 rounded-full border text-xs font-bold uppercase tracking-wider disabled:opacity-60 ${badgeStyle.badge}`}
              >
                {Object.keys(STATUS_META).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          ) : (
            <span className={`self-start md:self-center flex items-center space-x-1.5 px-3.5 py-2 rounded-full border text-xs font-bold uppercase tracking-wider shrink-0 ${badgeStyle.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dot}`} />
              <span>{badgeStyle.label}</span>
            </span>
          )}
        </div>

        {/* Location breadcrumb strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {doc.location ? (
            [{ label: doc.location.warehouseName }, ...segments.map((s) => ({ label: s.name }))].map((item, i, arr) => (
              <React.Fragment key={i}>
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className={i === arr.length - 1 ? 'font-bold text-slate-700 dark:text-slate-200' : ''}>{item.label}</span>
                </span>
                {i < arr.length - 1 && <span className="text-slate-200 dark:text-slate-700">›</span>}
              </React.Fragment>
            ))
          ) : (
            <span className="italic text-slate-400 dark:text-slate-600">Not yet assigned to a shelf location</span>
          )}
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metadata */}
        <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-5">Metadata</h3>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            <MetaRow icon={FileText} label="Document number" value={doc.documentNumber} />
            <MetaRow icon={Building} label="Company" value={doc.companyName} />
            <MetaRow icon={Tag} label="Category" value={doc.typeName} />
            <MetaRow icon={User} label="Custodian" value={doc.custodian} />
            <MetaRow icon={Layers} label="Pages" value={doc.pages} />
            <MetaRow icon={Calendar} label="Archived date" value={doc.archivedDate} />
            {doc.sourceSystem && <MetaRow icon={Send} label="Filed by" value={doc.externalFilerName} />}
            {doc.externalReference && <MetaRow icon={Tag} label="Source reference" value={doc.externalReference} />}
          </div>
          {doc.notes && (
            <div className="mt-5 flex items-start space-x-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Notebook className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{doc.notes}</p>
            </div>
          )}
        </div>

        {/* Storage Location */}
        <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Storage Location</h3>
            <div className="flex items-center gap-2">
              {doc.location && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  {copied
                    ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Copied!</span></>
                    : <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
                  }
                </button>
              )}
              {canManage && (
                <button
                  onClick={openLocationForm}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{doc.location ? 'Move' : 'Assign'}</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            {doc.location ? (
              <LocationTree location={doc.location} />
            ) : (
              <div className="h-full flex items-center justify-center text-center text-sm text-slate-400 dark:text-slate-600 italic py-10">
                This document has not been assigned a shelf location yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Details drawer */}
      {showEditForm && editForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowEditForm(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-blue-500" />
                  Edit Details
                </h2>
                <button onClick={() => setShowEditForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {editError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
              <form onSubmit={handleEditSubmit} id="edit-doc-form" className="space-y-4">
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select value={editForm.typeId} onChange={(e) => setEditForm({ ...editForm, typeId: e.target.value })} className={`${inputClass} cursor-pointer`}>
                    <option value="">No category</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Custodian</FieldLabel>
                  <input type="text" value={editForm.custodian} onChange={(e) => setEditForm({ ...editForm, custodian: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Pages</FieldLabel>
                  <input type="number" min="0" value={editForm.pages} onChange={(e) => setEditForm({ ...editForm, pages: e.target.value })} className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <FieldLabel>Archived date</FieldLabel>
                  <input type="date" value={editForm.archivedDate} onChange={(e) => setEditForm({ ...editForm, archivedDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
                </div>
              </form>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
              <button type="button" onClick={() => setShowEditForm(false)} className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center">
                Cancel
              </button>
              <button type="submit" form="edit-doc-form" disabled={savingEdit} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50">
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Location drawer */}
      {showLocationForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowLocationForm(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  {doc.location ? 'Move Document' : 'Assign Location'}
                </h2>
                <button onClick={() => setShowLocationForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {locationError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}
              <form onSubmit={handleLocationSubmit} id="location-form" className="space-y-4">
                <div>
                  <FieldLabel>Warehouse</FieldLabel>
                  <select
                    value={locationWarehouseId}
                    onChange={(e) => { setLocationWarehouseId(e.target.value); setPendingBoxLocationId(''); }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">No warehouse selected</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{!w.companyId ? ' (Shared)' : ''}</option>)}
                  </select>
                </div>
                <LocationPicker
                  warehouseId={locationWarehouseId}
                  initialBoxId={locationWarehouseId === doc.location?.warehouseId ? doc.boxLocationId : undefined}
                  onChange={setPendingBoxLocationId}
                />
              </form>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
              <button type="button" onClick={() => setShowLocationForm(false)} className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center">
                Cancel
              </button>
              <button type="submit" form="location-form" disabled={savingLocation} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50">
                {savingLocation ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DetailsPage;
