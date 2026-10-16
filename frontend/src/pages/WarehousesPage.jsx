import React, { useState, useEffect, useCallback } from 'react';
import { warehouseApi, locationApi } from '../services/adminApi';
import { extractErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Warehouse, Plus, X, ChevronRight, ChevronDown, ArrowLeft, Trash2,
  Layers, Box, AlertCircle
} from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

// Common suggestions only -- the hierarchy is company-defined, any free-text label is valid and
// levels can be skipped entirely (e.g. Wing -> Cabinet, no Floor/Room/Rack/Shelf at all).
const TYPE_SUGGESTIONS = ['Building', 'Floor', 'Room', 'Wing', 'Rack', 'Shelf', 'Cabinet', 'Drawer', 'Box'];

const LocationNodeItem = ({ node, depth, onAddChild, onDelete, canManage }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = node.storageUnit ? Box : Layers;
  const color = node.storageUnit
    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10';

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }} className={depth > 0 ? 'mt-2 border-l border-slate-100 dark:border-slate-800 pl-4' : 'mt-2'}>
      <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm group">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={() => setExpanded(e => !e)} className="text-slate-300 dark:text-slate-600 shrink-0 cursor-pointer" disabled={!hasChildren}>
            {hasChildren ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="inline-block w-4" />}
          </button>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-[9px] font-bold uppercase tracking-wider block ${color.split(' ')[0]}`}>{node.nodeType}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">{node.name}</span>
          </div>
          {node.capacity != null && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">cap. {node.capacity}</span>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!node.storageUnit && (
              <button
                onClick={() => onAddChild(node)}
                title="Add a location inside this one"
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(node)}
              title="Delete"
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <LocationNodeItem key={child.id} node={child} depth={depth + 1} onAddChild={onAddChild} onDelete={onDelete} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
};

const emptyLocationForm = { nodeType: '', name: '', description: '', capacity: '', storageUnit: false };

export const WarehousesPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);

  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '', city: '', managerName: '' });

  // A shared warehouse (created by a super admin) has no owning company, so any tenant can use
  // its boxes -- but only a super admin can add/remove structure inside it.
  const canManageSelectedTree = selectedWarehouse && (isSuperAdmin || selectedWarehouse.companyId === user.companyId);

  // Adding a location node: either a root (parent = null) or a child of `parentNode`.
  const [locationFormParent, setLocationFormParent] = useState(undefined); // undefined = closed, null = root
  const [locationForm, setLocationForm] = useState(emptyLocationForm);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    warehouseApi.getAll().then(setWarehouses).finally(() => setLoading(false));
  }, []);

  const loadTree = useCallback((warehouseId) => {
    setTreeLoading(true);
    warehouseApi.getLocationTree(warehouseId).then(setTree).finally(() => setTreeLoading(false));
  }, []);

  const openWarehouse = (wh) => {
    setSelectedWarehouse(wh);
    loadTree(wh.id);
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseForm.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const added = await warehouseApi.create(warehouseForm);
      setWarehouses(prev => [...prev, added]);
      setWarehouseForm({ name: '', address: '', city: '', managerName: '' });
      setShowWarehouseForm(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create warehouse.'));
    } finally {
      setSaving(false);
    }
  };

  const openAddLocation = (parentNode) => {
    setError('');
    setLocationForm(emptyLocationForm);
    setLocationFormParent(parentNode); // null for a root node
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    if (!locationForm.name.trim() || !locationForm.nodeType.trim()) return;
    setSaving(true);
    setError('');
    try {
      await locationApi.create({
        warehouseId: selectedWarehouse.id,
        parentId: locationFormParent ? locationFormParent.id : null,
        nodeType: locationForm.nodeType.trim(),
        name: locationForm.name,
        description: locationForm.description || undefined,
        capacity: locationForm.capacity ? Number(locationForm.capacity) : undefined,
        storageUnit: locationForm.storageUnit,
      });
      loadTree(selectedWarehouse.id);
      setLocationFormParent(undefined);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create location.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async (node) => {
    if (!window.confirm(`Delete "${node.name}" and everything inside it?`)) return;
    try {
      await locationApi.remove(node.id);
      loadTree(selectedWarehouse.id);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not delete location.'));
    }
  };

  // ── Warehouse list view ──────────────────────────────────────────────────
  if (!selectedWarehouse) {
    return (
      <div className="w-full animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
                <Warehouse className="h-5 w-5" />
              </div>
              Storage Locations
            </h1>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
              Warehouses and their location tree -- define whatever levels fit how your company archives things.
            </p>
          </div>
          <button
            onClick={() => { setError(''); setShowWarehouseForm(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Warehouse</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
            No warehouses registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                onClick={() => openWarehouse(wh)}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/40 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {wh.name}
                  </h3>
                  {wh.companyName ? (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {wh.companyName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                      Shared
                    </span>
                  )}
                </div>
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {(wh.address || wh.city) && <p>Location: <strong className="text-slate-700 dark:text-slate-300">{[wh.address, wh.city].filter(Boolean).join(', ')}</strong></p>}
                  {wh.managerName && <p>Manager: <strong className="text-slate-700 dark:text-slate-300">{wh.managerName}</strong></p>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>View location tree</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showWarehouseForm && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowWarehouseForm(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-500" />
                    Add Warehouse
                  </h2>
                  <button onClick={() => setShowWarehouseForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {error && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {isSuperAdmin ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30">
                    This will be a <strong className="text-indigo-600 dark:text-indigo-400">shared</strong> warehouse -- any company can be assigned boxes inside it, but only a super admin can manage its structure.
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    This warehouse will belong exclusively to your company.
                  </p>
                )}
                <form onSubmit={handleWarehouseSubmit} id="warehouse-form" className="space-y-4">
                  <div>
                    <FieldLabel required>Warehouse Name</FieldLabel>
                    <input type="text" value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="Warehouse C" className={inputClass} required />
                  </div>
                  <div>
                    <FieldLabel>Street Address</FieldLabel>
                    <input type="text" value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} placeholder="99 Storage Way, Sector 5" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <input type="text" value={warehouseForm.city} onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })} placeholder="Westport" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Manager</FieldLabel>
                    <input type="text" value={warehouseForm.managerName} onChange={(e) => setWarehouseForm({ ...warehouseForm, managerName: e.target.value })} placeholder="S. Croft" className={inputClass} />
                  </div>
                </form>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
                <button type="button" onClick={() => setShowWarehouseForm(false)} className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center">
                  Cancel
                </button>
                <button type="submit" form="warehouse-form" disabled={saving} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Location tree drill-down view ────────────────────────────────────────
  return (
    <div className="w-full animate-fade-in">
      <button
        onClick={() => setSelectedWarehouse(null)}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to warehouses</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">{selectedWarehouse.name}</h1>
          {!selectedWarehouse.companyName && (
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">Shared</span>
          )}
        </div>
        {!treeLoading && canManageSelectedTree && (
          <button
            onClick={() => openAddLocation(null)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add root location
          </button>
        )}
      </div>

      {!canManageSelectedTree && (
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          This is a shared facility -- you can assign documents to its boxes, but only a super admin can manage its structure.
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {treeLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
          No locations set up in this warehouse yet.
        </div>
      ) : (
        <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          {tree.map((node) => (
            <LocationNodeItem key={node.id} node={node} depth={0} onAddChild={openAddLocation} onDelete={handleDeleteNode} canManage={canManageSelectedTree} />
          ))}
        </div>
      )}

      {/* Add Location Node drawer */}
      {locationFormParent !== undefined && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setLocationFormParent(undefined)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  Add Location
                </h2>
                <button onClick={() => setLocationFormParent(undefined)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {locationFormParent && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Inside <strong className="text-slate-600 dark:text-slate-300">{locationFormParent.name}</strong></p>
              )}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleLocationSubmit} id="location-form" className="space-y-4">
                <div>
                  <FieldLabel required>Type</FieldLabel>
                  <input
                    type="text"
                    list="node-type-suggestions"
                    value={locationForm.nodeType}
                    onChange={(e) => setLocationForm({ ...locationForm, nodeType: e.target.value })}
                    placeholder="e.g. Floor, Wing, Cabinet -- whatever fits"
                    className={inputClass}
                    required
                  />
                  <datalist id="node-type-suggestions">
                    {TYPE_SUGGESTIONS.map(t => <option key={t} value={t} />)}
                  </datalist>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Any label works -- this company's hierarchy doesn't have to match anyone else's.</p>
                </div>
                <div>
                  <FieldLabel required>Name</FieldLabel>
                  <input type="text" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} placeholder="e.g. Cabinet 7" className={inputClass} required />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea value={locationForm.description} onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })} rows="2" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <FieldLabel>Capacity</FieldLabel>
                  <input type="number" value={locationForm.capacity} onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value })} className={`${inputClass} font-mono`} min="0" placeholder="Optional" />
                </div>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationForm.storageUnit}
                    onChange={(e) => setLocationForm({ ...locationForm, storageUnit: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Documents can be stored directly here (this becomes a leaf -- no locations can be added inside it)
                  </span>
                </label>
              </form>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
              <button type="button" onClick={() => setLocationFormParent(undefined)} className="w-1/2 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer text-center">
                Cancel
              </button>
              <button type="submit" form="location-form" disabled={saving} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center disabled:opacity-50">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WarehousesPage;
