import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, ExternalLink, RefreshCw, Radio } from 'lucide-react';
import { ChatMode } from '../types';

interface DebugPanelProps {
  sessionId: string;
  matchmakingStatus: 'idle' | 'searching' | 'matched' | 'ended';
  queueCount?: { total: number; text: number; video: number };
  mode: ChatMode;
  matchId?: string | null;
  connectionState: 'connected' | 'reconnecting' | 'disconnected';
  onResetSessionId?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  sessionId,
  matchmakingStatus,
  queueCount,
  mode,
  matchId,
  connectionState,
  onResetSessionId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleOpenSecondTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div 
      id="dev-debug-panel"
      className="fixed bottom-3 right-3 z-50 font-mono text-xs select-none max-w-sm"
    >
      {/* Collapsed Pill Button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="Open Matchmaking & State Debug Info"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionState === 'reconnecting'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span className="font-semibold text-[11px] text-slate-200">Dev Test Mode</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-[10px] text-indigo-400 uppercase font-bold">{matchmakingStatus}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded Debug Panel Card */
        <div className="rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl p-4 backdrop-blur-xl text-slate-300 w-80 sm:w-96 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white text-xs tracking-wider uppercase">Matchmaking Diagnostics</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Minimize panel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-[11px]">
            {/* User Session ID */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Session ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-300 font-semibold truncate max-w-[130px]" title={sessionId || 'Initializing...'}>
                  {sessionId ? `${sessionId.substring(0, 10)}...` : 'Connecting...'}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Copy session token"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Matchmaking Status */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Matchmaking Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  matchmakingStatus === 'searching'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : matchmakingStatus === 'matched'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {matchmakingStatus}
              </span>
            </div>

            {/* Queue Count */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Queue Count:</span>
              <span className="text-white font-medium">
                {queueCount 
                  ? `Total: ${queueCount.total} (Video: ${queueCount.video}, Text: ${queueCount.text})`
                  : '0 waiting'}
              </span>
            </div>

            {/* Selected Mode */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Selected Mode:</span>
              <span className="text-white uppercase font-bold text-indigo-400">{mode} Chat</span>
            </div>

            {/* Match ID */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Match ID:</span>
              <span className="text-rose-300 font-semibold truncate max-w-[140px]">
                {matchId ? matchId : 'None (idle)'}
              </span>
            </div>

            {/* Connection State */}
            <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Connection State:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionState === 'connected'
                      ? 'bg-emerald-400'
                      : connectionState === 'reconnecting'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                ></span>
                <span
                  className={
                    connectionState === 'connected'
                      ? 'text-emerald-400'
                      : connectionState === 'reconnecting'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                >
                  {connectionState}
                </span>
              </span>
            </div>
          </div>

          {/* Development Test Mode Quick Actions */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              onClick={handleOpenSecondTab}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Tab 2 (Simulate Peer)</span>
            </button>

            {onResetSessionId && (
              <button
                onClick={onResetSessionId}
                className="w-full py-1 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] flex items-center justify-center gap-1 transition-all"
                title="Generates a brand new anonymous identity for this tab"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Tab Identity</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
