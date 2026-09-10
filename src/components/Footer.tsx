import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { LegalDocType } from './LegalModal';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenLegal: (type: LegalDocType) => void;
  onStartChat: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenLegal,
  onStartChat,
}) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs mt-auto py-12" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <BrandLogo size="md" showTagline={true} />
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed mt-2">
              An original anonymous social discovery platform where adults can meet random people through instant text chat and real-time WebRTC video chat.
            </p>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Strictly 18+ Adults Only Platform</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('safety')} className="hover:text-white transition-colors">
                  Safety Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={onStartChat} className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">
                  Start Connecting
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
              Trust & Legal
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('guidelines')} className="hover:text-white transition-colors">
                  Community Guidelines
                </button>
              </li>
              <li className="pt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Active Moderation</span>
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div>
            © {new Date().getFullYear()} TO-GET-HER. All rights reserved. Original social platform.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Systems Operational</span>
            </span>
            <span>•</span>
            <span>WebRTC + Redis Queue Engine</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
