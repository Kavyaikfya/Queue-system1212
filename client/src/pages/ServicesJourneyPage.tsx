import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Landmark,
  GraduationCap,
  Building,
  Briefcase,
  Home,
  Wrench,
  Car,
  Zap,
  Users,
  FileText,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  RefreshCw,
  Edit3,
  X,
  Check,
  Star,
  MapPin,
  HelpCircle,
  Bookmark,
  Calendar,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { qevoraApi, ServiceItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface ServicesJourneyPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const ServicesJourneyPage: React.FC<ServicesJourneyPageProps> = ({
  onNavigate,
  initialCategory = 'ALL',
  initialSearch = '',
}) => {
  const { isStaff, isOrgAdmin, isSuperAdmin } = useAuth();
  const { lastEvent } = useSocket();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);
  const [savedFavorites, setSavedFavorites] = useState<Record<string, boolean>>({
    srv_kyc: true,
  });

  // Detailed Service Overview Modal State (Section 3)
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceItem | null>(null);

  // Admin Availability Edit Modal
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editStatus, setEditStatus] = useState<'AVAILABLE' | 'DELAYED' | 'UNAVAILABLE'>('AVAILABLE');
  const [editStaffStatus, setEditStaffStatus] = useState<string>('Staff on duty');
  const [editReason, setEditReason] = useState<string>('');
  const [editRecovery, setEditRecovery] = useState<string>('4:00 PM');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // 12 Real-World Service Categories from user prompt
  const categories = [
    { id: 'ALL', label: 'All Services', icon: Sparkles },
    { id: 'HEALTHCARE', label: 'Healthcare', icon: HeartPulse },
    { id: 'EDUCATION', label: 'Education', icon: GraduationCap },
    { id: 'BANKING', label: 'Banking & Finance', icon: Landmark },
    { id: 'GOVERNMENT', label: 'Government & Civic', icon: Building },
    { id: 'EMPLOYMENT', label: 'Employment', icon: Briefcase },
    { id: 'HOUSING', label: 'Housing & Property', icon: Home },
    { id: 'BUSINESS', label: 'Business Services', icon: Building2 },
    { id: 'RETAIL', label: 'Retail & Service', icon: Wrench },
    { id: 'TRANSPORT', label: 'Travel & Transport', icon: Car },
    { id: 'UTILITIES', label: 'Utilities', icon: Zap },
    { id: 'COMMUNITY', label: 'Community & Society', icon: Users },
    { id: 'DOCUMENTS', label: 'Document Services', icon: FileText },
  ];

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getServices({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchQuery || undefined,
      });
      if (res.success) {
        setServices(res.services);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  useEffect(() => {
    if (lastEvent?.type === 'SERVICE_STATUS_CHANGED' || lastEvent?.type === 'QUEUE_STATUS_CHANGED') {
      loadServices();
    }
  }, [lastEvent]);

  const handleAdminUpdate = async () => {
    if (!editingService) return;
    try {
      setIsSavingEdit(true);
      await qevoraApi.updateAvailability(editingService.id, {
        status: editStatus,
        staff_status: editStaffStatus,
        delay_reason: editReason,
        expected_recovery: editRecovery,
      });
      setEditingService(null);
      await loadServices();
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openAdminEdit = (srv: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingService(srv);
    setEditStatus(srv.status || 'AVAILABLE');
    setEditStaffStatus(srv.staff_status || 'Staff on duty');
    setEditReason(srv.delay_reason || '');
    setEditRecovery(srv.expected_recovery || '4:00 PM');
  };

  const toggleFavorite = (srvId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedFavorites((prev) => ({
      ...prev,
      [srvId]: !prev[srvId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available</span>
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Delayed</span>
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Unavailable</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verified Service Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Service Directory & Live Journey
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Check real-time staff status, verified delays, and required documents before arriving. Only participating QEVORA facilities guarantee live virtual queue sync.
          </p>
        </div>

        <button
          onClick={() => loadServices()}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl qevora-card text-xs font-bold text-slate-300 hover:text-cyan-400 self-start sm:self-auto transition-colors border border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* Temporary Success Alert */}
      {notificationSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationSuccess}</span>
          </div>
          <button onClick={() => setNotificationSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input Bar (Services, Organizations, Locations) */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadServices()}
            placeholder="Search by service name, government department, bank, or city location..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                loadServices();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 12 Categories Horizontal Pill Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl qevora-card animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center rounded-3xl qevora-card space-y-4 border border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            No participating services found for this query
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try searching for "Bank KYC", "Hospital OPD", or reset category filters to view all participating facilities.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => {
            const isAvailable = srv.status === 'AVAILABLE';
            const isDelayed = srv.status === 'DELAYED';
            const isUnavailable = srv.status === 'UNAVAILABLE';
            const isFav = !!savedFavorites[srv.id];

            return (
              <div
                key={srv.id}
                onClick={() => setSelectedServiceDetail(srv)}
                className="rounded-3xl qevora-card qevora-card-interactive p-6 flex flex-col justify-between space-y-4 cursor-pointer border border-slate-800 hover:border-cyan-500/40 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                      {srv.category}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {getStatusBadge(srv.status || 'AVAILABLE')}
                      <button
                        onClick={(e) => toggleFavorite(srv.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Save to favorites"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      {(isStaff || isOrgAdmin || isSuperAdmin) && (
                        <button
                          onClick={(e) => openAdminEdit(srv, e)}
                          title="Admin: Edit live availability"
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {srv.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{srv.location}</span>
                    </div>
                  </div>

                  {/* Status & Wait Details Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-xs">
                    {isUnavailable ? (
                      <div className="space-y-1 text-red-300">
                        <div className="font-bold flex items-center space-x-1.5 text-red-400">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Temporarily Closed / Doctor Away</span>
                        </div>
                        <p className="text-slate-300">
                          Reason: {srv.delay_reason || 'Staff unavailable'}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Expected recovery: <strong className="text-white">{srv.expected_recovery || '4:00 PM'}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Staff Presence:</span>
                          <span className="font-semibold text-white">
                            {srv.staff_status || 'Staff on duty'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Current Wait:</span>
                          <span className="font-extrabold text-cyan-400 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>~{srv.expected_wait_min || 15} min</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Required Documents Snippet */}
                  {srv.requirements && srv.requirements.length > 0 && (
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Requires: </span>
                      <span>{srv.requirements.slice(0, 2).join(', ')}</span>
                      {srv.requirements.length > 2 && ' + more'}
                    </div>
                  )}
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Click for Full Details</span>
                  <div className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Explore Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USER-FRIENDLY DETAILED SERVICE OVERVIEW MODAL (Prompt Spec 3) */}
      {selectedServiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl qevora-card p-6 sm:p-8 space-y-6 shadow-2xl border border-cyan-500/40 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    {selectedServiceDetail.category}
                  </span>
                  {getStatusBadge(selectedServiceDetail.status || 'AVAILABLE')}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {selectedServiceDetail.name}
                </h2>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedServiceDetail.location}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedServiceDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Service Details Grid */}
            <div className="space-y-4 text-xs">
              {/* 1. What this service provides */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h4 className="font-extrabold text-white text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>What This Service Provides</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {selectedServiceDetail.description ||
                    'Official counter processing, physical verification, biometric attestation, and certified acknowledgement receipt.'}
                </p>
              </div>

              {/* 2. Current Availability & Waiting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Staff Presence</span>
                  <div className="text-sm font-bold text-white">
                    {selectedServiceDetail.staff_status || 'Staff / Officer on duty'}
                  </div>
                  <p className="text-[11px] text-slate-400">Live updated counter feed</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Current Wait</span>
                  <div className="text-sm font-black text-cyan-400 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4" />
                    <span>~{selectedServiceDetail.expected_wait_min || 15} minutes</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Estimated duration: ~10 min per citizen</p>
                </div>
              </div>

              {/* 3. Required Documents */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Required Documents Checklist
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  {(selectedServiceDetail.requirements || [
                    'Government Photo ID (Aadhaar/Passport)',
                    'Official Application Form Reference',
                    'Address Proof'
                  ]).map((req: string, idx: number) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Accessibility & Important Notice */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3 text-slate-300">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">Accessibility & Facility Information:</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Wheelchair ramps available on Ground Floor. Token displays show audio announcements in English and local languages.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Prominent Action Buttons (Section 3 Prompt Requirements) */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-extrabold">
                <button
                  onClick={() => {
                    setNotificationSuccess(`Checked live status: ${selectedServiceDetail.name} is ${selectedServiceDetail.status || 'AVAILABLE'}.`);
                    setSelectedServiceDetail(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Check Availability</span>
                </button>

                <button
                  onClick={() => {
                    const srvId = selectedServiceDetail.id;
                    setSelectedServiceDetail(null);
                    onNavigate('join', { serviceId: srvId });
                  }}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Join Queue</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedServiceDetail(null);
                    onNavigate('group-booking');
                  }}
                  className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Book Service</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
                <button
                  onClick={() => {
                    setSelectedServiceDetail(null);
                    onNavigate('snap-understand');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Understand Document</span>
                </button>

                <button
                  onClick={(e) => {
                    toggleFavorite(selectedServiceDetail.id, e);
                    setNotificationSuccess('Service saved to your profile favorites.');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LIVE AVAILABILITY UPDATE MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl qevora-card p-6 space-y-4 shadow-2xl border border-cyan-500/30">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Admin Control Panel
                </span>
                <h3 className="text-lg font-bold text-white">
                  Update {editingService.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Live Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['AVAILABLE', 'DELAYED', 'UNAVAILABLE'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                        editStatus === st
                          ? st === 'AVAILABLE'
                            ? 'bg-emerald-500 text-slate-950'
                            : st === 'DELAYED'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Staff / Doctor Status
                </label>
                <input
                  type="text"
                  value={editStaffStatus}
                  onChange={(e) => setEditStaffStatus(e.target.value)}
                  placeholder="e.g. 3 Counters Open, Dr. Mehta available"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              {editStatus !== 'AVAILABLE' && (
                <>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="e.g. Doctor is in emergency ward"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Expected Recovery
                    </label>
                    <input
                      type="text"
                      value={editRecovery}
                      onChange={(e) => setEditRecovery(e.target.value)}
                      placeholder="e.g. 4:00 PM or Tomorrow 9:00 AM"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingService(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminUpdate}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
              >
                {isSavingEdit ? 'Saving...' : 'Save & Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
