import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { AgeGateModal } from './components/AgeGateModal';
import { StartChatView } from './components/StartChatView';
import { MatchmakingView } from './components/MatchmakingView';
import { TextChatView } from './components/TextChatView';
import { VideoChatView } from './components/VideoChatView';
import { ReportModal } from './components/ReportModal';
import { BlockModal } from './components/BlockModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SafetyView } from './components/SafetyView';
import { FAQView } from './components/FAQView';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { Footer } from './components/Footer';
import { DebugPanel } from './components/DebugPanel';
import { socketService, getTabSessionToken } from './services/socket';
import {
  ChatMode,
  UserPreferences,
  ChatMessage,
  ReportCategory,
  PlatformStats,
} from './types';

type AppView =
  | 'landing'
  | 'start'
  | 'matching'
  | 'text_chat'
  | 'video_chat'
  | 'safety'
  | 'faq';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('text');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: [],
    language: 'en',
    country: 'ANY',
  });

  // Session & Verification state
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return getTabSessionToken();
  });
  const [ageVerified, setAgeVerified] = useState<boolean>(() => {
    return localStorage.getItem('to_get_her_age_verified') === 'true';
  });
  const [showAgeGateModal, setShowAgeGateModal] = useState<boolean>(() => {
    return localStorage.getItem('to_get_her_age_verified') !== 'true';
  });
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // Active Chat Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [strangerName, setStrangerName] = useState<string>('Anonymous Stranger');
  const [commonInterests, setCommonInterests] = useState<string[]>([]);
  const [isInitiator, setIsInitiator] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [strangerDisconnected, setStrangerDisconnected] = useState(false);
  const [strangerDisconnectedReason, setStrangerDisconnectedReason] = useState<string>('');
  const [chatEnded, setChatEnded] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  // Stats
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    onlineUsers: 0,
    activeTextChats: 0,
    activeVideoChats: 0,
    matchesToday: 0,
    reportsToday: 0,
    blocksToday: 0,
    averageSessionSeconds: 0,
  });

  // 1. Initialize anonymous session token and socket connection
  useEffect(() => {
    let currentToken = getTabSessionToken();
    const isDeviceVerified = localStorage.getItem('to_get_her_age_verified') === 'true';

    async function initSession() {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: currentToken || undefined,
            autoVerifyIfConfirmed: isDeviceVerified,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const validToken = data.sessionToken || data.token;
          if (validToken) {
            currentToken = validToken;
            setSessionToken(validToken);
            sessionStorage.setItem('to_get_her_tab_session_token', validToken);
          }

          // Authoritative server-side verification state
          if (data.ageVerified || isDeviceVerified) {
            setAgeVerified(true);
            localStorage.setItem('to_get_her_age_verified', 'true');
            setShowAgeGateModal(false);
          } else {
            setAgeVerified(false);
            localStorage.removeItem('to_get_her_age_verified');
            setShowAgeGateModal(true);
          }
        }
      } catch (err) {
        console.error('Failed to obtain/validate session with server:', err);
      }

      // Initial stats fetch
      fetch('/api/stats')
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          if (s) setPlatformStats(s);
        })
        .catch(() => {});

      // Connect Socket.IO
      const socket = socketService.connect(currentToken || undefined);

      socket.on('connect', () => {
        setConnectionStatus('connected');
      });

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
      });

      socket.io.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
      });

      socket.on('session:ready', (data: { sessionId: string; ageVerified: boolean; banned?: boolean }) => {
        setActiveSessionId(data.sessionId);
        if (data.ageVerified) {
          setAgeVerified(true);
          localStorage.setItem('to_get_her_age_verified', 'true');
          setShowAgeGateModal(false);
        }
      });

      // Handle socket events
      socket.on('stats:update', (newStats: PlatformStats) => {
        if (newStats) setPlatformStats(newStats);
      });
      socket.on('stats:updated', (newStats: PlatformStats) => {
        if (newStats) setPlatformStats(newStats);
      });

      socket.on('error:notice', (data: { code: string; message: string }) => {
        if (data?.code === 'AGE_VERIFICATION_REQUIRED') {
          setAgeVerified(false);
          setShowAgeGateModal(true);
        }
      });

      socket.on('match:found', (data: {
        matchId?: string;
        sessionId: string;
        peerSessionId?: string;
        peerAnonymousName?: string;
        mode: ChatMode;
        commonInterests: string[];
        isInitiator: boolean;
      }) => {
        const matchId = data.matchId || data.sessionId;
        setActiveSessionId(matchId);
        socketService.setActiveMatch(matchId);
        setStrangerName(data.peerAnonymousName || 'Anonymous Stranger');
        setCommonInterests(data.commonInterests || []);
        setIsInitiator(data.isInitiator);
        setStrangerDisconnected(false);
        setChatEnded(false);
        setStrangerDisconnectedReason('');
        setMessages([]);
        setWarningMessage(null);

        if (data.mode === 'video') {
          setCurrentView('video_chat');
        } else {
          setCurrentView('text_chat');
        }
      });

      socket.on('match:ended', (data: { matchId: string; reason: string; byUser: boolean; message?: string }) => {
        setChatEnded(true);
        socketService.setActiveMatch(null);
        socketService.setSearching(false);
        setIsStrangerTyping(false);
        if (!data.byUser) {
          setStrangerDisconnected(true);
          setStrangerDisconnectedReason(data.message || 'Participant disconnected');
        } else {
          setStrangerDisconnectedReason('You ended the conversation.');
        }
      });

      socket.on('match:stranger_disconnected', (data?: { reason?: string; message?: string }) => {
        setStrangerDisconnected(true);
        setChatEnded(true);
        socketService.setActiveMatch(null);
        socketService.setSearching(false);
        setIsStrangerTyping(false);
        setStrangerDisconnectedReason(data?.message || 'Participant disconnected');
      });

      socket.on('match:cancelled', () => {
        socketService.setActiveMatch(null);
        socketService.setSearching(false);
      });

      socket.on('chat:incoming', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('chat:typing', (data: { isTyping: boolean }) => {
        setIsStrangerTyping(data.isTyping);
      });

      socket.on('chat:stranger_typing', (data: { isTyping: boolean }) => {
        setIsStrangerTyping(data.isTyping);
      });

      socket.on('chat:warning', (data: { message: string }) => {
        setWarningMessage(data.message);
        setTimeout(() => setWarningMessage(null), 5000);
      });

      socket.on('match:error', (data: { message: string }) => {
        setWarningMessage(data.message || 'An error occurred during matchmaking.');
      });
    }

    initSession();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Age Gate Confirmation
  const handleConfirmAge = (verifiedToken?: string) => {
    const tokenToUse = verifiedToken || sessionToken || getTabSessionToken();
    if (tokenToUse) {
      setSessionToken(tokenToUse);
      sessionStorage.setItem('to_get_her_tab_session_token', tokenToUse);
      const socket = socketService.connect(tokenToUse);
      socket.emit('session:init', { token: tokenToUse, autoVerifyIfConfirmed: true });
    }
    setAgeVerified(true);
    localStorage.setItem('to_get_her_age_verified', 'true');
    setShowAgeGateModal(false);
  };

  // Launch Chat from Landing or Header
  const handleInitiateChat = (mode: ChatMode = 'text') => {
    setSelectedMode(mode);
    if (!ageVerified) {
      setShowAgeGateModal(true);
    } else {
      setCurrentView('start');
    }
  };

  // Start Matching
  const handleStartMatching = (mode: ChatMode, preferences: UserPreferences) => {
    setSelectedMode(mode);
    setUserPreferences(preferences);
    setCurrentView('matching');
    socketService.startMatchmaking(mode, preferences);
  };

  // Cancel Matching
  const handleCancelMatching = () => {
    socketService.cancelMatchmaking();
    setCurrentView('start');
  };

  // Skip to Next Stranger
  const handleNextStranger = () => {
    setStrangerDisconnected(false);
    setChatEnded(false);
    setStrangerDisconnectedReason('');
    setMessages([]);
    setCurrentView('matching');
    socketService.nextStranger();
  };

  // End Current Chat
  const handleEndChat = () => {
    socketService.endChat();
    setChatEnded(true);
    setStrangerDisconnectedReason('You have ended the conversation.');
  };

  // Send Message
  const handleSendMessage = (text: string) => {
    socketService.sendMessage(text);
  };

  // Typing Indicator
  const handleTyping = (isTyping: boolean) => {
    socketService.sendTyping(isTyping);
  };

  // Report Stranger
  const handleReportSubmit = (category: ReportCategory, description: string, disconnect: boolean) => {
    socketService.reportStranger(category, description, disconnect);
    if (disconnect) {
      handleNextStranger();
    }
  };

  // Block Stranger
  const handleBlockConfirm = () => {
    socketService.blockStranger();
    setBlockModalOpen(false);
    setChatEnded(true);
    setStrangerDisconnected(true);
    setStrangerDisconnectedReason('User has been blocked. You will not be matched with them again.');
  };

  const handleOpenLegal = (type: LegalDocType) => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const isChatting = currentView === 'text_chat' || currentView === 'video_chat' || currentView === 'matching';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white" id="to-get-her-app">
      {/* Top Navigation Header */}
      {!isChatting && (
        <Header
          currentView={currentView}
          stats={platformStats}
          onlineCount={platformStats?.onlineUsers ?? 0}
          onStartChat={() => handleInitiateChat('text')}
          onOpenAdmin={() => setShowAdminDashboard(true)}
          onNavigate={(v) => setCurrentView(v as AppView)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {/* VIEW: LANDING */}
        {currentView === 'landing' && (
          <>
            <LandingHero
              stats={platformStats}
              onlineCount={platformStats?.onlineUsers ?? 0}
              onStartTextChat={() => handleInitiateChat('text')}
              onStartVideoChat={() => handleInitiateChat('video')}
              onHowItWorks={() => {
                const el = document.getElementById('how-it-works-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onSafety={() => setCurrentView('safety')}
            />
            {/* Embedded FAQ preview on landing for rich context */}
            <div className="border-t border-slate-900 bg-slate-950/60 py-16">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h3>
                <p className="text-slate-400 text-sm mb-8">
                  Everything you need to know about our anonymous connection engine.
                </p>
                <div className="text-center">
                  <button
                    onClick={() => setCurrentView('faq')}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
                  >
                    View All 12 FAQs
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW: START CHAT PREFERENCES */}
        {currentView === 'start' && (
          <StartChatView
            initialMode={selectedMode}
            onStartMatching={handleStartMatching}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {/* VIEW: MATCHMAKING SEARCH */}
        {currentView === 'matching' && (
          <MatchmakingView
            mode={selectedMode}
            preferences={userPreferences}
            onCancel={handleCancelMatching}
            onRetry={() => handleStartMatching(selectedMode, userPreferences)}
            onChangePreferences={() => setCurrentView('start')}
            onBackHome={() => setCurrentView('landing')}
            onlineCount={platformStats?.onlineUsers}
          />
        )}

        {/* VIEW: TEXT CHAT */}
        {currentView === 'text_chat' && (
          <TextChatView
            messages={messages}
            commonInterests={commonInterests}
            strangerName={strangerName}
            isStrangerTyping={isStrangerTyping}
            strangerDisconnected={strangerDisconnected}
            strangerDisconnectedReason={strangerDisconnectedReason}
            chatEnded={chatEnded}
            connectionStatus={connectionStatus}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onNext={handleNextStranger}
            onEndChat={handleEndChat}
            onBackHome={() => {
              setActiveSessionId(null);
              setMessages([]);
              setChatEnded(false);
              setStrangerDisconnected(false);
              setCurrentView('landing');
            }}
            onOpenReport={() => setReportModalOpen(true)}
            onOpenBlock={() => setBlockModalOpen(true)}
            warningMessage={warningMessage}
          />
        )}

        {/* VIEW: VIDEO CHAT */}
        {currentView === 'video_chat' && (
          <VideoChatView
            isInitiator={isInitiator}
            commonInterests={commonInterests}
            strangerDisconnected={strangerDisconnected}
            strangerDisconnectedReason={strangerDisconnectedReason}
            onNext={handleNextStranger}
            onEndCall={handleEndChat}
            onOpenReport={() => setReportModalOpen(true)}
            onOpenBlock={() => setBlockModalOpen(true)}
            onBackHome={() => {
              setActiveSessionId(null);
              setChatEnded(false);
              setStrangerDisconnected(false);
              setCurrentView('landing');
            }}
          />
        )}

        {/* VIEW: SAFETY CENTER */}
        {currentView === 'safety' && (
          <SafetyView
            onBack={() => setCurrentView('landing')}
            onStartChat={() => handleInitiateChat('text')}
          />
        )}

        {/* VIEW: FAQ */}
        {currentView === 'faq' && (
          <FAQView
            onBack={() => setCurrentView('landing')}
            onStartChat={() => handleInitiateChat('text')}
          />
        )}
      </main>

      {/* Global Footer (shown on non-chat views) */}
      {!isChatting && (
        <Footer
          onNavigate={(v) => {
            if (v === 'how-it-works') {
              setCurrentView('landing');
              setTimeout(() => {
                document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else {
              setCurrentView(v as AppView);
            }
          }}
          onOpenLegal={handleOpenLegal}
          onStartChat={() => handleInitiateChat('text')}
        />
      )}

      {/* MODALS */}
      {/* Age Gate Modal */}
      <AgeGateModal
        isOpen={showAgeGateModal}
        sessionToken={sessionToken}
        onVerified={handleConfirmAge}
        onConfirm={handleConfirmAge}
        onReject={() => {
          window.location.href = 'https://www.google.com';
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Block Modal */}
      <BlockModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={handleBlockConfirm}
      />

      {/* Legal & Guidelines Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        initialType={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Protected Admin & Moderation Console */}
      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* Development Diagnostics & Multi-Tab Testing Panel */}
      <DebugPanel
        sessionId={sessionToken || activeSessionId || ''}
        matchmakingStatus={
          currentView === 'matching'
            ? 'searching'
            : currentView === 'text_chat' || currentView === 'video_chat'
            ? 'matched'
            : chatEnded || strangerDisconnected
            ? 'ended'
            : 'idle'
        }
        queueCount={platformStats.queueStats || { total: platformStats.onlineUsers || 0, text: 0, video: 0 }}
        mode={selectedMode}
        matchId={activeSessionId}
        connectionState={connectionStatus}
        onResetSessionId={() => {
          const newToken = socketService.resetSession();
          setSessionToken(newToken);
          setActiveSessionId(null);
          setCurrentView('landing');
        }}
      />
    </div>
  );
}
