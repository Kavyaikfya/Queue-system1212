import React from 'react';
import {
  Home,
  Compass,
  Ticket,
  Bell,
  User,
  Settings,
  Shield,
  Briefcase,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenAI: () => void;
  onOpenSettings: () => void;
  unreadNotifications: number;
  activeVisitCount: number;
  theme: string;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenSettings,
  unreadNotifications,
  activeVisitCount,
  theme,
  onToggleTheme,
}) => {
  const { isSuperAdmin, isOrgAdmin, isStaff } = useAuth();

  // Clean 5-Item Navigation specified in requirements
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'my-services',
      label: 'My Services',
      icon: <Ticket className="w-5 h-5" />,
      badge: activeVisitCount > 0 ? `${activeVisitCount}` : null,
      badgeColor: 'bg-cyan-500 text-slate-950',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotifications > 0 ? `${unreadNotifications}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const hasStaffAccess = isStaff || isOrgAdmin || isSuperAdmin;
  const hasAdminAccess = isOrgAdmin || isSuperAdmin;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0 border-r border-slate-800/80 bg-[#040816]/90 backdrop-blur-2xl z-40 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <Logo size="md" showText={true} />
        </div>
      </div>

      {/* Main 5-item Clean Nav Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-6 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          NAVIGATION
        </div>

        {primaryNavItems.map((item) => {
          const isActive =
            currentPage === item.id ||
            (item.id === 'dashboard' && currentPage === 'home') ||
            (item.id === 'my-services' && (currentPage === 'my-visit' || currentPage === 'my-queue'));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <span
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Staff / Admin Section if authorized */}
        {(hasStaffAccess || hasAdminAccess) && (
          <div className="pt-6 mt-5 border-t border-slate-800/80">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              OPERATIONS
            </div>
            {hasStaffAccess && (
              <button
                onClick={() => onNavigate('staff')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  currentPage === 'staff'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Staff Counter</span>
              </button>
            )}
            {hasAdminAccess && (
              <button
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  currentPage === 'admin'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Admin Operations</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Compact Footer: Settings & Theme */}
      <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-cyan-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
