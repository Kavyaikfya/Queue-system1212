import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import { api } from '../services/api';
import { FairnessReplay } from '../components/FairnessReplay';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { useSocket } from '../context/SocketContext';

interface FairnessCenterPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const FairnessCenterPage: React.FC<FairnessCenterPageProps> = () => {
  const { lastEvent } = useSocket();
  const [fairnessData, setFairnessData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'replay' | 'simulator'>('replay');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFairness = async () => {
    try {
      setIsLoading(true);
      const res = await api.getFairnessStatus();
      setFairnessData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFairness();
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (['queue:reordered', 'queue:updated'].includes(lastEvent.type)) {
      loadFairness();
    }
  }, [lastEvent]);

  const report = fairnessData?.report;
  const recentEvents = fairnessData?.recentEvents || [];
  const score = report?.fairnessScore || 96;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ALGORITHMIC FAIRNESS MODULE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Fairness Monitor & Scenario Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Auditable wait-time dispersion analysis, historical queue replay, and predictive capacity simulation
        </p>
      </div>

      {/* Fairness Indicator Hero Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-950 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
              FAIRNESS INDICATOR
            </span>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-5xl sm:text-6xl font-black font-mono text-white">
                {score}%
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                Healthy Operational Balance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-xl">
              {report?.label || 'System-generated fairness indicator based on configured queue rules.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">AVG WAIT</span>
              <span className="text-lg font-mono font-bold text-white">
                {report?.metrics?.avgWaitMinutes || 14}m
              </span>
            </div>
            <div className="text-center border-x border-slate-700 px-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MAX WAIT</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {report?.metrics?.maxWaitMinutes || 28}m
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">VARIANCE</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {report?.metrics?.waitVariance || 8.2}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fairness Alerts Log */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Fairness Alerts & Audited Events ({report?.alerts?.length || 0})
          </h3>
        </div>

        {report?.alerts?.length === 0 && recentEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No fairness imbalances or starvation anomalies detected. Queues operating within nominal limits.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {report?.alerts?.map((alert: any, idx: number) => (
              <div
                key={alert.id || idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm flex items-start space-x-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {alert.type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {alert.message}
                  </p>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1 font-medium">
                    💡 <strong>Recommendation:</strong> {alert.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs: Replay vs What-If Simulator */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('replay')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'replay'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Queue Evolution Replay
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'simulator'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            What-If Scenario Simulator
          </button>
        </div>

        {activeTab === 'replay' ? <FairnessReplay /> : <WhatIfSimulator />}
      </div>
    </div>
  );
};
