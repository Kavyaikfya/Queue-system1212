import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface StaffDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [queueData, setQueueData] = useState<any>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');

  const [activeSessionTimer, setActiveSessionTimer] = useState<number>(0);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  // Load initial queues and counters
  const loadInitial = async () => {
    try {
      const qRes = await api.getQueues();
      const loadedQueues = qRes.queues || [];
      setQueues(loadedQueues);
      if (loadedQueues.length > 0 && !selectedQueueId) {
        setSelectedQueueId(loadedQueues[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueueDetail = async () => {
    if (!selectedQueueId) return;
    try {
      const res = await api.getQueue(selectedQueueId);
      setQueueData(res);
      const queueCounters = res.counters || [];
      setCounters(queueCounters);
      if (queueCounters.length > 0 && !selectedCounterId) {
        setSelectedCounterId(queueCounters[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadQueueDetail();
  }, [selectedQueueId]);

  // Real-time synchronization
  useEffect(() => {
    if (!lastEvent) return;
    if (
      [
        'queue:updated',
        'queue:reordered',
        'queue:called',
        'queue:service_started',
        'queue:service_completed',
      ].includes(lastEvent.type)
    ) {
      loadQueueDetail();
    }
  }, [lastEvent]);

  // Active in-service timer ticker
  useEffect(() => {
    const active = queueData?.inServiceEntries?.find((e: any) => e.status === 'IN_SERVICE');
    let timer: any = null;
    if (active?.service_start_time) {
      const startTime = new Date(active.service_start_time).getTime();
      setActiveSessionTimer(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));

      timer = setInterval(() => {
        setActiveSessionTimer(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
    } else {
      setActiveSessionTimer(0);
    }
    return () => clearInterval(timer);
  }, [queueData]);

  // Actions
  const handleCallNext = async () => {
    if (!selectedCounterId || !selectedQueueId) {
      alert('Please select your assigned counter first.');
      return;
    }
    try {
      setIsCalling(true);
      await api.callNext('dummy', {
        counterId: selectedCounterId,
        queueId: selectedQueueId,
      });
      await loadQueueDetail();
    } catch (err: any) {
      alert(err.message || 'Call next failed');
    } finally {
      setIsCalling(false);
    }
  };

  const handleStartService = async (entryId: string) => {
    try {
      await api.startService(entryId);
      await loadQueueDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to start service');
    }
  };

  const handleCompleteService = async (entryId: string) => {
    try {
      setIsCompleting(true);
      await api.completeService(entryId, { outcome: 'SUCCESS', notes: 'Completed at staff counter' });
      await loadQueueDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleMarkNoShow = async (entryId: string) => {
    if (!window.confirm('Mark this customer as No-Show?')) return;
    try {
      await api.markNoShow(entryId, 'Customer did not present at counter');
      await loadQueueDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to mark no-show');
    }
  };

  const handleToggleUrgent = async (entryId: string) => {
    try {
      await api.toggleUrgent(entryId);
      await loadQueueDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle urgency');
    }
  };

  const nextWaiting = queueData?.waitingEntries?.[0];
  const activeServing = queueData?.inServiceEntries?.find(
    (e: any) => e.counter_id === selectedCounterId || e.status === 'IN_SERVICE' || e.status === 'CALLED'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header with Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2 border border-amber-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>STAFF SERVICE CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Counter Operations
          </h1>
          <p className="text-xs text-slate-500">
            Authenticated Staff: <strong className="text-slate-800 dark:text-slate-200">{user?.fullName}</strong>
          </p>
        </div>

        {/* Counter & Queue Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Active Queue
            </label>
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

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              My Assigned Counter
            </label>
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
            >
              {counters.map((c) => (
                <option key={c.id} value={c.id}>
                  Counter {c.counter_number} ({c.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Operational Console: Next User vs In-Service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Eligible User Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Next User In Line
              </span>
              {nextWaiting?.is_urgent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                  PRIORITY TRIAGE
                </span>
              )}
            </div>

            {nextWaiting ? (
              <div className="py-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                    {nextWaiting.ticket_number}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    Priority: {nextWaiting.priority_score} pts
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {nextWaiting.guest_name || 'Guest'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waiting Time:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {Math.max(0, Math.floor((Date.now() - new Date(nextWaiting.join_time).getTime()) / 60000))} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reason:</span>
                    <span className="text-slate-600 dark:text-slate-400 text-right truncate max-w-xs">
                      {nextWaiting.priority_reason}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No users currently waiting in this queue.
              </div>
            )}
          </div>

          <button
            onClick={handleCallNext}
            disabled={isCalling || !nextWaiting || !selectedCounterId}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4" />
            <span>{isCalling ? 'CALLING USER...' : 'CALL NEXT USER'}</span>
          </button>
        </div>

        {/* Current Active Service Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Service Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeServing?.status === 'IN_SERVICE'
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : activeServing?.status === 'CALLED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {activeServing?.status || 'IDLE'}
              </span>
            </div>

            {activeServing ? (
              <div className="py-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black font-mono text-brand-600">
                    {activeServing.ticket_number}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">ELAPSED TIME</span>
                    <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                      {Math.floor(activeSessionTimer / 60)}:
                      {(activeSessionTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeServing.guest_name || 'Member'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Counter:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      Desk #{activeServing.counter_number || 1}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No ticket currently in service at this desk. Click "CALL NEXT USER" to begin.
              </div>
            )}
          </div>

          {/* Action Buttons for Active Service */}
          <div className="grid grid-cols-3 gap-2">
            {activeServing?.status === 'CALLED' && (
              <button
                onClick={() => handleStartService(activeServing.id)}
                className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md"
              >
                <span>START SERVICE</span>
              </button>
            )}

            {activeServing?.status === 'IN_SERVICE' && (
              <button
                onClick={() => handleCompleteService(activeServing.id)}
                disabled={isCompleting}
                className="col-span-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleting ? 'COMPLETING...' : 'COMPLETE SERVICE'}</span>
              </button>
            )}

            {activeServing && (
              <button
                onClick={() => handleMarkNoShow(activeServing.id)}
                className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                NO SHOW
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Waiting Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Current Waiting Line ({queueData?.waitingEntries?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Continuous Dynamic Ordering</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold text-[10px] uppercase">
                <th className="p-4">Pos</th>
                <th className="p-4">Ticket</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Priority Score</th>
                <th className="p-4">Wait Time</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queueData?.waitingEntries?.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                    #{entry.position}
                  </td>
                  <td className="p-4 font-mono font-bold text-brand-600">
                    {entry.ticket_number}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {entry.guest_name || 'Guest'}
                    </div>
                    {entry.is_urgent && (
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700">
                        URGENT
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-purple-600">
                      {entry.priority_score} pts
                    </span>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">
                      {entry.priority_reason}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-500">
                    {Math.max(0, Math.floor((Date.now() - new Date(entry.join_time).getTime()) / 60000))} min
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleUrgent(entry.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {entry.is_urgent ? 'Clear Urgent' : 'Flag Urgent'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
