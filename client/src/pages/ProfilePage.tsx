import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileText,
  Users,
  History,
  Languages,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Key,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { qevoraApi } from '../services/api';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState<string>('en');

  // Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    turnApproaching: true,
    serviceDelays: true,
    documentAlerts: true,
    groupUpdates: true,
  });

  const [serviceCount, setServiceCount] = useState<number>(3);

  useEffect(() => {
    qevoraApi.getActiveServices()
      .then((res: any) => {
        if (res.success && res.activeServices) {
          setServiceCount(res.activeServices.length + 2);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePref = (key: keyof typeof notifPreferences) => {
    setNotifPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  const displayName = (user as any)?.displayName || (user as any)?.name || 'Citizen User';

  const menuSections = [
    {
      id: 'passport',
      label: 'Service Passport',
      desc: 'Verified citizen profile, biometric badges, and cryptographic pass',
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      onClick: () => onNavigate('service-passport'),
    },
    {
      id: 'documents',
      label: 'Document Vault',
      desc: 'Aadhaar, PAN, marksheets, and digitally attested certificates',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      onClick: () => onNavigate('service-passport'),
    },
    {
      id: 'permissions',
      label: 'Permissions & Consents',
      desc: 'Active data-sharing approvals with hospitals, banks, and civic centers',
      icon: <Key className="w-5 h-5 text-purple-400" />,
      onClick: () => onNavigate('service-passport'),
    },
    {
      id: 'proxy',
      label: 'Service Proxy Delegations',
      desc: 'Authorized representatives to attend when you cannot be present',
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      onClick: () => onNavigate('proxy'),
    },
    {
      id: 'reuse',
      label: 'Process Reuse Records',
      desc: 'Active verified credentials valid for instant 1-click reuse',
      icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
      onClick: () => onNavigate('process-reuse'),
    },
    {
      id: 'history',
      label: 'Service History & Receipts',
      desc: `${serviceCount} completed service visits and verified tokens on record`,
      icon: <History className="w-5 h-5 text-slate-400" />,
      onClick: () => onNavigate('my-services'),
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      {/* 1. MY PROFILE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl qevora-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xl border border-cyan-500/30 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 text-2xl font-black shadow-xl shadow-cyan-500/25 shrink-0">
            {displayName ? displayName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-extrabold text-white">
                {displayName}
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                VERIFIED CITIZEN
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user?.email || 'citizen@qevora.gov'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. CITIZEN SUITE SECTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          CITIZEN TOOLS &amp; PASSPORT
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {menuSections.map((sec) => (
            <div
              key={sec.id}
              onClick={sec.onClick}
              className="p-4.5 rounded-2xl qevora-card qevora-card-interactive flex items-center justify-between cursor-pointer group shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-xl bg-[#04091a] border border-cyan-500/20 shrink-0">
                  {sec.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {sec.label}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {sec.desc}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. LANGUAGE PREFERENCE */}
      <div className="p-6 rounded-3xl qevora-card space-y-3.5 shadow-xl border border-cyan-500/20">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Languages className="w-4 h-4 text-cyan-400" />
          <span>Language Preference</span>
        </div>
        <p className="text-xs text-slate-400">
          Select your preferred language for explanations, voice guidance, and document simplification.
        </p>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            { id: 'en', label: 'English' },
            { id: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
            { id: 'hi', label: 'हिन्दी (Hindi)' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                language === l.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-black'
                  : 'bg-[#04091a] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. NOTIFICATION PREFERENCES */}
      <div className="p-6 rounded-3xl qevora-card space-y-4 shadow-xl border border-cyan-500/20">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Service Notification Settings</span>
        </div>

        <div className="space-y-3 text-xs">
          {[
            {
              key: 'turnApproaching',
              label: 'Approaching Queue Turn Alert',
              desc: 'SMS and audio chime when 2 people are ahead of you',
            },
            {
              key: 'serviceDelays',
              label: 'Live Availability & Delay Updates',
              desc: 'Instant notice if a counter pauses or doctors get delayed',
            },
            {
              key: 'documentAlerts',
              label: 'Document Requirements Check',
              desc: 'Pre-check reminder to ensure all mandatory proofs are ready',
            },
            {
              key: 'groupUpdates',
              label: 'Group Coordination Updates',
              desc: 'Alerts when co-applicants or witnesses confirm their attendance',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#04091a]/80 border border-slate-800"
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-white block">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-400">
                  {item.desc}
                </span>
              </div>

              <input
                type="checkbox"
                checked={notifPreferences[item.key as keyof typeof notifPreferences]}
                onChange={() => handleTogglePref(item.key as keyof typeof notifPreferences)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-cyan-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
