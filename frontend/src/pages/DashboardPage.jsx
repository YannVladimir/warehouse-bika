import React from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { DocumentCard } from '../components/DocumentCard';
import { RecentSearches } from '../components/RecentSearches';
import { Files, AlertTriangle, Clock, BarChart2, CheckCircle, Building2, Warehouse, Users, Tags, ClipboardList, ArrowRight } from 'lucide-react';

export const DashboardPage = () => {
  const { stats, recentlyAccessed } = useDocuments();
  const { user } = useAuth();

  const cards = [
    {
      label: 'Total documents',
      value: stats.total,
      icon: Files,
      iconBg: 'bg-blue-50 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-l-4 border-l-blue-500'
    },
    {
      label: 'Available',
      value: stats.available,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-l-4 border-l-emerald-500'
    },
    {
      label: 'Missing',
      value: stats.missing,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 dark:bg-rose-500/15',
      iconColor: 'text-rose-600 dark:text-rose-400',
      border: 'border-l-4 border-l-rose-500'
    },
    {
      label: 'Checked out',
      value: stats.checkedOut,
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-l-4 border-l-amber-500'
    }
  ];

  const getPercentage = (count) => {
    if (!stats.total) return 0;
    return Math.round((count / stats.total) * 100);
  };

  const statusBars = [
    { label: 'Available', count: stats.available, bar: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Missing', count: stats.missing, bar: 'bg-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: 'Checked Out', count: stats.checkedOut, bar: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const allAdminLinks = [
    { label: 'Companies', to: '/admin/companies', icon: Building2, desc: 'Partner organizations', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10', roles: ['SUPER_ADMIN'] },
    { label: 'Storage Locations', to: '/admin/warehouses', icon: Warehouse, desc: 'Warehouses & location tree', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'User Accounts', to: '/admin/users', icon: Users, desc: 'Access control & roles', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'Categories', to: '/admin/categories', icon: Tags, desc: 'Document categories', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'Reports', to: '/admin/reports', icon: ClipboardList, desc: 'Audit log & search activity', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
  ];
  const adminLinks = allAdminLinks.filter((link) => link.roles.includes(user.role));

  return (
    <div className="w-full animate-fade-in">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Overview of the warehouse document archive.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${card.border}`}
          >
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white block mt-1.5 font-mono tabular-nums">
                {card.value}
              </span>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recently Accessed */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-5">
            Recently accessed documents
          </h2>
          {recentlyAccessed.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentlyAccessed.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-600 text-sm">
              No documents accessed recently
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Admin Quick Links */}
          {adminLinks.length > 0 && (
          <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Building2 className="h-4 w-4 text-blue-500" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Admin Controls</h4>
            </div>
            <div className="space-y-3">
              {adminLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${link.color}`}>
                      <link.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-750 dark:text-slate-200 block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {link.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                        {link.desc}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-350 dark:text-slate-650 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
          )}

          {/* Status Breakdown */}
          <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <BarChart2 className="h-4 w-4 text-blue-500" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Status breakdown</h4>
            </div>
            <div className="space-y-4">
              {statusBars.map((bar) => {
                const pct = getPercentage(bar.count);
                return (
                  <div key={bar.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">{bar.label}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono">{bar.count}</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${bar.bg}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${bar.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Searches */}
          <RecentSearches />
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
