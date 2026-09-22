import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
  Footprints,
  Activity,
} from 'lucide-react';
import { SafeReturnWindowResult } from '../services/safeReturnEngine';

interface SafeReturnWindowCardProps {
  windowData: SafeReturnWindowResult;
  onRefresh?: () => void;
}

export const SafeReturnWindowCard: React.FC<SafeReturnWindowCardProps> = ({ windowData }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);

  const {
    safeToLeave,
    statusLabel,
    leaveAfterFormatted,
    returnByFormatted,
    turnEstimateFormatted,
    estimatedMinutesToTurn,
    confidence,
    peopleAhead,
    activeCounters,
    reason,
    detailedCalculation,
  } = windowData;

  return (
    <>
      <div
        className={`p-6 rounded-3xl border transition-all duration-200 shadow-xl ${
          safeToLeave
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 light:bg-emerald-50/50 border-emerald-500/30 shadow-emerald-500/5'
            : 'bg-gradient-to-br from-red-950/30 via-slate-900 to-slate-900 dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900 light:bg-slate-50 border-slate-700/60 dark:border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-xl ${
                safeToLeave
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">
                FAIRQUEUE PREDICTIVE MOBILITY
              </span>
              <h3 className="text-sm font-black text-white dark:text-white light:text-slate-900">
                SAFE RETURN WINDOW
              </h3>
            </div>
          </div>

          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
              safeToLeave
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-red-950/80 text-red-300 border-red-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                safeToLeave ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            ></span>
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Core Prediction Times */}
        {safeToLeave ? (
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-white border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 light:text-slate-500 block font-bold uppercase tracking-wider">
                  RETURN BY
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                  {returnByFormatted}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Recommended safe cutoff
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-white border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 light:text-slate-500 block font-bold uppercase tracking-wider">
                  ESTIMATED TURN
                </span>
                <span className="text-xl sm:text-2xl font-black text-white dark:text-white light:text-slate-900 font-mono mt-0.5 block">
                  {turnEstimateFormatted}
                </span>
                <span className="text-[10px] text-sky-400 mt-0.5 block">
                  ~{estimatedMinutesToTurn}m wait
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-white border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 light:text-slate-500 block font-bold uppercase tracking-wider">
                  CONFIDENCE
                </span>
                <span className="text-lg font-black text-sky-300 font-mono mt-1 block">
                  {confidence}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {activeCounters} counters active
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              Based on current queue throughput, you may temporarily step away. Be sure to return by{' '}
              <strong className="text-emerald-400">{returnByFormatted}</strong> to avoid missing your turn.
            </p>
          </div>
        ) : (
          <div className="py-5 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-100 border border-slate-700/60 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase">
                  STAY NEARBY RECOMMENDED
                </h4>
                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                  Queue conditions are advancing too quickly ({peopleAhead} people ahead) to safely recommend stepping away.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Disclaimer & View Why Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs">
          <span className="text-[11px] text-slate-400 light:text-slate-500 italic">
            ⚠️ Queue conditions can change. Return early if possible.
          </span>

          <button
            onClick={() => setShowWhyModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-sky-300 dark:text-sky-300 light:text-blue-700 font-bold text-xs flex items-center space-x-1.5 transition-colors self-end sm:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>VIEW WHY</span>
          </button>
        </div>
      </div>

      {/* VIEW WHY MODAL */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-sky-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 dark:text-slate-100 light:text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold">Why This Return Window?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700">
                FAIRQUEUE calculates your mobility window using multi-counter throughput equations, continuous wait aging, and automatic safety buffers.
              </p>

              <div className="space-y-2 font-mono p-3.5 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">People Ahead:</span>
                  <span className="font-bold text-white dark:text-white light:text-slate-900">{peopleAhead}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Service Counters:</span>
                  <span className="font-bold text-white dark:text-white light:text-slate-900">{activeCounters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Throughput:</span>
                  <span className="font-bold text-emerald-400">
                    ~{detailedCalculation.throughputPerMinute.toFixed(2)} served/min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Safety Buffer:</span>
                  <span className="font-bold text-amber-400">
                    {detailedCalculation.safetyBufferMinutes} min reserved
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-1.5">
                  <span className="text-slate-400">Recommended Return:</span>
                  <span className="font-bold text-emerald-400">{returnByFormatted}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 dark:bg-blue-950/40 light:bg-blue-50 text-slate-300 dark:text-slate-300 light:text-blue-900 leading-relaxed text-[11px]">
                {reason}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
