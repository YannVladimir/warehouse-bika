import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { documentApi, dashboardApi, searchHistoryApi } from '../services/documentApi';
import { useAuth } from './AuthContext';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [searchTotalElements, setSearchTotalElements] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentlyAccessed, setRecentlyAccessed] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, missing: 0, checkedOut: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadDashboard = useCallback(async () => {
    const [statsData, recentData, historyData] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRecent(),
      searchHistoryApi.getRecent(),
    ]);
    setStats(statsData);
    setRecentlyAccessed(recentData);
    setRecentSearches(historyData);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard().catch(() => {});
    }
  }, [isAuthenticated, loadDashboard]);

  const search = useCallback(async (query, filter = statusFilter, page = 0) => {
    setSearchQuery(query);
    setStatusFilter(filter);
    const backendStatus = filter === 'Checked Out' ? 'CHECKED_OUT' : filter === 'All' ? undefined : filter.toUpperCase();
    const result = await documentApi.search({ q: query, status: backendStatus, page });
    setSearchResults(result.content);
    setSearchPage(result.page);
    setSearchTotalPages(result.totalPages);
    setSearchTotalElements(result.totalElements);
    if (query && query.trim()) {
      searchHistoryApi.getRecent().then(setRecentSearches).catch(() => {});
    }
    return result;
  }, [statusFilter]);

  // Re-runs the current query/filter on a different page -- keeps SearchPage's pagination
  // controls simple (just pass a page number, no need to remember query/filter themselves).
  const goToSearchPage = useCallback((page) => search(searchQuery, statusFilter, page), [search, searchQuery, statusFilter]);

  const addDocument = useCallback(async (payload) => {
    const created = await documentApi.create(payload);
    loadDashboard().catch(() => {});
    return created;
  }, [loadDashboard]);

  const selectDocument = useCallback(async (id) => {
    const doc = await documentApi.getById(id);
    loadDashboard().catch(() => {});
    return doc;
  }, [loadDashboard]);

  return (
    <DocumentContext.Provider
      value={{
        searchResults,
        searchPage,
        searchTotalPages,
        searchTotalElements,
        recentSearches,
        recentlyAccessed,
        stats,
        searchQuery,
        statusFilter,
        setSearchQuery,
        setStatusFilter,
        search,
        goToSearchPage,
        addDocument,
        selectDocument,
        refresh: loadDashboard,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
