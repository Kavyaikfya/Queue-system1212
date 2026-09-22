import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  X,
  UserCheck,
  Check,
  Building,
  History,
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { qevoraApi } from '../services/api';

interface ServiceProxyPageProps {
  onNavigate: (page: string, params?: any) => void;
  serviceId?: string;
}

export const ServiceProxyPage: React.FC<ServiceProxyPageProps> = ({
  serviceId,
}) => {
  const [proxies, setProxies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [proxyName, setProxyName] = useState('');
  const [relationship, setRelationship] = useState('Daughter');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Unable to attend physically due to illness / distance');
  const [permissionType, setPermissionType] = useState<'ONE_TIME' | 'TIME_LIMITED'>('TIME_LIMITED');
  const [hoursValid, setHoursValid] = useState<number>(48);

  const [allowedActions, setAllowedActions] = useState<string[]>([
    'Submit verified physical documents',
    'Receive official acknowledgement receipt',
  ]);

  const [deniedActions, setDeniedActions] = useState<string[]>([
    'Change account profile information',
    'Authorize or execute financial payments',
  ]);

  const loadProxies = async () => {
    try {
      setIsLoading(true);
      const res = await qevoraApi.getProxies();
      if (res.success) {
        setProxies(res.proxies || []);
      }
    } catch (e) {
      console.error('Failed to load proxies:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProxies();
  }, []);

  const handleCreateProxy = async () => {
    if (!proxyName.trim()) {
      alert('Please provide the authorized person name');
      return;
    }

    try {
      await qevoraApi.createProxy({
        proxy_name: proxyName,
        relationship,
        phone,
        purpose,
        permission_type: permissionType,
        hours_valid: hoursValid,
        allowed_actions: allowedActions,
        denied_actions: deniedActions,
        service_id: serviceId || 'srv_kyc',
      });

      setShowCreateModal(false);
      setProxyName('');
      loadProxies();
    } catch (e) {
      console.error('Failed to create proxy:', e);
    }
  };

  const handleRevoke = async (proxyId: string) => {
    if (!window.confirm('Are you sure you want to revoke this proxy delegation immediately?')) return;
    try {
      await qevoraApi.revokeProxy(proxyId);
      loadProxies();
    } catch (e) {
      console.error('Failed to revoke proxy:', e);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Service Proxy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Authorize a Proxy
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Cannot physically attend due to illness, work, or distance? Authorize someone you trust for specific tasks with granular permissions and automatic expiry.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Authorize Person</span>
        </button>
      </div>

      {/* Security Principles Banner */}
      <div className="p-4.5 rounded-2xl bg-[#081028]/80 border border-cyan-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-white">Strict Least-Privilege Protection:</span>
          <p className="text-slate-400 leading-relaxed">
            Delegates receive a temporary, cryptographically signed pass permitting only your selected tasks. They cannot alter account details or authorize financial transactions.
          </p>
        </div>
      </div>

      {/* Proxies List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">
          Active Authorized Proxies
        </h3>

        {isLoading ? (
          <div className="p-16 text-center rounded-3xl qevora-card text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking active proxy authorizations...</span>
          </div>
        ) : proxies.length === 0 ? (
          <div className="p-12 text-center rounded-3xl qevora-card space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                No active proxy delegations
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                If you are unable to visit a government office, clinic, or university, you can delegate a family member or representative here.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
            >
              Authorize Someone
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {proxies.map((p) => {
              const isRevoked = p.status === 'REVOKED';
              const isExpired = new Date(p.valid_until) < new Date();

              return (
                <div
                  key={p.id}
                  className="p-6 sm:p-7 rounded-3xl qevora-card space-y-5 shadow-2xl border border-cyan-500/20 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <h4 className="text-lg font-bold text-white">
                          {p.proxy_name}
                        </h4>
                        <span className="text-xs font-semibold text-slate-400">({p.relationship})</span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            isRevoked
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isExpired
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE DELEGATE'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Purpose: <strong className="text-slate-200">{p.purpose}</strong>
                      </p>

                      <div className="flex items-center space-x-3 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Valid until: <strong className="text-slate-300">{new Date(p.valid_until).toLocaleString()}</strong></span>
                        </span>
                      </div>
                    </div>

                    {!isRevoked && !isExpired && (
                      <button
                        onClick={() => handleRevoke(p.id)}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/25 self-start transition-all flex items-center space-x-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </div>

                  {/* Allowed / Denied Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                        Allowed Permissions
                      </span>
                      <ul className="space-y-1.5">
                        {(p.allowed_actions || [
                          'Submit verified physical documents',
                          'Receive official acknowledgement receipt',
                        ]).map((action: string, i: number) => (
                          <li key={i} className="flex items-center space-x-2 text-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">
                        Strictly Prohibited
                      </span>
                      <ul className="space-y-1.5">
                        {(p.denied_actions || [
                          'Change account profile information',
                          'Authorize or execute financial payments',
                        ]).map((action: string, i: number) => (
                          <li key={i} className="flex items-center space-x-2 text-rose-300">
                            <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE PROXY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl qevora-card p-6 sm:p-7 space-y-5 shadow-2xl border border-cyan-500/40 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                  SECURITY DELEGATION
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Authorize a Trusted Proxy
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Full Name of Authorized Person
                </label>
                <input
                  type="text"
                  value={proxyName}
                  onChange={(e) => setProxyName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Colleague / Legal Representative">Legal Representative</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Purpose for Delegation
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Permission Scope
                  </label>
                  <select
                    value={permissionType}
                    onChange={(e) => setPermissionType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="TIME_LIMITED">Time Limited (Auto-Expires)</option>
                    <option value="ONE_TIME">One-Time (Expires After Visit)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Valid For (Hours)
                  </label>
                  <input
                    type="number"
                    value={hoursValid}
                    onChange={(e) => setHoursValid(Number(e.target.value))}
                    min={1}
                    max={168}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Permission Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Enforced Security Envelope
                </span>
                <p className="text-[11px] text-slate-400">
                  Allowed: Document submission & acknowledgement receipt.
                  <br />
                  Blocked: Profile modifications and payment operations.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProxy}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all"
              >
                Create Delegation Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
