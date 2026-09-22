import React from 'react';
import { Home, Compass, Ticket, Bell, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotification();

  const isHome = currentPage === 'dashboard' || currentPage === 'home';
  const isServices = currentPage === 'services';
  const isMyServices = currentPage === 'my-services' || currentPage === 'my-visit' || currentPage === 'my-queue';
  const isAlerts = currentPage === 'alerts' || currentPage === 'notifications';
  const isProfile = currentPage === 'profile' || currentPage === 'login' || currentPage === 'register';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#04091a]/95 backdrop-blur-2xl border-t border-cyan-500/20 px-3 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all"
      style={{
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      {/* 1. HOME */}
      <button
        id="mobile-nav-home"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
          isHome
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isHome ? 'bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''}`}>
          <Home className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Home</span>
        {isHome && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </button>

      {/* 2. SERVICES */}
      <button
        id="mobile-nav-services"
        onClick={() => onNavigate('services')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
          isServices
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isServices ? 'bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Services</span>
        {isServices && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </button>

      {/* 3. MY SERVICES */}
      <button
        id="mobile-nav-my-services"
        onClick={() => onNavigate('my-services')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
          isMyServices
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isMyServices ? 'bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''}`}>
          <Ticket className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold whitespace-nowrap">
          My Services
        </span>
        {isMyServices && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </button>

      {/* 4. ALERTS */}
      <button
        id="mobile-nav-alerts"
        onClick={() => onNavigate('alerts')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
          isAlerts
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all relative ${isAlerts ? 'bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''}`}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#04091a] animate-pulse"></span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Alerts</span>
        {isAlerts && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </button>

      {/* 5. PROFILE */}
      <button
        id="mobile-nav-profile"
        onClick={() => onNavigate(user ? 'profile' : 'login')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
          isProfile
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isProfile ? 'bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''}`}>
          {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
          {user ? 'Profile' : 'Sign In'}
        </span>
        {isProfile && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </button>
    </nav>
  );
};
