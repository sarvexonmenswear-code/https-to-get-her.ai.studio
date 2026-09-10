import { db } from './db.js';

// Basic list of abusive, predatory, or severe harassment patterns
const SEVERE_PATTERNS = [
  /\b(kill\s+your\s*self|go\s+die|die\s+in\s+a\s+fire)\b/i,
  /\b(nazi|hitler|fag{1,2}ot|nigg[aer]|kike|chink)\b/i,
  /\b(cp|child\s*porn|underage\s*(nude|pic|sex)|pedophil)\b/i,
  /\b(send\s+nudes|show\s+tits|show\s+cock|cam\s+4\s+pay|cashapp\s+me|onlyfans\.com)\b/i,
];

const PROFANITY_PATTERNS = [
  /\b(bitch|whore|slut|cunt|dickhead|asshole)\b/i,
];

interface UserRateTracker {
  messageTimestamps: number[];
  lastMessages: string[];
  warningCount: number;
}

class ModerationEngine {
  private userTrackers = new Map<string, UserRateTracker>();

  private getTracker(sessionId: string): UserRateTracker {
    let tracker = this.userTrackers.get(sessionId);
    if (!tracker) {
      tracker = {
        messageTimestamps: [],
        lastMessages: [],
        warningCount: 0,
      };
      this.userTrackers.set(sessionId, tracker);
    }
    return tracker;
  }

  // Rate Limiting
  public checkRateLimit(sessionId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const tracker = this.getTracker(sessionId);
    // keep timestamps from last 5 seconds
    tracker.messageTimestamps = tracker.messageTimestamps.filter(t => now - t < 5000);

    if (tracker.messageTimestamps.length >= 7) {
      db.addModerationEvent(sessionId, 'rate_limit', 'Exceeded 7 messages in 5 seconds', 'warning');
      return {
        allowed: false,
        reason: 'You are sending messages too quickly. Please slow down.',
      };
    }

    tracker.messageTimestamps.push(now);
    return { allowed: true };
  }

  // Spam detection: check for identical repeated messages
  public checkSpam(sessionId: string, text: string): { isSpam: boolean; reason?: string } {
    const tracker = this.getTracker(sessionId);
    const normalized = text.trim().toLowerCase();

    // Check last 3 messages
    const identicalCount = tracker.lastMessages.filter(m => m === normalized).length;
    if (identicalCount >= 3) {
      db.addModerationEvent(sessionId, 'spam', `Sent repeated identical message 3+ times: "${text.slice(0, 30)}"`, 'warning');
      return {
        isSpam: true,
        reason: 'Please avoid repeating the same message.',
      };
    }

    tracker.lastMessages.push(normalized);
    if (tracker.lastMessages.length > 5) {
      tracker.lastMessages.shift();
    }

    return { isSpam: false };
  }

  // Content filter for messages
  public filterMessage(sessionId: string, text: string): { cleanText: string; flagged: boolean; blocked: boolean; warning?: string } {
    // Check maximum length
    if (text.length > 1000) {
      return {
        cleanText: text.slice(0, 1000),
        flagged: true,
        blocked: false,
        warning: 'Message exceeded maximum length and was trimmed.',
      };
    }

    // Check severe threats / illicit content
    for (const pattern of SEVERE_PATTERNS) {
      if (pattern.test(text)) {
        db.addModerationEvent(sessionId, 'suspicious_activity', `Blocked high-severity message content match: "${text.slice(0, 40)}"`, 'blocked');
        return {
          cleanText: '[Message blocked by safety filter]',
          flagged: true,
          blocked: true,
          warning: 'Your message violated community safety guidelines and was blocked.',
        };
      }
    }

    // Check profane / harassment words and mask
    let clean = text;
    let flagged = false;
    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(clean)) {
        flagged = true;
        clean = clean.replace(pattern, (match) => '*'.repeat(match.length));
      }
    }

    if (flagged) {
      db.addModerationEvent(sessionId, 'profanity', 'Profanity detected and masked', 'warning');
    }

    return {
      cleanText: clean,
      flagged,
      blocked: false,
    };
  }

  public cleanup(sessionId: string) {
    this.userTrackers.delete(sessionId);
  }
}

export const moderation = new ModerationEngine();
