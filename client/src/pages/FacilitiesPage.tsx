import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Clock,
  Layers,
  Heart,
  ExternalLink,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Search,
  Activity,
  Phone,
  Globe,
  MapPin,
  Accessibility,
} from 'lucide-react';
import { api } from '../services/api';

interface FacilitiesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const FacilitiesPage: React.FC<FacilitiesPageProps> = ({ onNavigate }) => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [avoidCheckModal, setAvoidCheckModal] = useState<{
    isOpen: boolean;
    serviceName?: string;
    loading: boolean;
    data?: any;
  }>({
    isOpen: false,
    loading: false,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [facRes, favRes] = await Promise.all([
        api.getFacilitiesIntelligence().catch(() => ({ facilities: [] })),
        api.getFavorites().catch(() => ({ favorites: [] })),
      ]);
      const facs = facRes.facilities || [];
      setFacilities(facs);
      setFavorites(favRes.favorites || []);
      if (facs.length > 0 && !selectedFacility) {
        setSelectedFacility(facs[0]);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFavorite = async (orgId?: string, svcId?: string) => {
    try {
      await api.toggleFavorite({ organizationId: orgId, serviceId: svcId });
      const favRes = await api.getFavorites();
      setFavorites(favRes.favorites || []);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const isOrgFavorite = (orgId: string) => {
    return favorites.some((f) => f.organization_id === orgId);
  };

  const handleCheckCanAvoid = async (serviceId: string, serviceName: string) => {
    setAvoidCheckModal({
      isOpen: true,
      serviceName,
      loading: true,
    });
    try {
      const data = await api.canAvoidVisit(serviceId);
      setAvoidCheckModal({
        isOpen: true,
        serviceName,
        loading: false,
        data,
      });
    } catch (err) {
      console.error('Can avoid error:', err);
      setAvoidCheckModal({
        isOpen: true,
        serviceName,
        loading: false,
        data: {
          status: 'PHYSICAL VISIT REQUIRED',
          title: 'Physical In-Person Verification Mandatory',
          description: 'Official physical attendance is required by policy.',
          requirementsNeeded: ['Valid Photo ID', 'In-Person Presence'],
        },
      });
    }
  };

  const getDemandBadgeColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'NORMAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'BUSY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'VERY BUSY':
        return 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL-TIME VISIT INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Facility Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time crowd demand, counter velocity, operating status, and online alternatives.
          </p>
        </div>

        <button
          onClick={() => onNavigate('join')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 active:scale-95 transition-all self-start sm:self-auto"
        >
          <span>JOIN QUEUE</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: Facility Grid + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Facilities List (Left) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              PARTICIPATING FACILITIES ({facilities.length})
            </h3>
          </div>

          <div className="space-y-3">
            {facilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;
              const isFav = isOrgFavorite(fac.id);
              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-white dark:bg-[#0b162b] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">
                        {fac.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {fac.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{fac.address || 'Central District'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(fac.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                      title={isFav ? 'Remove Favorite' : 'Save as Favorite'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold border ${getDemandBadgeColor(
                        fac.demandLevel
                      )}`}
                    >
                      {fac.demandLevel} CROWD
                    </span>
                    <span className="text-slate-400 font-mono">
                      {fac.totalWaiting || 0} waiting • {fac.activeCountersCount || 0} counters
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Facility Detail (Center + Right) */}
        {selectedFacility && (
          <div className="lg:col-span-2 space-y-6">
            {/* Facility Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
                    {selectedFacility.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {selectedFacility.name}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {selectedFacility.operating_status || 'OPEN NOW'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedFacility.address || 'Medical & Civic Center Complex'} •{' '}
                      {selectedFacility.phone || '+1 (555) 234-5678'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getDemandBadgeColor(
                      selectedFacility.demandLevel
                    )}`}
                  >
                    DEMAND: {selectedFacility.demandLevel}
                  </span>
                </div>
              </div>

              {/* 4 Metric Cards as required in Section 22 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    CURRENT CROWD
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedFacility.totalWaiting || 0}
                  </div>
                  <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                    {selectedFacility.demandLevel} Level
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ACTIVE COUNTERS
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedFacility.activeCountersCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Serving Now</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    AVG WAIT
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedFacility.avgWaitMinutes || 12} min
                  </div>
                  <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Predictive</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SERVICES
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedFacility.services?.length || 0}
                  </div>
                  <div className="text-[10px] text-cyan-500 font-semibold mt-0.5">Available</div>
                </div>
              </div>

              {/* Accessibility Information */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center space-x-3 text-xs text-slate-300">
                <Accessibility className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  <strong className="text-white">Accessibility & Amenities:</strong>{' '}
                  {selectedFacility.accessibility_info ||
                    'Wheelchair accessible entrance, priority service counters, braille signage, and elevator access.'}
                </span>
              </div>
            </div>

            {/* Available Services List */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                AVAILABLE SERVICES ({selectedFacility.services?.length || 0})
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedFacility.services?.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {svc.name}
                        </h4>
                        {svc.online_available && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                            ONLINE OPTION
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {svc.description || 'Standard service consultation and intake'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center space-x-3">
                        <span>Est. Duration: {svc.estimated_duration_min || 15} min</span>
                        <span>•</span>
                        <span>Waiting in queue: {svc.currentWaiting || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Can I avoid this visit? button */}
                      <button
                        onClick={() => handleCheckCanAvoid(svc.id, svc.name)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Check if this service has online submission options"
                      >
                        Can I Avoid Visit?
                      </button>

                      {/* Join Queue button */}
                      <button
                        onClick={() => onNavigate('join', { serviceId: svc.id, orgId: selectedFacility.id })}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95 flex items-center space-x-1.5"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CAN I AVOID THIS VISIT? Modal Dialog */}
      {avoidCheckModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CAN I AVOID THIS VISIT?</span>
              </div>
              <button
                onClick={() => setAvoidCheckModal({ isOpen: false, loading: false })}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {avoidCheckModal.loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">
                  Checking digital portal alternatives...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    STATUS VERIFICATION:
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {avoidCheckModal.data?.status}
                  </h3>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {avoidCheckModal.data?.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {avoidCheckModal.data?.description}
                  </p>
                </div>

                {avoidCheckModal.data?.requirementsNeeded?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      IF VISITING IN PERSON, ENSURE:
                    </span>
                    {avoidCheckModal.data.requirementsNeeded.map((req: string, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setAvoidCheckModal({ isOpen: false, loading: false })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  {avoidCheckModal.data?.status === 'ONLINE OPTION AVAILABLE' ? (
                    <a
                      href={avoidCheckModal.data?.actionUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-1.5"
                    >
                      <span>{avoidCheckModal.data?.actionText || 'Open Digital Portal'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setAvoidCheckModal({ isOpen: false, loading: false });
                        onNavigate('readiness');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Check Visit Readiness
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
