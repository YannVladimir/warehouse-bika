import React from 'react';
import { Clock } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/documentDisplay';

export const RecentSearches = () => {
  const { recentSearches, search } = useDocuments();
  const navigate = useNavigate();

  const handleItemClick = (query) => {
    search(query);
    navigate('/');
  };

  if (!recentSearches || recentSearches.length === 0) {
    return (
      <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-3">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold tracking-tight">Recent searches</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-600 italic">No recent searches yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-fade-in">
      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <Clock className="h-4 w-4 text-blue-500" />
        <h4 className="text-sm font-bold tracking-tight">Recent searches</h4>
      </div>

      <div className="space-y-0.5">
        {recentSearches.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.query)}
            className="flex items-center justify-between w-full px-2 py-2 text-left rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Clock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.query}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-wider shrink-0 pl-2">
              {formatRelativeTime(item.searchedAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default RecentSearches;
