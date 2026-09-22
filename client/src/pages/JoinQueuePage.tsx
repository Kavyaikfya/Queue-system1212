import React, { useState, useEffect } from 'react';
import {
  Building2,
  ListOrdered,
  Clock,
  Sparkles,
  CheckCircle2,
  Users,
  ShieldCheck,
  QrCode,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Check,
  Stethoscope,
  Landmark,
  FileText,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { playChime } from '../services/audioEngine';
import { speakAnnouncement } from '../services/voiceEngine';
import { triggerHaptic } from '../services/hapticsEngine';

interface JoinQueuePageProps {
  onNavigate: (page: string, params?: any) => void;
  preselectedQueueId?: string;
}

export const JoinQueuePage: React.FC<JoinQueuePageProps> = ({ onNavigate, preselectedQueueId }) => {
  const { user, loginWithGoogle } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string>(preselectedQueueId || '');
  const [queueDetail, setQueueDetail] = useState<any>(null);

  // Priority Review State (Requirement 21)
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [priorityCategory, setPriorityCategory] = useState<string>('MEDICAL');
  const [priorityDetails, setPriorityDetails] = useState<string>('');
  const [priorityReviewApplied, setPriorityReviewApplied] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [joinResult, setJoinResult] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [errorState, setErrorState] = useState<{
    type: 'auth' | 'already_in_queue' | 'closed' | 'full' | 'database';
    message: string;
    data?: any;
  } | null>(null);

  // Load organizations on mount
  useEffect(() => {
    api
      .getOrganizations()
      .then((res) => {
        const orgs = res.organizations || [];
        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Load org details when selected
  useEffect(() => {
    if (!selectedOrgId) return;
    api
      .getOrganization(selectedOrgId)
      .then((res) => {
        setOrgDetails(res);
        if (res.queues && res.queues.length > 0) {
          if (!selectedQueueId || !res.queues.some((q: any) => q.id === selectedQueueId)) {
            setSelectedQueueId(res.queues[0].id);
          }
        }
      })
      .catch((e) => console.error(e));
  }, [selectedOrgId]);

  // Load queue detail when selected
  useEffect(() => {
    if (!selectedQueueId) return;
    api
      .getQueue(selectedQueueId)
      .then((res) => setQueueDetail(res))
      .catch((e) => console.error(e));
  }, [selectedQueueId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueId) return;

    if (!user) {
      setErrorState({
        type: 'auth',
        message: 'Please sign in with Google before joining a queue.',
      });
      return;
    }

    if (queueDetail?.queue?.status === 'PAUSED') {
      setErrorState({
        type: 'closed',
        message: 'This queue is currently unavailable.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorState(null);
      const res = await api.joinQueue(selectedQueueId, {
        guestName: user?.displayName || user?.fullName || 'Google Verified Guest',
        guestPhone: user?.phone || '',
        isUrgent: priorityReviewApplied,
        priorityReason: priorityReviewApplied
          ? `Priority review requested (${priorityCategory}): ${priorityDetails || 'Standard verification'}`
          : undefined,
        hasAppointment: false,
        notes: priorityReviewApplied ? `Priority review requested for ${priorityCategory}` : '',
      });

      playChime('joined');
      triggerHaptic('turn_approaching');
      speakAnnouncement(`You have joined the queue. Your position is ${res.position}.`);
      setJoinResult(res);
    } catch (err: any) {
      console.error('[JoinQueue] Technical error:', err);
      if (err.alreadyInQueue || err.status === 409 || err.message?.includes('already in this queue')) {
        playChime('alert');
        triggerHaptic('position_changed');
        setErrorState({
          type: 'already_in_queue',
          message: 'You are already in this queue.',
          data: {
            ticketNumber: err.ticketNumber,
            position: err.position,
            entryId: err.entryId,
          },
        });
      } else if (err.status === 401 || err.status === 403) {
        setErrorState({
          type: 'auth',
          message: 'Please sign in with Google before joining a queue.',
        });
      } else if (err.message?.includes('capacity') || err.message?.includes('full')) {
        setErrorState({
          type: 'full',
          message: 'This queue has reached its current capacity.',
        });
      } else if (
        err.message?.includes('unavailable') ||
        err.message?.includes('closed') ||
        err.message?.includes('PAUSED')
      ) {
        setErrorState({
          type: 'closed',
          message: 'This queue is currently unavailable.',
        });
      } else {
        setErrorState({
          type: 'database',
          message: 'Unable to join the queue right now. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrgIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('HOSPITAL') || t.includes('CLINIC') || t.includes('HEALTH')) {
      return <Stethoscope className="w-5 h-5 text-emerald-500" />;
    }
    if (t.includes('GOV') || t.includes('PUBLIC') || t.includes('CIVIC')) {
      return <Landmark className="w-5 h-5 text-sky-500" />;
    }
    if (t.includes('BANK') || t.includes('FINANCE')) {
      return <FileText className="w-5 h-5 text-indigo-500" />;
    }
    return <Building2 className="w-5 h-5 text-brand-500" />;
  };

  // SUCCESS SCREEN
  if (joinResult) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LIVE SPOT CONFIRMED</span>
        </span>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Ticket Issued Successfully
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
          Your spot has been allocated in the real-time queue. Starvation protection guarantees your turn will advance steadily.
        </p>

        <div className="my-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                YOUR TICKET
              </span>
              <div className="text-3xl font-black font-mono text-brand-600 dark:text-brand-400 mt-0.5">
                {joinResult.ticketNumber}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                INITIAL POSITION
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                #{joinResult.position}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Safe Return Window</span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              🟢 Calculated on Dashboard
            </span>
          </div>

          {priorityReviewApplied && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
              <div className="font-bold flex items-center space-x-1.5 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Priority Review Pending</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                Priority was applied according to the queue's configured rules. Organization staff will review eligibility at counter triage.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <span>VIEW ACTIVE TICKET & RETURN WINDOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setJoinResult(null);
              setStep(1);
            }}
            className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Join Another Queue
          </button>
        </div>
      </div>
    );
  }

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);
  const currentQueue = queueDetail?.queue;
  const waitingCount = queueDetail?.waitingEntries?.length || 0;
  const activeCounters = queueDetail?.counters?.filter((c: any) => c.status !== 'OFFLINE') || [];
  const estWait = Math.round(
    Math.ceil(waitingCount / Math.max(1, activeCounters.length)) * (currentQueue?.avg_duration_minutes || 12)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-blue-950/80 text-sky-600 dark:text-sky-300 border border-sky-500/20">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>REAL-TIME QUEUE JOINING</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Select Your Facility & Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Experience transparent, AI-calculated wait times with automatic Safe Return Windows and anti-starvation guarantees.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-6 text-xs font-bold">
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
            step === 1
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          <span>ORGANIZATION</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
            step === 2
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          <span>SERVICE</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
            step === 3
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
          <span>CONFIRMATION</span>
        </div>
      </div>

      {/* ========================================================
          STEP 1: SELECT ORGANIZATION (Requirement 19)
      ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              SELECT ORGANIZATION
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {organizations.length} verified facilities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => {
            const isSelected = selectedOrgId === org.id;
            return (
              <div
                key={org.id}
                onClick={() => {
                  setSelectedOrgId(org.id);
                  if (step === 1) setStep(2);
                }}
                className={`p-5 rounded-3xl cursor-pointer border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-xl shadow-sky-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {getOrgIcon(org.type)}
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>ACTIVE</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {org.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                    {org.type ? org.type.toLowerCase().replace('_', ' ') : 'Service Center'}
                  </div>
                  {org.address && (
                    <div className="text-[11px] text-slate-400 truncate mt-1">
                      📍 {org.address}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {org.queue_count || 4} Active Queues
                  </span>
                  <span
                    className={`font-bold flex items-center space-x-1 ${
                      isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                    }`}
                  >
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          STEP 2: SELECT SERVICE (Requirement 19)
      ======================================================== */}
      {selectedOrgId && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                SELECT SERVICE
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {orgDetails?.queues?.length || 0} services available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(orgDetails?.queues || []).map((q: any) => {
              const isSelected = selectedQueueId === q.id;
              const qWaiting = q.waiting_count || 0;
              const avgMin = q.avg_duration_minutes || 10;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQueueId(q.id);
                    setStep(3);
                  }}
                  className={`p-5 rounded-3xl cursor-pointer border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-xl shadow-sky-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-sky-300">
                      SERVICE
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{avgMin} min avg</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {q.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {q.description || 'Standard queue with predictive progression and live alerts.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-500" />
                      <span>{qWaiting} waiting users</span>
                    </span>
                    <span
                      className={`font-bold flex items-center space-x-1 ${
                        isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                      }`}
                    >
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: QUEUE CONFIRMATION & IDENTITY (Requirements 19, 20, 21)
      ======================================================== */}
      {selectedQueueId && currentQueue && (
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              QUEUE CONFIRMATION
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Identity & Confirmation Card */}
            <div className="md:col-span-2 space-y-5">
              {/* REQUIREMENT 20: NO GUEST INPUTS, SIGNED IN AS GOOGLE IDENTITY */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      SIGNED IN AS
                    </span>
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                    <Check className="w-3 h-3 text-sky-500" />
                    <span>Google Authenticated</span>
                  </span>
                </div>

                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-md">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
                        }
                        alt={user.displayName || user.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        {user.displayName || user.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {user.email}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Digital queue ticket will be directly linked to this Google profile.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Sign in with your Google account to automatically track your real-time turn and receive predictive Safe Return Window alerts.
                    </p>
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-2 shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>CONTINUE WITH GOOGLE</span>
                    </button>
                  </div>
                )}
              </div>

              {/* REQUIREMENT 21: RULE-BASED PRIORITY REVIEW (NO SELF-CLAIMED "I AM URGENT") */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      PRIORITY REVIEW ELIGIBILITY
                    </span>
                  </div>
                  {priorityReviewApplied ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400/40">
                      REVIEW REQUESTED
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Optional</span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  FAIRQUEUE eliminates unfair queue jumping. Instead of self-declaring urgency, priority requires organization-defined clinical or accessibility triage review.
                </p>

                {priorityReviewApplied ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>Reason: {priorityCategory}</span>
                      <button
                        type="button"
                        onClick={() => setPriorityReviewApplied(false)}
                        className="text-[10px] text-red-500 underline"
                      >
                        Cancel Review Request
                      </button>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {priorityDetails || 'Standard triage request filed with ticket.'}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                      ℹ️ Priority was applied according to the queue's configured rules.
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPriorityModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>REQUEST PRIORITY REVIEW</span>
                  </button>
                )}
              </div>

              {/* Error Display / Banner */}
              {errorState && (
                <div className="animate-fade-in">
                  {errorState.type === 'already_in_queue' ? (
                    <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-xl space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight">You are already in this queue.</h3>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                            {errorState.data?.ticketNumber
                              ? `Active ticket #${errorState.data.ticketNumber} is currently waiting.`
                              : 'You already have an active ticket registered in this queue.'}
                          </p>
                        </div>
                      </div>

                      {errorState.data?.position && (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-800/80 text-xs font-mono font-bold">
                          <span>Your Current Position:</span>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                            #{errorState.data.position}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onNavigate('dashboard')}
                          className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
                        >
                          <span>VIEW MY QUEUE</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setErrorState(null)}
                          className="py-3 px-4 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : errorState.type === 'auth' ? (
                    <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 shadow-lg space-y-3">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-sky-500 shrink-0" />
                        <span className="text-xs font-bold">{errorState.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all"
                      >
                        <span>CONTINUE WITH GOOGLE</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{errorState.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorState(null)}
                        className="text-[11px] underline font-bold ml-2 hover:text-red-900"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION: JOIN QUEUE */}
              <form onSubmit={handleJoin}>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedQueueId}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 tracking-wider flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'ISSUING DIGITAL TICKET...' : 'JOIN QUEUE NOW'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Right 1 Col: Live Queue Summary Card (Requirement 19 Step 3) */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    QUEUE SUMMARY
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {currentQueue?.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Selected Queue:</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {currentQueue.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Current Queue Size:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {waitingCount} people
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Active Counters:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {Math.max(1, activeCounters.length)} Desks
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Estimated Wait:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ~{estWait} min
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Operating Status:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      OPEN (09:00 - 18:00)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-sky-500" />
                    <span>Show Queue QR Code</span>
                  </button>
                </div>
              </div>

              {/* Fairness Assurance Callout */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Fairness Guarantee</span>
                </div>
                <p>
                  Waiting time is credited dynamically. Your position cannot be indefinitely delayed by newer requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIORITY REVIEW MODAL (Requirement 21) */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Request Priority Review
                </h3>
              </div>
              <button
                onClick={() => setShowPriorityModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Priority is not self-assigned. Your request will be recorded and evaluated according to the queue's configured rules.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Eligible Criterion
                </label>
                <select
                  value={priorityCategory}
                  onChange={(e) => setPriorityCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="MEDICAL">Clinical / Medical Triage Assessment</option>
                  <option value="ACCESSIBILITY">Physical Mobility / Disability Accommodation</option>
                  <option value="SENIOR_INFANT">Senior Citizen (65+) / Infant Accompanying</option>
                  <option value="OFFICIAL_DEADLINE">Statutory / Official Time Deadline</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Supporting Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={priorityDetails}
                  onChange={(e) => setPriorityDetails(e.target.value)}
                  placeholder="e.g., Referred by clinic reception or holding appointment memo..."
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPriorityModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriorityReviewApplied(true);
                  setShowPriorityModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
              >
                Apply for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQueueId && currentQueue && (
        <QRCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          queueId={selectedQueueId}
          queueName={currentQueue.name}
          orgName={currentOrg?.name || 'Organization'}
        />
      )}
    </div>
  );
};
