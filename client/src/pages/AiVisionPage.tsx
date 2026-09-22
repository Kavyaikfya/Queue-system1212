import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';

interface AiVisionPageProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const AiVisionPage: React.FC<AiVisionPageProps> = ({ onNavigate }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample quick scenarios for rapid testing
  const sampleScenarios = [
    {
      name: 'Hospital OPD Triage Hall',
      tag: 'High Density (18 People)',
      filename: 'hospital_queue_busy.jpg',
      previewColor: 'from-blue-900 to-indigo-950',
    },
    {
      name: 'Commercial Bank Teller Lobby',
      tag: 'Moderate Flow (12 People)',
      filename: 'bank_lobby_moderate.jpg',
      previewColor: 'from-slate-900 to-blue-950',
    },
    {
      name: 'Passport Verification Desks',
      tag: 'Clear Waiting Hall (3 People)',
      filename: 'empty_clear_hall.jpg',
      previewColor: 'from-emerald-950 to-slate-900',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: any) => {
    setFileName(sample.filename);
    setSelectedImage('sample_selected');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    try {
      setIsAnalyzing(true);
      const res = await api.analyzeVision({
        image: selectedImage,
        filename: fileName,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-bold mb-2">
          <Eye className="w-3.5 h-3.5" />
          <span>AI QUEUE VISION • COMPUTER VISION ESTIMATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Physical Queue Vision Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Upload or capture an image of your service hall, waiting lobby, or counter area. Our neural vision model automatically estimates crowding density, queue length, and bottleneck areas.
        </p>
      </div>

      {/* Main Upload / Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card (Left 6/12) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Upload Queue Photo or Capture Live
            </h3>

            {/* Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                selectedImage
                  ? 'border-sky-500/50 bg-sky-50 dark:bg-sky-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* Scanning effect during analysis */}
              {isAnalyzing && <div className="scanner-line"></div>}

              {selectedImage ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {fileName || 'Captured Image Loaded'}
                    </span>
                    <span className="text-[11px] text-sky-600 dark:text-sky-400">Click to replace photo</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Drag & drop queue photo, or browse
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WebP up to 10MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Photos */}
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-2">
                Or test with sample pre-calibrated scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sampleScenarios.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      fileName === s.filename
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">{s.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze CTA */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isAnalyzing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAnalyzing ? 'AI ANALYZING IMAGE...' : 'ANALYZE PHYSICAL QUEUE'}</span>
            </button>
          </div>
        </div>

        {/* Results Card (Right 6/12) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl min-h-[380px] flex flex-col justify-between">
            <div>
              {/* REQUIREMENT 24: Header Label */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  AI VISUAL QUEUE ESTIMATE
                </span>
                {result && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    Confidence: {result.confidenceScore}%
                  </span>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto animate-ai-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Extracting Scene Geometry...</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Detecting waiting clusters, open counter partitions, and queue lines
                    </p>
                  </div>
                </div>
              ) : result ? (
                <div className="py-4 space-y-5 animate-fade-in">
                  {/* REQUIREMENT 24: KPI Grid with Exact Labels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">PEOPLE DETECTED</span>
                      <span className="text-xl font-mono font-black text-sky-600 dark:text-sky-400">
                        {result.peopleDetected}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">EST. QUEUE LENGTH</span>
                      <span className="text-xl font-mono font-black text-brand-600 dark:text-brand-400">
                        ~{Math.round(result.peopleDetected * 1.2)}m
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">VISIBLE COUNTERS</span>
                      <span className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {result.visibleCounters}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">CROWDING LEVEL</span>
                      <span
                        className={`text-sm font-bold block mt-1 ${
                          result.queueDensity === 'HIGH'
                            ? 'text-red-500'
                            : result.queueDensity === 'MEDIUM'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {result.queueDensity}
                      </span>
                    </div>
                  </div>

                  {/* Operational Recommendation Box */}
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/20 text-xs space-y-1">
                    <span className="font-bold text-sky-700 dark:text-sky-300 block">
                      💡 Operational Recommendation:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400">
                  Select a sample image or upload a waiting room photo to see instant AI queue metrics.
                </div>
              )}
            </div>

            {/* REQUIREMENT 24: MANDATORY PRIVACY DISCLAIMER */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic space-y-0.5">
              <div className="font-bold not-italic text-slate-700 dark:text-slate-300">
                AI-generated visual estimate.
              </div>
              <p>
                Actual queue conditions may differ. Do not perform face recognition. Do not identify individuals. Do not infer sensitive personal information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
