import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface DbAnonymousSession {
  id: string;
  sessionTokenHash: string;
  rawToken: string;
  mode: 'text' | 'video';
  language: string;
  country: string;
  ageVerified: boolean;
  ageVerifiedAt?: string;
  isOnline: boolean;
  socketId?: string;
  ipHash?: string;
  banned: boolean;
  banReason?: string;
  interests: string[];
  createdAt: string;
  lastSeenAt: string;
}

export interface DbMatch {
  id: string;
  userA: string;
  userB: string;
  mode: 'text' | 'video';
  commonInterests: string[];
  startedAt: string;
  endedAt?: string;
  endReason?: string;
  durationSeconds?: number;
}

export interface DbReport {
  id: string;
  reporterSession: string;
  reportedSession: string;
  matchId?: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderationResult?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DbBlock {
  id: string;
  blockerSession: string;
  blockedSession: string;
  createdAt: string;
}

export interface DbBan {
  id: string;
  sessionTokenHash: string;
  rawToken?: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
}

export interface DbModerationEvent {
  id: string;
  sessionId: string;
  eventType: 'rate_limit' | 'spam' | 'profanity' | 'suspicious_activity';
  details: string;
  severity: 'warning' | 'flagged' | 'blocked';
  createdAt: string;
}

class DatabaseStore {
  private sessions = new Map<string, DbAnonymousSession>();
  private matches = new Map<string, DbMatch>();
  private reports = new Map<string, DbReport>();
  private blocks = new Set<string>(); // "blocker:blocked"
  private bans = new Map<string, DbBan>(); // tokenHash -> ban
  private moderationEvents: DbModerationEvent[] = [];
  private dataFilePath = path.join(process.cwd(), 'data', 'db_store.json');

  constructor() {
    this.ensureDataDir();
    this.loadState();
    // Seed standard interests
    this.seedDefaults();
  }

  private ensureDataDir() {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn('Could not create data dir:', e);
      }
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.sessions) {
          for (const s of data.sessions) {
            s.isOnline = false;
            s.socketId = undefined;
            this.sessions.set(s.id, s);
          }
        }
        if (data.matches) {
          for (const m of data.matches) this.matches.set(m.id, m);
        }
        if (data.reports) {
          for (const r of data.reports) this.reports.set(r.id, r);
        }
        if (data.blocks) {
          for (const b of data.blocks) this.blocks.add(b);
        }
        if (data.bans) {
          for (const bn of data.bans) this.bans.set(bn.sessionTokenHash, bn);
        }
        if (data.moderationEvents) {
          this.moderationEvents = data.moderationEvents;
        }
      }
    } catch (e) {
      console.warn('Error loading db_store.json, initializing fresh store:', e);
    }
  }

  public persist() {
    try {
      const payload = {
        sessions: Array.from(this.sessions.values()).slice(-200),
        matches: Array.from(this.matches.values()).slice(-200),
        reports: Array.from(this.reports.values()),
        blocks: Array.from(this.blocks.values()),
        bans: Array.from(this.bans.values()),
        moderationEvents: this.moderationEvents.slice(-200),
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      // Non-blocking in ephemeral environment
    }
  }

  private seedDefaults() {
    // Add sample initial report to demonstrate working admin moderation queue
    if (this.reports.size === 0) {
      const sampleReport: DbReport = {
        id: 'rep_' + crypto.randomBytes(4).toString('hex'),
        reporterSession: 'sess_sample_a',
        reportedSession: 'sess_sample_b',
        category: 'spam',
        description: 'Sent commercial promotional links repeatedly during conversation.',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      };
      this.reports.set(sampleReport.id, sampleReport);
    }
  }

  // Hashing helper
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Session Methods
  public createOrGetSession(token: string, ip?: string): DbAnonymousSession {
    const tokenHash = this.hashToken(token);
    for (const session of this.sessions.values()) {
      if (session.sessionTokenHash === tokenHash) {
        session.lastSeenAt = new Date().toISOString();
        session.isOnline = true;
        const isBanned = this.bans.has(tokenHash);
        session.banned = isBanned;
        if (isBanned) {
          session.banReason = this.bans.get(tokenHash)?.reason;
        }
        return session;
      }
    }

    const id = 'sess_' + crypto.randomBytes(8).toString('hex');
    const isBanned = this.bans.has(tokenHash);
    const newSession: DbAnonymousSession = {
      id,
      sessionTokenHash: tokenHash,
      rawToken: token,
      mode: 'text',
      language: 'en',
      country: 'ANY',
      ageVerified: false,
      isOnline: true,
      banned: isBanned,
      banReason: isBanned ? this.bans.get(tokenHash)?.reason : undefined,
      interests: [],
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    this.sessions.set(id, newSession);
    this.persist();
    return newSession;
  }

  public getSession(id: string): DbAnonymousSession | undefined {
    return this.sessions.get(id);
  }

  public getSessionByToken(token: string): DbAnonymousSession | undefined {
    const hash = this.hashToken(token);
    for (const session of this.sessions.values()) {
      if (session.sessionTokenHash === hash) return session;
    }
    return undefined;
  }

  public updateSession(id: string, updates: Partial<DbAnonymousSession>): DbAnonymousSession | undefined {
    const s = this.sessions.get(id);
    if (!s) return undefined;
    Object.assign(s, updates);
    s.lastSeenAt = new Date().toISOString();
    return s;
  }

  public verifyAge(token: string): boolean {
    const s = this.getSessionByToken(token);
    if (s) {
      s.ageVerified = true;
      s.ageVerifiedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  public setSocketId(sessionId: string, socketId: string | undefined) {
    const s = this.sessions.get(sessionId);
    if (s) {
      s.socketId = socketId;
      s.isOnline = !!socketId;
      s.lastSeenAt = new Date().toISOString();
    }
  }

  // Matches
  public createMatch(userA: string, userB: string, mode: 'text' | 'video', commonInterests: string[]): DbMatch {
    const id = 'match_' + crypto.randomBytes(8).toString('hex');
    const match: DbMatch = {
      id,
      userA,
      userB,
      mode,
      commonInterests,
      startedAt: new Date().toISOString(),
    };
    this.matches.set(id, match);
    this.persist();
    return match;
  }

  public endMatch(matchId: string, reason: string): DbMatch | undefined {
    const match = this.matches.get(matchId);
    if (match && !match.endedAt) {
      match.endedAt = new Date().toISOString();
      match.endReason = reason;
      const startMs = new Date(match.startedAt).getTime();
      const endMs = new Date(match.endedAt).getTime();
      match.durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
      this.persist();
    }
    return match;
  }

  public getActiveMatchForUser(sessionId: string): DbMatch | undefined {
    for (const match of this.matches.values()) {
      if (!match.endedAt && (match.userA === sessionId || match.userB === sessionId)) {
        return match;
      }
    }
    return undefined;
  }

  public getAllMatches(): DbMatch[] {
    return Array.from(this.matches.values());
  }

  // Reports
  public createReport(report: Omit<DbReport, 'id' | 'createdAt' | 'status'>): DbReport {
    const id = 'rep_' + crypto.randomBytes(6).toString('hex');
    const newReport: DbReport = {
      ...report,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.reports.set(id, newReport);

    // If critical (e.g. underage concern), record moderation event
    if (report.category === 'underage_concern') {
      this.addModerationEvent(report.reportedSession, 'suspicious_activity', 'Underage concern report submitted', 'flagged');
    }

    this.persist();
    return newReport;
  }

  public getReports(): DbReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateReportStatus(reportId: string, status: DbReport['status'], moderationResult?: string, reviewer?: string): DbReport | undefined {
    const report = this.reports.get(reportId);
    if (report) {
      report.status = status;
      if (moderationResult) report.moderationResult = moderationResult;
      report.reviewedBy = reviewer || 'admin';
      report.reviewedAt = new Date().toISOString();
      this.persist();
    }
    return report;
  }

  // Blocks
  public addBlock(blockerSession: string, blockedSession: string): DbBlock {
    const pairKey = `${blockerSession}:${blockedSession}`;
    this.blocks.add(pairKey);
    const block: DbBlock = {
      id: 'blk_' + crypto.randomBytes(6).toString('hex'),
      blockerSession,
      blockedSession,
      createdAt: new Date().toISOString(),
    };
    this.persist();
    return block;
  }

  public isBlocked(user1: string, user2: string): boolean {
    return this.blocks.has(`${user1}:${user2}`) || this.blocks.has(`${user2}:${user1}`);
  }

  public getAllBlocks(): { blockerSession: string; blockedSession: string }[] {
    return Array.from(this.blocks.values()).map(pair => {
      const [blockerSession, blockedSession] = pair.split(':');
      return { blockerSession, blockedSession };
    });
  }

  // Bans
  public banSession(tokenHashOrSessionId: string, reason: string, bannedBy = 'admin', expiresAt?: string): DbBan {
    // If sessionId is provided, get the hash
    let hash = tokenHashOrSessionId;
    let rawToken: string | undefined;
    const session = this.sessions.get(tokenHashOrSessionId);
    if (session) {
      hash = session.sessionTokenHash;
      rawToken = session.rawToken;
      session.banned = true;
      session.banReason = reason;
    }

    const ban: DbBan = {
      id: 'ban_' + crypto.randomBytes(6).toString('hex'),
      sessionTokenHash: hash,
      rawToken,
      reason,
      bannedBy,
      bannedAt: new Date().toISOString(),
      expiresAt,
    };
    this.bans.set(hash, ban);
    this.persist();
    return ban;
  }

  public unbanSession(tokenHash: string): boolean {
    const existed = this.bans.delete(tokenHash);
    if (existed) {
      for (const s of this.sessions.values()) {
        if (s.sessionTokenHash === tokenHash) {
          s.banned = false;
          s.banReason = undefined;
        }
      }
      this.persist();
    }
    return existed;
  }

  public isBanned(tokenHash: string): boolean {
    return this.bans.has(tokenHash);
  }

  public getAllBans(): DbBan[] {
    return Array.from(this.bans.values());
  }

  // Moderation events
  public addModerationEvent(sessionId: string, eventType: DbModerationEvent['eventType'], details: string, severity: DbModerationEvent['severity']) {
    const event: DbModerationEvent = {
      id: 'mod_' + crypto.randomBytes(6).toString('hex'),
      sessionId,
      eventType,
      details,
      severity,
      createdAt: new Date().toISOString(),
    };
    this.moderationEvents.push(event);
    if (this.moderationEvents.length > 500) {
      this.moderationEvents = this.moderationEvents.slice(-300);
    }
  }

  public getModerationEvents(): DbModerationEvent[] {
    return [...this.moderationEvents].reverse();
  }

  // Stats
  public getStats() {
    const onlineSessions = Array.from(this.sessions.values()).filter(s => s.isOnline && !s.banned);
    const activeMatches = Array.from(this.matches.values()).filter(m => !m.endedAt);
    const activeTextChats = activeMatches.filter(m => m.mode === 'text').length;
    const activeVideoChats = activeMatches.filter(m => m.mode === 'video').length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const matchesToday = Array.from(this.matches.values()).filter(m => m.startedAt.startsWith(todayStr)).length;
    const reportsToday = Array.from(this.reports.values()).filter(r => r.createdAt.startsWith(todayStr)).length;
    const bansToday = Array.from(this.bans.values()).filter(b => b.bannedAt.startsWith(todayStr)).length;

    const endedMatches = Array.from(this.matches.values()).filter(m => m.durationSeconds !== undefined);
    const avgDuration = endedMatches.length > 0
      ? Math.round(endedMatches.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / endedMatches.length)
      : 48;

    return {
      onlineUsers: onlineSessions.length,
      activeTextChats,
      activeVideoChats,
      matchesToday,
      reportsToday,
      blocksToday: this.blocks.size,
      bansToday,
      averageSessionSeconds: avgDuration,
    };
  }

  public getLiveSessions() {
    const activeMatches = Array.from(this.matches.values())
      .filter(m => !m.endedAt)
      .map(m => {
        const reportCount = Array.from(this.reports.values()).filter(r => r.matchId === m.id).length;
        return {
          id: m.id,
          userA: m.userA,
          userB: m.userB,
          mode: m.mode,
          startedAt: m.startedAt,
          status: 'active',
          reportCount,
          commonInterests: m.commonInterests,
        };
      });
    return activeMatches;
  }
}

export const db = new DatabaseStore();
