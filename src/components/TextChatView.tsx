import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  SkipForward,
  Flag,
  Ban,
  PhoneOff,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCheck,
  Check,
  RotateCcw,
  Home,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ChatMessage } from '../types';

interface TextChatViewProps {
  messages: ChatMessage[];
  commonInterests: string[];
  strangerName?: string;
  isStrangerTyping: boolean;
  strangerDisconnected: boolean;
  strangerDisconnectedReason?: string;
  chatEnded?: boolean;
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onNext: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onEndChat: () => void;
  onBackHome?: () => void;
  warningMessage?: string | null;
}

export const TextChatView: React.FC<TextChatViewProps> = ({
  messages,
  commonInterests,
  strangerName = 'Anonymous Stranger',
  isStrangerTyping,
  strangerDisconnected,
  strangerDisconnectedReason,
  chatEnded = false,
  connectionStatus = 'connected',
  onSendMessage,
  onTyping,
  onNext,
  onOpenReport,
  onOpenBlock,
  onEndChat,
  onBackHome,
  warningMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showConnectedNotice, setShowConnectedNotice] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStrangerTyping]);

  // Auto-focus input when connected
  useEffect(() => {
    if (!strangerDisconnected && !chatEnded) {
      inputRef.current?.focus();
    }
  }, [strangerDisconnected, chatEnded]);

  // Hide initial connected notice after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConnectedNotice(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Typing debounce
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || strangerDisconnected || chatEnded) return;

    onSendMessage(inputText.trim());
    setInputText('');
    onTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmEnd = () => {
    setShowEndConfirmModal(false);
    onEndChat();
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isConversationOver = strangerDisconnected || chatEnded;

  return (
    <div
      className="max-w-4xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-[calc(100dvh-4.5rem)] max-h-[860px]"
      id="text-chat-layout"
    >
      {/* End Chat Confirmation Modal */}
      {showEndConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          id="end-chat-confirm-modal"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">End this conversation?</h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Are you sure you want to end this chat? You will be disconnected and can find someone new anytime.
            </p>
            <div className="flex gap-3">
              <button
                id="cancel-end-chat-btn"
                onClick={() => setShowEndConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Keep Chatting
              </button>
              <button
                id="confirm-end-chat-btn"
                onClick={handleConfirmEnd}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-colors"
              >
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Card */}
      <div className="flex-1 flex flex-col rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between"
          id="chat-header"
        >
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showTagline={false} />
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white" id="participant-display-name">
                  {strangerName}
                </span>

                {/* Connection Status Badge */}
                {!isConversationOver ? (
                  connectionStatus === 'connected' ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium" id="chat-connection-status">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium" id="chat-connection-status">
                      <WifiOff className="w-3 h-3 animate-spin" />
                      Reconnecting...
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium" id="chat-connection-status">
                    Disconnected
                  </span>
                )}
              </div>

              {/* Shared Interests or Anonymous Notice */}
              {commonInterests.length > 0 ? (
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5" id="chat-common-interests">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[240px] sm:max-w-xs">
                    Shared: {commonInterests.join(', ')}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>100% Anonymous & Encrypted</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Header actions */}
          <div className="flex items-center gap-1.5">
            <button
              id="chat-report-btn"
              onClick={onOpenReport}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Report Stranger"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              id="chat-block-btn"
              onClick={onOpenBlock}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Block Stranger"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        {warningMessage && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* You're Connected Toast Notification */}
        {showConnectedNotice && !isConversationOver && (
          <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">You're connected!</span>
              <span className="text-emerald-400/80 hidden sm:inline">Say hi to start the conversation.</span>
            </div>
            <button
              onClick={() => setShowConnectedNotice(false)}
              className="text-emerald-400/60 hover:text-emerald-300 text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3" id="chat-messages-area">
          
          {/* Welcome Notice */}
          <div className="text-center my-2">
            <div className="inline-block p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 max-w-md leading-relaxed">
              <span className="font-semibold text-slate-200">You're connected with an anonymous adult.</span>
              <br />
              Be friendly and respectful. Never share personal passwords, contact details, or exact home location.
            </div>
          </div>

          {/* Empty Conversation State */}
          {messages.length === 0 && !isConversationOver && (
            <div className="py-8 text-center" id="chat-empty-state">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-slate-300 text-sm font-semibold mb-1">
                Say hello to break the ice!
              </p>
              <p className="text-slate-400 text-xs">
                Your conversation is completely anonymous and private.
              </p>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-rose-600/10'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1 mt-1 font-mono">
                  <span>{formatTime(msg.timestamp)}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isStrangerTyping && !isConversationOver && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-2 py-1 animate-in fade-in" id="stranger-typing-indicator">
              <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span className="ml-1 text-[11px] text-slate-300">{strangerName} is typing...</span>
              </div>
            </div>
          )}

          {/* CHAT ENDED / STRANGER DISCONNECTED STATE */}
          {isConversationOver && (
            <div
              className="my-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center max-w-sm mx-auto shadow-xl animate-in fade-in"
              id="chat-ended-card"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-300 flex items-center justify-center mx-auto mb-3 border border-slate-700">
                <PhoneOff className="w-6 h-6 text-rose-400" />
              </div>
              <div className="text-base font-bold text-white mb-1">
                {strangerDisconnected ? 'Participant disconnected' : 'Chat ended'}
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {strangerDisconnectedReason ||
                  (strangerDisconnected
                    ? 'Participant disconnected'
                    : 'The conversation has concluded.')}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  id="chat-find-someone-new-btn"
                  onClick={onNext}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Find Someone New</span>
                </button>

                {onBackHome && (
                  <button
                    id="chat-back-home-btn"
                    onClick={onBackHome}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Back Home</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800">
          <form onSubmit={handleSend} className="flex items-center gap-2" id="chat-input-form">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                id="chat-message-input"
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isConversationOver}
                placeholder={
                  isConversationOver
                    ? 'Chat has ended. Click Find Someone New above.'
                    : 'Type a message... (Press Enter to send)'
                }
                maxLength={1000}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 pr-16 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                {inputText.length}/1000
              </span>
            </div>

            <button
              type="submit"
              id="chat-send-btn"
              disabled={!inputText.trim() || isConversationOver}
              className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white disabled:opacity-40 transition-colors shadow-md shadow-rose-600/20 cursor-pointer active:scale-95 shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Bottom Controls Bar */}
        <div
          className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs"
          id="chat-bottom-controls"
        >
          <div className="flex items-center gap-2">
            <button
              id="chat-next-btn"
              onClick={onNext}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4 text-amber-400" />
              <span>Next</span>
            </button>

            {!isConversationOver && (
              <button
                id="chat-end-btn"
                onClick={() => setShowEndConfirmModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-medium flex items-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">End Chat</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="chat-report-bottom-btn"
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>

            <button
              id="chat-block-bottom-btn"
              onClick={onOpenBlock}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Block</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
