import React, { useState, useEffect, useCallback } from 'react';
import { auditLogApi, searchHistoryApi } from '../services/documentApi';
import { ClipboardList, Search, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const ENTITY_TYPES = ['AUTH', 'COMPANY', 'USER', 'WAREHOUSE', 'LOCATION_NODE', 'DOCUMENT', 'DOCUMENT_TYPE'];

const emptyPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

const PaginationBar = ({ page, totalPages, totalElements, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Page {page + 1} of {totalPages} · {totalElements} total
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const ACTION_COLOR = {
  LOGIN_SUCCESS: 'text-emerald-600 dark:text-emerald-400',
  LOGIN_FAILURE: 'text-rose-600 dark:text-rose-400',
};

const AuditLogTab = () => {
  const [data, setData] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');

  const load = useCallback((page = 0, type = entityType) => {
    setLoading(true);
    auditLogApi.getAll({ entityType: type || undefined, page })
      .then(setData)
      .finally(() => setLoading(false));
  }, [entityType]);

  useEffect(() => { load(0, entityType); }, [entityType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filter:</span>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : data.content.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
          No audit events found.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Change</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{log.actorName || '—'}</div>
                      <div className="text-slate-400 dark:text-slate-500">{log.actorEmail || 'unknown'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">{log.entityType}</td>
                    <td className={`px-4 py-3 text-xs font-bold ${ACTION_COLOR[log.action] || 'text-slate-700 dark:text-slate-300'}`}>{log.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      {log.oldValue || log.newValue ? (
                        <span className="flex items-center gap-1.5 truncate">
                          {log.oldValue && <span className="line-through text-slate-400 dark:text-slate-600">{log.oldValue}</span>}
                          {log.oldValue && log.newValue && <ArrowRight className="h-3 w-3 shrink-0" />}
                          {log.newValue && <span className="text-slate-700 dark:text-slate-300 font-medium">{log.newValue}</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <PaginationBar page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={(p) => load(p)} />
    </div>
  );
};

const SearchActivityTab = () => {
  const [data, setData] = useState(emptyPage);
  const [loading, setLoading] = useState(true);

  const load = useCallback((page = 0) => {
    setLoading(true);
    searchHistoryApi.getReport(page).then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(0); }, [load]);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : data.content.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 dark:text-slate-500">
          No searches logged yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Query</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Results</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{row.userName}</div>
                      <div className="text-slate-400 dark:text-slate-500">{row.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">&ldquo;{row.query}&rdquo;</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">{row.resultCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <PaginationBar page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={load} />
    </div>
  );
};

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('audit');

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
            <ClipboardList className="h-5 w-5" />
          </div>
          Reports
        </h1>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Audit trail of every change, and a log of everyone's search activity.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Audit Log
        </button>
        <button
          onClick={() => setActiveTab('searches')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'searches' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <Search className="h-4 w-4" />
          Search Activity
        </button>
      </div>

      {activeTab === 'audit' ? <AuditLogTab /> : <SearchActivityTab />}
    </div>
  );
};
export default ReportsPage;
