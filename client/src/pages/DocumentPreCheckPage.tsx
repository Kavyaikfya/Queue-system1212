import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';

interface DocumentPreCheckPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DocumentPreCheckPage: React.FC<DocumentPreCheckPageProps> = ({ onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [preCheckResult, setPreCheckResult] = useState<{
    documentDetected: boolean;
    readable: boolean;
    potentiallyIncomplete: boolean;
    missingFields: string[];
    confidenceScore: number;
    disclaimer: string;
    status: string;
  } | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.getDocuments();
      setUploadedDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreCheckResult(null);
    }
  };

  const handleRunPreCheck = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      const result = await api.preCheckDocument({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });
      setPreCheckResult(result);
      await loadDocuments();
    } catch (err) {
      console.error('Pre-check error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreCheckResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI READINESS SUITE</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            AI Document Pre-Check
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perform an instant clarity & completeness scan on your service documents before arriving.
          </p>
        </div>

        <button
          onClick={() => onNavigate('readiness')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#0b162b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <span>View Readiness Score</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-700 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">AI pre-check only.</span> Final verification is performed by the organization.
          This automated tool assesses image clarity and expected document structure. It does not perform facial recognition, identity verification, or infer sensitive personal information.
        </div>
      </div>

      {/* Upload Zone & Interactive Scan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-blue-500" />
            <span>Upload Document</span>
          </h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-blue-50/20 dark:hover:bg-blue-950/20 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select document or image
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ID card, proof of address, medical slip, or token receipt
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                PNG, JPG, PDF up to 10MB
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 max-h-56 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="object-contain max-h-56 w-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
                <button
                  onClick={handleReset}
                  className="text-red-500 hover:text-red-400 font-bold text-xs"
                >
                  Remove
                </button>
              </div>

              <button
                onClick={handleRunPreCheck}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing with Document AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Pre-Check</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>DOCUMENT PRE-CHECK RESULTS</span>
          </h3>

          {!preCheckResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No pre-check performed yet.</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Upload a document on the left and click "Run AI Pre-Check" to detect readiness.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Status Indicator */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    preCheckResult.potentiallyIncomplete
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {preCheckResult.potentiallyIncomplete ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {preCheckResult.potentiallyIncomplete ? 'Needs Attention' : 'Pre-Check Passed'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold">
                    Score: {preCheckResult.confidenceScore}%
                  </span>
                </div>

                {/* Pre-check checklist as specified in requirement 19 */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Document detected</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                    {preCheckResult.readable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span>Image readable & well-lit</span>
                  </div>

                  {preCheckResult.potentiallyIncomplete ? (
                    <div className="flex items-start space-x-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Some required information may be missing</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>All primary field segments recognized</span>
                    </div>
                  )}
                </div>

                {/* Missing Fields list */}
                {preCheckResult.missingFields?.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      SUGGESTED CHECKLIST FOR VISITOR:
                    </div>
                    {preCheckResult.missingFields.map((field, idx) => (
                      <div key={idx} className="text-xs text-amber-500 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ready Next Step Button */}
              <button
                onClick={() => onNavigate('readiness')}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Update Visit Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents History */}
      {uploadedDocuments.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>RECENT PRE-CHECKED DOCUMENTS ({uploadedDocuments.length})</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {doc.file_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(doc.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    doc.pre_check_status === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {doc.pre_check_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
