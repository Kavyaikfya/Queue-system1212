import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueId: string;
  queueName: string;
  orgName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  queueId,
  queueName,
  orgName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}/#/scan/${queueId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">QR Queue Access</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100">
            <QRCodeSVG value={joinUrl} size={180} level="H" includeMargin />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-3">{queueName}</h4>
          <p className="text-xs text-slate-500">{orgName}</p>
          <span className="mt-1 text-[11px] text-slate-400">
            Scan to instantly view live wait time and join without typing an ID
          </span>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Direct Join URL'}</span>
          </button>

          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 flex items-center justify-center space-x-1.5 transition-colors block"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Mobile Scan Page</span>
          </a>
        </div>
      </div>
    </div>
  );
};
