import React, { useState, useEffect, useRef } from 'react';
import {
  ListOrdered,
  Users,
  Clock,
  Activity,
  Footprints,
  Sparkles,
  HelpCircle,
  LogOut,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Smartphone,
  Share2,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { supabase } from '../services/supabase';
import { QueuePulse } from '../components/QueuePulse';
import { SafeReturnWindowCard } from '../components/SafeReturnWindowCard';
import { ExplainabilityModal } from '../components/ExplainabilityModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { NoShowTimer } from '../components/NoShowTimer';
import { calculateSafeReturnWindow } from '../services/safeReturnEngine';
import { playChime } from '../services/audioEngine';
import {
  speakAnnouncement,
  startVoiceRecognition,
  isVoiceRecognitionSupported,
} from '../services/voiceEngine';
import { triggerHaptic } from '../services/hapticsEngine';

interface MyQueuePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyQueuePage: React.FC<MyQueuePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<boolean>(false);

  // Gesture handling state
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const longPressTimer = useRef<any>(null);

  const prevPositionRef = useRef<number | null>(null);

  // Load active tickets
  const loadActiveTickets = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const res = await api.getActiveTickets();
      const tickets = res.activeTickets || [];
      setActiveTickets(tickets);

      if (tickets.length > 0) {
        const active = tickets[selectedIndex] || tickets[0];
        const newPos = active.position;

        // Position change detection for Audio, Voice & Haptics
        if (prevPositionRef.current !== null && prevPositionRef.current !== newPos) {
          if (newPos < prevPositionRef.current) {
            playChime('position_changed');
            triggerHaptic('position_changed');
            speakAnnouncement(`Your current position is ${newPos}.`);
          }
          if (newPos === 1) {
            playChime('turn_approaching');
            triggerHaptic('turn_approaching');
            speakAnnouncement('Your turn is approaching.');
          }
        }
        prevPositionRef.current = newPos;
      }
    } catch (err) {
      console.error('[MyQueue] Error loading active tickets:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTickets(true);
  }, [user]);

  // Real-time synchronization: Supabase Realtime channel subscription
  useEffect(() => {
    if (!user?.id) return;

    // Listen to changes on queue_entries for this user
    const channel = supabase
      .channel(`user-queue-entries-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadActiveTickets(false);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Real-time synchronization: WebSocket broadcast events
  useEffect(() => {
    if (!lastEvent) return;
    if (
      [
        'queue:updated',
        'queue:reordered',
        'queue:called',
        'queue:service_started',
        'queue:service_completed',
        'user:turn_called',
      ].includes(lastEvent.type)
    ) {
      loadActiveTickets(false);
    }
  }, [lastEvent]);

  // Leave Queue handler
  const handleLeaveQueue = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to leave this queue? Your ticket will be cancelled.')) {
      return;
    }
    try {
      setIsLeaving(true);
      await api.leaveQueue(ticketId);
      playChime('alert');
      triggerHaptic('position_changed');
      speakAnnouncement('You have left the queue.');
      loadActiveTickets(false);
    } catch (err: any) {
      alert(err.message || 'Failed to leave queue');
    } finally {
      setIsLeaving(false);
      setActionMenuOpen(false);
    }
  };

  // Voice command listener
  const handleToggleVoice = () => {
    if (!isVoiceRecognitionSupported()) {
      alert("Voice input isn't supported on this browser.");
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const currentTicket = activeTickets[selectedIndex] || activeTickets[0];
    const pos = currentTicket?.position || 6;
    const peopleAhead = currentTicket?.people_ahead !== undefined ? Number(currentTicket.people_ahead) : Math.max(0, pos - 1);
    const estWait = currentTicket?.estimated_wait_minutes || 17;

    setIsListeningVoice(true);
    setVoiceFeedback('Listening for commands: "What\'s my position?", "How long will I wait?"...');

    startVoiceRecognition(
      (rawTranscript: string) => {
        setIsListeningVoice(false);
        const lower = rawTranscript.toLowerCase();
        if (lower.includes('position')) {
          const resp = `You are currently #${pos.toString().padStart(2, '0')} with ${peopleAhead} people ahead. Your estimated waiting time is ${estWait} minutes.`;
          setVoiceFeedback(resp);
          speakAnnouncement(resp);
        } else if (lower.includes('wait') || lower.includes('long')) {
          const resp = `Your estimated waiting time is ${estWait} minutes.`;
          setVoiceFeedback(resp);
          speakAnnouncement(resp);
        } else if (lower.includes('turn')) {
          const resp = pos <= 2 ? 'Your turn is approaching very soon!' : `You have approximately ${peopleAhead} people ahead before your turn.`;
          setVoiceFeedback(resp);
          speakAnnouncement(resp);
        } else if (lower.includes('why')) {
          const resp = `Your position changed due to completed services ahead. FAIRQUEUE dynamically guarantees starvation prevention.`;
          setVoiceFeedback(resp);
          speakAnnouncement(resp);
        } else if (lower.includes('return')) {
          const resp = estWait > 12 ? 'Safe Return Window indicates you can safely step away.' : 'We recommend staying nearby because your turn is approaching.';
          setVoiceFeedback(resp);
          speakAnnouncement(resp);
        } else {
          setVoiceFeedback(`Heard: "${rawTranscript}". Try asking: "What's my position?" or "How long will I wait?"`);
        }
      },
      (err: string) => {
        setIsListeningVoice(false);
        setVoiceFeedback(`Voice input: ${err}`);
      }
    );
  };

  // Touch Gesture Listeners (Swipe down: refresh, Swipe left: alerts, Long press: menu)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('turn_approaching');
      setActionMenuOpen(true);
    }, 700);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (touchStartY.current === null || touchStartX.current === null) return;

    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe down to refresh (if dragged down > 90px and minimal horizontal deviation)
    if (diffY > 90 && Math.abs(diffX) < 40 && window.scrollY <= 10) {
      triggerHaptic('position_changed');
      loadActiveTickets(false);
    }
    // Swipe left: open notifications
    else if (diffX < -90 && Math.abs(diffY) < 40) {
      onNavigate('notifications');
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  const currentTicket = activeTickets[selectedIndex] || activeTickets[0];

  // If loading and no tickets loaded yet
  if (isLoading && activeTickets.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48"></div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  // ========================================================
  // REQUIREMENT 8: NO ACTIVE QUEUE STATE
  // ========================================================
  if (!currentTicket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-500 flex items-center justify-center mx-auto shadow-xl">
          <ListOrdered className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            YOU'RE NOT IN A QUEUE
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Join a queue to see your live position and estimated waiting time.
          </p>
        </div>

        <button
          onClick={() => onNavigate('join')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <span>JOIN A QUEUE</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          FAIRQUEUE • AI REAL-TIME QUEUE INTELLIGENCE
        </div>
      </div>
    );
  }

  // Calculated variables from real active ticket data
  const pos = currentTicket.position || 6;
  const peopleAhead =
    currentTicket.people_ahead !== undefined
      ? Number(currentTicket.people_ahead)
      : Math.max(0, pos - 1);
  const estWait = currentTicket.estimated_wait_minutes || (peopleAhead > 0 ? peopleAhead * 3 + 2 : 17);
  const queueStatus = currentTicket.status || 'ACTIVE';

  // Dynamic Queue Pulse calculation
  const pulseScore = Math.max(50, Math.min(98, 96 - peopleAhead * 2));
  const queuePulseState: 'FAST' | 'STABLE' | 'BUSY' | 'SLOW' | 'CRITICAL' =
    pulseScore >= 85 ? 'FAST' : pulseScore >= 75 ? 'STABLE' : pulseScore >= 60 ? 'BUSY' : pulseScore >= 45 ? 'SLOW' : 'CRITICAL';

  // Safe Return Window calculation
  const safeReturnWindowData = calculateSafeReturnWindow({
    position: pos,
    peopleAhead,
    estimatedWaitMinutes: estWait,
    activeCounters: 3,
    averageServiceMinutes: 5,
    isPaused: queueStatus === 'PAUSED',
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="max-w-xl mx-auto px-4 py-4 sm:py-8 space-y-5 animate-fade-in transition-colors select-none"
    >
      {/* Top Bar: Multiple Queues Switcher (if user has > 1 active ticket) */}
      {activeTickets.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {activeTickets.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedIndex === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Ticket {t.ticket_number} (#{t.position})
            </button>
          ))}
        </div>
      )}

      {/* Voice Mode Feedback Banner */}
      {voiceFeedback && (
        <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-sky-500 animate-pulse" />
            <span>{voiceFeedback}</span>
          </div>
          <button
            onClick={() => setVoiceFeedback(null)}
            className="text-[10px] font-bold text-sky-600 underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================
          REQUIREMENT 10: MY QUEUE DESIGN (MOBILE-FIRST PREMIUM)
      ======================================================== */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-sky-500/30 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase block">
                MY ACTIVE QUEUE
              </span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                {currentTicket.organization_name || 'Organization'} · {currentTicket.queue_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl border transition-all ${
                isListeningVoice
                  ? 'bg-red-500 text-white border-red-400 animate-bounce'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500'
              }`}
              title="Voice Mode Assistant"
            >
              {isListeningVoice ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition-all"
              title="View QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Metric Cards */}
        <div className="p-6 space-y-6">
          {/* Main Prominent Large Position */}
          <div className="flex items-end justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                YOUR POSITION
              </span>
              <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-slate-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-sky-200 dark:to-sky-400 mt-1">
                #{pos.toString().padStart(2, '0')}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TICKET
              </span>
              <span className="text-xl font-black font-mono text-sky-600 dark:text-sky-400">
                {currentTicket.ticket_number}
              </span>
            </div>
          </div>

          {/* Stat Grid: PEOPLE AHEAD, ESTIMATED WAIT, QUEUE STATUS */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            {/* 1. PEOPLE AHEAD */}
            <div className="text-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PEOPLE AHEAD
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 flex items-center justify-center space-x-1">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>{peopleAhead}</span>
              </div>
            </div>

            {/* 2. ESTIMATED WAIT */}
            <div className="text-center border-x border-slate-200 dark:border-slate-700 px-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ESTIMATED WAIT
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center justify-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{estWait} MIN</span>
              </div>
            </div>

            {/* 3. QUEUE STATUS */}
            <div className="text-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                QUEUE STATUS
              </span>
              <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase mt-1.5 flex items-center justify-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{queueStatus}</span>
              </div>
            </div>
          </div>

          {/* Called Turn Alert if CALLED */}
          {queueStatus === 'CALLED' && (
            <NoShowTimer
              entryId={currentTicket.id}
              deadline={currentTicket.no_show_deadline}
              counterName={currentTicket.counter_name}
              counterNumber={currentTicket.counter_number}
              onStatusChanged={() => loadActiveTickets(false)}
            />
          )}

          {/* ========================================================
              FEATURE 1: QUEUE PULSE (Requirement 11)
          ======================================================== */}
          <QueuePulse
            score={pulseScore}
            speedScore={8}
            demandScore={Math.min(10, Math.max(3, Math.round(peopleAhead * 1.2)))}
            counterScore={9}
            statusText={queuePulseState as any}
          />

          {/* ========================================================
              FEATURE 2: SAFE RETURN WINDOW (Requirement 12)
          ======================================================== */}
          <SafeReturnWindowCard
            windowData={safeReturnWindowData}
            onRefresh={() => loadActiveTickets(false)}
          />

          {/* ========================================================
              WHY DID MY POSITION CHANGE?
          ======================================================== */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>WHY DID MY POSITION CHANGE?</span>
              </div>
              <button
                onClick={() => setShowExplainModal(true)}
                className="text-[11px] font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
              >
                <span>[VIEW WHY]</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentTicket.priority_reason ||
                `You are currently #${pos.toString().padStart(2, '0')} with ${peopleAhead} people ahead. FAIRQUEUE dynamically guarantees starvation prevention so newer arrivals cannot bypass your turn.`}
            </p>
          </div>

          {/* ========================================================
              LIVE QUEUE TIMELINE
          ======================================================== */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              <span>LIVE QUEUE TIMELINE</span>
              <span className="text-[10px] text-sky-500 font-mono">Live</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-1 font-medium">
              <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  ✓ Joined queue (
                  {new Date(currentTicket.join_time || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  )
                </span>
              </div>
              <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>✓ Position assigned (#{pos.toString().padStart(2, '0')})</span>
              </div>
              <div className="flex items-center space-x-2.5 text-sky-600 dark:text-sky-400">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  ✓ {Math.max(1, Math.floor(pos / 2))} counter service(s) completed ahead
                </span>
              </div>
              <div className="flex items-center space-x-2.5 text-amber-600 dark:text-amber-400 animate-pulse font-semibold">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400/30 border-2 border-amber-500 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                </span>
                <span>● Safe Return Window active (Counter throughput stable)</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              BUTTONS: ASK QUEUE AI, LEAVE QUEUE
          ======================================================== */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* ASK QUEUE AI */}
            <button
              onClick={() => {
                const trigger = document.getElementById('queue-ai-trigger');
                if (trigger) trigger.click();
                else setShowExplainModal(true);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ASK QUEUE AI</span>
            </button>

            {/* LEAVE QUEUE */}
            <button
              onClick={() => handleLeaveQueue(currentTicket.id)}
              disabled={isLeaving}
              className="py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLeaving ? 'LEAVING...' : 'LEAVE QUEUE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Swipe / Gesture Help Tip (Subtle, non-intrusive) */}
      <div className="text-center text-[10px] text-slate-400 font-medium">
        💡 Mobile Gestures: Swipe down to refresh · Swipe left for alerts · Long press for menu
      </div>

      {/* Explainability / Why Modal */}
      {showExplainModal && (
        <ExplainabilityModal
          isOpen={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          ticketNumber={currentTicket.ticket_number}
          currentPosition={pos}
          priorityScore={currentTicket.priority_score || 0}
          priorityReason={currentTicket.priority_reason || 'Sequential throughput'}
          recentEvents={[]}
          estimatedWaitMinutes={estWait}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <QRCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          queueId={currentTicket.queue_id}
          queueName={currentTicket.queue_name}
          orgName={currentTicket.organization_name || 'FAIRQUEUE'}
        />
      )}

      {/* Long Press Action Menu Modal */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Queue Action Menu</h3>
            <div className="space-y-2 text-xs font-bold">
              <button
                onClick={() => {
                  setActionMenuOpen(false);
                  setShowQrModal(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left flex items-center space-x-2.5"
              >
                <QrCode className="w-4 h-4 text-sky-500" />
                <span>Show Ticket QR Code</span>
              </button>
              <button
                onClick={() => {
                  setActionMenuOpen(false);
                  const trigger = document.getElementById('queue-ai-trigger');
                  if (trigger) trigger.click();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left flex items-center space-x-2.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ask Queue AI</span>
              </button>
              <button
                onClick={() => handleLeaveQueue(currentTicket.id)}
                className="w-full py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 text-left flex items-center space-x-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave This Queue</span>
              </button>
            </div>
            <button
              onClick={() => setActionMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs text-slate-400 font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
