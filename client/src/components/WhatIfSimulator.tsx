import React, { useState } from 'react';
import {
  Sliders,
  Play,
  TrendingUp,
  AlertCircle,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

interface WhatIfSimulatorProps {
  queueId?: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ queueId }) => {
  const [additionalUsers, setAdditionalUsers] = useState<number>(10);
  const [counterChange, setCounterChange] = useState<number>(0);
  const [serviceMultiplier, setServiceMultiplier] = useState<number>(1.0);
  const [pauseMinutes, setPauseMinutes] = useState<number>(0);
  const [simulation, setSimulation] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      const res = await api.runSimulation({
        queueId,
        additionalUsers,
        counterChange,
        serviceDurationMultiplier: serviceMultiplier,
        pauseMinutes,
      });
      setSimulation(res);
    } catch (err: any) {
      alert(err.message || 'Simulation run failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            What-If Queue Capacity Simulator
          </h3>
          <p className="text-xs text-slate-500">
            Model hypothetical arrival surges, counter closures, and service duration fluctuations
          </p>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Arrival Surge Slider */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Arrival Surge
            </span>
            <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
              +{additionalUsers} users
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={additionalUsers}
            onChange={(e) => setAdditionalUsers(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>

        {/* Counter Adjust Slider */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Counters
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                counterChange < 0
                  ? 'text-red-500'
                  : counterChange > 0
                  ? 'text-emerald-500'
                  : 'text-slate-500'
              }`}
            >
              {counterChange > 0 ? `+${counterChange}` : counterChange}
            </span>
          </div>
          <input
            type="range"
            min={-2}
            max={3}
            step={1}
            value={counterChange}
            onChange={(e) => setCounterChange(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-1">
            {counterChange < 0 ? 'Simulate counter outage' : 'Simulate adding staff'}
          </span>
        </div>

        {/* Service Time Multiplier */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Service Complexity
            </span>
            <span className="text-xs font-mono font-bold text-amber-500">
              {Math.round(serviceMultiplier * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={serviceMultiplier}
            onChange={(e) => setServiceMultiplier(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-1">
            {serviceMultiplier > 1 ? 'Slower average service' : 'Expedited processing'}
          </span>
        </div>

        {/* Queue Pause Minutes */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pause Duration
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {pauseMinutes} min
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={pauseMinutes}
            onChange={(e) => setPauseMinutes(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-1">Simulate break or interruption</span>
        </div>
      </div>

      {/* Run Button */}
      <div className="flex justify-end pb-5">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'RUNNING PROJECTION...' : 'RUN WHAT-IF SIMULATION'}</span>
        </button>
      </div>

      {/* Simulation Results Display */}
      {simulation && (
        <div className="mt-4 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in">
          {/* Impact Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start space-x-3 ${
              simulation.impact.bottleneckLevel === 'SEVERE'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                : simulation.impact.bottleneckLevel === 'MODERATE'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Bottleneck Risk: {simulation.impact.bottleneckLevel}
                </span>
                <span className="text-xs">
                  (Wait Delta: {simulation.impact.waitDeltaMinutes > 0 ? '+' : ''}
                  {simulation.impact.waitDeltaMinutes} min)
                </span>
              </div>
              <p className="text-xs mt-1">{simulation.impact.explanation}</p>
            </div>
          </div>

          {/* Baseline vs Projected Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                CURRENT BASELINE
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">QUEUE LENGTH</span>
                  <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200">
                    {simulation.baseline.queueLength}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">AVG WAIT</span>
                  <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200">
                    {simulation.baseline.avgWaitMinutes}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">FAIRNESS</span>
                  <span className="text-xl font-mono font-bold text-emerald-500">
                    {simulation.baseline.fairnessScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Projected */}
            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider block mb-3">
                MODEL PREDICTION
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">QUEUE LENGTH</span>
                  <span className="text-xl font-mono font-bold text-brand-600 dark:text-brand-400">
                    {simulation.projected.queueLength}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">PROJECTED WAIT</span>
                  <span className="text-xl font-mono font-bold text-brand-600 dark:text-brand-400">
                    {simulation.projected.avgWaitMinutes}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">FAIRNESS</span>
                  <span className="text-xl font-mono font-bold text-amber-500">
                    {simulation.projected.fairnessScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Model Disclaimer */}
          <p className="text-[11px] text-slate-400 italic text-center pt-2">
            ⚠️ {simulation.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};
