export type ChatMode = 'text' | 'video';

export interface UserPreferences {
  interests: string[];
  language?: string;
  country?: string;
}

export interface AnonymousSession {
  id: string;
  sessionToken: string;
  ageVerified: boolean;
  ageVerifiedAt?: string;
  mode?: ChatMode;
  preferences: UserPreferences;
  createdAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  banned: boolean;
  banReason?: string;
}

export interface MatchSession {
  id: string;
  userA: string;
  userB: string;
  mode: ChatMode;
  startedAt: string;
  endedAt?: string;
  endReason?: 'user_next' | 'user_leave' | 'user_disconnect' | 'user_block' | 'user_report' | 'admin_disconnect';
  commonInterests: string[];
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string; // 'me' or 'stranger' or session id
  text: string;
  timestamp: string;
  system?: boolean;
}

export type ReportCategory =
  | 'harassment'
  | 'sexual_content'
  | 'nudity'
  | 'hate_speech'
  | 'spam'
  | 'scam'
  | 'threatening_behavior'
  | 'underage_concern'
  | 'other';

export interface UserReport {
  id: string;
  reporterSession: string;
  reportedSession: string;
  matchId?: string;
  category: ReportCategory;
  description: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  moderationResult?: string;
}

export interface UserBlock {
  id: string;
  blockerSession: string;
  blockedSession: string;
  createdAt: string;
}

export interface UserBan {
  id: string;
  sessionToken: string;
  reason: string;
  bannedAt: string;
  expiresAt?: string;
  bannedBy: string;
}

export interface ModerationEvent {
  id: string;
  sessionId: string;
  type: 'rate_limit' | 'spam' | 'profanity' | 'suspicious_activity';
  details: string;
  timestamp: string;
  severity: 'warning' | 'flagged' | 'blocked';
}

export interface PlatformStats {
  onlineUsers: number;
  activeTextChats: number;
  activeVideoChats: number;
  matchesToday: number;
  reportsToday: number;
  blocksToday: number;
  bansToday?: number;
  averageSessionSeconds: number;
  queueStats?: {
    total: number;
    text: number;
    video: number;
  };
}
