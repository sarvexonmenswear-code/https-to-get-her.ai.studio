import React from 'react';
import { MessageSquare, Video, Sparkles, ShieldCheck, Zap, Globe, HeartHandshake, ArrowRight } from 'lucide-react';
import { PlatformStats } from '../types';

interface LandingHeroProps {
  onSelectMode?: (mode: 'text' | 'video') => void;
  stats?: PlatformStats;
  onlineCount?: number;
  onStartTextChat?: () => void;
  onStartVideoChat?: () => void;
  onHowItWorks?: () => void;
  onSafety?: () => void;
  onExploreSafety?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSelectMode,
  stats,
  onlineCount,
  onStartTextChat,
  onStartVideoChat,
  onHowItWorks,
  onSafety,
  onExploreSafety,
}) => {
  const count = typeof onlineCount === 'number' ? onlineCount : (stats?.onlineUsers ?? 0);
  const onlineCountFormatted = count > 0 ? count.toLocaleString() : 'Many';

  return (
    <div className="relative overflow-hidden" id="landing-hero-section">
      {/* Background radial glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-rose-500/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Hero Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 mb-8 backdrop-blur-md shadow-sm" id="hero-badge">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {count > 0 ? `${count} People Online Right Now` : 'People are online & ready to chat'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-rose-400 font-medium">18+ Anonymous Social Discovery</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]" id="hero-headline">
          Meet. Talk. <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Connect.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 font-normal">
          Start a conversation with someone new through instant text or video chat. 
          No account needed, no intrusive tracking — just spontaneous human connection.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14" id="hero-actions">
          {/* Text Chat Button */}
          <button
            id="hero-start-text-chat-btn"
            onClick={() => {
              if (onStartTextChat) onStartTextChat();
              else if (onSelectMode) onSelectMode('text');
            }}
            className="w-full sm:w-1/2 group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-base shadow-lg shadow-slate-950/50 hover:border-slate-600 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="leading-tight">Text Chat</div>
              <div className="text-[11px] text-slate-400 font-normal">No camera required</div>
            </div>
          </button>

          {/* Video Chat Button */}
          <button
            id="hero-start-video-chat-btn"
            onClick={() => {
              if (onStartVideoChat) onStartVideoChat();
              else if (onSelectMode) onSelectMode('video');
            }}
            className="w-full sm:w-1/2 group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold text-base shadow-xl shadow-rose-600/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-white/20 text-white group-hover:bg-white/30 transition-colors">
              <Video className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="leading-tight">Video Chat</div>
              <div className="text-[11px] text-rose-100 font-normal">Face-to-face WebRTC</div>
            </div>
          </button>
        </div>

        {/* Subtle Animated Connection Graphic */}
        <div className="relative max-w-3xl mx-auto py-6 mb-16" id="hero-connection-animation">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
              
              {/* User Node 1 */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <span className="text-lg font-bold">You</span>
                </div>
                <span className="text-xs font-medium text-slate-400">Anonymous</span>
              </div>

              {/* Connecting animated wave / beam */}
              <div className="flex-1 relative flex items-center justify-center px-4">
                <div className="w-full h-1 bg-slate-800 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-400 animate-pulse"></div>
                </div>
                {/* Center matching node */}
                <div className="absolute w-8 h-8 rounded-full bg-slate-950 border border-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Sparkles className="w-4 h-4 text-rose-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>

              {/* User Node 2 (Stranger) */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                  <span className="text-lg font-bold">???</span>
                </div>
                <span className="text-xs font-medium text-slate-400">Random Stranger</span>
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Sub-second matchmaking
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active safety moderation
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" /> Global discovery
              </span>
            </div>
          </div>
        </div>

        {/* 3 Steps: How It Works */}
        <div className="py-12 border-t border-slate-800/80" id="how-it-works-section">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How TO-GET-HER Works</h2>
            <p className="text-slate-400 text-sm">Three easy steps to start meaningful random conversations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Choose Mode & Topics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pick text or video chat, then pick your interests (gaming, travel, music, tech, etc.) to meet like-minded people.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-base mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Instant Matchmaking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our matchmaking queue securely pairs you in real time with an active stranger who matches your chosen preferences.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Talk or Skip Anytime</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enjoy your conversation. Want to meet someone new? Hit "Next" anytime to seamlessly rotate to another stranger.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Callout */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-rose-950/30 to-indigo-950/30 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white font-bold text-base">Your safety is our highest priority</div>
              <div className="text-slate-400 text-xs">
                Active automated abuse filters, one-tap reporting, immediate block protection, and adult age verification.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (onSafety) onSafety();
              else if (onExploreSafety) onExploreSafety();
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Safety Guidelines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
