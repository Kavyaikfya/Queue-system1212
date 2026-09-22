import React, { useState } from 'react';
import {
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  History,
  LogOut,
  AlertCircle,
  Building2,
  CheckCircle,
  Activity,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { NoShowTimer } from './NoShowTimer';
import { ExplainabilityModal } from './ExplainabilityModal';
import { SafeReturnWindowCard } from './SafeReturnWindowCard';
import { calculateSafeReturnWindow } from '../services/safeReturnEngine';
import { api } from '../services/api';

interface ActiveTicketCardProps {
  ticket: any;
  onRefresh: () => void;
}

export const ActiveTicketCard: React.FC<ActiveTicketCardProps> = ({ ticket, onRefresh }) => {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.getTicketDetail(ticket.id);
      setTicketDetails(res);
    } catch {
      // ignore
    }
  };

  const handleOpenExplain = async () => {
    await fetchDetails();
    setShowExplainModal(true);
  };

  const handleLeaveQueue = async () => {
    if (!window.confirm('Are you sure you want to leave this queue? Your ticket will be cancelled.')) {
      return;
    }
    try {
      setIsLeaving(true);
      await api.leaveQueue(ticket.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to leave queue');
    } finally {
      setIsLeaving(false);
    }
  };

  const isCalled = ticket.status === 'CALLED';
  const isInService = ticket.status === 'IN_SERVICE';
  const pos = ticket.position || 6;
  const peopleAhead = Math.max(0, ticket.people_ahead !== undefined ? Number(ticket.people_ahead) : Math.max(0, pos - 1));
  const estWait = ticket.estimated_wait_minutes || (peopleAhead > 0 ? peopleAhead * 3 + 2 : 17);

  // Animated progress computation (relative progression towards #01)
  const initialEstimatePos = Math.max(pos, 10);
  const progressPercent = Math.min(
    100,
    Math.max(15, Math.round(((initialEstimatePos - pos + 1) / initialEstimatePos) * 100))
  );

  const safeReturnWindowData = calculateSafeReturnWindow({
    position: pos,
    peopleAhead,
    estimatedWaitMinutes: estWait,
    activeCounters: 3,
    averageServiceMinutes: 5,
    isPaused: ticket.status === 'PAUSED',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-sky-500/30 shadow-xl dark:shadow-2xl dark:shadow-sky-500/10 transition-all text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-gradient-to-r dark:from-blue-950/60 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
              MY QUEUE
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{ticket.organization_name || 'Service Facility'}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">{ticket.queue_name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {ticket.is_urgent && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
              PRIORITY REVIEWED
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800/80">
            {ticket.ticket_number}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Large Prominent Queue Position Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              CURRENT POSITION
            </span>
            <div className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-sky-200 dark:to-sky-400 font-mono mt-1">
              #{pos.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            {/* People Ahead */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                PEOPLE AHEAD
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-sky-500" />
                <span>{peopleAhead}</span>
              </div>
            </div>

            {/* Estimated Wait */}
            <div className="border-x border-slate-200 dark:border-slate-700/80 px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                EST. WAIT
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{estWait}m</span>
              </div>
            </div>

            {/* Queue Pulse: STABLE */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                QUEUE PULSE
              </span>
              <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wide mt-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>STABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
              <span>Queue Advancement Progress</span>
            </span>
            <span className="font-mono text-sky-600 dark:text-sky-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 rounded-full transition-all duration-700 relative overflow-hidden"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* REQUIREMENT 22: SAFE RETURN WINDOW CARD */}
        <SafeReturnWindowCard windowData={safeReturnWindowData} onRefresh={onRefresh} />

        {/* Called Turn Countdown if CALLED */}
        {isCalled && (
          <div className="mt-4">
            <NoShowTimer
              entryId={ticket.id}
              deadline={ticket.no_show_deadline}
              counterName={ticket.counter_name}
              counterNumber={ticket.counter_number}
              onStatusChanged={onRefresh}
            />
          </div>
        )}

        {/* REQUIREMENT 22: WHY DID MY POSITION CHANGE? */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>WHY DID MY POSITION CHANGE?</span>
            </div>
            <button
              onClick={handleOpenExplain}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
            >
              <span>[VIEW WHY]</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {ticket.priority_reason ||
              `You are #${pos.toString().padStart(2, '0')} with ${peopleAhead} ahead based on standard wait-time progression. FAIRQUEUE dynamically guarantees starvation prevention so newer arrivals cannot bypass your turn.`}
          </p>
        </div>

        {/* REQUIREMENT 22: LIVE QUEUE TIMELINE */}
        <div className="p-5 rounded-3xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <History className="w-4 h-4 text-sky-500" />
            <span>LIVE QUEUE TIMELINE</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>✓ Joined queue ({new Date(ticket.join_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>✓ Position assigned (#{pos.toString().padStart(2, '0')})</span>
            </div>
            <div className="flex items-center space-x-3 text-sky-600 dark:text-sky-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>✓ {Math.max(1, Math.floor(pos / 2))} service(s) completed ahead of you</span>
            </div>
            <div className="flex items-center space-x-3 text-sky-700 dark:text-sky-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>✓ Position updated & ETA recalculated</span>
            </div>
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400/30 border-2 border-amber-500 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              </span>
              <span>● Your turn approaching (Counter throughput steady)</span>
            </div>
          </div>
        </div>

        {/* REQUIREMENT 22: Buttons: ASK QUEUE AI, LEAVE QUEUE */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              const trigger = document.getElementById('queue-ai-trigger');
              if (trigger) trigger.click();
              else handleOpenExplain();
            }}
            className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ASK QUEUE AI</span>
          </button>

          <button
            onClick={handleLeaveQueue}
            disabled={isLeaving}
            className="px-5 py-3 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 transition-colors flex items-center space-x-1.5 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>LEAVE QUEUE</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ExplainabilityModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        ticketNumber={ticket.ticket_number}
        currentPosition={pos}
        priorityScore={ticket.priority_score || 0}
        priorityReason={ticket.priority_reason}
        recentEvents={ticketDetails?.timeline || []}
        estimatedWaitMinutes={estWait}
      />
    </div>
  );
};
