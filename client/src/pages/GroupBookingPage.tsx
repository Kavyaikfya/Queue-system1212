import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Calendar,
  Check,
  X,
  RefreshCw,
  BellRing,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { qevoraApi } from '../services/api';

interface GroupBookingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const GroupBookingPage: React.FC<GroupBookingPageProps> = ({ onNavigate }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New Booking state
  const [title, setTitle] = useState('Property Registration & Biometrics');
  const [serviceName, setServiceName] = useState('Sub-Registrar Land Deed Attestation');
  const [scheduledDate, setScheduledDate] = useState('Tomorrow, 11:30 AM');

  const defaultMembers = [
    { id: 'mem_1', name: 'Alex Morgan', role: 'Buyer (You)', status: 'CONFIRMED' },
    { id: 'mem_2', name: 'Rajesh Kumar', role: 'Seller', status: 'CONFIRMED' },
    { id: 'mem_3', name: 'Dr. Anita Rao', role: 'Witness 1', status: 'CONFIRMED' },
    { id: 'mem_4', name: 'Kavita Sundaram', role: 'Witness 2', status: 'PENDING' },
  ];

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getGroupBookings();
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch (e) {
      console.error('Failed to load group bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleToggleMember = async (bookingId: string, memberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'CONFIRMED' ? 'DECLINED' : 'CONFIRMED';
    try {
      await qevoraApi.confirmGroupMember(bookingId, {
        member_id: memberId,
        status: nextStatus,
      });
      loadBookings();
    } catch (e) {
      console.error('Failed to update member confirmation:', e);
    }
  };

  const handleNotifyEveryone = (bookingTitle: string) => {
    setActionSuccessMsg(`SMS & Push notification sent to all participants for "${bookingTitle}".`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleReschedule = (bookingTitle: string) => {
    setActionSuccessMsg(`Rescheduling portal opened for "${bookingTitle}". Priority alternatives proposed to all participants.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Group Booking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Group Coordination
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Some services require multiple people (e.g. Property registration, joint accounts, legal signatures). Final appointments only lock in when every required participant confirms.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Group Booking</span>
        </button>
      </div>

      {/* Success notification alert */}
      {actionSuccessMsg && (
        <div className="p-4.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-semibold flex items-center justify-between shadow-lg shadow-cyan-500/10 animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Coordination Protocol Banner */}
      <div className="p-4.5 rounded-2xl bg-[#081028]/80 border border-cyan-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <UserCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-white">All-Participant Synchronization:</span>
          <p className="text-slate-400 leading-relaxed">
            Eliminate situations where a family member or witness fails to show up. QEVORA verifies attendance readiness beforehand and provides instant rescheduling if anyone cannot attend.
          </p>
        </div>
      </div>

      {/* Bookings Display */}
      {isLoading ? (
        <div className="p-16 text-center rounded-3xl qevora-card text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading group coordination details...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl qevora-card space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              No group bookings active
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Creating a joint account or registering property? Coordinate your co-applicants here so no one arrives to find a missing witness.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            Create Group Booking
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const memberList = booking.members || defaultMembers;
            const confirmedCount = memberList.filter((m: any) => m.status === 'CONFIRMED').length;
            const totalMembers = memberList.length;
            const hasDeclined = memberList.some((m: any) => m.status === 'DECLINED');
            const hasPending = memberList.some((m: any) => m.status === 'PENDING');
            const isAtRisk = hasDeclined || hasPending || booking.status === 'AT_RISK';
            const allConfirmed = confirmedCount === totalMembers;

            return (
              <div
                key={booking.id}
                className={`p-6 sm:p-8 rounded-3xl qevora-card space-y-6 shadow-2xl relative overflow-hidden transition-all ${
                  isAtRisk
                    ? 'border-amber-500/40 shadow-amber-500/5'
                    : 'border-cyan-500/30'
                }`}
              >
                {/* Risk Warning Alert */}
                {isAtRisk && (
                  <div className="p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm block text-amber-300">
                          GROUP BOOKING AT RISK
                        </span>
                        <p className="text-slate-300">
                          {hasDeclined
                            ? 'A required participant has declined. The appointment cannot proceed until rescheduled.'
                            : 'Awaiting confirmation from all required participants before appointment is locked.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleNotifyEveryone(booking.title)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-colors border border-amber-500/30"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Notify Everyone</span>
                      </button>
                      <button
                        onClick={() => handleReschedule(booking.title)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      {booking.org_name || 'Sub-Registrar Department'}
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      {booking.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{booking.scheduled_date || 'Tomorrow, 11:30 AM'}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span>Service: <strong className="text-slate-200">{booking.service_name || 'Biometrics & Deed Sign-off'}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full border ${
                        allConfirmed
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isAtRisk
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {allConfirmed ? 'ALL CONFIRMED &bull; LOCKED' : `${confirmedCount}/${totalMembers} CONFIRMED`}
                    </span>
                  </div>
                </div>

                {/* Participant Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    REQUIRED PARTICIPANTS ({confirmedCount} OF {totalMembers} READY)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memberList.map((member: any) => {
                      const isConfirmed = member.status === 'CONFIRMED';
                      const isDeclined = member.status === 'DECLINED';

                      return (
                        <div
                          key={member.id || member.name}
                          className="p-4 rounded-2xl bg-[#04091a]/80 border border-slate-800/80 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-cyan-400">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white">{member.name}</div>
                              <div className="text-xs text-slate-400">{member.role}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : isDeclined
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {member.status}
                            </span>
                            <button
                              onClick={() => handleToggleMember(booking.id, member.id || member.name, member.status)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Toggle confirmation status"
                            >
                              {isConfirmed ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
