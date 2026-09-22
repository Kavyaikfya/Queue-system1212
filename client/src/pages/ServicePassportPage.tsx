import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Share2,
  Check,
  X,
  FileText,
  UserCheck,
  QrCode,
  Calendar,
  Key,
  History,
  AlertCircle
} from 'lucide-react';
import { qevoraApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ServicePassportPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ServicePassportPage: React.FC<ServicePassportPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [passportFields, setPassportFields] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'verifications' | 'history'>('profile');

  // Granular sharing modal state
  const [sharingModalOpen, setSharingModalOpen] = useState<boolean>(false);
  const [selectedService] = useState<string>('Unity Bank - Account Opening & KYC');
  const [sharedFields, setSharedFields] = useState<Record<string, boolean>>({
    name: true,
    id_verification: true,
    address: true,
    phone: false,
    dob: false,
  });
  const [sharingResultMsg, setSharingResultMsg] = useState<string | null>(null);

  const loadPassport = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getServicePassport();
      if (res.success) {
        setPassportFields(res.passport || []);
        setConsents(res.consents || []);
      }
    } catch (e) {
      console.error('Failed to load service passport:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, [user]);

  const handleToggleField = (field: string) => {
    setSharedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleGrantConsent = async (allow: boolean) => {
    try {
      const activeKeys = Object.keys(sharedFields).filter((k) => sharedFields[k]);
      await qevoraApi.saveServiceConsent({
        service_id: 'srv_kyc',
        granted_fields: allow ? activeKeys : [],
        status: allow ? 'GRANTED' : 'DENIED',
      });

      setSharingResultMsg(
        allow
          ? 'Only the selected information will be shared with the participating QEVORA service.'
          : 'Sharing was denied. No data was shared.'
      );
      setTimeout(() => {
        setSharingModalOpen(false);
        setSharingResultMsg(null);
        loadPassport();
      }, 1800);
    } catch (e) {
      console.error('Failed to save consent:', e);
    }
  };

  const citizenName = (user as any)?.displayName || (user as any)?.name || 'Citizen User';

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-1 border border-cyan-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Service Wallet</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Service Passport
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Never repeatedly submit identical paperwork. Your credentials and verifications remain securely encrypted and are shared only with your explicit, granular consent.
          </p>
        </div>

        <button
          onClick={() => setSharingModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 self-start sm:self-auto transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Test Consent Request</span>
        </button>
      </div>

      {/* LUXURY DIGITAL CITIZEN CARD / PASSPORT WALLET */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1a38] via-[#091329] to-[#040915] border border-cyan-500/40 shadow-2xl overflow-hidden hologram-shimmer space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-cyan-500/25 shrink-0 border border-cyan-300/40">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {citizenName}
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ VERIFIED CITIZEN
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-mono">
                QEVORA PASSPORT ID: QEV-8849-KA · Enrolled Sept 2026
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero-Knowledge Encrypted</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase">Identity Status</span>
            <div className="text-sm font-black text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Aadhaar Biometrics</span>
            </div>
            <p className="text-[11px] text-slate-400">UIDAI Verified Token</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase">Address Status</span>
            <div className="text-sm font-black text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Bescom Utility Proof</span>
            </div>
            <p className="text-[11px] text-slate-400">Bengaluru Urban, 560001</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase">Reuse Readiness</span>
            <div className="text-sm font-black text-cyan-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Ready for 1-Click Reuse</span>
            </div>
            <p className="text-[11px] text-slate-400">Participating facilities only</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Verified Profile
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'documents'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Documents Vault ({passportFields.length})
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'verifications'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Previous Verifications
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Consent History ({consents.length})
        </button>
      </div>

      {/* Tab 1: Verified Profile Details */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-8 rounded-3xl qevora-card space-y-5 border border-slate-800">
          <h3 className="text-base font-bold text-white">
            Verified Identity Attributes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Legal Name</span>
              <div className="text-sm font-bold text-white">{citizenName}</div>
              <p className="text-slate-400 text-[11px]">Matched across UIDAI & Tax records</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Contact Email</span>
              <div className="text-sm font-bold text-white">{user?.email || 'citizen@qevora.gov'}</div>
              <p className="text-slate-400 text-[11px]">Verified via Google OAuth</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Document Vault Cards */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {passportFields.map((doc, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl qevora-card flex items-start justify-between space-y-1 border border-slate-800 hover:border-cyan-500/40 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-white">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold">{doc.field_name}</h4>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {doc.field_value}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Verified: {doc.verification_source}</span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Ready
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Previous Verifications */}
      {activeTab === 'verifications' && (
        <div className="p-6 sm:p-8 rounded-3xl qevora-card space-y-4 border border-slate-800">
          <h3 className="text-base font-bold text-white">
            Active Verified Credentials Ready for Reuse
          </h3>
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Identity Verification (Aadhaar UIDAI)</h4>
                <p className="text-slate-400">Verified: 18 Sept 2026 · Valid through: 18 Sept 2027</p>
              </div>
              <button
                onClick={() => onNavigate('process-reuse')}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold transition-all self-start sm:self-auto border border-cyan-500/30"
              >
                Reuse Verification
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Address Proof (Bescom Utility)</h4>
                <p className="text-slate-400">Verified: 02 Sept 2026 · Valid through: 02 March 2027</p>
              </div>
              <button
                onClick={() => onNavigate('process-reuse')}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold transition-all self-start sm:self-auto border border-cyan-500/30"
              >
                Reuse Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Consent Audit Log */}
      {activeTab === 'history' && (
        <div className="p-6 sm:p-8 rounded-3xl qevora-card space-y-4 border border-slate-800">
          <h3 className="text-base font-bold text-white">
            Data Sharing Consent Audit Log
          </h3>
          <div className="space-y-3">
            {consents.length === 0 ? (
              <p className="text-xs text-slate-400">No consent requests granted yet.</p>
            ) : (
              consents.map((c, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-sm">{c.service_name || 'Participating Service'}</span>
                    <p className="text-slate-400 text-[11px]">
                      Granted: {Array.isArray(c.granted_fields) ? c.granted_fields.join(', ') : 'Profile ID'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GRANULAR CONSENT REQUEST MODAL (Prompt Spec 8) */}
      {sharingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl qevora-card p-6 sm:p-8 space-y-5 shadow-2xl border border-cyan-500/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  Participating QEVORA Service
                </span>
                <h3 className="text-xl font-black text-white">
                  INFORMATION REQUESTED
                </h3>
              </div>
              <button
                onClick={() => setSharingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">{selectedService}</strong> is requesting verified credentials to complete your service. Select the specific attributes you consent to share:
            </p>

            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              {[
                { key: 'name', label: 'Full Legal Name' },
                { key: 'id_verification', label: 'ID Verification (Aadhaar Token)' },
                { key: 'address', label: 'Verified Residential Address' },
                { key: 'phone', label: 'Phone Number' },
                { key: 'dob', label: 'Date of Birth' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!sharedFields[item.key]}
                    onChange={() => handleToggleField(item.key)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-semibold">
              "Only the selected information will be shared."
            </div>

            {sharingResultMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 animate-in fade-in">
                {sharingResultMsg}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => handleGrantConsent(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                Don't Share
              </button>
              <button
                onClick={() => handleGrantConsent(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
