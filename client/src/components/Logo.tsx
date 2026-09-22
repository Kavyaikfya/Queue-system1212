import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto' | 'navbar';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText,
  variant = 'auto',
  className = '',
}) => {
  const isNavbar = variant === 'navbar';
  const shouldShowText = showText !== undefined ? showText : !isNavbar;
  
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Modern QEVORA Geometric Hexagon Ring Emblem */}
      <div className={`relative ${iconDimensions} flex items-center justify-center shrink-0`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 opacity-75 blur-sm"></div>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md"
        >
          <rect width="48" height="48" rx="14" fill="#070f26" />
          {/* Stylized Q with forward service completion arrow */}
          <circle cx="24" cy="22" r="13" stroke="url(#qevora_grad)" strokeWidth="4.5" strokeLinecap="round" />
          <path
            d="M28 26L37 35"
            stroke="url(#qevora_grad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M20 22L23 25L29 18"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="qevora_grad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Wordmark & Tagline */}
      {shouldShowText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`font-black tracking-wider text-slate-900 dark:text-white ${textSizes}`}>
              QE<span className="text-blue-500 dark:text-cyan-400">VORA</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Service Completion Platform
          </span>
        </div>
      )}
    </div>
  );
};
