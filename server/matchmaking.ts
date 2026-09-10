import { db } from './db.js';

export interface QueueCandidate {
  sessionId: string;
  socketId: string;
  mode: 'text' | 'video';
  interests: string[];
  language?: string;
  country?: string;
  availability?: 'available' | 'busy';
  status?: 'searching' | 'matched';
  createdAt?: number;
  enqueuedAt: number;
  anonymousName?: string;
}

class MatchmakingQueue {
  private queue: QueueCandidate[] = [];
  // Tracks skipped users per session: sessionId -> Map<peerId, timestamp>
  private recentSkips = new Map<string, Map<string, number>>();
  // Tracks recent matches: sessionId -> Map<peerId, timestamp>
  private recentMatches = new Map<string, Map<string, number>>();
  // Active in-progress lock to prevent race conditions during matching
  private isProcessing = false;

  public enqueue(candidate: QueueCandidate) {
    // Remove if already in queue
    this.dequeue(candidate.sessionId);
    if (!candidate.anonymousName) {
      candidate.anonymousName = `Stranger #${Math.floor(100 + Math.random() * 900)}`;
    }
    candidate.availability = 'available';
    candidate.status = 'searching';
    candidate.createdAt = candidate.createdAt || Date.now();
    this.queue.push(candidate);
  }

  public dequeue(sessionId: string): QueueCandidate | undefined {
    const index = this.queue.findIndex(c => c.sessionId === sessionId);
    if (index !== -1) {
      return this.queue.splice(index, 1)[0];
    }
    return undefined;
  }

  public isQueued(sessionId: string): boolean {
    return this.queue.some(c => c.sessionId === sessionId);
  }

  public getCandidate(sessionId: string): QueueCandidate | undefined {
    return this.queue.find(c => c.sessionId === sessionId);
  }

  public getAllCandidates(): QueueCandidate[] {
    return [...this.queue];
  }

  public getQueueLength(mode?: 'text' | 'video'): number {
    if (!mode) return this.queue.length;
    return this.queue.filter(c => c.mode === mode).length;
  }

  public recordSkip(userA: string, userB: string) {
    const now = Date.now();
    if (!this.recentSkips.has(userA)) this.recentSkips.set(userA, new Map());
    this.recentSkips.get(userA)!.set(userB, now);

    if (!this.recentSkips.has(userB)) this.recentSkips.set(userB, new Map());
    this.recentSkips.get(userB)!.set(userA, now);
  }

  public recordMatch(userA: string, userB: string) {
    const now = Date.now();
    if (!this.recentMatches.has(userA)) this.recentMatches.set(userA, new Map());
    this.recentMatches.get(userA)!.set(userB, now);

    if (!this.recentMatches.has(userB)) this.recentMatches.set(userB, new Map());
    this.recentMatches.get(userB)!.set(userA, now);
  }

  private hasRecentlyInteracted(userA: string, userB: string): boolean {
    // If the total queue size is small (e.g. <= 2 people looking), waive cooldown so test / low-traffic works seamlessly
    if (this.queue.length <= 2) {
      return false;
    }

    const now = Date.now();
    const cooldownMs = 15 * 1000; // 15s cooldown against immediate rematches in large queues

    // Check recent skips (5 second grace period)
    const skipTimeA = this.recentSkips.get(userA)?.get(userB);
    const skipTimeB = this.recentSkips.get(userB)?.get(userA);
    if ((skipTimeA && now - skipTimeA < 5000) || (skipTimeB && now - skipTimeB < 5000)) {
      return true;
    }

    // Check recent matches
    const matchTimeA = this.recentMatches.get(userA)?.get(userB);
    const matchTimeB = this.recentMatches.get(userB)?.get(userA);
    if ((matchTimeA && now - matchTimeA < cooldownMs) || (matchTimeB && now - matchTimeB < cooldownMs)) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates compatibility between candidate A and B
   * Higher score = better match, -1 = disqualified
   */
  private scoreCompatibility(a: QueueCandidate, b: QueueCandidate): number {
    // 1. Same user or same socket is strictly disqualified
    if (a.sessionId === b.sessionId || a.socketId === b.socketId) return -1;

    // 2. Same mode is mandatory
    if (a.mode !== b.mode) return -1;

    // 3. Block check: if blocked, never match
    if (db.isBlocked(a.sessionId, b.sessionId)) return -1;

    // 4. Skip/recent match check: prevent immediate repeated rematching
    if (this.hasRecentlyInteracted(a.sessionId, b.sessionId)) {
      return -1;
    }

    let score = 20; // baseline for same mode

    // 5. Common interests matching
    const commonInterests = a.interests.filter(i =>
      b.interests.some(bi => bi.toLowerCase().trim() === i.toLowerCase().trim())
    );
    score += commonInterests.length * 30;

    // 6. Language preference
    if (a.language && b.language && a.language.toLowerCase() === b.language.toLowerCase()) {
      score += 15;
    }

    // 7. Country preference
    if (
      a.country &&
      b.country &&
      a.country !== 'ANY' &&
      b.country !== 'ANY' &&
      a.country.toLowerCase() === b.country.toLowerCase()
    ) {
      score += 10;
    }

    // 8. Waiting time expansion: as users wait past 5s & 10s, boost score so they pair
    const waitingSecondsA = (Date.now() - a.enqueuedAt) / 1000;
    const waitingSecondsB = (Date.now() - b.enqueuedAt) / 1000;
    score += Math.min(50, Math.floor((waitingSecondsA + waitingSecondsB) * 3));

    return score;
  }

  /**
   * Attempts to find the best match for candidate in queue
   */
  public findMatchFor(candidate: QueueCandidate): {
    matchedPeer: QueueCandidate;
    commonInterests: string[];
  } | null {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      let bestPeer: QueueCandidate | null = null;
      let highestScore = -1;

      for (const other of this.queue) {
        if (other.sessionId === candidate.sessionId || other.socketId === candidate.socketId) continue;

        const score = this.scoreCompatibility(candidate, other);
        if (score > highestScore) {
          highestScore = score;
          bestPeer = other;
        }
      }

      if (bestPeer && highestScore > 0) {
        // Remove both from queue
        this.dequeue(candidate.sessionId);
        this.dequeue(bestPeer.sessionId);

        // Record match in cooldown history
        this.recordMatch(candidate.sessionId, bestPeer.sessionId);

        const commonInterests = candidate.interests.filter(i =>
          bestPeer!.interests.some(bi => bi.toLowerCase().trim() === i.toLowerCase().trim())
        );

        return {
          matchedPeer: bestPeer,
          commonInterests,
        };
      }

      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Polls the whole queue to pair all compatible users
   */
  public matchAllAvailable(): Array<{
    userA: QueueCandidate;
    userB: QueueCandidate;
    commonInterests: string[];
  }> {
    const matches: Array<{
      userA: QueueCandidate;
      userB: QueueCandidate;
      commonInterests: string[];
    }> = [];

    // Process from oldest to newest
    const sorted = [...this.queue].sort((a, b) => a.enqueuedAt - b.enqueuedAt);

    for (const candidate of sorted) {
      if (!this.isQueued(candidate.sessionId)) continue;

      const result = this.findMatchFor(candidate);
      if (result) {
        matches.push({
          userA: candidate,
          userB: result.matchedPeer,
          commonInterests: result.commonInterests,
        });
      }
    }

    return matches;
  }
}

export const matchmaking = new MatchmakingQueue();
