import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  Building2,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  TrendingDown,
} from 'lucide-react';
import { useNotification, NotificationItem } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

interface NotificationCenterPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const NotificationCenterPage: React.FC<NotificationCenterPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useNotification();

  const [activeFilter, setActiveFilter] = useState<'all' | 'queue' | 'system'>('all');

  useEffect(() => {
    refreshNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'queue') {
      return (
        notif.type.includes('queue') ||
        notif.type.includes('turn') ||
        notif.type.includes('position') ||
        notif.type.includes('return') ||
        notif.title.toLowerCase().includes('position') ||
        notif.title.toLowerCase().includes('turn') ||
        notif.title.toLowerCase().includes('queue')
      );
    }
    if (activeFilter === 'system') {
      return (
        notif.type.includes('system') ||
        notif.type.includes('alert') ||
        notif.type.includes('fairness') ||
        !notif.type.includes('queue')
      );
    }
    return true;
  });

  const getIconForType = (type: string, title: string) => {
    const t = (type + ' ' + title).toUpperCase();
    if (t.includes('SAFE RETURN') || t.includes('RETURN')) {
      return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    }
    if (t.includes('TURN ARRIVED') || t.includes('CALLED')) {
      return <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />;
    }
    if (t.includes('TURN APPROACHING')) {
      return <Clock className="w-5 h-5 text-sky-500" />;
    }
    if (t.includes('WAIT TIME') || t.includes('CHANGE')) {
      return <TrendingDown className="w-5 h-5 text-indigo-500" />;
    }
    if (t.includes('PAUSED') || t.includes('DELAY')) {
      return <PauseCircle className="w-5 h-5 text-red-500" />;
    }
    if (t.includes('RESUMED')) {
      return <PlayCircle className="w-5 h-5 text-emerald-500" />;
    }
    return <Info className="w-5 h-5 text-sky-500" />;
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    // Requirement 25: Click notification: Open related queue.
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              <span>Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30 animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Real-time alerts on turn announcements, Safe Return Windows, and queue speed updates.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('queue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeFilter === 'queue'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Queue & Turns
            </button>
            <button
              onClick={() => setActiveFilter('system')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeFilter === 'system'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              System & Windows
            </button>
          </div>

          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline font-mono">
            ● Live Push Active
          </span>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start justify-between gap-4 ${
                  !notif.is_read
                    ? 'bg-blue-50/70 dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-sky-300 dark:border-sky-500/40 shadow-sm dark:shadow-lg'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      !notif.is_read
                        ? 'bg-sky-100 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getIconForType(notif.type, notif.title)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4
                        className={`text-sm font-bold tracking-tight ${
                          !notif.is_read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                      {notif.message}
                    </p>
                    <div className="flex items-center space-x-3 pt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!notif.is_read ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-500/30 transition-colors"
                    >
                      Mark read
                    </button>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
              </div>
            ))
          ) : (
            /* REQUIREMENT 32: EMPTY STATE: "You’re all caught up." */
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-sky-600 dark:text-slate-400">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-200">
                You’re all caught up.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {activeFilter === 'all'
                  ? 'No pending notifications. You will receive live alerts when your position advances, or when your Safe Return Window is ready.'
                  : `No ${activeFilter} notifications available at the moment.`}
              </p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/20"
              >
                Go to My Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
