import React, { useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Languages,
  ArrowRight,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  Building,
  HelpCircle,
  Scan,
  ShieldCheck,
  X
} from 'lucide-react';
import { qevoraApi } from '../services/api';

interface SnapAndUnderstandPageProps {
  onNavigate: (page: string, params?: any) => void;
  query?: string;
}

export const SnapAndUnderstandPage: React.FC<SnapAndUnderstandPageProps> = ({
  onNavigate,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sampleNoticeType, setSampleNoticeType] = useState<string>('REVENUE_REJECTION');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const sampleNotices = [
    {
      id: 'REVENUE_REJECTION',
      title: 'Govt Revenue Income Defect Notice',
      type: 'revenue rejection notice income proof missing',
      desc: 'Official notice from Tahsildar regarding missing salary/income documentation',
    },
    {
      id: 'BANK_KYC',
      title: 'Bank Periodic KYC Re-verification Notice',
      type: 'bank kyc periodic update aadhaar pan debit card restriction',
      desc: 'RBI compliance letter requiring immediate identity and address re-verification',
    },
    {
      id: 'HOSPITAL_LAB',
      title: 'Doctor Fasting Diagnostic Prescription',
      type: 'hospital doctor prescription blood fasting lipid panel uhid',
      desc: 'Diagnostic lab order requiring 12-hour overnight fasting at OPD lab',
    },
    {
      id: 'COLLEGE_ADM',
      title: 'College Original Marksheet Verification Slip',
      type: 'college university admission marksheet transfer certificate registrar',
      desc: 'Registrar notice requesting original marksheet for final enrollment',
    },
  ];

  const handleAnalyze = async (sampleId?: string, file?: File) => {
    try {
      setIsAnalyzing(true);
      const targetSample = sampleNotices.find((s) => s.id === (sampleId || sampleNoticeType));
      const textToAnalyze = targetSample ? targetSample.type : (file ? file.name : 'Government Revenue notice');

      const res = await qevoraApi.snapAndUnderstand({
        document_text: textToAnalyze,
        language: selectedLanguage,
      });

      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
      }
    } catch (e) {
      console.error('Failed to analyze document:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    handleAnalyze('REVENUE_REJECTION');
  }, [selectedLanguage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      handleAnalyze(undefined, file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.getElementById('camera-file-input') as HTMLInputElement;
    if (input) input.click();
  };

  // Multilingual UI translations
  const labels = {
    en: {
      badge: 'SNAP & UNDERSTAND',
      title: 'Snap & Understand',
      subtitle: 'Upload any government letter, hospital order, or bank notice to get a clear breakdown in plain language.',
      takePhoto: 'Take Photo',
      uploadDoc: 'Upload Document / PDF',
      orSample: 'Or test with a real-world notice template:',
      whatIsThis: 'WHAT IS THIS?',
      whatDoesItMean: 'WHAT DOES IT MEAN?',
      whatDoINeedToDo: 'WHAT DO I NEED TO DO?',
      deadline: 'DEADLINE',
      documentsRequired: 'DOCUMENTS REQUIRED',
      whereToGo: 'WHERE SHOULD I GO?',
      nextAction: 'NEXT ACTION',
      continueToService: 'Continue to Service',
      reasonLabel: 'Reason:',
      analyzing: 'QEVORA Vision Engine is scanning & translating notice...',
    },
    kn: {
      badge: 'ಸ್ನ್ಯಾಪ್ ಮತ್ತು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
      title: 'ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮತ್ತು ವಿವರಣೆ',
      subtitle: 'ಸರ್ಕಾರಿ ನೋಟಿಸ್, ಆಸ್ಪತ್ರೆ ವರದಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಪತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಸ್ಪಷ್ಟ ವಿವರಣೆ ಪಡೆಯಿರಿ.',
      takePhoto: 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
      uploadDoc: 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      orSample: 'ಅಥವಾ ಮಾದರಿ ನೋಟಿಸ್ ಆಯ್ಕೆಮಾಡಿ:',
      whatIsThis: 'ಇದು ಏನು?',
      whatDoesItMean: 'ಇದರ ಅರ್ಥವೇನು?',
      whatDoINeedToDo: 'ನಾನು ಏನು ಮಾಡಬೇಕು?',
      deadline: 'ಕೊನೆಯ ದಿನಾಂಕ',
      documentsRequired: 'ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು',
      whereToGo: 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?',
      nextAction: 'ಮುಂದಿನ ಕ್ರಮ',
      continueToService: 'ಸೇವೆಯನ್ನು ಮುಂದುವರಿಸಿ',
      reasonLabel: 'ಕಾರಣ:',
      analyzing: 'ದಾಖಲೆಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಭಾಷಾಂತರಿಸಲಾಗುತ್ತಿದೆ...',
    },
    hi: {
      badge: 'स्नैप और समझें',
      title: 'दस्तावेज़ समझें',
      subtitle: 'सरकारी नोटिस, अस्पताल रिपोर्ट या बैंक पत्र अपलोड करें और सरल हिंदी में स्पष्ट जानकारी प्राप्त करें।',
      takePhoto: 'फ़ोटो लें',
      uploadDoc: 'दस्तावेज़ अपलोड करें',
      orSample: 'या नमूना नोटिस चुनें:',
      whatIsThis: 'यह क्या है?',
      whatDoesItMean: 'इसका क्या मतलब है?',
      whatDoINeedToDo: 'मुझे क्या करना होगा?',
      deadline: 'अंतिम तिथि',
      documentsRequired: 'आवश्यक दस्तावेज',
      whereToGo: 'कहाँ जाना है?',
      nextAction: 'अगला कदम',
      continueToService: 'सेवा जारी रखें',
      reasonLabel: 'कारण:',
      analyzing: 'दस्तावेज़ का विश्लेषण हो रहा है...',
    },
  }[selectedLanguage];

  const getLocalizedAnalysis = () => {
    if (!analysisResult) return null;

    if (selectedLanguage === 'kn') {
      return {
        whatIsThis: analysisResult.what_is_this_kn || 'ಇದು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದ ತಿರಸ್ಕಾರ ಸೂಚನೆ.',
        meaning: analysisResult.meaning_kn || 'ಆದಾಯದ ಪುರಾವೆ ಲಗತ್ತಿಸದ ಕಾರಣ ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
        whatToDo: analysisResult.action_required_kn || 'ಮಾನ್ಯ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ವೇತನ ಚೀಟಿಯನ್ನು ಕಂದಾಯ ಕಚೇರಿಗೆ ಸಲ್ಲಿಸಿ.',
        deadline: '30 ಸೆಪ್ಟೆಂಬರ್ 2026',
        documents: ['ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ (Income Certificate)', 'ಅರ್ಜಿ ಸಂಖ್ಯೆ (Application ID)'],
        location: 'ಕಂದಾಯ ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ (Revenue Office)',
        nextAction: 'ಕೊರತೆಯಿರುವ ದಾಖಲೆಯನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕೌಂಟರ್‌ನಲ್ಲಿ ಸಲ್ಲಿಸಿ.',
        serviceLink: analysisResult.service_link || 'services',
      };
    }

    if (selectedLanguage === 'hi') {
      return {
        whatIsThis: analysisResult.what_is_this_hi || 'यह दस्तावेज़ अस्वीकृति / सुधार नोटिस है।',
        meaning: analysisResult.meaning_hi || 'आय प्रमाण संलग्न न होने के कारण आपका आवेदन रोक दिया गया है।',
        whatToDo: analysisResult.action_required_hi || 'नया आय प्रमाण पत्र और आवेदन संख्या काउंटर पर जमा करें।',
        deadline: '30 सितम्बर 2026',
        documents: ['आय प्रमाण पत्र (Income Certificate)', 'आवेदन आईडी (Application ID)'],
        location: 'राजस्व कार्यालय (तहसीलदार केंद्र)',
        nextAction: 'लापता दस्तावेज़ जमा करें और सेवा पूरी करें।',
        serviceLink: analysisResult.service_link || 'services',
      };
    }

    return {
      whatIsThis: analysisResult.what_is_this || 'This is a document rejection notice.',
      meaning: analysisResult.meaning || 'Income proof is missing from your submitted application.',
      whatToDo: analysisResult.action_required || 'Submit the missing income certificate and application reference before deadline.',
      deadline: analysisResult.deadline || '30 September 2026',
      documents: analysisResult.documents_needed || ['Income certificate', 'Application ID'],
      location: analysisResult.where_to_go || 'Revenue Office (Tahsildar Center, Counter 4)',
      nextAction: analysisResult.next_action || 'Submit the missing document to complete your service.',
      serviceLink: analysisResult.service_link || 'services',
    };
  };

  const localized = getLocalizedAnalysis();

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-1 border border-cyan-500/30">
            <Scan className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{labels.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {labels.title}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            {labels.subtitle}
          </p>
        </div>

        {/* Multi-language Selector (English, Kannada, Hindi) */}
        <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLanguage === 'en'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setSelectedLanguage('kn')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLanguage === 'kn'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ಕನ್ನಡ (Kannada)
          </button>
          <button
            onClick={() => setSelectedLanguage('hi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLanguage === 'hi'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Input Action Controls: Take Photo & Upload Document */}
      <div className="p-6 sm:p-8 rounded-3xl qevora-card space-y-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            id="camera-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            id="upload-file-input"
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={handleCameraCapture}
            className="w-full sm:w-1/2 py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center space-x-2.5"
          >
            <Camera className="w-5 h-5" />
            <span>{labels.takePhoto}</span>
          </button>

          <button
            onClick={() => {
              const input = document.getElementById('upload-file-input') as HTMLInputElement;
              if (input) input.click();
            }}
            className="w-full sm:w-1/2 py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-all active:scale-95 flex items-center justify-center space-x-2.5"
          >
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>{labels.uploadDoc}</span>
          </button>
        </div>

        {/* Selected preview if available */}
        {previewUrl && (
          <div className="relative p-3 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium truncate max-w-xs">{selectedFile?.name}</span>
            </div>
            <button
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sample Notices Selector */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <span className="text-xs font-bold text-slate-400">
            {labels.orSample}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleNotices.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setSampleNoticeType(sample.id);
                  handleAnalyze(sample.id);
                }}
                className={`p-3.5 rounded-2xl text-left text-xs transition-all border ${
                  sampleNoticeType === sample.id
                    ? 'border-cyan-500 bg-cyan-500/15 text-white font-bold shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center space-x-2 text-white">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>{sample.title}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{sample.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Result Display */}
      {isAnalyzing ? (
        <div className="p-16 text-center rounded-3xl qevora-card space-y-4 border border-cyan-500/30 animate-pulse">
          <Scan className="w-10 h-10 text-cyan-400 mx-auto animate-spin" />
          <h3 className="text-base font-extrabold text-white">
            {labels.analyzing}
          </h3>
        </div>
      ) : localized ? (
        <div className="p-6 sm:p-8 rounded-3xl qevora-card space-y-6 shadow-2xl border border-cyan-500/40">
          {/* Section 1: What is this? & Meaning */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-black text-cyan-400 tracking-wider uppercase">
                {labels.whatIsThis}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                "{localized.whatIsThis}"
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <span className="text-[11px] font-black text-amber-400 tracking-wider uppercase flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>{labels.whatDoesItMean}</span>
              </span>
              <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                {labels.reasonLabel} {localized.meaning}
              </p>
            </div>
          </div>

          {/* Section 2: What do I need to do & Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                {labels.whatDoINeedToDo}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {localized.whatToDo}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                {labels.documentsRequired}
              </span>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {localized.documents.map((doc: string, idx: number) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Deadline & Where to Go */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {labels.deadline}
                </span>
                <div className="text-base font-black text-white">
                  {localized.deadline}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {labels.whereToGo}
                </span>
                <div className="text-sm font-bold text-white truncate">
                  {localized.location}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Next Action & Direct Connect to Service */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                {labels.nextAction}
              </span>
              <p className="text-sm font-extrabold text-white">
                {localized.nextAction}
              </p>
            </div>

            <button
              onClick={() => onNavigate('services')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 shrink-0 transition-all"
            >
              <span>{labels.continueToService}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
