import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Lock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AgeGateModalProps {
  isOpen: boolean;
  onVerified?: (token?: string) => void;
  onConfirm?: (token?: string) => void;
  onReject?: () => void;
  sessionToken?: string;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({
  isOpen,
  onVerified,
  onConfirm,
  onReject,
  sessionToken,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmAge = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Resolve token: prop, localStorage, or request fresh from server
      let activeToken = sessionToken || localStorage.getItem('to_get_her_session_token') || localStorage.getItem('to_get_her_token') || '';

      if (!activeToken) {
        try {
          const sessRes = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          if (sessRes.ok) {
            const sessData = await sessRes.json();
            activeToken = sessData.sessionToken || sessData.token || '';
          }
        } catch (e) {
          // If fetch fails, age-verify will auto-generate token on the server
        }
      }

      // 2. Submit adult age verification to server
      const response = await fetch('/api/auth/age-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken || undefined,
          confirmed: true,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.success || data.ageVerified)) {
        const verifiedToken = data.sessionToken || data.token || activeToken;
        if (verifiedToken) {
          localStorage.setItem('to_get_her_session_token', verifiedToken);
          localStorage.setItem('to_get_her_token', verifiedToken);
        }
        localStorage.setItem('to_get_her_age_verified', 'true');

        if (onVerified) onVerified(verifiedToken);
        if (onConfirm) onConfirm(verifiedToken);
      } else {
        setError(data.error || 'Verification failed. Please confirm you are 18 or older.');
      }
    } catch (err) {
      setError('Connection to verification server failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    if (onReject) {
      onReject();
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      id="age-gate-overlay"
    >
      <div 
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-rose-950/30 text-center relative overflow-hidden"
        id="age-gate-dialog"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Brand */}
        <div className="flex justify-center mb-2">
          <BrandLogo size="sm" showTagline={false} />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-2" id="age-gate-title">
          18+ ONLY
        </h2>

        {/* Body */}
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          This platform is intended exclusively for adults aged <strong>18 and above</strong>. TO-GET-HER connects random adults worldwide for authentic conversation.
        </p>

        {/* Security badges */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-6 text-xs text-slate-400 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Server-verified session • Anonymous • Encrypted</span>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            id="age-gate-confirm-btn"
            onClick={handleConfirmAge}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{isSubmitting ? 'Verifying Session...' : 'I am 18+ (Enter TO-GET-HER)'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            id="age-gate-exit-btn"
            onClick={handleExit}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium border border-slate-700/60 transition-colors"
          >
            Exit (I am under 18)
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-4 leading-normal">
          By proceeding, you agree to our Community Guidelines and confirm you meet the age requirements in your jurisdiction.
        </p>
      </div>
    </div>
  );
};
