import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Activity,
  ChevronDown,
  Settings,
  ListOrdered,
  Sun,
  Moon,
  Laptop,
  Search,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { Logo } from './Logo';
import { SettingsModal } from './SettingsModal';
import { api } from '../services/api';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, loginWithGoogle, isSuperAdmin, isOrgAdmin, isStaff } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ facilities: any[]; services: any[]; queues: any[] }>({
    facilities: [],
    services: [],
    queues: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ facilities: [], services: [], queues: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(searchQuery.trim());
        setSearchResults(res);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Retrieve custom avatar or Google avatar
  const avatarUrl =
    user?.avatarUrl ||
    localStorage.getItem('fq_avatar_url') ||
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

  const displayName = user?.displayName || user?.fullName || 'User';

  const totalResults =
    searchResults.facilities.length + searchResults.services.length + searchResults.queues.length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#070e1e]/90 backdrop-blur-xl text-slate-900 dark:text-slate-100 transition-colors shadow-sm dark:shadow-lg dark:shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ========================================================
            LEFT: FAIRQUEUE Logo (mobile or compact fallback)
        ======================================================== */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none group shrink-0"
          onClick={() => onNavigate('dashboard')}
        >
          <Logo variant="navbar" />
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white font-sans">
                QE<span className="text-blue-500 dark:text-cyan-400">VORA</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[9px] font-bold tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 rounded-full border border-blue-200 dark:border-blue-500/30 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>SERVICE PLATFORM</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:block leading-none mt-0.5 tracking-wide">
              Real-World Service Completion
            </p>
          </div>
        </div>

        {/* ========================================================
            CENTER: Desktop Global Search Bar (Requirement 12 & 38)
        ======================================================== */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (totalResults > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search services, notices, hospitals, banks…"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-100 dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0b162b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 max-h-96 overflow-y-auto custom-scrollbar animate-fade-in">
              {totalResults === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isSearching ? 'Searching visit platform...' : 'No facilities or services found matching your query.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Facilities */}
                  {searchResults.facilities.length > 0 && (
                    <div>
                      <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Facilities ({searchResults.facilities.length})
                      </div>
                      {searchResults.facilities.map((fac) => (
                        <div
                          key={fac.id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            onNavigate('facilities');
                          }}
                          className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{fac.name}</div>
                              <div className="text-[11px] text-slate-400">{fac.address || 'Medical & Civic Center'}</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                            VIEW
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Services */}
                  {searchResults.services.length > 0 && (
                    <div>
                      <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Services ({searchResults.services.length})
                      </div>
                      {searchResults.services.map((svc) => (
                        <div
                          key={svc.id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            onNavigate('join');
                          }}
                          className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Layers className="w-4 h-4 text-cyan-500 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{svc.name}</div>
                              <div className="text-[11px] text-slate-400">{svc.organization_name} • Est. {svc.estimated_duration_min || 15}m</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
                            JOIN
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Queues */}
                  {searchResults.queues.length > 0 && (
                    <div>
                      <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Active Queues ({searchResults.queues.length})
                      </div>
                      {searchResults.queues.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            onNavigate('join');
                          }}
                          className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{q.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {q.waiting_count || 0} waiting • Status: {q.status}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT: Theme Toggle, Notifications, Profile (Requirement 12)
        ======================================================== */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* THEME TOGGLE (Requirement 14: ☀️ / 🌙) */}
          <div className="relative">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-sm flex items-center justify-center"
              title={`Toggle theme (Current: ${theme})`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>

          {/* NOTIFICATION BELL */}
          <button
            onClick={() => onNavigate('alerts')}
            className={`relative p-2.5 rounded-xl border transition-all ${
              currentPage === 'notifications'
                ? 'bg-sky-50 dark:bg-blue-950/60 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            aria-label="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white dark:text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-md shadow-sky-500/50">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* USER PROFILE OR GOOGLE LOGIN */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-sky-500/40 shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate max-w-[110px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 capitalize leading-tight font-mono">
                    {user.role.toLowerCase().replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-transform" />
              </button>

              {/* REQUIREMENT 18: PROFILE MENU */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-sky-500/20 py-2 z-50 animate-fade-in text-slate-900 dark:text-slate-100">
                  {/* Google Profile Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden border border-sky-500/40 shrink-0">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-sky-500" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-2.5 transition-colors"
                    >
                      <ListOrdered className="w-4 h-4 text-sky-500" />
                      <span>My Queues</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('alerts');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-2.5 transition-colors"
                    >
                      <Bell className="w-4 h-4 text-sky-500" />
                      <span>Notifications</span>
                    </button>

                    {/* Theme Selector Sub-row */}
                    <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 my-1 bg-slate-50/50 dark:bg-slate-850/50">
                      <span className="font-semibold text-[11px]">Theme:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-1 rounded-lg text-xs ${
                            theme === 'light' ? 'bg-sky-500 text-white font-bold' : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Light"
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-1 rounded-lg text-xs ${
                            theme === 'dark' ? 'bg-sky-500 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Dark"
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`p-1 rounded-lg text-xs ${
                            theme === 'system' ? 'bg-sky-500 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="System"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      onNavigate('home');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center space-x-2.5 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* REQUIREMENT 17: UNAUTHENTICATED: Log In & Continue with Google */
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Log In
              </button>

              <button
                onClick={loginWithGoogle}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center space-x-1.5 font-sans"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Continue with Google</span>
                <span className="sm:hidden">Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </header>
  );
};

