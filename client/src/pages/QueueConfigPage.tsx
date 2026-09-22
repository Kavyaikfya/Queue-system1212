import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';
import { api } from '../services/api';

interface QueueConfigPageProps {
  queueId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const QueueConfigPage: React.FC<QueueConfigPageProps> = ({ queueId, onNavigate }) => {
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>(queueId || '');
  const [queue, setQueue] = useState<any>(null);

  // Editable config states
  const [name, setName] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<number>(100);
  const [operatingHours, setOperatingHours] = useState<string>('09:00 - 18:00');
  const [noShowTimeoutSec, setNoShowTimeoutSec] = useState<number>(120);

  // Priority Weights
  const [agingWeight, setAgingWeight] = useState<number>(1.5);
  const [urgencyWeight, setUrgencyWeight] = useState<number>(40.0);
  const [appointmentWeight, setAppointmentWeight] = useState<number>(15.0);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.getQueues().then((res) => {
      const qList = res.queues || [];
      setQueues(qList);
      if (qList.length > 0 && !selectedQueueId) {
        setSelectedQueueId(qList[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedQueueId) return;
    api.getQueue(selectedQueueId).then((res) => {
      const q = res.queue;
      setQueue(q);
      setName(q.name || '');
      setMaxCapacity(q.max_capacity || 100);
      setOperatingHours(q.operating_hours || '09:00 - 18:00');
      setNoShowTimeoutSec(q.no_show_timeout_sec || 120);

      try {
        const rules =
          typeof q.priority_rules_json === 'string'
            ? JSON.parse(q.priority_rules_json || '{}')
            : q.priority_rules_json || {};
        setAgingWeight(rules.wait_time_aging_weight ?? 1.5);
        setUrgencyWeight(rules.urgency_boost_weight ?? 40.0);
        setAppointmentWeight(rules.appointment_boost_weight ?? 15.0);
      } catch {
        // default
      }
    });
  }, [selectedQueueId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueId) return;
    try {
      setIsSaving(true);
      await api.saveQueueConfig(selectedQueueId, {
        name,
        maxCapacity: Number(maxCapacity),
        operatingHours,
        noShowTimeoutSec: Number(noShowTimeoutSec),
        priorityRulesJson: {
          wait_time_aging_weight: Number(agingWeight),
          urgency_boost_weight: Number(urgencyWeight),
          appointment_boost_weight: Number(appointmentWeight),
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('admin')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </button>

        {savedSuccess && (
          <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration Saved & Applied Dynamically!</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Queue Rules & Priority Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic priority weights, capacity limits, and no-show response windows
          </p>
        </div>

        <div>
          <select
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
          >
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.organization_name} - {q.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Settings Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. General Queue Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Queue Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Max Waiting Capacity
              </label>
              <input
                type="number"
                required
                min={10}
                max={1000}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                required
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                No-Show Timeout (Seconds)
              </label>
              <input
                type="number"
                required
                min={30}
                max={600}
                value={noShowTimeoutSec}
                onChange={(e) => setNoShowTimeoutSec(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Priority Engine Weights Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Dynamic Priority Engine Weights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Wait-Time Aging Weight
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">
                Points awarded per minute waited (Starvation Prevention)
              </span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={10.0}
                value={agingWeight}
                onChange={(e) => setAgingWeight(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Urgency Tier Boost
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">
                Priority score boost for emergency triage flags
              </span>
              <input
                type="number"
                step={1}
                min={0}
                max={100}
                value={urgencyWeight}
                onChange={(e) => setUrgencyWeight(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Appointment Bonus
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">
                Bonus score for confirmed scheduled appointments
              </span>
              <input
                type="number"
                step={1}
                min={0}
                max={50}
                value={appointmentWeight}
                onChange={(e) => setAppointmentWeight(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 flex items-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'SAVING RULES...' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
