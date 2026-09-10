import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  SkipForward,
  Flag,
  Ban,
  PhoneOff,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Send,
  X,
  Camera,
} from 'lucide-react';
import { socketService } from '../services/socket';
import { ChatMessage } from '../types';

interface VideoChatViewProps {
  isInitiator: boolean;
  commonInterests: string[];
  strangerDisconnected: boolean;
  strangerDisconnectedReason?: string;
  onNext: () => void;
  onEndCall: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onBackHome?: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const VideoChatView: React.FC<VideoChatViewProps> = ({
  isInitiator,
  commonInterests,
  strangerDisconnected,
  strangerDisconnectedReason,
  onNext,
  onEndCall,
  onOpenReport,
  onOpenBlock,
  onBackHome,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Immediate WebRTC cleanup when peer disconnects to avoid dangling resources
  useEffect(() => {
    if (strangerDisconnected) {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (e) {
          // ignore
        }
        pcRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [strangerDisconnected]);

  const [isCallEnded, setIsCallEnded] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [strangerMediaState, setStrangerMediaState] = useState<{ audioMuted: boolean; videoDisabled: boolean }>({
    audioMuted: false,
    videoDisabled: false,
  });

  // Built-in overlay text messages for video chat
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // 1. Initialize Local Media Stream and PeerConnection
  useEffect(() => {
    let isMounted = true;

    async function initMediaAndWebRTC() {
      try {
        setConnectionState('requesting_permissions');
        // Request user media with graceful fallback
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: true,
          });
        } catch (mediaErr: any) {
          if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
            throw mediaErr;
          }
          // Try fallback without audio constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } catch {
            // Virtual/headless environment without physical camera: simulated visual stream
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            let frame = 0;
            setInterval(() => {
              if (!ctx) return;
              frame++;
              ctx.fillStyle = '#090d16';
              ctx.fillRect(0, 0, 640, 480);
              const grad = ctx.createRadialGradient(320, 240, 20, 320, 240, 200);
              grad.addColorStop(0, '#e11d48');
              grad.addColorStop(1, '#4f46e5');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(320 + Math.sin(frame * 0.05) * 40, 240 + Math.cos(frame * 0.05) * 20, 70, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 18px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('TO-GET-HER Live Feed', 320, 245);
            }, 60);
            stream = canvas.captureStream(30);
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize PeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionState('connected');
          }
        };

        // Handle local ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketService.sendICECandidate(event.candidate.toJSON());
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState) {
            setConnectionState(pc.connectionState);
          }
        };

        // If this client is initiator, create and send offer
        if (isInitiator) {
          setConnectionState('calling_stranger');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.sendWebRTCOffer(offer);
        }
      } catch (err: any) {
        console.error('Media or WebRTC error:', err);
        if (isMounted) {
          setPermissionDenied(true);
          setPermissionErrorMsg(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Camera or microphone access was denied by your browser. Please allow permissions in your address bar to continue video chat.'
              : 'Could not access camera or microphone. Please check that another application is not using your camera.'
          );
        }
      }
    }

    initMediaAndWebRTC();

    // 2. Set up Socket.IO listeners for WebRTC signaling
    const socket = socketService.getSocket();
    if (socket) {
      // Received Offer
      const handleOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
        try {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          while (iceCandidateQueueRef.current.length > 0) {
            const queued = iceCandidateQueueRef.current.shift();
            if (queued) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(queued));
            }
          }
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socketService.sendWebRTCAnswer(answer);
        } catch (e) {
          console.error('Error handling WebRTC offer:', e);
        }
      };

      // Received Answer
      const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
        try {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          while (iceCandidateQueueRef.current.length > 0) {
            const queued = iceCandidateQueueRef.current.shift();
            if (queued) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(queued));
            }
          }
        } catch (e) {
          console.error('Error handling WebRTC answer:', e);
        }
      };

      // Received ICE candidate
      const handleCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
        try {
          if (!pcRef.current) return;
          if (!pcRef.current.remoteDescription || !pcRef.current.remoteDescription.type) {
            iceCandidateQueueRef.current.push(data.candidate);
            return;
          }
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      };

      // Received stranger media mute/camera states
      const handleStrangerMedia = (data: { audioMuted: boolean; videoDisabled: boolean }) => {
        setStrangerMediaState(data);
      };

      // Video chat text messages
      const handleIncomingMessage = (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      };

      socket.on('webrtc:offer', handleOffer);
      socket.on('webrtc:answer', handleAnswer);
      socket.on('webrtc:ice_candidate', handleCandidate);
      socket.on('webrtc:stranger_media_state', handleStrangerMedia);
      socket.on('chat:incoming', handleIncomingMessage);

      return () => {
        isMounted = false;
        socket.off('webrtc:offer', handleOffer);
        socket.off('webrtc:answer', handleAnswer);
        socket.off('webrtc:ice_candidate', handleCandidate);
        socket.off('webrtc:stranger_media_state', handleStrangerMedia);
        socket.off('chat:incoming', handleIncomingMessage);

        // Stop all local tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        // Close peer connection
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
      };
    }
  }, [isInitiator]);

  // Handle Mute/Unmute Mic
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMicMuted(muted);
        socketService.sendMediaState(muted, isVideoDisabled);
      }
    }
  };

  // Handle Video On/Off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const disabled = !videoTrack.enabled;
        setIsVideoDisabled(disabled);
        socketService.sendMediaState(isMicMuted, disabled);
      }
    }
  };

  const handleSendOverlayMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || strangerDisconnected) return;
    socketService.sendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 h-[calc(100vh-5rem)] max-h-[850px] flex flex-col" id="video-chat-layout">
      {/* Video Container Card */}
      <div className="flex-1 relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* Main Stranger Video Stage */}
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden" id="remote-video-container">
          {/* Remote Video element */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            id="remote-video-element"
          />

          {/* If stranger video is muted or loading */}
          {strangerMediaState.videoDisabled && !strangerDisconnected && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <VideoOff className="w-8 h-8" />
              </div>
              <div className="text-white font-bold text-base">Stranger's camera is turned off</div>
              <div className="text-slate-400 text-xs mt-1">Audio is still connected</div>
            </div>
          )}

          {/* Connection Status Overlay (when waiting or negotiating) */}
          {connectionState !== 'connected' && !strangerDisconnected && !permissionDenied && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-12 h-12 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-white mb-1">Connecting Video Stream...</h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Establishing secure peer-to-peer WebRTC connection with your matched stranger.
              </p>
            </div>
          )}

          {/* Stranger Disconnected or Call Ended Overlay */}
          {(strangerDisconnected || isCallEnded) && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-3">
                <PhoneOff className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {strangerDisconnected ? 'Participant disconnected' : 'Call Ended'}
              </h3>
              <p className="text-slate-300 text-xs mb-6 max-w-xs">
                {strangerDisconnected
                  ? (strangerDisconnectedReason || 'Participant disconnected. Connect with someone new or return home.')
                  : 'You ended this conversation. Connect with another member or return home.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="video-next-after-disconnect-btn"
                  onClick={() => {
                    setIsCallEnded(false);
                    onNext();
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Find New Stranger (Next)
                </button>
                <button
                  id="video-home-after-disconnect-btn"
                  onClick={onBackHome || onEndCall}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Back Home
                </button>
              </div>
            </div>
          )}

          {/* Permission Denied Overlay */}
          {permissionDenied && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20" id="permission-denied-view">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Camera & Microphone Access Required</h3>
              <p className="text-slate-300 text-xs max-w-md mb-6 leading-relaxed">
                {permissionErrorMsg}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Reload & Grant Permissions
                </button>
                <button
                  onClick={onEndCall}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Switch to Text Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Floating Badge Bar */}
        <div className="relative z-20 p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white">Live Video Stranger</span>
            {commonInterests.length > 0 && (
              <span className="text-[11px] text-indigo-300 hidden sm:inline">
                • {commonInterests.slice(0, 2).join(', ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChatOverlay(!showChatOverlay)}
              className="p-2 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-md"
              title="Toggle Text Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenReport}
              className="p-2 rounded-full bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-rose-400 backdrop-blur-md"
              title="Report Stranger"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenBlock}
              className="p-2 rounded-full bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-rose-400 backdrop-blur-md"
              title="Block Stranger"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Self-Preview Video (Picture in Picture) */}
        <div 
          className="absolute bottom-20 right-4 z-20 w-32 sm:w-44 aspect-[4/3] rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden pointer-events-auto"
          id="self-preview-video-container"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
            id="local-video-element"
          />
          {isVideoDisabled && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
              <Camera className="w-5 h-5 mb-1" />
              <span>Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-[9px] font-semibold text-slate-300 bg-slate-950/70 px-1.5 py-0.5 rounded">
            You
          </div>
        </div>

        {/* Text Chat Drawer Overlay (if toggled) */}
        {showChatOverlay && (
          <div className="absolute top-16 left-4 bottom-20 w-72 sm:w-80 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-xl z-25 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-white font-semibold">
              <span>In-Call Chat</span>
              <button onClick={() => setShowChatOverlay(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {messages.length === 0 && (
                <div className="text-slate-500 text-center py-8">
                  Send a text message during your video call.
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl max-w-[85%] ${
                    m.senderId === 'me'
                      ? 'ml-auto bg-rose-600 text-white rounded-br-none'
                      : 'mr-auto bg-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendOverlayMessage} className="p-2 border-t border-slate-800 flex gap-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="p-1.5 bg-rose-600 rounded-xl text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Video Controls Bar */}
        <div 
          className="relative z-20 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-center gap-3 sm:gap-4"
          id="video-controls-bar"
        >
          {/* Mic Toggle */}
          <button
            id="video-toggle-mic-btn"
            onClick={toggleMic}
            className={`p-3.5 rounded-full border transition-all ${
              isMicMuted
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            id="video-toggle-cam-btn"
            onClick={toggleVideo}
            className={`p-3.5 rounded-full border transition-all ${
              isVideoDisabled
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Next Button */}
          <button
            id="video-next-btn"
            onClick={onNext}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            <span>Next</span>
          </button>

          {/* End Call Button */}
          <button
            id="video-end-btn"
            onClick={() => {
              setIsCallEnded(true);
              socketService.endChat();
            }}
            className="p-3.5 rounded-full bg-slate-900/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
            title="End Video Chat"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
