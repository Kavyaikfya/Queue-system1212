import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  qevoraApi,
  ServiceItem,
  ActiveServiceItem,
  ActionableAlert,
  OpportunityRescueItem
} from '../services/api';
import {
  Search, Mic, MicOff, ArrowRight, Clock,
  AlertTriangle, Users, FileText, ChevronRight,
  ShieldCheck, RefreshCw, Sparkles, Building2, MapPin,
  Check, X, Radio, BellRing, HeartPulse, Landmark,
  GraduationCap, Building, Briefcase, Home, Wrench,
  Car, Zap, UserCheck, Star, ArrowUpRight, CheckCircle2
} from 'lucide-react';

interface UserDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Search & Voice States
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const [guidanceResult, setGuidanceResult] = useState<{
    query: string;
    serviceName: string;
    category: string;
    availability: 'AVAILABLE' | 'DELAYED' | 'UNAVAILABLE';
    requiredDocs: string[];
    waitMin: number;
    recommendedAction: string;
    targetRoute: string;
  } | null>(null);

  // Data states
  const [activeServices, setActiveServices] = useState<ActiveServiceItem[]>([]);
  const [liveServices, setLiveServices] = useState<ServiceItem[]>([]);
  const [actionableAlerts, setActionableAlerts] = useState<ActionableAlert[]>([]);
  const [opportunityAtRisk, setOpportunityAtRisk] = useState<OpportunityRescueItem | null>(null);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = (user as any)?.displayName || (user as any)?.name || 'Citizen';
  const userName = displayName.split(' ')[0];

  // Load real backend data
  const loadDashboardData = async () => {
    try {
      const [servicesRes, activeRes, alertsRes, rescueRes] = await Promise.all([
        qevoraApi.getServices(),
        qevoraApi.getActiveServices(),
        qevoraApi.getActionableAlerts(),
        qevoraApi.getOpportunityRecovery()
      ]);

      if (servicesRes.success) {
        setLiveServices(servicesRes.services);
      }
      if (activeRes.success) {
        setActiveServices(activeRes.activeServices);
      }
      if (alertsRes.success) {
        setActionableAlerts(alertsRes.alerts);
      }
      if (rescueRes.success && rescueRes.opportunities.length > 0) {
        const atRisk = rescueRes.opportunities.find((o: OpportunityRescueItem) => o.status === 'AT_RISK');
        setOpportunityAtRisk(atRisk || null);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Web Speech API Voice Recognition
  const toggleVoiceInput = () => {
    setVoiceError(null);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser. Please type your request.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        handleSearch(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        setVoiceError('Could not capture audio. Please try again or type.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to initialize:', err);
      setVoiceError('Microphone permission needed or voice engine unavailable.');
      setIsListening(false);
    }
  };

  // Human-Friendly Search / Guidance Engine
  const handleSearch = (textToSearch?: string) => {
    const query = (textToSearch !== undefined ? textToSearch : searchQuery).trim().toLowerCase();
    if (!query) return;

    if (query.includes('hospital') || query.includes('doctor') || query.includes('opd') || query.includes('health') || query.includes('clinic')) {
      setGuidanceResult({
        query,
        serviceName: 'City Hospital OPD Consultation',
        category: 'Healthcare',
        availability: 'AVAILABLE',
        requiredDocs: ['Government Photo ID (Aadhaar)', 'Previous Prescriptions', 'Health Insurance Card'],
        waitMin: 18,
        recommendedAction: 'Join OPD Queue or Book Doctor Slot',
        targetRoute: 'services'
      });
    } else if (query.includes('bank') || query.includes('kyc') || query.includes('account') || query.includes('finance') || query.includes('loan')) {
      setGuidanceResult({
        query,
        serviceName: 'Bank KYC & Account Verification',
        category: 'Banking & Finance',
        availability: 'AVAILABLE',
        requiredDocs: ['PAN Card', 'Aadhaar Card', 'Address Proof (Utility Bill)'],
        waitMin: 12,
        recommendedAction: 'Verify via Service Passport or Join Counter Queue',
        targetRoute: 'services'
      });
    } else if (query.includes('notice') || query.includes('letter') || query.includes('reject') || query.includes('document')) {
      setGuidanceResult({
        query,
        serviceName: 'Document Notice Clarification',
        category: 'Document & Citizen Services',
        availability: 'AVAILABLE',
        requiredDocs: ['The Physical or Digital Notice / Letter Received'],
        waitMin: 0,
        recommendedAction: 'Upload to Snap & Understand for Instant Breakdown',
        targetRoute: 'snap-understand'
      });
    } else if (query.includes('college') || query.includes('university') || query.includes('certificate') || query.includes('degree') || query.includes('exam')) {
      setGuidanceResult({
        query,
        serviceName: 'Degree & Transcript Attestation',
        category: 'Education',
        availability: 'DELAYED',
        requiredDocs: ['Original Marksheets', 'College ID Card', 'Fee Receipt'],
        waitMin: 45,
        recommendedAction: 'Check Counter Availability before Traveling',
        targetRoute: 'services'
      });
    } else if (query.includes('property') || query.includes('deed') || query.includes('house') || query.includes('rent')) {
      setGuidanceResult({
        query,
        serviceName: 'Sub-Registrar Property Deed Attestation',
        category: 'Housing & Property',
        availability: 'AVAILABLE',
        requiredDocs: ['Draft Sale Deed', 'Buyer & Seller IDs', 'Two Identified Witnesses'],
        waitMin: 30,
        recommendedAction: 'Coordinate Co-Applicants via Group Booking',
        targetRoute: 'group-booking'
      });
    } else {
      setGuidanceResult({
        query,
        serviceName: 'General Citizen Service Support',
        category: 'Civic Services',
        availability: 'AVAILABLE',
        requiredDocs: ['Government Photo ID', 'Service Application Reference'],
        waitMin: 15,
        recommendedAction: 'Explore Participating Qevora Centers',
        targetRoute: 'services'
      });
    }
  };

  // 12 Real-World Service Categories specified in prompt
  const serviceCategories = [
    {
      id: 'HEALTHCARE',
      name: 'Healthcare',
      icon: HeartPulse,
      desc: 'Hospitals, OPD clinics, diagnostics & labs',
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
      badge: '9 Available',
    },
    {
      id: 'EDUCATION',
      name: 'Education',
      icon: GraduationCap,
      desc: 'Colleges, universities, admission & exams',
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      badge: '6 Available',
    },
    {
      id: 'BANKING',
      name: 'Banking & Finance',
      icon: Landmark,
      desc: 'Banks, KYC verification, loans & insurance',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      badge: '12 Available',
    },
    {
      id: 'GOVERNMENT',
      name: 'Government & Civic',
      icon: Building,
      desc: 'Revenue offices, RTO, Aadhaar & municipal',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
      badge: '8 Available',
    },
    {
      id: 'EMPLOYMENT',
      name: 'Employment',
      icon: Briefcase,
      desc: 'Job exchanges, skill centers & verification',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      badge: '4 Available',
    },
    {
      id: 'HOUSING',
      name: 'Housing & Property',
      icon: Home,
      desc: 'Property registration, deeds & associations',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
      badge: '5 Available',
    },
    {
      id: 'BUSINESS',
      name: 'Business Services',
      icon: Building2,
      desc: 'Legal, corporate attestation & documentation',
      color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-300',
      badge: '7 Available',
    },
    {
      id: 'RETAIL',
      name: 'Retail & Service',
      icon: Wrench,
      desc: 'Electronics repair, customer care & auto',
      color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400',
      badge: '11 Available',
    },
    {
      id: 'TRANSPORT',
      name: 'Travel & Transport',
      icon: Car,
      desc: 'Driving licenses, vehicle RC & transport',
      color: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30 text-sky-400',
      badge: '5 Available',
    },
    {
      id: 'UTILITIES',
      name: 'Utilities',
      icon: Zap,
      desc: 'Electricity boards, water & telecom counters',
      color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400',
      badge: '6 Available',
    },
    {
      id: 'COMMUNITY',
      name: 'Community & Society',
      icon: Users,
      desc: 'Resident welfare associations & local bodies',
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
      badge: '3 Available',
    },
    {
      id: 'DOCUMENTS',
      name: 'Document Services',
      icon: FileText,
      desc: 'Certificates, notarization & form filing',
      color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400',
      badge: '14 Available',
    },
  ];

  const sampleQueries = [
    'I need a hospital appointment',
    'I need to renew a document',
    'I need to visit a bank',
    'I received a government notice',
    'I need property registration'
  ];

  const primaryActiveQueue = activeServices.find((s) => s.type === 'QUEUE');

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* 1. LUXURY HERO / WELCOME SECTION */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 qevora-card qevora-card-glow border border-cyan-500/20">
        {/* Ambient background glow orbs */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm shadow-cyan-500/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real-World Service Completion Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {getGreeting()}, <span className="text-gradient-cyan">{userName}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl">
              Complete your real-world services without unnecessary trips, waiting or confusion. QEVORA verifies availability, prepares your documents, and guides you from start to finish.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Wasted Travel</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero Duplicate Paperwork</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fair Virtual Waiting</span>
              </span>
            </div>
          </div>

          {/* Animated 3D-Style QEVORA Journey Radar Emblem */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-slate-900 via-[#071128] to-slate-950 border border-cyan-500/40 p-4 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden hologram-shimmer">
              <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent" />
              <div className="relative z-10 space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl animate-float">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-xs font-black text-white tracking-widest uppercase">QEVORA</div>
                <div className="text-[10px] text-cyan-400 font-semibold">Service Network Active</div>
                <div className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ● Real-Time Sync
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMAND CENTER: "WHAT DO YOU NEED TODAY?" (Search & Voice) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              WHAT DO YOU NEED TODAY?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tell QEVORA what you need to complete and get step-by-step guidance.
            </p>
          </div>
        </div>

        <div className="qevora-card rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl border border-cyan-500/25">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="What do you need to complete? (e.g. Bank visit, Hospital OPD, Government notice, Property registration)"
                className="w-full pl-12 pr-10 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setGuidanceResult(null);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Voice Input Button with Speech Recognition */}
            <button
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Speak to QEVORA'}
              className={`px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-voice-active shadow-lg shadow-red-500/40'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Voice</span>
                </>
              )}
            </button>

            {/* Search Submit Button */}
            <button
              onClick={() => handleSearch()}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all shrink-0"
            >
              Search
            </button>
          </div>

          {/* Voice Error Notification */}
          {voiceError && (
            <div className="text-xs text-amber-400 flex items-center space-x-2 px-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Example query chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Popular:</span>
            {sampleQueries.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setSearchQuery(chip);
                  handleSearch(chip);
                }}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 whitespace-nowrap transition-all shadow-sm"
              >
                "{chip}"
              </button>
            ))}
          </div>

          {/* Intelligent AI Service Guidance Breakdown */}
          {guidanceResult && (
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/50 border border-cyan-500/40 space-y-4 animate-in fade-in duration-300 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      {guidanceResult.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        guidanceResult.availability === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      ● {guidanceResult.availability}
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-white">
                    {guidanceResult.serviceName}
                  </h4>
                </div>

                <button
                  onClick={() => onNavigate(guidanceResult.targetRoute)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-500/30 transition-all shrink-0"
                >
                  <span>Start Service</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Required Documents:</span>
                  <ul className="space-y-1 text-slate-200">
                    {guidanceResult.requiredDocs.map((doc, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400 font-semibold block">Expected Waiting:</span>
                  <div className="flex items-center space-x-2 text-white font-extrabold text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>~{guidanceResult.waitMin} minutes</span>
                  </div>
                  <p className="text-[11px] text-cyan-300">
                    Recommended action: {guidanceResult.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. MY SERVICE JOURNEY (Visual Milestone Track) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-white tracking-tight">
              MY SERVICE JOURNEY
            </h3>
            <p className="text-xs text-slate-400">
              {primaryActiveQueue
                ? `Active in: ${primaryActiveQueue.title}`
                : 'The 5-stage QEVORA pathway from start to finish'}
            </p>
          </div>
          {primaryActiveQueue && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
              Stage 3 Active
            </span>
          )}
        </div>

        <div className="qevora-card rounded-3xl p-6 shadow-xl border border-slate-800">
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-800 -z-0" />

            {/* Step 1: Understand */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                  primaryActiveQueue
                    ? 'bg-emerald-500 text-white'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}
              >
                {primaryActiveQueue ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs font-bold text-slate-200">Understand</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Requirements</span>
            </div>

            {/* Step 2: Prepare */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                  primaryActiveQueue
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {primaryActiveQueue ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs font-bold text-slate-200">Prepare</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Documents & ID</span>
            </div>

            {/* Step 3: Book / Queue */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-lg ${
                  primaryActiveQueue
                    ? 'bg-cyan-500 text-slate-950 animate-radar-ring ring-4 ring-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {primaryActiveQueue ? '●' : '3'}
              </div>
              <span className="text-xs font-bold text-slate-200">Book / Queue</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {primaryActiveQueue ? 'Active Ticket' : 'Reserve Spot'}
              </span>
            </div>

            {/* Step 4: Service */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-xs shadow">
                4
              </div>
              <span className="text-xs font-bold text-slate-200">Service</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Counter Visit</span>
            </div>

            {/* Step 5: Complete */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-xs shadow">
                5
              </div>
              <span className="text-xs font-bold text-slate-200">Complete</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Reuse Credentials</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURRENT QUEUE (Digital Boarding Pass / Wallet Card) */}
      {primaryActiveQueue && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
              <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>LIVE QUEUE PASS IN PROGRESS</span>
            </h3>
            <span className="text-xs text-slate-400">Virtual Ticket</span>
          </div>

          <div className="ticket-wallet-stub p-6 sm:p-7 space-y-5">
            <div className="ticket-notch-left" />
            <div className="ticket-notch-right" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">
                  {primaryActiveQueue.orgName}
                </span>
                <h4 className="text-2xl font-black text-white">
                  {primaryActiveQueue.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-semibold">Queue moving normally</span>
                </div>
              </div>

              {/* Digital Boarding Pass Ticket Stamp */}
              <div className="flex items-center space-x-5 bg-slate-900/90 px-5 py-3.5 rounded-2xl border border-cyan-500/30 shadow-inner">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Ticket</div>
                  <div className="text-3xl font-black text-cyan-400 tracking-tight font-mono">
                    {primaryActiveQueue.ticketNumber || '#B-103'}
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Ahead</div>
                  <div className="text-xl font-black text-white">
                    {primaryActiveQueue.position ? `${primaryActiveQueue.position} people` : '2 people'}
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Wait</div>
                  <div className="text-xl font-black text-emerald-400">
                    {primaryActiveQueue.wait ? `~${primaryActiveQueue.wait} min` : '~8 min'}
                  </div>
                </div>
              </div>
            </div>

            <div className="ticket-perforation pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <BellRing className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span>Audio chimes will sound when you are called to Counter.</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('my-services')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow transition-all"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. OPPORTUNITY RESCUE (Emergency Recovery Card — Conditional) */}
      {opportunityAtRisk && (
        <section className="p-6 rounded-3xl bg-gradient-to-r from-red-950/70 via-slate-900/95 to-amber-950/50 border border-red-500/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-3 text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                  🚨 OPPORTUNITY AT RISK — APPOINTMENT CANCELLED
                </span>
                <h4 className="text-base font-bold text-white">
                  Original booking for {opportunityAtRisk.service_name} at {opportunityAtRisk.original_time} was cancelled.
                </h4>
                <p className="text-xs text-slate-300">
                  Reason: {opportunityAtRisk.risk_reason}. QEVORA checked real database availability and found recovery options.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('opportunity-rescue')}
              className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs flex items-center space-x-2 shrink-0 transition-all shadow-lg shadow-red-500/30 self-start sm:self-auto"
            >
              <span>View Recovery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* 6. SERVICE DISCOVERY (The 12 Real-World Categories Grid) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              DISCOVER PARTICIPATING SERVICES
            </h3>
            <p className="text-xs text-slate-400">
              Browse real-world public, civic, and healthcare institutions participating in QEVORA
            </p>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>View All Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {serviceCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('services', { category: cat.id })}
                className="p-4 rounded-2xl qevora-card qevora-card-interactive cursor-pointer flex flex-col justify-between space-y-3 group border border-slate-800 hover:border-cyan-500/40"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
                  <span>Explore</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. LIVE SERVICE STATUS (Real Data Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-white tracking-tight">
              LIVE SERVICE AVAILABILITY
            </h3>
            <p className="text-xs text-slate-400">
              Live verified staff presence and current waiting times
            </p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
            className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {liveServices.slice(0, 3).map((service) => (
            <div
              key={service.id}
              onClick={() => onNavigate('services')}
              className="p-5 rounded-3xl qevora-card qevora-card-interactive cursor-pointer flex flex-col justify-between space-y-3.5 group border border-slate-800"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      service.status === 'AVAILABLE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : service.status === 'DELAYED'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <span>●</span>
                    <span>{service.status}</span>
                  </span>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {service.name}
                </h4>

                <div className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{service.location}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {service.staff_status || 'Staff on duty'}
                </span>
                <span className="font-bold text-cyan-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{service.expected_wait_min} min wait</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. QUICK ACTIONS */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          QUICK ACTIONS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            onClick={() => onNavigate('snap-understand')}
            className="p-5 rounded-3xl qevora-card qevora-card-interactive text-left space-y-3 group border border-slate-800"
          >
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                Snap & Understand
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan notice or letter
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('services')}
            className="p-5 rounded-3xl qevora-card qevora-card-interactive text-left space-y-3 group border border-slate-800"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Check Availability
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live staff & wait times
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('join')}
            className="p-5 rounded-3xl qevora-card qevora-card-interactive text-left space-y-3 group border border-slate-800"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                Join Virtual Queue
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Get ticket from home
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('group-booking')}
            className="p-5 rounded-3xl qevora-card qevora-card-interactive text-left space-y-3 group border border-slate-800"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Group Booking
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-party coordination
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 9. IMPORTANT ACTIONS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white tracking-tight">
            IMPORTANT ACTIONS
          </h3>
          <span className="text-xs text-slate-400">Attention required</span>
        </div>

        <div className="space-y-2.5">
          {actionableAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onNavigate(alert.action ? alert.action.replace('/', '') : 'alerts')}
              className="p-4 sm:p-5 rounded-2xl qevora-card qevora-card-interactive flex items-start space-x-4 cursor-pointer group border border-slate-800"
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  alert.type === 'TURN_APPROACHING'
                    ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                    : alert.type === 'SERVICE_DELAY'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {alert.type === 'TURN_APPROACHING' ? (
                  <BellRing className="w-4 h-4" />
                ) : alert.type === 'SERVICE_DELAY' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : alert.type === 'GROUP_PENDING' ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {alert.title}
                  </h5>
                  <span className="text-[10px] text-slate-400">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {alert.message}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 self-center" />
            </div>
          ))}
        </div>
      </section>

      {/* 10. RECENT ACTIVITY & ACTIVE ASSISTANCE PANEL */}
      <section className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="font-extrabold text-white text-sm">Active Assistance & Verified Credentials</span>
            <p className="text-slate-400">
              1 authorized delegate active (Priya - Daughter) · 1 reusable Aadhaar identity verification on file.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => onNavigate('proxy')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Manage Proxy
          </button>
          <button
            onClick={() => onNavigate('process-reuse')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition-colors"
          >
            View Verifications
          </button>
        </div>
      </section>
    </div>
  );
};
