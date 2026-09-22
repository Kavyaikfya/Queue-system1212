import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'init' | 'connecting' | 'complete'>('init');
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Step 1: Initializing Visit Intelligence (0 - 600ms)
    const t1 = setTimeout(() => {
      setProgress(55);
      setPhase('connecting'); // "Connecting to FAIRQUEUE…"
    }, 650);

    // Step 2: Completing connection (650 - 1300ms)
    const t2 = setTimeout(() => {
      setProgress(100);
      setPhase('complete');
    }, 1350);

    // Step 3: Smooth fade-out and dismiss (1600 - 1850ms)
    const t3 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1600);

    const t4 = setTimeout(() => {
      onComplete();
    }, 1900);

    // Safety timeout: Never hang longer than 2.5s
    const maxTimeout = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(maxTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-slate-950 text-white select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      {/* Background Cyber Ambient Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[550px] h-[340px] sm:h-[550px] bg-gradient-to-tr from-blue-600/25 via-sky-500/20 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-sky-600/10 rounded-full blur-2xl"></div>
      </div>

      {/* Top micro brand tag */}
      <div className="relative z-10 w-full flex justify-between items-center pt-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
        <span>FAIRQUEUE V3.0</span>
        <span className="flex items-center space-x-1 text-sky-400">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
          <span>VISIT PLATFORM ACTIVE</span>
        </span>
      </div>

      {/* Center Hero: Logo Fade + Scale, AI Badge, Dynamic Text */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm mx-auto my-auto">
        {/* Animated FAIRQUEUE Logo */}
        <div className="transform transition-all duration-700 hover:scale-105">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-sky-400 rounded-3xl blur-md opacity-40 animate-pulse"></div>
            <div className="relative">
              <Logo size="xl" showText={false} className="justify-center" />
            </div>
          </div>
        </div>

        {/* Wordmark and Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            FAIR<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">QUEUE</span>
          </h1>

          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-black tracking-wider text-sky-300 bg-sky-950/80 border border-sky-500/40 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>AI • REAL-TIME VISIT INTELLIGENCE</span>
          </div>
        </div>

        {/* Dynamic Status Text: Initializing -> Connecting -> Ready */}
        <div className="pt-4 w-full flex flex-col items-center space-y-3">
          {/* Glowing Animated Loading Bar */}
          <div className="w-56 sm:w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>

          <p className="text-xs font-mono font-medium tracking-wide text-slate-300 transition-all duration-300">
            {phase === 'init' && '“Initializing Visit Intelligence…”'}
            {phase === 'connecting' && '“Connecting to FAIRQUEUE…”'}
            {phase === 'complete' && '“Visit Intelligence Active”'}
          </p>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="relative z-10 text-center pb-2">
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Your Turn. Your Time. Your Visit.
        </p>
      </div>
    </div>
  );
};
