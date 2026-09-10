import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, EyeOff, UserX, Flag, CheckCircle2 } from 'lucide-react';

interface SafetyViewProps {
  onBack: () => void;
  onStartChat: () => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({ onBack, onStartChat }) => {
  const safetyRules = [
    {
      icon: Lock,
      title: 'Never Share Passwords or Credentials',
      description: 'Never reveal account logins, verification codes, 2FA tokens, or security answers to anyone on the platform.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: EyeOff,
      title: 'Never Share Financial Information',
      description: 'Keep your credit card numbers, bank routing information, PayPal, Venmo, CashApp, or cryptocurrency addresses strictly private.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      icon: AlertTriangle,
      title: 'Do Not Share Your Home Address or Location',
      description: 'Avoid sharing your physical address, neighborhood details, workplace, or schools you or your family attend.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      icon: UserX,
      title: 'Block Suspicious Users Immediately',
      description: 'If anyone behaves suspiciously, aggressively, or inappropriately, tap the Block button immediately to permanently disconnect.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      icon: Flag,
      title: 'Report Abusive Behavior',
      description: 'Use the Report button to flag violations like harassment, illegal material, or underage concerns. Our moderation team takes immediate action.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: ShieldCheck,
      title: 'Leave Conversations That Make You Uncomfortable',
      description: 'You are under no obligation to stay in a chat. Click Next or End at any second to leave instantly without explanation.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: AlertTriangle,
      title: 'Never Arrange Unsafe Offline Meetings',
      description: 'TO-GET-HER is intended for online discovery. Never agree to meet strangers offline in private or unverified locations.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: CheckCircle2,
      title: 'TO-GET-HER Is Strictly 18+ Only',
      description: 'This platform is intended solely for consenting adults. Underage access is strictly prohibited and subject to immediate banning and reporting.',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10" id="safety-guidelines-page">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-4 h-4" /> Community Trust & Security
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Your safety matters.
        </h1>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          TO-GET-HER was created to bring people together in a respectful, anonymous environment. 
          Follow these golden rules to protect your privacy and well-being.
        </p>
      </div>

      {/* Safety Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {safetyRules.map((rule, idx) => {
          const Icon = rule.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${rule.bg} ${rule.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">{rule.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{rule.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Banner CTA */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-indigo-950/40 to-slate-900 border border-rose-500/30 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ready to explore safely?</h2>
        <p className="text-slate-300 text-sm max-w-lg mx-auto mb-6">
          Meet interesting adults worldwide through text or video chat in complete anonymity.
        </p>
        <button
          onClick={onStartChat}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
        >
          Start Chatting Now
        </button>
      </div>
    </div>
  );
};
