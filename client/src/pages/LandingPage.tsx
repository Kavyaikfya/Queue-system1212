import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Activity,
  Users,
  Clock,
  CheckCircle2,
  Building2,
  HelpCircle,
  QrCode,
  Layers,
  Camera,
  Bot,
  ChevronRight,
  TrendingDown,
  Cpu,
  RefreshCw,
  Eye,
} from 'lucide-react';
import HeroBg from '../assets/hero-bg.svg';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('HOSPITAL');

  const industries = [
    {
      id: 'HOSPITAL',
      title: 'Hospitals & Healthcare',
      desc: 'Triage prioritization, pediatric fast-track, and emergency care isolation.',
      example: 'City Care Clinic',
      tag: 'Critical Priority Engine',
    },
    {
      id: 'BANK',
      title: 'Banks & Financial Services',
      desc: 'High-throughput teller desks, commercial accounts, and appointment arrivals.',
      example: 'Unity Bank',
      tag: 'Multi-Window Load Balancing',
    },
    {
      id: 'GOVERNMENT',
      title: 'Government Offices',
      desc: 'Civil documentation, biometrics desks, and transparent citizen lines.',
      example: 'Citizen Service Center',
      tag: 'Zero-Favoritism Auditing',
    },
    {
      id: 'COLLEGE',
      title: 'Colleges & Universities',
      desc: 'Course admissions, financial aid helpdesks, and transcript counters.',
      example: 'Campus Administration',
      tag: 'Peak Enrollment Resilient',
    },
    {
      id: 'SERVICE_CENTER',
      title: 'Customer Service Centers',
      desc: 'Hardware diagnosis benches, warranty repairs, and expedited returns.',
      example: 'Service Hub',
      tag: 'Rolling Velocity Prediction',
    },
    {
      id: 'CUSTOM',
      title: 'Custom Organizations',
      desc: 'Retail branches, embassies, logistics centers, and customized workflows.',
      example: 'Enterprise Queue Node',
      tag: 'Configurable Rules & SLA',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white pb-20 transition-colors">
      {/* ========================================================
          HERO SECTION REDESIGN WITH HERO BACKGROUND VISUAL
      ======================================================== */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Background Network Graphic with Navy Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={HeroBg}
            alt="AI Digital Queue Network"
            className="w-full h-full object-cover object-center opacity-35 filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950"></div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-sky-500/20 via-blue-600/20 to-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-sky-500/30 text-sky-300 text-xs font-bold mb-6 backdrop-blur-md shadow-lg shadow-sky-500/10">
            <span className="text-amber-300">✦</span>
            <span>AI-POWERED QUEUE INTELLIGENCE</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-none uppercase font-sans">
            WAIT LESS. <br />
            KNOW MORE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300">
              GET YOUR TURN.
            </span>
          </h1>

          {/* Tagline & Supporting text */}
          <p className="text-xl sm:text-2xl font-bold text-sky-200/90 mt-5 max-w-2xl mx-auto tracking-wide">
            “Your Turn. Your Time. Your Fairness.”
          </p>

          <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
            FAIRQUEUE continuously understands queue conditions, predicts your waiting time, and keeps you informed about every important change.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('join')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center space-x-2 active:scale-95 transition-all duration-150 border border-white/20"
            >
              <span>JOIN A QUEUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              EXPLORE HOW IT WORKS
            </button>
          </div>

          {/* ========================================================
              REQUIREMENT 8: INTERACTIVE LIVE QUEUE INTELLIGENCE CARD
          ======================================================== */}
          <div className="mt-14 max-w-3xl mx-auto rounded-3xl bg-slate-900/90 border border-sky-500/30 p-6 sm:p-8 shadow-2xl shadow-sky-500/10 text-left backdrop-blur-xl">
            <div className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-sm font-bold text-white tracking-wide uppercase">
                  LIVE QUEUE INTELLIGENCE
                </span>
              </div>
              <span className="text-xs font-mono text-sky-400 font-semibold">
                Continuous Real-Time Stream
              </span>
            </div>

            {/* Live Metrics Quad */}
            <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  CURRENT QUEUE
                </span>
                <span className="text-2xl font-mono font-black text-white mt-0.5 block">
                  24 PEOPLE
                </span>
                <span className="text-[10px] text-sky-400 block mt-0.5">Live Waiting List</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  ACTIVE COUNTERS
                </span>
                <span className="text-2xl font-mono font-black text-sky-400 mt-0.5 block">
                  06
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Throughput Online</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  AVG WAIT
                </span>
                <span className="text-2xl font-mono font-black text-emerald-400 mt-0.5 block">
                  14 MIN
                </span>
                <span className="text-[10px] text-emerald-300 block mt-0.5">Confidence: 96%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  FAIRNESS
                </span>
                <span className="text-2xl font-mono font-black text-indigo-300 mt-0.5 block">
                  94%
                </span>
                <span className="text-[10px] text-indigo-400 block mt-0.5">Zero Starvation</span>
              </div>
            </div>

            {/* Visual Queue Flow: JOINED -> ANALYZING -> PRIORITIZING -> YOUR TURN */}
            <div className="mt-2 pt-5 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center sm:text-left">
                INTELLIGENT QUEUE FLOW PIPELINE
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-blue-950/40 border border-sky-500/20 text-center relative overflow-hidden group">
                  <div className="text-xs font-black tracking-wider text-sky-300 uppercase">
                    1. JOINED
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mobile QR / App</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mx-auto mt-2"></div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-sky-500/20 text-center relative overflow-hidden group">
                  <div className="text-xs font-black tracking-wider text-sky-300 uppercase">
                    2. ANALYZING
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Wait & Velocity</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mx-auto mt-2 animate-ping"></div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-sky-500/20 text-center relative overflow-hidden group">
                  <div className="text-xs font-black tracking-wider text-sky-300 uppercase">
                    3. PRIORITIZING
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fair Aging Curve</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mx-auto mt-2"></div>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-emerald-500/40 text-center relative overflow-hidden">
                  <div className="text-xs font-black tracking-wider text-emerald-300 uppercase">
                    4. YOUR TURN
                  </div>
                  <p className="text-[10px] text-emerald-200 mt-0.5">Direct Counter Call</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-2 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 1: LIVE QUEUE INTELLIGENCE
      ======================================================== */}
      <section className="py-16 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>SECTION 1 · REAL-TIME PLATFORM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Live Queue Intelligence That Never Keeps You In The Dark
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Traditional queues force visitors to wait in uncertainty with static paper tokens. FAIRQUEUE turns the waiting line into a responsive, real-time intelligence network.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sub-Second Synchronization:</strong> Every time a counter finishes a service, all waiting tickets advance immediately via WebSocket event streaming.
                  </span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dynamic Multi-Window Balancing:</strong> Workload automatically spreads across active counters to prevent choke points and maximize throughput.
                  </span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Auditable Queue History:</strong> Complete transparency of every position change, turn call, and delay with causal reasoning.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-sky-400">FAIRQUEUE TELEMETRY</span>
                <span className="text-xs text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ONLINE</span>
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400">Position Recalculation Rate</span>
                  <span className="text-sky-300 font-bold">&lt; 15ms</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400">Starvation Age Weighting</span>
                  <span className="text-emerald-300 font-bold">1.25 pts / min</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400">Multi-Counter Throughput</span>
                  <span className="text-indigo-300 font-bold">4.2 served / min</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400">No-Show Protection Buffer</span>
                  <span className="text-amber-300 font-bold">120s Grace Period</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: HOW FAIRQUEUE WORKS
      ======================================================== */}
      <section id="how-it-works" className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-sky-400 tracking-wider uppercase">
              SECTION 2 · SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
              How FAIRQUEUE Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Five continuous stages powering accurate wait times and transparent order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg relative">
              <span className="text-3xl font-black text-sky-500/30 font-mono">01</span>
              <h3 className="text-sm font-bold text-white mt-2">JOIN</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Scan QR or choose your service online to receive an instant digital ticket.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg relative">
              <span className="text-3xl font-black text-sky-500/30 font-mono">02</span>
              <h3 className="text-sm font-bold text-white mt-2">AI ANALYZES</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Neural velocity engine evaluates counter pace and service categories.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg relative">
              <span className="text-3xl font-black text-sky-500/30 font-mono">03</span>
              <h3 className="text-sm font-bold text-white mt-2">QUEUE UPDATES</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Real-time WebSocket events broadcast position advances to your device.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg relative">
              <span className="text-3xl font-black text-sky-500/30 font-mono">04</span>
              <h3 className="text-sm font-bold text-white mt-2">WAITING PREDICTED</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Continuous countdown gives you exact minutes before your turn arrives.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-950/60 to-slate-900 border border-sky-500/30 shadow-lg relative">
              <span className="text-3xl font-black text-emerald-400/40 font-mono">05</span>
              <h3 className="text-sm font-bold text-emerald-300 mt-2">YOUR TURN</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Audio chime and screen highlight guide you straight to the ready counter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 3: WHY FAIRQUEUE?
      ======================================================== */}
      <section className="py-20 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-sky-400 tracking-wider uppercase">
              SECTION 3 · CORE ADVANTAGES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
              Why FAIRQUEUE?
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Engineered to replace outdated token dispensers with transparent, intelligent management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-sky-400 w-fit">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Real-Time Updates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No need to sit under a blurry monitor. Track your ticket anywhere from your mobile phone with live position shifts.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-300 w-fit">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Transparent Decisions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                “Ask Queue AI” provides transparent mathematical explanations for every queue movement, eradicating doubts and frustration.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Waiting Prediction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines historical service durations with real-time active counter pace to compute reliable ETAs with high confidence scores.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-300 w-fit">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Queue Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deep administrator dashboards monitor queue length, counter bottlenecks, and hourly rush times to optimize staff allocation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-300 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Fairness Monitoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuous Gini index tracking ensures emergency tiers never permanently starve routine waiting citizens.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 w-fit">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Assistance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our embedded Queue AI assistant answers all inquiries about your position, wait time, and queue rules with live authenticated context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 4: SUPPORTED SERVICES
      ======================================================== */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-sky-400 tracking-wider uppercase">
              SECTION 4 · TAILORED WORKFLOWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
              Supported Services & Organizations
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Pre-tuned priority engines and multi-counter configurations for critical environments.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  selectedIndustry === ind.id
                    ? 'bg-blue-600 border-sky-400 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold truncate">{ind.title}</div>
              </button>
            ))}
          </div>

          {/* Active Industry Detail Card */}
          {(() => {
            const ind = industries.find((i) => i.id === selectedIndustry) || industries[0];
            return (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-950 text-sky-300 border border-sky-800">
                    {ind.tag}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">{ind.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{ind.desc}</p>
                  <p className="text-xs text-sky-400 font-mono">Example Setup: {ind.example}</p>
                </div>

                <button
                  onClick={() => onNavigate('join')}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors shrink-0 flex items-center space-x-2"
                >
                  <span>Browse {ind.title} Queues</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ========================================================
          SECTION 5: AI QUEUE VISION (NEW FEATURE SHOWCASE)
      ======================================================== */}
      <section className="py-20 border-t border-slate-800 bg-gradient-to-b from-slate-900/40 via-blue-950/20 to-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-bold">
                <Camera className="w-3.5 h-3.5" />
                <span>SECTION 5 · COMPUTER VISION INTELLIGENCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                AI Queue Vision: See Physical Waiting Rooms Through AI
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Allow facility supervisors to snap or upload a photo of a physical waiting lobby or counter zone. Our vision model automatically detects waiting density, estimates people counts, and diagnoses crowding levels.
              </p>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">Privacy First:</span>
                  <span className="text-emerald-400 font-mono font-bold">100% Anonymized</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  No biometric storage, facial recognition, or individual tracking. Strictly visual crowd density estimation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('vision')}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>TRY AI QUEUE VISION NOW</span>
                </button>
              </div>
            </div>

            {/* Vision Mock Result Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    AI Visual Analysis Result
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">AI Visual Estimate</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    PEOPLE DETECTED
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">18</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    VISIBLE COUNTERS
                  </span>
                  <span className="text-2xl font-black text-sky-400 font-mono mt-0.5 block">04</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    QUEUE DENSITY
                  </span>
                  <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                    HIGH
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    VISUAL STATUS
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                    BUSY
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-[11px] text-slate-400 italic text-center">
                “AI-generated visual estimate. Actual queue conditions may differ.”
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6: QUEUE AI ASSISTANT
      ======================================================== */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">QUEUE AI</h4>
                  <p className="text-[10px] text-slate-400">Contextual Assistant</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-blue-600 text-white max-w-[80%] ml-auto text-right">
                  “How long do I have to wait?”
                </div>
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 max-w-[85%] leading-relaxed">
                  “You are currently #6. There are 5 people ahead of you. Your estimated waiting time is 17 minutes.”
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-sky-400 font-mono block text-center">
                  ✦ Click bottom-right floating badge to chat with Queue AI anytime!
                </span>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-bold">
                <Bot className="w-3.5 h-3.5" />
                <span>SECTION 6 · AI QUEUE ASSISTANT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Real Answers With Real Queue Data
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                No scripted static bots. Queue AI connects directly to your live session to explain waiting times, why your position shifted, and when to start walking to the service counter.
              </p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Instant response to “Where is my queue?” and “When is my turn?”</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Real-time math calculations based on active counter velocity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 7: CALL TO ACTION
      ======================================================== */}
      <section className="py-24 border-t border-slate-800 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <span className="text-xs font-extrabold text-sky-400 uppercase tracking-widest block">
            SECTION 7 · READY FOR EFFORTLESS WAITING?
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to stop guessing when your turn will come?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of users enjoying transparent, predictable, and stress-free waiting lines with FAIRQUEUE.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('join')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 flex items-center space-x-2 active:scale-95 transition-all"
            >
              <span>JOIN A QUEUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="px-6 py-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-sm shadow-sm transition-all"
            >
              REGISTER AN ORGANIZATION
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
