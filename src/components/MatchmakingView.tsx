import React, { useEffect, useState } from 'react';
import { Sparkles, X, MessageSquare, Video, RefreshCw, Clock, AlertCircle, SlidersHorizontal, Home } from 'lucide-react';
import { ChatMode, UserPreferences } from '../types';

interface MatchmakingViewProps {
  mode: ChatMode;
  preferences: UserPreferences;
  onCancel: () => void;
  onRetry: () => void;
  onChangePreferences?: () => void;
  onBackHome?: () => void;
  onlineCount?: number;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({
  mode,
  preferences,
  onCancel,
  onRetry,
  onChangePreferences,
  onBackHome,
  onlineCount,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 15) {
          return 15;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry]);

  const handleRetryClick = () => {
    setElapsedSeconds(0);
    onRetry();
  };

  const handlePreferencesClick = () => {
    if (onChangePreferences) {
      onChangePreferences();
    } else {
      onCancel();
    }
  };

  const handleHomeClick = () => {
    if (onBackHome) {
      onBackHome();
    } else {
      onCancel();
    }
  };

  const isTimedOut = elapsedSeconds >= 15;

  // Derive phase status and text
  let statusHeading = 'Finding someone for you...';
  let statusSubtitle = `Searching for an active adult who matches your ${mode === 'video' ? 'Video Chat' : 'Text Chat'} preference.`;

  if (typeof onlineCount === 'number' && onlineCount <= 1) {
    statusHeading = 'Waiting for another person...';
    statusSubtitle = 'You are currently the only active member in this queue. When another member joins, you will connect instantly.';
  } else if (elapsedSeconds >= 10 && elapsedSeconds < 15) {
    statusHeading = 'Expanding your match options...';
    statusSubtitle = 'Broadening criteria to connect with any available stranger in queue.';
  } else if (elapsedSeconds >= 5 && elapsedSeconds < 10) {
    statusHeading = 'Still looking...';
    statusSubtitle = 'Scanning online members for matching interests and language...';
  }

  // Calculate percentage for progress bar (0 to 100%)
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / 15) * 100));

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4" id="matchmaking-container">
      <div className="w-full max-w-lg text-center relative py-10 px-6 sm:px-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl transition-all">
        
        {!isTimedOut ? (
          <>
            {/* Radar / Pulse Animation */}
            <div className="relative w-36 h-36 mx-auto mb-7 flex items-center justify-center">
              {/* Outer ripples */}
              <div className="absolute inset-0 rounded-full border border-rose-500/25 animate-ping opacity-60" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute inset-2 rounded-full border border-indigo-500/30 animate-pulse" style={{ animationDuration: '1.8s' }}></div>
              <div className="absolute inset-5 rounded-full border border-slate-700 bg-slate-950/80 shadow-inner flex items-center justify-center"></div>

              {/* Rotating radar sweep */}
              <div className="absolute inset-5 rounded-full overflow-hidden pointer-events-none animate-radar">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-rose-500/30 via-indigo-500/20 to-transparent origin-bottom-right"></div>
              </div>

              {/* Center icon */}
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                {mode === 'video' ? (
                  <Video className="w-7 h-7 animate-pulse" />
                ) : (
                  <MessageSquare className="w-7 h-7 animate-pulse" />
                )}
              </div>
            </div>

            {/* Status Headings */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight transition-all" id="matchmaking-status-text">
              {statusHeading}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
              {statusSubtitle}
            </p>

            {/* 15s Progress Bar */}
            <div className="mb-6 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                <span>Matching progress</span>
                <span className="text-indigo-400 font-semibold">{elapsedSeconds}s / 15s</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Selected Criteria Summary */}
            <div className="p-4 mb-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex flex-col gap-2 text-left">
              <div className="flex items-center justify-between text-slate-400">
                <span>Selected Mode</span>
                <span className="text-white font-medium uppercase tracking-wider">{mode} Chat</span>
              </div>

              {preferences.interests.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Interests</span>
                  <span className="text-indigo-300 font-medium truncate max-w-[200px]">
                    {preferences.interests.join(', ')}
                  </span>
                </div>
              )}

              {preferences.language && preferences.language !== 'en' && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Language</span>
                  <span className="text-slate-200 uppercase">{preferences.language}</span>
                </div>
              )}

              {typeof onlineCount === 'number' && onlineCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-slate-400">
                  <span>Live Online</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {onlineCount === 1 ? '1 member (You)' : `${onlineCount} members`}
                  </span>
                </div>
              )}
            </div>

            {/* Cancel Search Button */}
            <div className="flex items-center justify-center gap-3">
              <button
                id="cancel-matchmaking-btn"
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Cancel Search</span>
              </button>
            </div>
          </>
        ) : (
          /* 15-SECOND TIMEOUT STATE */
          <div className="py-2 animate-in fade-in duration-300" id="matchmaking-timeout-view">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2" id="no-match-available-title">
              No match available right now
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mb-8 max-w-md mx-auto leading-relaxed">
              We searched for 15 seconds, but couldn't find an available match right now. Members join continuously throughout the day.
            </p>

            {/* Three required action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                id="matchmaking-try-again-btn"
                onClick={handleRetryClick}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                id="matchmaking-change-pref-btn"
                onClick={handlePreferencesClick}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Change Preferences</span>
              </button>

              <button
                id="matchmaking-back-home-btn"
                onClick={handleHomeClick}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs sm:text-sm font-medium border border-slate-800 flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Back Home</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
