import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, ChevronRight } from 'lucide-react';
import { statusMeta } from '../utils/documentDisplay';

export const DocumentCard = ({ doc }) => {
  const navigate = useNavigate();
  const styles = statusMeta(doc.status);
  const segments = doc.location?.segments || [];

  return (
    <div
      onClick={() => navigate(`/document/${doc.id}`)}
      className="group flex flex-col p-5 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60 cursor-pointer animate-fade-in h-full"
    >
      {/* Top row: icon + document number + status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-600 uppercase truncate">
            {doc.documentNumber}
          </span>
        </div>

        <span className={`flex items-center shrink-0 space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${styles.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />
          <span>{styles.label}</span>
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 mb-1">
        {doc.title}
      </h3>

      {/* Company · Category */}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">
        {doc.companyName}
        {doc.typeName && <><span className="mx-1.5 text-slate-200 dark:text-slate-700">•</span>{doc.typeName}</>}
      </p>

      {/* Location breadcrumb — pushed to bottom, generic over any hierarchy depth */}
      {segments.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-3 border-t border-slate-50 dark:border-slate-800">
          <span className="flex items-center space-x-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <span>{doc.location.warehouseName}</span>
          </span>
          {segments.map((segment, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-3 w-3 text-slate-200 dark:text-slate-700 shrink-0" />
              <span className={i === segments.length - 1 ? 'font-semibold text-slate-600 dark:text-slate-300' : ''}>
                {segment.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
export default DocumentCard;
