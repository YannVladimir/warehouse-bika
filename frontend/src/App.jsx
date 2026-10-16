import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DocumentProvider } from './context/DocumentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { EmbedLayout } from './components/EmbedLayout';
import { SearchPage } from './pages/SearchPage';
import { DetailsPage } from './pages/DetailsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddDocumentPage } from './pages/AddDocumentPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { UsersPage } from './pages/UsersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HandoffPage } from './pages/HandoffPage';
import { ProfilePage } from './pages/ProfilePage';

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
    <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, bootstrapping } = useAuth();
  if (bootstrapping) return <FullScreenLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/handoff" element={<HandoffPage />} />
      <Route path="/embed" element={<EmbedLayout />}>
        <Route path="handoff" element={<HandoffPage targetPath="/embed/add" compact />} />
        <Route
          path="add"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER']}>
                <AddDocumentPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<SearchPage />} />
        <Route path="document/:id" element={<DetailsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="add" element={<RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER']}><AddDocumentPage /></RoleRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/companies" element={<RoleRoute roles={['SUPER_ADMIN']}><CompaniesPage /></RoleRoute>} />
        <Route path="admin/warehouses" element={<RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN']}><WarehousesPage /></RoleRoute>} />
        <Route path="admin/users" element={<RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN']}><UsersPage /></RoleRoute>} />
        <Route path="admin/categories" element={<RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN']}><CategoriesPage /></RoleRoute>} />
        <Route path="admin/reports" element={<RoleRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN']}><ReportsPage /></RoleRoute>} />
        <Route path="*" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DocumentProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DocumentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
