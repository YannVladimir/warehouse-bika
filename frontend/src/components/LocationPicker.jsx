import React, { useState, useEffect } from 'react';
import { warehouseApi } from '../services/adminApi';

const selectClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer";

function findPathToNode(nodes, targetId, pathSoFar = []) {
  for (const node of nodes) {
    const path = [...pathSoFar, node];
    if (node.id === targetId) return path;
    if (node.children?.length) {
      const found = findPathToNode(node.children, targetId, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Drills down a warehouse's location tree one level at a time. The hierarchy is company-defined
 * (any depth, any type names), so instead of a fixed set of dropdowns this walks the actual tree:
 * each selected node reveals its children as the next dropdown, and drilling stops as soon as a
 * node marked as a storage unit is chosen -- that's the final assignable location.
 */
export const LocationPicker = ({ warehouseId, initialBoxId, onChange }) => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState([]);

  useEffect(() => {
    if (!warehouseId) {
      setTree([]);
      setSelections([]);
      return;
    }
    setLoading(true);
    warehouseApi.getLocationTree(warehouseId)
      .then((fetchedTree) => {
        setTree(fetchedTree);
        const preselected = initialBoxId ? findPathToNode(fetchedTree, initialBoxId) : null;
        setSelections(preselected || []);
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
    // Only re-run when the warehouse changes -- initialBoxId is just a one-time seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const optionsForLevel = (levelIndex) => (levelIndex === 0 ? tree : (selections[levelIndex - 1]?.children || []));

  const handleSelect = (levelIndex, nodeId) => {
    const node = optionsForLevel(levelIndex).find(n => n.id === nodeId);
    const next = selections.slice(0, levelIndex);
    if (node) next[levelIndex] = node;
    setSelections(next);
    onChange(node?.storageUnit ? node.id : '');
  };

  if (!warehouseId) return null;
  if (loading) {
    return <p className="text-xs text-slate-400 dark:text-slate-500">Loading location tree…</p>;
  }
  if (tree.length === 0) {
    return <p className="text-xs text-amber-600 dark:text-amber-400">This warehouse has no location tree set up yet -- create one under Storage Locations first.</p>;
  }

  const levels = [];
  let options = tree;
  let i = 0;
  while (options.length > 0) {
    levels.push({ index: i, options });
    const chosen = selections[i];
    if (!chosen || chosen.storageUnit) break;
    options = chosen.children || [];
    i++;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {levels.map(({ index, options: levelOptions }) => (
        <div key={index}>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            {levelOptions[0]?.nodeType || 'Location'}
          </label>
          <select
            value={selections[index]?.id || ''}
            onChange={(e) => handleSelect(index, e.target.value)}
            className={selectClass}
          >
            <option value="">Select…</option>
            {levelOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.name}{o.storageUnit ? ' (storage)' : ''}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
export default LocationPicker;
