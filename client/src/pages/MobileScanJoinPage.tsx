import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Building2,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MobileScanJoinPageProps {
  queueId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const MobileScanJoinPage: React.FC<MobileScanJoinPageProps> = ({ queueId, onNavigate }) => {
  const { user } = useAuth();
  const [queueData, setQueueData] = useState<any>(null);
  const [guestName, setGuestName] = useState<string>(user?.fullName || '');
  const [guestPhone, setGuestPhone] = useState<string>(user?.phone || '');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketIssued, setTicketIssued] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!queueId) return;
    api
      .getQueue(queueId)
      .then((res) => setQueueData(res))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [queueId]);

  const handleOneTapJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.joinQueue(queueId, {
        guestName: guestName || 'Mobile Visitor',
        guestPhone,
        isUrgent,
      });
      setTicketIssued(res);
    } catch (err: any) {
      alert(err.message || 'Error joining queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Connecting to live queue...
      </div>
    );
  }

  if (ticketIssued) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">You're In Line!</h2>
        <p className="text-xs text-slate-500 mt-1">Keep this screen open for live position updates</p>

        <div className="my-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-xs text-slate-400 font-bold">TICKET</span>
            <span className="text-3xl font-black font-mono text-brand-600">
              {ticketIssued.ticketNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold">YOUR POSITION</span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
                #{ticketIssued.position}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold">EST WAIT</span>
              <span className="text-xl font-bold font-mono text-emerald-500">
                ~{ticketIssued.position * 10}m
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-xl shadow-brand-500/20"
        >
          View Full Ticket Portal
        </button>
      </div>
    );
  }

  const q = queueData?.queue;
  const waitingCount = queueData?.waitingEntries?.length || 0;
  const activeCounters = queueData?.counters?.filter((c: any) => c.status !== 'OFFLINE') || [];
  const estWait = Math.round(
    Math.ceil(waitingCount / Math.max(1, activeCounters.length)) * (q?.avg_duration_minutes || 15)
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header Badge */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold mb-3 border border-brand-200">
          <QrCode className="w-3.5 h-3.5" />
          <span>QR CODE CHECK-IN</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {q?.name || 'Service Queue'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{q?.organization_name}</p>
      </div>

      {/* Live Status Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">AHEAD</span>
            <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
              {waitingCount}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">DESKS</span>
            <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
              {activeCounters.length}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">EST WAIT</span>
            <span className="text-lg font-black font-mono text-emerald-500">
              ~{estWait}m
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Operating: <strong className="text-slate-700 dark:text-slate-300">{q?.operating_hours || '09:00 - 18:00'}</strong>
        </p>
      </div>

      {/* Direct Form */}
      <form
        onSubmit={handleOneTapJoin}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
      >
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Your Name</label>
          <input
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Alex Miller"
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mobile Phone</label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="+1-555-0100"
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 accent-red-600"
          />
          <span>Urgent Medical / Operational Priority</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 active:scale-95 transition-all mt-2"
        >
          {isSubmitting ? 'JOINING QUEUE...' : 'JOIN QUEUE NOW'}
        </button>
      </form>
    </div>
  );
};
