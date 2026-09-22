import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Flag,
  RotateCcw,
} from 'lucide-react';

interface QueueTimelineProps {
  events: any[];
}

export const QueueTimeline: React.FC<QueueTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No timeline events logged yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'JOINED':
        return <Flag className="w-3.5 h-3.5 text-brand-500" />;
      case 'POSITION_CHANGED':
        return <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />;
      case 'CALLED':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'SERVICE_STARTED':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-500" />;
      case 'SERVICE_COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'NO_SHOW':
        return <RotateCcw className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {events.map((ev, index) => (
        <div key={ev.id || index} className="relative flex items-start space-x-3 group">
          {/* Dot */}
          <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:border-brand-500 transition-colors">
            {getEventIcon(ev.event_type)}
          </div>

          {/* Content */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {ev.event_type.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(ev.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {ev.reason || 'Status updated'}
            </p>
            {ev.new_position !== undefined && ev.previous_position !== undefined && (
              <div className="mt-1.5 flex items-center space-x-2 text-[11px] font-mono">
                <span className="text-slate-400 line-through">#{ev.previous_position}</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  #{ev.new_position}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
