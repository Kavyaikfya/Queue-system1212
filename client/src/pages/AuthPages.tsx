import React, { useState } from 'react';
import {
  Sparkles,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import HeroBg from '../assets/hero-bg.svg';

interface AuthPageProps {
  onNavigate: (page: string) => void;
  initialMode?: string;
}

export const AuthPages: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, allow direct continuation
  React.useEffect(() => {
    if (user) {
      onNavigate('dashboard');
    }
  }, [user, onNavigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      await signInWithGoogle();
      onNavigate('dashboard');
    } catch (err: any) {
      console.error('[Auth] Google sign in failed:', err);
      setErrorMessage(
        err.message || 'Google sign-in was cancelled or encountered a connection error. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors animate-fade-in">
      <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-sky-500/20 shadow-2xl shadow-sky-500/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 backdrop-blur-xl">
        {/* ========================================================
            LEFT COLUMN: PREMIUM AI QUEUE VISUAL / BACKGROUND IMAGE
        ======================================================== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border-r border-slate-800 text-white overflow-hidden">
          {/* Background vector graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={HeroBg}
              alt="AI Queue Background"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-blue-950/70 to-slate-950/85"></div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3">
              <Logo size="md" variant="navbar" />
              <div>
                <span className="font-black text-xl tracking-tight text-white font-sans">
                  FAIR<span className="text-sky-400">QUEUE</span>
                </span>
                <span className="block text-[10px] text-sky-400 font-mono">
                  AI • REAL-TIME QUEUE INTELLIGENCE
                </span>
              </div>
            </div>

            <div className="pt-8 space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-sky-500/30 text-sky-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Supabase Google Authentication</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Your Turn. Your Time. Your Fairness.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect effortlessly with your Google account. Your profile, active tickets, and personalized Safe Return Windows sync instantly in real time.
              </p>
            </div>
          </div>

          {/* Real-time telemetry snapshot */}
          <div className="relative z-10 p-5 rounded-2xl bg-slate-900/85 border border-sky-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>AI Queue Telemetry</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">94% Fairness Index</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase">Avg Wait</span>
                <div className="text-lg font-mono font-bold text-emerald-400">14 Min</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase">Live Counters</span>
                <div className="text-lg font-mono font-bold text-sky-400">06 Online</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Encrypted OAuth 2.0</span>
            <span>Zero Password Storage</span>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: AUTHENTICATION CARD (GOOGLE SIGN-IN ONLY)
        ======================================================== */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-8">
          {/* Logo & Brand Header */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Logo size="md" variant="navbar" />
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white font-sans">
                  FAIR<span className="text-sky-500">QUEUE</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 uppercase tracking-wider">
                  AI • REAL-TIME
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                “Your queue. Your time. Your turn.”
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Join and track real-time queues with intelligent waiting-time updates and transparent queue decisions.
              </p>
            </div>
          </div>

          {/* Error Notice if any */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Core Action: CONTINUE WITH GOOGLE */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating || authLoading}
              className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-bold text-sm sm:text-base flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98 disabled:opacity-50"
            >
              {/* Official Google-Style SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isAuthenticating ? 'Connecting to Google...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              By continuing, you agree to the platform terms and privacy policy.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Automatic user profile created with your Google identity</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant access to Safe Return Windows and Queue Pulse</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Zero passwords to remember or reset</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
