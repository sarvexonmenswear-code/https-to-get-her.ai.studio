import { io, Socket } from 'socket.io-client';
import { ChatMode, UserPreferences } from '../types';

export function getTabSessionToken(): string {
  let storedToken = sessionStorage.getItem('to_get_her_tab_session_token');
  if (!storedToken) {
    storedToken = 'tok_tab_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem('to_get_her_tab_session_token', storedToken);
  }
  return storedToken;
}

export function resetTabSessionToken(): string {
  const newToken = 'tok_tab_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
  sessionStorage.setItem('to_get_her_tab_session_token', newToken);
  return newToken;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string = '';
  private activeMatchId: string | null = null;
  private isSearching: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.handleTabClose());
      window.addEventListener('pagehide', () => this.handleTabClose());
    }
  }

  public setActiveMatch(matchId: string | null): void {
    this.activeMatchId = matchId;
    if (matchId) {
      this.isSearching = false;
    }
  }

  public setSearching(searching: boolean): void {
    this.isSearching = searching;
  }

  public handleTabClose(): void {
    if (this.socket && this.socket.connected) {
      // Prompt explicitly requests: emit 'match:ended' when a user refreshes or closes the browser tab
      this.socket.emit('match:ended', {
        reason: 'user_disconnect',
        matchId: this.activeMatchId,
        message: 'Participant disconnected',
      });
      this.socket.emit('match:end', {
        reason: 'user_disconnect',
        matchId: this.activeMatchId,
        message: 'Participant disconnected',
      });
      if (this.isSearching) {
        this.socket.emit('match:cancel');
      }
    }

    // Use sendBeacon as immediate reliable transport for unloading tabs
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const payload = JSON.stringify({
        token: this.getToken(),
        matchId: this.activeMatchId,
        reason: 'user_disconnect',
        message: 'Participant disconnected',
      });
      try {
        navigator.sendBeacon('/api/match/ended', new Blob([payload], { type: 'application/json' }));
      } catch (e) {
        // Non-blocking
      }
    }

    this.activeMatchId = null;
    this.isSearching = false;
  }

  public connect(customToken?: string): Socket {
    // Each tab gets its own unique session token stored in sessionStorage
    const storedToken = customToken || getTabSessionToken();

    if (customToken && customToken !== this.token) {
      this.token = customToken;
      sessionStorage.setItem('to_get_her_tab_session_token', customToken);
      if (this.socket && this.socket.connected) {
        const isDeviceAgeVerified = localStorage.getItem('to_get_her_age_verified') === 'true';
        this.socket.emit('session:init', { 
          token: this.token, 
          autoVerifyIfConfirmed: isDeviceAgeVerified 
        });
        return this.socket;
      }
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.token = storedToken;

    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      const isDeviceAgeVerified = localStorage.getItem('to_get_her_age_verified') === 'true';
      this.socket?.emit('session:init', { 
        token: this.token,
        autoVerifyIfConfirmed: isDeviceAgeVerified,
      });
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public resetSession(): string {
    const newToken = resetTabSessionToken();
    this.token = newToken;
    if (this.socket && this.socket.connected) {
      const isDeviceAgeVerified = localStorage.getItem('to_get_her_age_verified') === 'true';
      this.socket.emit('session:init', { 
        token: newToken, 
        autoVerifyIfConfirmed: isDeviceAgeVerified 
      });
    }
    return newToken;
  }

  public getSocket(): Socket | null {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public getToken(): string {
    return this.token || getTabSessionToken();
  }

  public startMatchmaking(mode: ChatMode, preferences: UserPreferences) {
    this.isSearching = true;
    const token = this.getToken();
    this.socket?.emit('match:find', {
      token,
      mode,
      interests: preferences.interests,
      language: preferences.language,
      country: preferences.country,
    });
  }

  public findMatch(mode: ChatMode, interests: string[], language?: string, country?: string) {
    this.isSearching = true;
    const token = this.getToken();
    this.socket?.emit('match:find', {
      token,
      mode,
      interests,
      language,
      country,
    });
  }

  public cancelMatchmaking() {
    this.isSearching = false;
    this.socket?.emit('match:cancel');
  }

  public cancelMatch() {
    this.isSearching = false;
    this.socket?.emit('match:cancel');
  }

  public nextStranger() {
    this.isSearching = true;
    this.activeMatchId = null;
    this.socket?.emit('match:next');
  }

  public nextMatch() {
    this.isSearching = true;
    this.activeMatchId = null;
    this.socket?.emit('match:next');
  }

  public endChat(matchId?: string) {
    const targetMatchId = matchId || this.activeMatchId;
    this.socket?.emit('match:ended', {
      matchId: targetMatchId,
      reason: 'user_leave',
      message: 'Participant disconnected',
    });
    this.socket?.emit('match:end', {
      matchId: targetMatchId,
      reason: 'user_leave',
      message: 'Participant disconnected',
    });
    this.activeMatchId = null;
    this.isSearching = false;
  }

  public sendMessage(text: string) {
    this.socket?.emit('chat:message', { text });
  }

  public sendTyping(isTyping: boolean) {
    this.socket?.emit('chat:typing', { isTyping });
  }

  public setTyping(isTyping: boolean) {
    this.socket?.emit('chat:typing', { isTyping });
  }

  public reportStranger(category: string, description: string, disconnect = true) {
    this.socket?.emit('user:report', { category, description, disconnect });
  }

  public reportUser(category: string, description: string, disconnect = true) {
    this.socket?.emit('user:report', { category, description, disconnect });
  }

  public blockStranger() {
    this.socket?.emit('user:block');
  }

  public blockUser() {
    this.socket?.emit('user:block');
  }

  public sendWebRTCOffer(offer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc:offer', { offer });
  }

  public sendWebRTCAnswer(answer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc:answer', { answer });
  }

  public sendICECandidate(candidate: RTCIceCandidateInit) {
    this.socket?.emit('webrtc:ice_candidate', { candidate });
  }

  public sendMediaState(audioMuted: boolean, videoDisabled: boolean) {
    this.socket?.emit('webrtc:media_state', { audioMuted, videoDisabled });
  }
}

export const socketService = new SocketService();
