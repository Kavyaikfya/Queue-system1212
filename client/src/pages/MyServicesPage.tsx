import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Bell,
  Sparkles,
  MapPin,
  Calendar,
  LogOut,
  Radio,
  BellRing
} from 'lucide-react';
import { api, qevoraApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface MyServicesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyServicesPage: React.FC<MyServicesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [groupBookings, setGroupBookings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLeaving, setIsLeaving] = useState<string | null>(null);

  const loadMyServices = async () => {
    try {
      setIsLoading(true);
      const [activeRes, histRes] = await Promise.all([
        api.getQevoraActiveServices().catch(() => ({ activeTickets: [], groupBookings: [] })),
        api.getTicketHistory().catch(() => ({ history: [] })),
      ]);

      setActiveTickets(activeRes.activeTickets || []);
      setGroupBookings(activeRes.groupBookings || []);
      setHistory(histRes.history || []);
    } catch (e) {
      console.error('Failed to load My Services:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyServices();
  }, [user]);

  // Live Socket.IO reload on queue events
  useEffect(() => {
    if (!lastEvent) return;
    if (['queue:user_joined', 'queue:called', 'queue:reordered', 'queue:service_completed', 'queue:service_started'].includes(lastEvent.type)) {
      loadMyServices();
    }
  }, [lastEvent]);

  const handleLeaveQueue = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to leave this queue?')) return;
    try {
      setIsLeaving(entryId);
      await api.leaveQueue(entryId);
      loadMyServices();
    } catch (e) {
      console.error('Failed to leave queue:', e);
    } finally {
      setIsLeaving(null);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-1 border border-cyan-500/30">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Real-Time Service Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            My Services
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Track all your active queues, scheduled appointments, and group coordination journeys with live real-time synchronization.
          </p>
        </div>

        <button
          onClick={loadMyServices}
          className="p-3 rounded-2xl qevora-card text-slate-400 hover:text-cyan-400 self-start sm:self-auto transition-colors border border-slate-800"
          title="Refresh active services"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. ACTIVE QUEUES (Digital Boarding Pass Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center space-x-2.5">
            <span>Active Queue Tickets</span>
            {activeTickets.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                {activeTickets.length} Active
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center rounded-3xl qevora-card text-xs text-slate-400 border border-slate-800">
            Loading your active queues...
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="p-8 text-center rounded-3xl qevora-card border border-slate-800 space-y-3">
            <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-white">
              No active queue tokens right now
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Need to visit a hospital, bank, or government center? Join a virtual queue from home to skip physical lines.
            </p>
            <button
              onClick={() => onNavigate('join')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20"
            >
              <span>Join a Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeTickets.map((ticket) => {
              const isCalled = ticket.status === 'CALLED';
              const peopleAhead = Math.max(0, (ticket.position || 1) - 1);
              const isApproaching = ticket.position <= 3;

              return (
                <div
                  key={ticket.id}
                  className={`ticket-wallet-stub p-6 sm:p-8 space-y-6 ${
                    isCalled
                      ? 'ring-2 ring-cyan-400 shadow-2xl shadow-cyan-500/20'
                      : isApproaching
                      ? 'ring-1 ring-amber-500/50 shadow-xl'
                      : ''
                  }`}
                >
                  <div className="ticket-notch-left" />
                  <div className="ticket-notch-right" />

                  {/* Turn Approaching Alert Banner */}
                  {isApproaching && !isCalled && (
                    <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center space-x-3 text-xs text-amber-200 font-bold">
                      <BellRing className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
                      <span>🔔 YOUR TURN IS APPROACHING — "Please be ready near the counter."</span>
                    </div>
                  )}

                  {isCalled && (
                    <div className="p-4 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center space-x-3 text-xs text-cyan-200 font-black animate-pulse">
                      <Bell className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>🔔 YOUR TURN HAS ARRIVED — "Please proceed immediately to the counter!"</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">
                        {ticket.organization_name || 'Participating Center'}
                      </span>
                      <h3 className="text-2xl font-black text-white">
                        {ticket.service_name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.location || 'Central Facility'}</span>
                      </div>
                    </div>

                    {/* Prominent Ticket Badge Stamp */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-center shrink-0 self-start shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        TICKET NUMBER
                      </span>
                      <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
                        #{ticket.prefix || 'T'}-{ticket.ticket_number}
                      </span>
                    </div>
                  </div>

                  {/* Live Progress Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">People Ahead</span>
                      <div className="text-lg font-black text-white">
                        {peopleAhead} {peopleAhead === 1 ? 'person' : 'people'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Estimated Wait</span>
                      <div className="text-lg font-black text-emerald-400">
                        ~{ticket.wait_time_minutes || 8} min
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Queue Status</span>
                      <div className="text-sm font-bold text-cyan-300">
                        {isCalled ? 'Called to Counter' : 'Moving Normally'}
                      </div>
                    </div>
                  </div>

                  {/* Perforated Action Line */}
                  <div className="ticket-perforation pt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleLeaveQueue(ticket.id)}
                      disabled={isLeaving === ticket.id}
                      className="text-xs font-bold text-red-400 hover:text-red-300 hover:underline flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isLeaving === ticket.id ? 'Leaving...' : 'Leave Queue'}</span>
                    </button>

                    <button
                      onClick={() => onNavigate('my-queue')}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow"
                    >
                      <span>View Live Queue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. GROUP BOOKINGS SECTION */}
      {groupBookings.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black text-white">
            Active Group Bookings
          </h2>
          <div className="space-y-4">
            {groupBookings.map((gb) => (
              <div
                key={gb.id}
                onClick={() => onNavigate('group-booking')}
                className="p-6 rounded-3xl qevora-card qevora-card-interactive cursor-pointer border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    Multi-Party Coordination
                  </span>
                  <h4 className="text-lg font-bold text-white">{gb.title}</h4>
                  <p className="text-xs text-slate-400">
                    Status: <strong className="text-amber-400">{gb.status}</strong>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SERVICE HISTORY */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-black text-white">
          Completed Service History
        </h2>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="p-6 rounded-3xl qevora-card text-center text-xs text-slate-400 border border-slate-800">
              No previous service visits on record.
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="p-4 sm:p-5 rounded-2xl qevora-card flex items-center justify-between border border-slate-800 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white text-sm">{h.service_name || 'Public Service'}</div>
                  <div className="text-slate-400">{h.organization_name || 'Center'} · {new Date(h.created_at || Date.now()).toLocaleDateString()}</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Completed ✓
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
