import React from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Plus, Sun, Moon, LogOut, Menu, X, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import logoBika from '../assets/logo-bika.png';

export const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const canManageDocuments = user.role === 'SUPER_ADMIN' || user.role === 'COMPANY_ADMIN' || user.role === 'EXTERNAL_FILER';

  const navItems = [
    { path: '/', label: 'Search', icon: Search },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(canManageDocuments ? [{ path: '/add', label: 'Add', icon: Plus }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-1.5 transition-all duration-200 group-hover:scale-105">
              <img src={logoBika} alt="Bika Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-800 dark:text-white text-base leading-none">
                Bika Archive
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-widest mt-0.5 leading-none uppercase">
                Warehouse Document System
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4 text-amber-400" />
                : <Moon className="h-4 w-4 text-blue-600" />
              }
            </button>

            {/* Profile Avatar Trigger */}
            <Link
              to="/profile"
              className="flex items-center space-x-2 p-1.5 pr-3 border border-slate-200 bg-white text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
            >
              <div className="h-6.5 w-6.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                {user.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="hidden sm:inline text-xs">{user.fullName.split(' ')[0]}</span>
            </Link>

            {/* Sign Out (Desktop) */}
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-500 rounded-xl text-sm font-medium shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/30 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl md:hidden border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 dark:border-slate-800 dark:bg-slate-950 shadow-xl animate-fade-in">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <User className="h-5 w-5" />
              <span>Profile Settings</span>
            </NavLink>

            <button
              onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              className="flex w-full items-center space-x-3 px-3 py-3 text-left text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 text-sm font-medium transition-all border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 cursor-pointer rounded-xl"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-5 dark:border-slate-800 dark:bg-slate-950 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 dark:text-slate-600">
          Bika Archive — Production-ready warehouse document location system
        </div>
      </footer>
    </div>
  );
};
export default Layout;
