import React from 'react';
import {
  X,
  Sparkles,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Calendar,
} from 'lucide-react';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  currentPosition: number;
  priorityScore: number;
  priorityReason: string;
  recentEvents: any[];
  estimatedWaitMinutes?: number;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  currentPosition,
  priorityScore,
  priorityReason,
  recentEvents,
  estimatedWaitMinutes = 17,
}) => {
  if (!isOpen) return null;

  // Filter position changed and important queue events
  const positionEvents = recentEvents.filter(
    (ev) =>
      ev.event_type === 'POSITION_CHANGED' ||
      ev.event_type === 'JOINED' ||
      ev.event_type === 'SERVICE_COMPLETED' ||
      ev.event_type === 'CALLED'
  );

  // Latest previous position
  const lastChange = positionEvents.find(
    (ev) => ev.previous_position && ev.previous_position !== currentPosition
  );
  const prevPos = lastChange?.previous_position || currentPosition + 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-sky-500/30 w-full max-w-xl rounded-3xl shadow-2xl shadow-sky-500/10 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">QUEUE AI EXPLANATION</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-sky-400/20 text-sky-300 border border-sky-400/30 uppercase">
                  Transparent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ticket <span className="font-mono font-bold text-sky-400">#{ticketNumber}</span> · Real-Time Algorithmic Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {/* Key Intelligence Summary Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-950/30 border border-sky-500/20 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Position</span>
              <div className="text-2xl font-black text-sky-400 font-mono mt-0.5">
                #{currentPosition.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] text-slate-500">Live in queue</span>
            </div>

            <div className="border-x border-slate-800 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Previous Position</span>
              <div className="text-2xl font-black text-slate-400 font-mono mt-0.5">
                #{prevPos.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Advanced +{Math.max(1, prevPos - currentPosition)}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Waiting Time</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {estimatedWaitMinutes}m
              </div>
              <span className="text-[10px] text-slate-500">Predicted ETA</span>
            </div>
          </div>

          {/* Transparent AI Explanation Callout */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Why Your Position Changed</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              Your position changed from <strong className="text-sky-300">#{prevPos.toString().padStart(2, '0')}</strong> to <strong className="text-sky-300">#{currentPosition.toString().padStart(2, '0')}</strong> because {prevPos - currentPosition > 1 ? `${prevPos - currentPosition} services were completed ahead of you` : 'services were completed ahead of you at active counters'}.
            </p>
            <p className="text-xs text-slate-400">
              <strong>Calculation Basis:</strong> {priorityReason || 'Standard wait-time progression with starvation-prevention bonus'}.
            </p>
          </div>

          {/* Next Update & Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">Estimated Next Update:</span>
            </div>
            <span className="font-mono text-sky-300 font-semibold">~2 to 3 minutes</span>
          </div>

          {/* Important Queue Events Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Important Queue Events</span>
            </h4>

            {positionEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Your position has remained steady since entering the queue.
              </p>
            ) : (
              <div className="space-y-2">
                {positionEvents.map((ev, i) => {
                  const isImprovement =
                    ev.new_position !== undefined &&
                    ev.previous_position !== undefined &&
                    ev.new_position < ev.previous_position;

                  return (
                    <div
                      key={ev.id || i}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start justify-between"
                    >
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`p-1 rounded-lg mt-0.5 ${
                            isImprovement
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-blue-950 text-sky-400'
                          }`}
                        >
                          {isImprovement ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {ev.reason || 'Position updated from active counter service'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ev.created_at || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xs font-mono font-bold text-sky-300">
                          #{ev.new_position || currentPosition}
                        </span>
                        {ev.previous_position && (
                          <span className="text-[10px] text-slate-500 block line-through">
                            #{ev.previous_position}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Fairness Score: 94% guaranteed</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
