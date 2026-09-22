import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Building,
  Calendar,
  AlertCircle,
  History,
  Check,
  X,
  Lock,
  Sparkles
} from 'lucide-react';
import { qevoraApi } from '../services/api';

interface ProcessReusePageProps {
  onNavigate: (page: string, params?: any) => void;
  serviceId?: string;
}

export const ProcessReusePage: React.FC<ProcessReusePageProps> = ({ onNavigate, serviceId }) => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reusingId, setReusingId] = useState<string | null>(null);
  const [reuseSuccess, setReuseSuccess] = useState<string | null>(null);
  const [consentCheck, setConsentCheck] = useState<Record<string, boolean>>({});

  const loadVerifications = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getReusableVerifications();
      if (res.success) {
        setVerifications(res.verifications || []);
      }
    } catch (e) {
      console.error('Failed to load reusable verifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleReuse = async (verifId: string, verifTitle: string) => {
    if (!consentCheck[verifId]) {
      alert('Please confirm your consent checkbox to reuse this verification with the target service.');
      return;
    }

    try {
      setReusingId(verifId);
      const res = await qevoraApi.reuseVerification({
        verification_id: verifId,
        service_id: serviceId || 'srv_kyc',
      });
      if (res.success) {
        setReuseSuccess(`Successfully applied previous ${verifTitle}! No repeat verification required.`);
        setTimeout(() => {
          setReuseSuccess(null);
        }, 4500);
      }
    } catch (e) {
      console.error('Failed to reuse verification:', e);
    } finally {
      setReusingId(null);
    }
  };

  const toggleConsent = (verifId: string) => {
    setConsentCheck((prev) => ({
      ...prev,
      [verifId]: !prev[verifId],
    }));
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Process Reuse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reuse Valid Verification
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Already verified your identity or credentials? Never repeat identical paperwork. You can securely reuse your still-valid verification with participating services.
          </p>
        </div>

        <button
          onClick={loadVerifications}
          className="p-2.5 rounded-2xl qevora-card text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 self-start sm:self-auto transition-all"
          title="Refresh verified credentials"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {reuseSuccess && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-bold shadow-xl shadow-emerald-500/10 animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="text-sm text-white block">{reuseSuccess}</span>
              <span className="text-slate-300 font-normal">Audit record logged to your Service Passport.</span>
            </div>
          </div>
          <button onClick={() => setReuseSuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Safety & Audit Banner */}
      <div className="p-4.5 rounded-2xl bg-[#081028]/80 border border-cyan-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-white">Cryptographic Validity & Zero Expired Re-Use:</span>
          <p className="text-slate-400 leading-relaxed">
            QEVORA automatically validates certificates prior to submission. Expired or altered certifications are strictly blocked. Every reuse creates an immutable audit log.
          </p>
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center rounded-3xl qevora-card text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking verified credentials on file...</span>
          </div>
        ) : verifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl qevora-card space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <FileCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                No previous verifications on file
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you complete your first verified service or document review, your verified credential card will appear here for 1-click reuse.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {verifications.map((item) => {
              const isExpired = new Date(item.valid_until) < new Date();
              const isChecked = !!consentCheck[item.id];

              return (
                <div
                  key={item.id}
                  className={`p-6 sm:p-7 rounded-3xl qevora-card space-y-5 shadow-2xl relative overflow-hidden transition-all ${
                    isExpired ? 'opacity-70 border-slate-800' : 'border-cyan-500/30 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                          PREVIOUSLY VERIFIED
                        </span>
                        <span
                          className={`text-xs font-bold flex items-center space-x-1.5 px-2 py-0.5 rounded-full ${
                            isExpired
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Status: {isExpired ? 'EXPIRED' : 'VALID'}</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white pt-1">
                        {item.title || item.verification_type}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span>Verified: <strong className="text-slate-300">{item.verified_date || '18 Sept 2026'}</strong></span>
                        <span className="text-slate-600">&bull;</span>
                        <span>Authority: <strong className="text-slate-300">{item.issuing_authority || 'UIDAI / National Identity Registry'}</strong></span>
                        <span className="text-slate-600">&bull;</span>
                        <span>Valid through: <strong className="text-slate-300">{new Date(item.valid_until).toLocaleDateString()}</strong></span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#04091a] border border-cyan-500/20 text-cyan-400 hidden sm:block shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Consent & Reuse Controls */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <label className="flex items-center space-x-3 cursor-pointer text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleConsent(item.id)}
                        disabled={isExpired}
                        className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-cyan-500"
                      />
                      <span>
                        I consent to reuse this verified identity with participating QEVORA facilities.
                      </span>
                    </label>

                    <button
                      onClick={() => handleReuse(item.id, item.title || item.verification_type)}
                      disabled={isExpired || !isChecked || reusingId === item.id}
                      className={`px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shrink-0 ${
                        isExpired || !isChecked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                      }`}
                    >
                      <span>{reusingId === item.id ? 'Reusing...' : 'Reuse Verification'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
