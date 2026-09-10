import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Shield, Sparkles, MessageSquare, Video, Menu, X, Users } from 'lucide-react';
import { PlatformStats } from '../types';

interface HeaderProps {
  currentView?: string;
  onNavigate: (view: string) => void;
  onStartChat: () => void;
  onOpenAdmin: () => void;
  stats?: PlatformStats;
  onlineCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'home',
  onNavigate,
  onStartChat,
  onOpenAdmin,
  stats,
  onlineCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Online display logic: real count if > 0, otherwise friendly status
  const count = typeof onlineCount === 'number' ? onlineCount : (stats?.onlineUsers ?? 0);
  const onlineText = count > 0 
    ? `${count.toLocaleString()} online`
    : 'People are online';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'safety', label: 'Safety' },
    { id: 'faq', label: 'FAQ' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-all" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          className="cursor-pointer py-1"
          onClick={() => handleNavClick('home')}
          id="nav-logo-btn"
        >
          <BrandLogo size="md" showTagline={false} />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60" id="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="hidden sm:flex items-center gap-3" id="header-right-actions">
          {/* Live Online Counter */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium"
            id="live-online-counter"
            title="Real-time connected users"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <Users className="w-3.5 h-3.5" />
            <span>{onlineText}</span>
          </div>

          {/* Admin Shield / Login Portal */}
          <button
            id="admin-portal-btn"
            onClick={onOpenAdmin}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Admin & Safety Dashboard"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Start Chatting CTA */}
          <button
            id="header-start-chat-btn"
            onClick={onStartChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-sm font-semibold hover:from-rose-600 hover:to-indigo-700 transition-all shadow-md shadow-rose-500/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Chatting</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">{onlineText}</span>
          </div>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-4 space-y-3" id="mobile-menu-drawer">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2 rounded-lg text-base font-medium ${
                  currentView === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-900"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Admin & Moderation</span>
            </button>

            <button
              onClick={() => {
                onStartChat();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-base font-semibold shadow-md shadow-rose-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Chatting</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
