import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { matchmaking } from './server/matchmaking.js';
import { moderation } from './server/moderation.js';

const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  app.use(cors());
  app.use(express.json());

  // Socket mapping: socket.id -> sessionId, and sessionId -> socket.id
  const socketToSession = new Map<string, string>();
  const sessionToSocket = new Map<string, Socket>();

  // Helper: notify online stats to all clients periodically or on change
  function broadcastStats() {
    const raw = db.getStats();
    const queueStats = {
      total: matchmaking.getQueueLength(),
      text: matchmaking.getQueueLength('text'),
      video: matchmaking.getQueueLength('video'),
    };
    const stats = {
      ...raw,
      onlineUsers: sessionToSocket.size,
      queueStats,
    };
    io.emit('stats:update', stats);
    io.emit('stats:updated', stats);
  }

  // Set periodic stats broadcast
  setInterval(broadcastStats, 6000);

  // Helper: End a match between two users
  function terminateMatch(matchId: string, reason: string, initiatorSessionId?: string, customMessage?: string) {
    const match = db.endMatch(matchId, reason);
    if (!match) return;

    const socketA = sessionToSocket.get(match.userA);
    const socketB = sessionToSocket.get(match.userB);

    const defaultMsg = (reason === 'user_disconnect' || reason === 'user_leave')
      ? 'Participant disconnected'
      : 'Stranger has left the conversation.';
    const finalMsg = customMessage || defaultMsg;

    if (socketA) {
      socketA.emit('match:ended', {
        matchId,
        reason,
        byUser: initiatorSessionId === match.userA,
        message: initiatorSessionId === match.userA ? 'You left the chat.' : finalMsg,
      });
      if (initiatorSessionId && initiatorSessionId !== match.userA) {
        socketA.emit('match:stranger_disconnected', { 
          reason,
          message: finalMsg,
        });
      }
    }
    if (socketB) {
      socketB.emit('match:ended', {
        matchId,
        reason,
        byUser: initiatorSessionId === match.userB,
        message: initiatorSessionId === match.userB ? 'You left the chat.' : finalMsg,
      });
      if (initiatorSessionId && initiatorSessionId !== match.userB) {
        socketB.emit('match:stranger_disconnected', { 
          reason,
          message: finalMsg,
        });
      }
    }

    // Clean up both users from matchmaking queue to prevent dangling session errors
    matchmaking.dequeue(match.userA);
    matchmaking.dequeue(match.userB);

    broadcastStats();
  }

  // Matchmaking runner: checks and connects queued users
  function processQueue() {
    // 1. Clean stale candidates whose socket is no longer connected
    const candidates = matchmaking.getAllCandidates();
    for (const c of candidates) {
      const sock = sessionToSocket.get(c.sessionId);
      if (!sock || !sock.connected) {
        matchmaking.dequeue(c.sessionId);
      }
    }

    // 2. Perform compatible matching
    const matches = matchmaking.matchAllAvailable();
    for (const m of matches) {
      const socketA = sessionToSocket.get(m.userA.sessionId);
      const socketB = sessionToSocket.get(m.userB.sessionId);

      // Verify both sockets are connected before committing match
      if (!socketA || !socketA.connected) {
        matchmaking.dequeue(m.userA.sessionId);
        if (socketB && socketB.connected) {
          matchmaking.enqueue(m.userB);
        }
        continue;
      }
      if (!socketB || !socketB.connected) {
        matchmaking.dequeue(m.userB.sessionId);
        if (socketA && socketA.connected) {
          matchmaking.enqueue(m.userA);
        }
        continue;
      }

      const dbMatch = db.createMatch(
        m.userA.sessionId,
        m.userB.sessionId,
        m.userA.mode,
        m.commonInterests
      );

      socketA.emit('match:found', {
        matchId: dbMatch.id,
        sessionId: dbMatch.id,
        peerSessionId: m.userB.sessionId,
        peerAnonymousName: m.userB.anonymousName || `Stranger #${Math.floor(100 + Math.random() * 900)}`,
        mode: dbMatch.mode,
        commonInterests: dbMatch.commonInterests,
        isInitiator: true, // socketA initiates WebRTC offer
      });

      socketB.emit('match:found', {
        matchId: dbMatch.id,
        sessionId: dbMatch.id,
        peerSessionId: m.userA.sessionId,
        peerAnonymousName: m.userA.anonymousName || `Stranger #${Math.floor(100 + Math.random() * 900)}`,
        mode: dbMatch.mode,
        commonInterests: dbMatch.commonInterests,
        isInitiator: false,
      });
    }
    if (matches.length > 0) {
      broadcastStats();
    }
  }

  // Run queue processor every second
  setInterval(processQueue, 1000);

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'TO-GET-HER' });
  });

  // Current stats (public)
  app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
  });

  // Create, resume, or validate anonymous session
  app.post('/api/auth/session', (req, res) => {
    const { token, autoVerifyIfConfirmed } = req.body || {};
    const clientToken = (typeof token === 'string' && token.trim())
      ? token.trim()
      : `tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const session = db.createOrGetSession(clientToken);

    if (autoVerifyIfConfirmed && !session.ageVerified) {
      session.ageVerified = true;
      session.ageVerifiedAt = new Date().toISOString();
      db.persist();
    }

    res.json({
      token: clientToken,
      sessionToken: clientToken,
      sessionId: session.id,
      ageVerified: Boolean(session.ageVerified),
      ageVerifiedAt: session.ageVerifiedAt,
      banned: Boolean(session.banned),
      banReason: session.banReason,
    });
  });

  // Validate session via GET
  app.get('/api/auth/session', (req, res) => {
    const authHeader = req.headers['authorization'] || '';
    const tokenHeader = (req.headers['x-session-token'] as string) || '';
    const queryToken = (req.query.token as string) || '';
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    const token = tokenHeader || bearerToken || queryToken;

    if (!token) {
      const newClientToken = `tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      const session = db.createOrGetSession(newClientToken);
      return res.json({
        token: newClientToken,
        sessionToken: newClientToken,
        sessionId: session.id,
        ageVerified: false,
        banned: false,
      });
    }

    const session = db.createOrGetSession(token);
    res.json({
      token,
      sessionToken: token,
      sessionId: session.id,
      ageVerified: Boolean(session.ageVerified),
      ageVerifiedAt: session.ageVerifiedAt,
      banned: Boolean(session.banned),
      banReason: session.banReason,
    });
  });

  // Server-side Age Gate Verification
  app.post('/api/auth/age-verify', (req, res) => {
    let { token, confirmed } = req.body || {};
    if (confirmed !== true && confirmed !== 'true') {
      return res.status(400).json({ error: 'Adult age confirmation (18+) is required' });
    }

    // If client token is missing or empty, generate a new anonymous session token
    if (!token || typeof token !== 'string' || token.trim() === '') {
      token = `tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    } else {
      token = token.trim();
    }

    const session = db.createOrGetSession(token);
    session.ageVerified = true;
    session.ageVerifiedAt = new Date().toISOString();
    db.persist();

    broadcastStats();

    res.json({
      success: true,
      ageVerified: true,
      token,
      sessionToken: token,
      sessionId: session.id,
    });
  });

  // Export PostgreSQL Database Schema DDL
  app.get('/api/database/schema', (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'server', 'schema.sql');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(schemaContent);
    } catch (e) {
      res.status(500).json({ error: 'Schema file not found' });
    }
  });

  // ==========================================
  // REST MATCHMAKING ENDPOINTS
  // ==========================================

  // Get current queue counts and state
  app.get('/api/match/queue', (req, res) => {
    res.json({
      total: matchmaking.getQueueLength(),
      text: matchmaking.getQueueLength('text'),
      video: matchmaking.getQueueLength('video'),
    });
  });

  // Start matchmaking via REST
  app.post('/api/match/find', (req, res) => {
    let { token, sessionId, mode, interests, language, country, confirmed, ageVerified } = req.body || {};
    let session = sessionId ? db.getSession(sessionId) : null;
    if (!session && token) {
      session = db.createOrGetSession(token);
    }
    if (!session) {
      const newToken = `tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      session = db.createOrGetSession(newToken);
    }

    if (confirmed || ageVerified) {
      session.ageVerified = true;
      session.ageVerifiedAt = new Date().toISOString();
      db.persist();
    }

    if (!session.ageVerified) {
      return res.status(403).json({
        error: 'AGE_VERIFICATION_REQUIRED',
        message: 'Adult age verification (18+) is required before entering chat.',
      });
    }

    if (session.banned) {
      return res.status(403).json({
        error: 'ACCOUNT_BANNED',
        message: session.banReason || 'Your session has been restricted by moderation.',
      });
    }

    // End existing match if any
    const existingMatch = db.getActiveMatchForUser(session.id);
    if (existingMatch) {
      terminateMatch(existingMatch.id, 'user_next', session.id);
    }

    session.mode = mode || 'text';
    session.interests = interests || [];
    session.language = language || 'en';
    session.country = country || 'ANY';

    const candidate = {
      sessionId: session.id,
      socketId: session.socketId || `rest_${session.id}`,
      mode: session.mode,
      interests: session.interests,
      language: session.language,
      country: session.country,
      enqueuedAt: Date.now(),
      createdAt: Date.now(),
      availability: 'available' as const,
      status: 'searching' as const,
    };

    matchmaking.enqueue(candidate);
    broadcastStats();
    processQueue();

    // Check if matched immediately
    const activeMatch = db.getActiveMatchForUser(session.id);
    if (activeMatch) {
      const peerId = activeMatch.userA === session.id ? activeMatch.userB : activeMatch.userA;
      const peerSession = db.getSession(peerId);
      return res.json({
        status: 'matched',
        matchId: activeMatch.id,
        sessionId: activeMatch.id,
        mode: activeMatch.mode,
        peerAnonymousName: `Stranger #${peerId.slice(-3)}`,
        commonInterests: activeMatch.commonInterests,
        isInitiator: activeMatch.userA === session.id,
        redirectView: activeMatch.mode === 'video' ? 'video_chat' : 'text_chat',
      });
    }

    return res.json({
      status: 'searching',
      sessionId: session.id,
      token: session.rawToken,
      mode: session.mode,
      queueCount: matchmaking.getQueueLength(session.mode),
      totalQueue: matchmaking.getQueueLength(),
    });
  });

  // Query matchmaking status (polling fallback)
  app.get('/api/match/status', (req, res) => {
    const sessionId = (req.query.sessionId as string) || '';
    const token = (req.query.token as string) || '';
    let session = sessionId ? db.getSession(sessionId) : null;
    if (!session && token) {
      session = db.createOrGetSession(token);
    }
    if (!session) {
      return res.json({ status: 'idle' });
    }

    const activeMatch = db.getActiveMatchForUser(session.id);
    if (activeMatch) {
      const peerId = activeMatch.userA === session.id ? activeMatch.userB : activeMatch.userA;
      return res.json({
        status: 'matched',
        matchId: activeMatch.id,
        sessionId: activeMatch.id,
        mode: activeMatch.mode,
        peerAnonymousName: `Stranger #${peerId.slice(-3)}`,
        commonInterests: activeMatch.commonInterests,
        isInitiator: activeMatch.userA === session.id,
        redirectView: activeMatch.mode === 'video' ? 'video_chat' : 'text_chat',
      });
    }

    if (matchmaking.isQueued(session.id)) {
      const c = matchmaking.getCandidate(session.id);
      return res.json({
        status: 'searching',
        sessionId: session.id,
        mode: c?.mode || session.mode,
        queueCount: matchmaking.getQueueLength(c?.mode),
        totalQueue: matchmaking.getQueueLength(),
      });
    }

    return res.json({ status: 'idle', sessionId: session.id });
  });

  // Cancel matchmaking via REST
  app.post('/api/match/cancel', (req, res) => {
    const { sessionId, token } = req.body || {};
    let session = sessionId ? db.getSession(sessionId) : null;
    if (!session && token) {
      session = db.createOrGetSession(token);
    }
    if (session) {
      matchmaking.dequeue(session.id);
      broadcastStats();
    }
    res.json({ success: true, status: 'cancelled' });
  });

  // End match / tab-close notification via REST / sendBeacon
  app.post('/api/match/ended', (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { token, sessionId, reason, message } = body || {};
    let session = sessionId ? db.getSession(sessionId) : null;
    if (!session && token) {
      session = db.getSessionByToken(token);
    }
    if (session) {
      const activeMatch = db.getActiveMatchForUser(session.id);
      if (activeMatch) {
        terminateMatch(activeMatch.id, reason || 'user_disconnect', session.id, message || 'Participant disconnected');
      }
      matchmaking.dequeue(session.id);
      broadcastStats();
    }
    res.json({ success: true, status: 'ended' });
  });

  // ==========================================
  // ADMIN API ENDPOINTS (Protected)
  // ==========================================

  // Admin auth check middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['x-admin-token'] || req.headers['authorization'];
    if (authHeader === `Bearer ${ADMIN_PASSWORD}` || authHeader === ADMIN_PASSWORD) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: invalid admin credentials' });
  };

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: ADMIN_PASSWORD });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  });

  app.get('/api/admin/stats', adminAuth, (req, res) => {
    res.json(db.getStats());
  });

  app.get('/api/admin/live-sessions', adminAuth, (req, res) => {
    res.json(db.getLiveSessions());
  });

  app.post('/api/admin/live-sessions/:id/disconnect', adminAuth, (req, res) => {
    const { id } = req.params;
    terminateMatch(id, 'admin_disconnect');
    res.json({ success: true, message: 'Session disconnected by admin' });
  });

  app.get('/api/admin/reports', adminAuth, (req, res) => {
    res.json(db.getReports());
  });

  app.post('/api/admin/reports/:id/action', adminAuth, (req, res) => {
    const { id } = req.params;
    const { action, moderationResult, banUser } = req.body; // action: 'review' | 'resolve' | 'dismiss' | 'ban'

    const status = action === 'dismiss' ? 'dismissed' : action === 'resolve' ? 'resolved' : 'reviewed';
    const report = db.updateReportStatus(id, status, moderationResult, 'Admin');

    if (report && banUser) {
      db.banSession(report.reportedSession, moderationResult || `Banned due to report ${report.id}`);
      // If user is currently in a match, disconnect them
      const activeMatch = db.getActiveMatchForUser(report.reportedSession);
      if (activeMatch) {
        terminateMatch(activeMatch.id, 'user_banned');
      }
    }

    res.json({ success: true, report });
  });

  app.get('/api/admin/bans', adminAuth, (req, res) => {
    res.json(db.getAllBans());
  });

  app.post('/api/admin/bans', adminAuth, (req, res) => {
    const { target, reason } = req.body; // target: sessionId or tokenHash
    if (!target) return res.status(400).json({ error: 'Target session ID or token hash required' });

    const ban = db.banSession(target, reason || 'Banned by administrator');
    const activeMatch = db.getActiveMatchForUser(target);
    if (activeMatch) {
      terminateMatch(activeMatch.id, 'user_banned');
    }
    broadcastStats();
    res.json({ success: true, ban });
  });

  app.post('/api/admin/bans/:tokenHash/unban', adminAuth, (req, res) => {
    const { tokenHash } = req.params;
    const success = db.unbanSession(tokenHash);
    broadcastStats();
    res.json({ success });
  });

  app.get('/api/admin/blocks', adminAuth, (req, res) => {
    res.json(db.getAllBlocks());
  });

  app.get('/api/admin/moderation-events', adminAuth, (req, res) => {
    res.json(db.getModerationEvents());
  });

  app.get('/api/admin/analytics', adminAuth, (req, res) => {
    const allMatches = db.getAllMatches();
    const reports = db.getReports();
    const totalMatches = allMatches.length;
    const textMatches = allMatches.filter(m => m.mode === 'text').length;
    const videoMatches = allMatches.filter(m => m.mode === 'video').length;
    const skips = allMatches.filter(m => m.endReason === 'user_next').length;
    const completedNormal = allMatches.filter(m => m.endReason === 'user_leave' || m.endReason === 'user_next').length;

    res.json({
      totalMatches,
      textMatches,
      videoMatches,
      skipRate: totalMatches > 0 ? Math.round((skips / totalMatches) * 100) : 0,
      reportRate: totalMatches > 0 ? Math.round((reports.length / totalMatches) * 100) : 0,
      averageDuration: db.getStats().averageSessionSeconds,
      peakUsagePeriod: '8:00 PM - 12:00 AM UTC',
    });
  });

  // ==========================================
  // SOCKET.IO REALTIME & WEBRTC SIGNALING
  // ==========================================

  io.on('connection', (socket: Socket) => {
    let currentSessionId: string | null = null;

    // 1. Session handshake
    socket.on('session:init', (data: { token: string; autoVerifyIfConfirmed?: boolean }) => {
      if (!data?.token) return;
      const session = db.createOrGetSession(data.token);
      if (data.autoVerifyIfConfirmed && !session.ageVerified) {
        session.ageVerified = true;
        session.ageVerifiedAt = new Date().toISOString();
        db.persist();
      }
      currentSessionId = session.id;

      socketToSession.set(socket.id, session.id);
      sessionToSocket.set(session.id, socket);
      db.setSocketId(session.id, socket.id);

      socket.emit('session:ready', {
        sessionId: session.id,
        ageVerified: session.ageVerified,
        banned: session.banned,
        banReason: session.banReason,
      });

      broadcastStats();
    });

    // 2. Start Matchmaking (Enter Queue)
    socket.on('match:find', (data: {
      token?: string;
      mode: 'text' | 'video';
      interests?: string[];
      language?: string;
      country?: string;
      ageVerified?: boolean;
    }) => {
      if (!currentSessionId) {
        currentSessionId = socketToSession.get(socket.id) || null;
      }
      if (!currentSessionId && data?.token) {
        const s = db.createOrGetSession(data.token);
        currentSessionId = s.id;
        socketToSession.set(socket.id, s.id);
        sessionToSocket.set(s.id, socket);
        db.setSocketId(s.id, socket.id);
      }
      if (!currentSessionId) return;
      const session = db.getSession(currentSessionId);
      if (!session) return;

      if (data?.ageVerified && !session.ageVerified) {
        session.ageVerified = true;
        session.ageVerifiedAt = new Date().toISOString();
        db.persist();
      }

      // Ensure age verified server-side
      if (!session.ageVerified) {
        return socket.emit('error:notice', {
          code: 'AGE_VERIFICATION_REQUIRED',
          message: 'Adult age verification (18+) is required before entering chat.',
        });
      }

      // Check bans
      if (session.banned) {
        return socket.emit('error:notice', {
          code: 'ACCOUNT_BANNED',
          message: session.banReason || 'Your session has been restricted by moderation.',
        });
      }

      // End any previous active match
      const existingMatch = db.getActiveMatchForUser(currentSessionId);
      if (existingMatch) {
        terminateMatch(existingMatch.id, 'user_next', currentSessionId);
      }

      // Update preferences
      session.mode = data.mode || 'text';
      session.interests = data.interests || [];
      session.language = data.language || 'en';
      session.country = data.country || 'ANY';

      // Enqueue with full candidate state
      matchmaking.enqueue({
        sessionId: currentSessionId,
        socketId: socket.id,
        mode: data.mode || 'text',
        interests: data.interests || [],
        language: data.language,
        country: data.country,
        enqueuedAt: Date.now(),
        createdAt: Date.now(),
        availability: 'available',
        status: 'searching',
      });

      socket.emit('match:queued', { 
        mode: data.mode, 
        queueCount: matchmaking.getQueueLength(data.mode),
        totalQueue: matchmaking.getQueueLength()
      });
      broadcastStats();

      // Immediate attempt
      processQueue();
    });

    // 3. Cancel Matchmaking
    socket.on('match:cancel', () => {
      if (currentSessionId) {
        matchmaking.dequeue(currentSessionId);
        socket.emit('match:cancelled');
        broadcastStats();
      }
    });

    // 4. Next / Skip
    socket.on('match:next', () => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      const session = db.getSession(currentSessionId);
      if (!session) return;

      if (activeMatch) {
        const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
        // Record skip so they don't immediately rematch
        matchmaking.recordSkip(currentSessionId, peerId);

        // Terminate old match
        terminateMatch(activeMatch.id, 'user_next', currentSessionId);
      }

      // Re-enter matchmaking queue immediately
      matchmaking.enqueue({
        sessionId: currentSessionId,
        socketId: socket.id,
        mode: session.mode,
        interests: session.interests,
        language: session.language,
        country: session.country,
        enqueuedAt: Date.now(),
        createdAt: Date.now(),
        availability: 'available',
        status: 'searching',
      });

      socket.emit('match:queued', { 
        mode: session.mode,
        queueCount: matchmaking.getQueueLength(session.mode),
        totalQueue: matchmaking.getQueueLength()
      });
      broadcastStats();
      processQueue();
    });

    // 5. End Chat / Tab Close
    const handleMatchTermination = (data?: { reason?: string; message?: string; matchId?: string }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (activeMatch) {
        terminateMatch(
          activeMatch.id,
          data?.reason || 'user_leave',
          currentSessionId,
          data?.message || 'Participant disconnected'
        );
      }
      matchmaking.dequeue(currentSessionId);
      broadcastStats();
    };

    socket.on('match:end', handleMatchTermination);
    socket.on('match:ended', handleMatchTermination);

    // 6. Text Chat Messages
    socket.on('chat:message', (data: { text: string }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch) return;

      const rawText = data?.text?.trim();
      if (!rawText) return;

      // Rate limit check
      const rateCheck = moderation.checkRateLimit(currentSessionId);
      if (!rateCheck.allowed) {
        return socket.emit('chat:warning', { message: rateCheck.reason });
      }

      // Spam check
      const spamCheck = moderation.checkSpam(currentSessionId, rawText);
      if (spamCheck.isSpam) {
        return socket.emit('chat:warning', { message: spamCheck.reason });
      }

      // Content moderation filter
      const filterResult = moderation.filterMessage(currentSessionId, rawText);
      if (filterResult.blocked) {
        return socket.emit('chat:warning', { message: filterResult.warning });
      }

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);

      const messagePayload = {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        matchId: activeMatch.id,
        text: filterResult.cleanText,
        timestamp: new Date().toISOString(),
      };

      // Send to sender with 'me' identity
      socket.emit('chat:incoming', {
        ...messagePayload,
        senderId: 'me',
      });

      // Send to peer with 'stranger' identity
      if (peerSocket) {
        peerSocket.emit('chat:incoming', {
          ...messagePayload,
          senderId: 'stranger',
        });
      }

      if (filterResult.flagged && filterResult.warning) {
        socket.emit('chat:warning', { message: filterResult.warning });
      }
    });

    // 7. Typing status indicator
    socket.on('chat:typing', (data: { isTyping: boolean }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch) return;

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);
      if (peerSocket) {
        peerSocket.emit('chat:stranger_typing', { isTyping: !!data?.isTyping });
        peerSocket.emit('chat:typing', { isTyping: !!data?.isTyping });
      }
    });

    // 8. Report User
    socket.on('user:report', (data: {
      category: any;
      description: string;
      disconnect?: boolean;
    }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch) return;

      const reportedId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;

      db.createReport({
        reporterSession: currentSessionId,
        reportedSession: reportedId,
        matchId: activeMatch.id,
        category: data.category || 'other',
        description: data.description || '',
        priority: data.category === 'underage_concern' || data.category === 'threatening_behavior' ? 'critical' : 'medium',
      });

      socket.emit('user:reported_ack', {
        message: 'Report submitted. Our moderation team will investigate. Thank you for keeping TO-GET-HER safe.',
      });

      // Terminate connection if requested or severe
      if (data.disconnect !== false) {
        terminateMatch(activeMatch.id, 'user_report', currentSessionId);
      }
    });

    // 9. Block User
    socket.on('user:block', () => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch) return;

      const blockedId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      db.addBlock(currentSessionId, blockedId);

      // Terminate match immediately
      terminateMatch(activeMatch.id, 'user_block', currentSessionId);

      socket.emit('user:blocked_ack', {
        message: 'User blocked. You will never be matched with them again.',
      });
    });

    // 10. WebRTC Signaling Relays
    socket.on('webrtc:offer', (payload: { offer: any }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch || activeMatch.mode !== 'video') return;

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);
      if (peerSocket) {
        peerSocket.emit('webrtc:offer', {
          offer: payload.offer,
          from: currentSessionId,
        });
      }
    });

    socket.on('webrtc:answer', (payload: { answer: any }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch || activeMatch.mode !== 'video') return;

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);
      if (peerSocket) {
        peerSocket.emit('webrtc:answer', {
          answer: payload.answer,
          from: currentSessionId,
        });
      }
    });

    socket.on('webrtc:ice_candidate', (payload: { candidate: any }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch || activeMatch.mode !== 'video') return;

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);
      if (peerSocket) {
        peerSocket.emit('webrtc:ice_candidate', {
          candidate: payload.candidate,
        });
      }
    });

    socket.on('webrtc:media_state', (payload: { audioMuted: boolean; videoDisabled: boolean }) => {
      if (!currentSessionId) return;
      const activeMatch = db.getActiveMatchForUser(currentSessionId);
      if (!activeMatch) return;

      const peerId = activeMatch.userA === currentSessionId ? activeMatch.userB : activeMatch.userA;
      const peerSocket = sessionToSocket.get(peerId);
      if (peerSocket) {
        peerSocket.emit('webrtc:stranger_media_state', payload);
      }
    });

    // 11. Disconnect Cleanup
    socket.on('disconnect', () => {
      if (currentSessionId) {
        matchmaking.dequeue(currentSessionId);
        moderation.cleanup(currentSessionId);

        const activeMatch = db.getActiveMatchForUser(currentSessionId);
        if (activeMatch) {
          terminateMatch(activeMatch.id, 'user_disconnect', currentSessionId, 'Participant disconnected');
        }

        db.setSocketId(currentSessionId, undefined);
        sessionToSocket.delete(currentSessionId);
      }
      socketToSession.delete(socket.id);
      broadcastStats();
    });
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[TO-GET-HER] Server & Socket.IO running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
