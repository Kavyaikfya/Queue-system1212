import React from 'react';
import { Activity, Zap, Users, ShieldCheck, Gauge } from 'lucide-react';

interface QueuePulseProps {
  score?: number; // 0 to 100
  speedScore?: number; // 0 to 10
  demandScore?: number; // 0 to 10
  counterScore?: number; // 0 to 10
  statusText?: 'STABLE' | 'OPTIMAL' | 'MODERATE' | 'BUSY' | 'SURGE';
  waitingCount?: number;
  activeCounters?: number;
  className?: string;
}

export const QueuePulse: React.FC<QueuePulseProps> = ({
  score = 82,
  speedScore = 8,
  demandScore = 7,
  counterScore = 9,
  statusText = 'STABLE',
  className = '',
}) => {
  // SVG circular gauge calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (s >= 60) return 'text-sky-400 stroke-sky-400';
    if (s >= 40) return 'text-amber-400 stroke-amber-400';
    return 'text-red-400 stroke-red-400';
  };

  const statusColorClass = getStatusColor(score);

  return (
    <div
      className={`p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">
              REAL-TIME RADAR
            </span>
            <h3 className="text-sm font-black text-white dark:text-white light:text-slate-900">
              QUEUE PULSE
            </h3>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800 uppercase font-mono">
          Live Feed
        </span>
      </div>

      {/* Circular Radar / Gauge Display */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-800 dark:text-slate-800 light:text-slate-200 stroke-current"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`${statusColorClass} transition-all duration-1000 ease-out`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black font-mono text-white dark:text-white light:text-slate-900 leading-none">
              {score}%
            </span>
            <span className="text-[9px] font-bold text-sky-400 tracking-wider uppercase mt-1">
              {statusText}
            </span>
          </div>
        </div>

        {/* Breakdown Metric Bars */}
        <div className="flex-1 w-full space-y-3 text-xs">
          {/* Queue Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 light:text-slate-600 font-medium">Queue Speed</span>
              <span className="font-mono font-bold text-sky-300 dark:text-sky-300 light:text-blue-600">
                {speedScore}/10
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-700"
                style={{ width: `${speedScore * 10}%` }}
              ></div>
            </div>
          </div>

          {/* Demand */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 light:text-slate-600 font-medium">Demand Pressure</span>
              <span className="font-mono font-bold text-amber-300 dark:text-amber-300 light:text-amber-600">
                {demandScore}/10
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                style={{ width: `${demandScore * 10}%` }}
              ></div>
            </div>
          </div>

          {/* Counter Availability */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 light:text-slate-600 font-medium">Counter Availability</span>
              <span className="font-mono font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-600">
                {counterScore}/10
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${counterScore * 10}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtext Label */}
      <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
        <span className="text-[10px] text-slate-400 light:text-slate-500 italic">
          “System-generated live queue condition.”
        </span>
      </div>
    </div>
  );
};
