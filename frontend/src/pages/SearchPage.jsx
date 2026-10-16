import React, { useState, useEffect } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { DocumentCard } from '../components/DocumentCard';
import { RecentSearches } from '../components/RecentSearches';
import { Search, X, Sparkles, LayoutDashboard, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SearchPage = () => {
  const {
    searchResults,
    searchPage,
    searchTotalPages,
    searchTotalElements,
    recentlyAccessed,
    searchQuery,
    statusFilter,
    search,
    goToSearchPage,
    setSearchQuery,
    setStatusFilter
  } = useDocuments();

  const [inputVal, setInputVal] = useState(searchQuery);

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    search(inputVal, statusFilter);
  };

  const handleClear = () => {
    setInputVal('');
    search('', 'All');
  };

  const handleSuggestClick = (s) => {
    setInputVal(s);
    search(s, 'All');
  };

  const handleFilterClick = (filter) => {
    setStatusFilter(filter);
    search(inputVal, filter);
  };

  // Filtering now happens server-side (full-text search + status filter); searchResults is
  // already the correct result set for the current query.
  const filteredDocs = searchQuery ? searchResults : [];

  // Only 3 statuses now
  const filterOptions = ['All', 'Available', 'Checked Out', 'Missing'];

  return (
    <div className="w-full">
      {!searchQuery ? (
        /* ========== LANDING ========== */
        <div className="animate-fade-in">
          {/* Hero */}
          <div className="text-center py-12 md:py-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Warehouse Document Location System</span>
            </div>

            <h1 className="font-extrabold text-4xl md:text-5xl leading-tight tracking-tight text-slate-800 dark:text-white">
              Find any archived document <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
                in seconds
              </span>
            </h1>

            <p className="mt-4 text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Enter a document number to trace its exact physical location — from warehouse and zone right down to the shelf and box.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-14">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search by document number, title, or category..."
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200 rounded-2xl shadow-md transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900 dark:border-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/10 text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </form>
            <div className="flex items-center justify-center space-x-2 mt-3 text-xs font-medium text-slate-400 dark:text-slate-600">
              <span>Try</span>
              <button onClick={() => handleSuggestClick('DOC-2024-0001')} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold">
                DOC-2024-0001
              </button>
              <span>or search by title</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recently Accessed */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                  Recently accessed
                </h2>
                <Link to="/dashboard" className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  <span>View dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentlyAccessed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                  {recentlyAccessed.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                  No documents accessed recently
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-5">
              <RecentSearches />
              <Link
                to="/dashboard"
                className="group flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-blue-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Admin dashboard
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Stats & archive overview
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

      ) : (
        /* ========== RESULTS ========== */
        <div className="animate-fade-in">
          {/* Compact Search */}
          <div className="max-w-3xl mx-auto mb-8">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 dark:bg-slate-900 dark:border-slate-700 dark:focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
              />
              <button type="button" onClick={handleClear} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Result count + filter chips */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400">{searchTotalElements}</span> result{searchTotalElements !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleFilterClick(opt)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        statusFilter === opt
                          ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDocs.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
                  </div>
                  {searchTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => goToSearchPage(searchPage - 1)}
                        disabled={searchPage === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                      </button>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        Page {searchPage + 1} of {searchTotalPages}
                      </span>
                      <button
                        onClick={() => goToSearchPage(searchPage + 1)}
                        disabled={searchPage + 1 >= searchTotalPages}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-14 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 mb-4">
                    <Search className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No results found</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1.5">
                    We couldn't find any documents matching your criteria. Try a different ID or title.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <RecentSearches />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchPage;
