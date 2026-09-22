import React, { useState, useEffect } from 'react';
import { Clock, Check, Hourglass, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface NoShowTimerProps {
  entryId: string;
  deadline?: string | Date;
  counterName?: string;
  counterNumber?: number;
  onStatusChanged?: () => void;
}

export const NoShowTimer: React.FC<NoShowTimerProps> = ({
  entryId,
  deadline,
  counterName,
  counterNumber,
  onStatusChanged,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responded, setResponded] = useState<string | null>(null);

  useEffect(() => {
    const calculateSeconds = () => {
      if (!deadline) return 120;
      const target = new Date(deadline).getTime();
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      return diff;
    };

    setSecondsRemaining(calculateSeconds());

    const interval = setInterval(() => {
      const remaining = calculateSeconds();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const handleRespond = async (action: 'READY' | 'NEED_TIME') => {
    try {
      setIsSubmitting(true);
      await api.respondTurn(entryId, action);
      setResponded(action === 'READY' ? 'READY_ACKNOWLEDGED' : 'POSTPONED');
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      alert(err.message || 'Error sending response');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (responded === 'READY_ACKNOWLEDGED') {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
          Presence Confirmed!
        </h4>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Please proceed immediately to Counter {counterNumber || 1} ({counterName || 'Service Desk'}). Staff is expecting you.
        </p>
      </div>
    );
  }

  if (responded === 'POSTPONED') {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
        <Hourglass className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
          Extra Time Granted
        </h4>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Your ticket has been placed 2 spots back in line without cancellation. Take your time!
        </p>
      </div>
    );
  }

  const isUrgentTiming = secondsRemaining <= 30;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isUrgentTiming
          ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 pulse-attention'
          : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-5 h-5 ${isUrgentTiming ? 'text-red-600 animate-bounce' : 'text-amber-600'}`} />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Your Turn Has Arrived!
          </h4>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {Math.floor(secondsRemaining / 60)}:
            {(secondsRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
        You are called to <strong className="text-brand-600">Counter {counterNumber || 1} ({counterName || 'Service Desk'})</strong>. Please confirm your arrival within the response window.
      </p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={() => handleRespond('READY')}
          disabled={isSubmitting || secondsRemaining <= 0}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>I'M READY</span>
        </button>

        <button
          onClick={() => handleRespond('NEED_TIME')}
          disabled={isSubmitting || secondsRemaining <= 0}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Hourglass className="w-4 h-4 text-amber-500" />
          <span>NEED MORE TIME</span>
        </button>
      </div>
    </div>
  );
};
