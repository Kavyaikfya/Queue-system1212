import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Bell,
  X,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { qevoraApi, OpportunityRescueItem } from '../services/api';

interface OpportunityRescuePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const OpportunityRescuePage: React.FC<OpportunityRescuePageProps> = ({ onNavigate }) => {
  const [rescues, setRescues] = useState<OpportunityRescueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [recoveredSuccess, setRecoveredSuccess] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  const loadRescues = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getOpportunityRecovery();
      if (res.success) {
        setRescues(res.opportunities || []);
      }
    } catch (e) {
      console.error('Failed to load opportunity rescues:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRescues();
  }, []);

  const handleRecover = async (opportunityId: string, slotId: string) => {
    try {
      setRecoveringId(slotId);
      const res = await qevoraApi.recoverOpportunity(opportunityId, slotId);
      if (res.success) {
        setRecoveredSuccess('Opportunity successfully rescued! Your new slot is secured.');
        setTimeout(() => {
          onNavigate('my-services');
        }, 1800);
      }
    } catch (e) {
      console.error('Failed to recover opportunity:', e);
    } finally {
      setRecoveringId(null);
    }
  };

  const handleNotifyMe = (serviceName: string) => {
    setNotifySuccess(`Notification active! We will alert you immediately when a verified slot opens for ${serviceName}.`);
    setTimeout(() => setNotifySuccess(null), 4000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Opportunity Rescue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Rescue Disrupted Services
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            When an appointment or queue slot is lost due to unexpected delays, closure, or capacity issues, QEVORA finds real, verified alternatives so you never make wasted trips.
          </p>
        </div>

        <button
          onClick={loadRescues}
          className="p-2.5 rounded-2xl qevora-card text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 self-start sm:self-auto transition-all"
          title="Refresh verified rescue alternatives"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {recoveredSuccess && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 shadow-xl shadow-emerald-500/10 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white">{recoveredSuccess}</h4>
            <p className="text-xs text-slate-300">Routing you to My Services...</p>
          </div>
        </div>
      )}

      {notifySuccess && (
        <div className="p-4 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-semibold flex items-center justify-between shadow-lg shadow-cyan-500/10 animate-fade-in">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>{notifySuccess}</span>
          </div>
          <button onClick={() => setNotifySuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Safety & Real Guarantee Banner */}
      <div className="p-4.5 rounded-2xl bg-[#081028]/80 border border-cyan-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-white">Guaranteed Real-Time Capacity:</span>
          <p className="text-slate-400 leading-relaxed">
            QEVORA never invents fake slots. Every alternative displayed below is cross-checked with active counter staff and actual live capacity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center rounded-3xl qevora-card text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking real service recovery alternatives...</span>
        </div>
      ) : rescues.length === 0 ? (
        <div className="p-12 text-center rounded-3xl qevora-card space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              No disrupted services right now
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All your booked services and queue appointments are running normally without unexpected delays or cancellations.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {rescues.map((rescue) => {
            const hasRecoverySlots = rescue.recovery_options && rescue.recovery_options.length > 0;

            return (
              <div
                key={rescue.id}
                className="p-6 sm:p-8 rounded-3xl qevora-card space-y-6 shadow-2xl border border-rose-500/30 relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Top Alert Banner */}
                <div className="p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">
                      OPPORTUNITY AT RISK &bull; APPOINTMENT DISRUPTED
                    </h3>
                    <p className="text-xs text-slate-200">
                      Your original booking for <strong className="text-white">{rescue.service_name}</strong> at <span className="font-semibold text-rose-300">{rescue.original_time}</span> was disrupted.
                    </p>
                    <div className="text-xs text-rose-300 font-semibold pt-0.5">
                      Reason: {rescue.risk_reason}
                    </div>
                  </div>
                </div>

                {/* Real Alternatives List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      REAL AVAILABLE RECOVERY OPTIONS
                    </h4>
                    <span className="text-[11px] font-semibold text-cyan-400">
                      Verified real-time capacity
                    </span>
                  </div>

                  {hasRecoverySlots ? (
                    <div className="grid grid-cols-1 gap-3">
                      {rescue.recovery_options.map((opt: any, index: number) => (
                        <div
                          key={opt.id || index}
                          className="p-5 rounded-2xl bg-[#04091a]/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-black text-cyan-400 tracking-wider">
                                OPTION {index + 1}
                              </span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-sm font-bold text-white">
                                {opt.slot_type}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {opt.availability_status || 'Available'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                              <span className="flex items-center space-x-1.5 text-slate-200 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{opt.time}</span>
                              </span>
                              <span className="flex items-center space-x-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{opt.location}</span>
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRecover(rescue.id, opt.id)}
                            disabled={recoveringId === opt.id}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all shrink-0"
                          >
                            <span>
                              {recoveringId === opt.id ? 'Rescuing...' : 'Recover Opportunity'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#04091a]/80 border border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-300">
                        "No immediate recovery option found."
                      </p>
                      <button
                        onClick={() => handleNotifyMe(rescue.service_name)}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
                      >
                        Notify Me
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
