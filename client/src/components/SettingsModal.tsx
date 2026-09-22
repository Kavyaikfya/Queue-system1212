import React, { useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Mic,
  Volume2,
  Bell,
  Smartphone,
  Shield,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isSoundEnabled, setSoundEnabled, playChime } from '../services/audioEngine';
import {
  isVoiceAnnouncementsEnabled,
  setVoiceAnnouncementsEnabled,
  getVoiceVolume,
  setVoiceVolume,
  speakAnnouncement,
  isVoiceRecognitionSupported,
} from '../services/voiceEngine';
import { isVibrationEnabled, setVibrationEnabled, triggerHaptic } from '../services/hapticsEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [voiceOn, setVoiceOn] = useState(isVoiceAnnouncementsEnabled);
  const [voiceVolume, setVoiceVol] = useState(getVoiceVolume);
  const [vibrationOn, setVibrationOn] = useState(isVibrationEnabled);
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'voice' | 'sound' | 'haptics' | 'notifications' | 'privacy'
  >('appearance');

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playChime('alert');
  };

  const handleToggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    setVoiceAnnouncementsEnabled(next);
    if (next) speakAnnouncement('Voice announcements enabled.');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVoiceVol(val);
    setVoiceVolume(val);
  };

  const handleToggleVibration = () => {
    const next = !vibrationOn;
    setVibrationOn(next);
    setVibrationEnabled(next);
    if (next) triggerHaptic('position_changed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Settings</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure your queue intelligence experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center space-x-1 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Voice
          </button>
          <button
            onClick={() => setActiveTab('sound')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'sound'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sound
          </button>
          <button
            onClick={() => setActiveTab('haptics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'haptics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Haptics
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Privacy
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* APPEARANCE SECTION */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Theme System
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'border-sky-500 bg-blue-50/60 dark:bg-blue-950/40 text-sky-600 font-bold ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'border-sky-500 bg-blue-50/60 dark:bg-blue-950/40 text-sky-400 font-bold ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-5 h-5 mx-auto mb-2 text-sky-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'system'
                      ? 'border-sky-500 bg-blue-50/60 dark:bg-blue-950/40 text-sky-500 font-bold ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Laptop className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                  <span>System</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Theme choice is saved to your profile and automatically synchronized across devices.
              </p>
            </div>
          )}

          {/* VOICE SECTION */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Voice Announcements
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Spoken notifications when your turn approaches
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceOn}
                  onChange={handleToggleVoice}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>

              {voiceOn && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Voice Volume
                    </span>
                    <span className="font-mono text-slate-500">
                      {Math.round(voiceVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voiceVolume}
                    onChange={handleVolumeChange}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-sky-500" />
                  <span>Voice Mode Commands</span>
                </div>
                <p>
                  You can say: <em>“What is my position?”</em>, <em>“How long will I wait?”</em>, or <em>“Should I return now?”</em> to QUEUE AI.
                </p>
                {!isVoiceRecognitionSupported() && (
                  <p className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                    ℹ️ Note: Voice input recognition is not supported in this browser.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SOUND SECTION */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Synthesized Chime Alerts
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Play harmonic audio chimes on ticket issuance, position change, and turn call
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={handleToggleSound}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>

              {soundOn && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => playChime('joined')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold"
                  >
                    Test Join Chime
                  </button>
                  <button
                    type="button"
                    onClick={() => playChime('your_turn')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold"
                  >
                    Test Turn Fanfare
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HAPTICS SECTION */}
          {activeTab === 'haptics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Vibration / Haptic Feedback
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tactical mobile vibration when turn arrives or position changes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={vibrationOn}
                  onChange={handleToggleVibration}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Safe Return Window Alerts
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Get notified when it is safe to step away and when you must return
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* PRIVACY SECTION */}
          {activeTab === 'privacy' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Zero-Biometric Guarantee</span>
              </div>
              <p>
                FAIRQUEUE strictly protects privacy. Queue Vision algorithms estimate crowd counts without face recognition, and Google authentication identity information is never shared with third parties.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-850/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
