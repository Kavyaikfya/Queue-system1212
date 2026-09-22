import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Users,
  FileText,
  Clock,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Ban,
  BellRing,
  Sparkles
} from 'lucide-react';
import { qevoraApi, ActionableAlert } from '../services/api';

interface AlertsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<ActionableAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getActionableAlerts();
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'TURN_APPROACHING':
        return <BellRing className="w-5 h-5 text-cyan-400 animate-bounce" />;
      case 'SERVICE_DELAY':
      case 'APPOINTMENT_CANCELLED':
        return <Ban className="w-5 h-5 text-rose-400" />;
      case 'GROUP_PENDING':
        return <Users className="w-5 h-5 text-amber-400" />;
      case 'DOCS_MISSING':
      default:
        return <FileText className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Important Alerts
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Only meaningful items that require your action. Zero spam, zero fake notifications, zero decorative statistics.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="p-2.5 rounded-2xl qevora-card text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 self-start sm:self-auto transition-all"
          title="Refresh alerts"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center rounded-3xl qevora-card text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking your service alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl qevora-card space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              All clear &bull; no actions required
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any pending document requirements, approaching queue turns, or unexpected service delays.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => {
                if (alert.action) {
                  onNavigate(alert.action.replace('/', ''));
                }
              }}
              className="p-5 rounded-2xl qevora-card qevora-card-interactive flex items-start space-x-4 cursor-pointer group shadow-lg"
            >
              <div className="p-3 rounded-2xl bg-[#04091a] border border-cyan-500/20 shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {alert.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{alert.time}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {alert.message}
                </p>

                {alert.action && (
                  <div className="pt-2 text-[11px] font-bold text-cyan-400 flex items-center space-x-1">
                    <span>Take Action</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
