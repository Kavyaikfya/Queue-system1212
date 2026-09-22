import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Building2,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

interface VisitReadinessPageProps {
  onNavigate: (page: string, params?: any) => void;
  serviceId?: string;
}

export const VisitReadinessPage: React.FC<VisitReadinessPageProps> = ({
  onNavigate,
  serviceId: initialServiceId,
}) => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '');
  const [readinessData, setReadinessData] = useState<{
    score: number;
    checklist: any[];
    total: number;
    completed: number;
  }>({
    score: 0,
    checklist: [],
    total: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Load available facilities and services
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setIsLoading(true);
        const res = await api.getFacilitiesIntelligence();
        const facs = res.facilities || [];
        setFacilities(facs);

        if (!selectedServiceId && facs.length > 0 && facs[0].services?.length > 0) {
          setSelectedServiceId(facs[0].services[0].id);
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFacilities();
  }, []);

  // Fetch readiness whenever selected service changes
  const loadReadiness = async (svcId: string) => {
    if (!svcId) return;
    try {
      const data = await api.getVisitReadiness(svcId);
      setReadinessData(data);
    } catch (err) {
      console.error('Error fetching readiness:', err);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      loadReadiness(selectedServiceId);
    }
  }, [selectedServiceId]);

  const handleToggle = async (reqId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setToggleLoading(reqId);
    try {
      await api.toggleReadinessItem(selectedServiceId, reqId, newStatus);
      await loadReadiness(selectedServiceId);
    } catch (err) {
      console.error('Failed to toggle readiness item:', err);
    } finally {
      setToggleLoading(null);
    }
  };

  const selectedService = facilities
    .flatMap((f) => f.services || [])
    .find((s) => s.id === selectedServiceId);

  // Group checklist items by category
  const categories = ['SERVICE REQUIREMENTS', 'WHAT TO BRING', 'DOCUMENTS', 'PREPARATION', 'IMPORTANT NOTES'];
  const groupedChecklist: Record<string, any[]> = {};
  categories.forEach((c) => {
    groupedChecklist[c] = [];
  });

  readinessData.checklist.forEach((item) => {
    const cat = item.category || 'SERVICE REQUIREMENTS';
    if (!groupedChecklist[cat]) {
      groupedChecklist[cat] = [];
    }
    groupedChecklist[cat].push(item);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VISIT PREPARATION PLATFORM</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Visit Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prepare everything required before arriving at the facility to ensure a seamless visit.
          </p>
        </div>

        {/* Service Selector */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="appearance-none pl-3.5 pr-9 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {facilities.map((fac) => (
                <optgroup key={fac.id} label={fac.name}>
                  {fac.services?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({fac.name})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none rotate-90" />
          </div>

          <button
            onClick={() => loadReadiness(selectedServiceId)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b162b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Refresh readiness"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Readiness Score Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/20 via-[#0b162b] to-indigo-900/20 border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {selectedService ? selectedService.name : 'Target Service'} Readiness
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {readinessData.score === 100
                ? 'Ready for Service!'
                : readinessData.score >= 70
                ? 'Well Prepared for Your Visit'
                : 'Action Required Before Visit'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {readinessData.score === 100
                ? 'All prerequisite documents and checks are complete. You can proceed directly to joining the queue.'
                : `${readinessData.total - readinessData.completed} preparation items still require your attention before queueing.`}
            </p>
          </div>

          {/* Big Score Gauge */}
          <div className="flex items-center space-x-4 shrink-0 bg-white/60 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    readinessData.score >= 80
                      ? 'text-emerald-500'
                      : readinessData.score >= 50
                      ? 'text-blue-500'
                      : 'text-amber-500'
                  } transition-all duration-700 ease-out`}
                  strokeDasharray={`${readinessData.score}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-xl text-slate-900 dark:text-white">
                {readinessData.score}%
              </span>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                COMPLETED
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {readinessData.completed} of {readinessData.total} items
              </div>
              <div className="text-[11px] text-blue-500 font-semibold mt-0.5">
                {readinessData.total > 0 && readinessData.completed === readinessData.total
                  ? 'All verified'
                  : 'Action needed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Shortcut Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('documents')}
          className="p-4 rounded-2xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between group transition-all shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                AI Document Pre-Check
              </h4>
              <p className="text-[11px] text-slate-400">Scan documents to verify completeness</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
        </div>

        <div
          onClick={() => onNavigate('facilities')}
          className="p-4 rounded-2xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between group transition-all shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors">
                Can I Avoid This Visit?
              </h4>
              <p className="text-[11px] text-slate-400">Explore digital online alternatives</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {categories.map((category) => {
          const items = groupedChecklist[category] || [];
          if (items.length === 0) return null;

          return (
            <div
              key={category}
              className="p-6 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>{category}</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {items.filter((i) => i.status === 'completed').length}/{items.length} Ready
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const isDone = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-start justify-between gap-4 group"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <button
                          onClick={() => handleToggle(item.id, item.status)}
                          disabled={toggleLoading === item.id}
                          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : toggleLoading === item.id ? (
                            <div className="w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : null}
                        </button>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isDone
                                ? 'text-slate-400 line-through'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {item.title}
                            {item.is_mandatory && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                                REQUIRED
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.is_mandatory
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? 'COMPLETE' : item.is_mandatory ? 'PENDING' : 'OPTIONAL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ready to join callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
        <div>
          <h4 className="font-bold text-sm">Checked your preparation?</h4>
          <p className="text-xs text-blue-100 mt-0.5">
            Proceed directly to the live queue when you have gathered all mandatory requirements.
          </p>
        </div>
        <button
          onClick={() => onNavigate('join')}
          className="px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 active:scale-95 font-bold text-xs shadow-md transition-all shrink-0 flex items-center space-x-2"
        >
          <span>JOIN LIVE QUEUE</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
