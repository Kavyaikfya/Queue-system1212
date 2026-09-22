import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCw,
  Star,
  Send,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface MyVisitPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyVisitPage: React.FC<MyVisitPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketsRes, histRes] = await Promise.all([
        api.getActiveTickets().catch(() => ({ activeTickets: [] })),
        api.getTicketHistory().catch(() => ({ history: [] })),
      ]);
      setActiveTickets(ticketsRes.activeTickets || []);
      setHistory(histRes.history || []);
    } catch (e) {
      console.error('Error loading visit data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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
      loadData();
    }
  }, [lastEvent]);

  const activeTicket = activeTickets[0];
  const lastCompletedVisit = history.find((h) => h.status === 'COMPLETED') || history[0];

  const handleSubmitFeedback = async () => {
    if (!lastCompletedVisit) return;
    setFeedbackLoading(true);
    try {
      await api.submitVisitFeedback({
        entryId: lastCompletedVisit.id,
        organizationId: lastCompletedVisit.organization_id,
        serviceId: lastCompletedVisit.service_id,
        rating: feedbackRating,
        feedback: feedbackText,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Determine current timeline phase dynamically from actual active ticket
  const getTimelineSteps = () => {
    const isJoined = !!activeTicket;
    const isCalled = activeTicket?.status === 'CALLED';
    const isServing = activeTicket?.status === 'IN_SERVICE';
    const isCompleted = !activeTicket && history.length > 0;

    return [
      {
        id: 'SERVICE_SELECTED',
        title: 'SERVICE SELECTED',
        desc: activeTicket ? `${activeTicket.service_name || activeTicket.organization_name}` : 'Select your desired service',
        status: isJoined || isCompleted ? 'COMPLETED' : 'CURRENT',
      },
      {
        id: 'REQUIREMENTS_CHECKED',
        title: 'REQUIREMENTS CHECKED',
        desc: 'Pre-requisite documents and checklist reviewed',
        status: isJoined || isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'VISIT_READY',
        title: 'VISIT READY',
        desc: 'Visit readiness criteria satisfied',
        status: isJoined || isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'QUEUE_JOINED',
        title: 'QUEUE JOINED',
        desc: activeTicket ? `Ticket #${activeTicket.ticket_number} assigned` : 'Join the queue session',
        status: isJoined ? 'COMPLETED' : isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'WAITING',
        title: 'WAITING',
        desc: activeTicket ? `${activeTicket.people_ahead || 0} visitors ahead` : 'Predictive wait countdown',
        status: isServing || isCalled ? 'COMPLETED' : isJoined ? 'CURRENT' : isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'TURN_APPROACHING',
        title: 'TURN APPROACHING',
        desc: isCalled ? 'Safe Return Alert: Proceed to counter now' : 'Triggered within Safe Return Window',
        status: isServing ? 'COMPLETED' : isCalled ? 'CURRENT' : isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'SERVICE',
        title: 'SERVICE',
        desc: isServing ? 'Active session at counter' : 'Service by designated staff',
        status: isServing ? 'CURRENT' : isCompleted ? 'COMPLETED' : 'PENDING',
      },
      {
        id: 'COMPLETED',
        title: 'COMPLETED',
        desc: isCompleted ? 'Service finished successfully' : 'Final visit sign-off',
        status: isCompleted ? 'COMPLETED' : 'PENDING',
      },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>JOURNEY INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            My Visit Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end trace of your visit: from preparation and waiting to service completion and feedback.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b162b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
          title="Refresh Journey"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timeline Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>PERSONAL VISIT TIMELINE</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {activeTicket ? `Ticket #${activeTicket.ticket_number}` : 'No active session'}
          </span>
        </div>

        {/* Vertical/Horizontal responsive timeline steps */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {steps.map((step, idx) => {
            const isDone = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';

            return (
              <div key={step.id} className="relative flex items-start space-x-4">
                {/* Node indicator */}
                <div
                  className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`text-xs font-black tracking-wider uppercase ${
                        isCurrent
                          ? 'text-blue-500'
                          : isDone
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase animate-pulse border border-blue-500/30">
                        CURRENT STATE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISIT SUMMARY & 1-5 FEEDBACK (Section 29) */}
      {lastCompletedVisit && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>VISIT SUMMARY</span>
            </h3>
            <span className="text-xs font-mono text-emerald-500 font-bold">
              COMPLETED VISIT
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                FACILITY
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                {lastCompletedVisit.organization_name || 'City Care Clinic'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                SERVICE
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                {lastCompletedVisit.queue_name || 'General Consultation'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WAIT DURATION
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {lastCompletedVisit.duration_seconds
                  ? `${Math.round(lastCompletedVisit.duration_seconds / 60)} min`
                  : '14 min'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                COMPLETED AT
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {new Date(lastCompletedVisit.join_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Feedback Form (1-5 rating & optional comments) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>HOW WAS YOUR VISIT?</span>
            </h4>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! Your feedback has been saved to the facility visit ledger.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1-5 Star Picker */}
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-400 ml-2">
                    {feedbackRating === 5
                      ? 'Excellent'
                      : feedbackRating === 4
                      ? 'Very Good'
                      : feedbackRating === 3
                      ? 'Average'
                      : feedbackRating === 2
                      ? 'Needs Improvement'
                      : 'Poor'}
                  </span>
                </div>

                {/* Feedback comment input */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Optional comments regarding waiting comfort, counter staff, or facility experience..."
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />

                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{feedbackLoading ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
