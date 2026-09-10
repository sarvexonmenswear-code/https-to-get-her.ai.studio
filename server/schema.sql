-- =======================================================
-- TO-GET-HER Platform Database Schema (PostgreSQL)
-- Anonymous Social Discovery with Text & WebRTC Video Chat
-- =======================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Anonymous Sessions Table
CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id VARCHAR(64) PRIMARY KEY,
    session_token_hash VARCHAR(128) NOT NULL UNIQUE,
    mode VARCHAR(16) DEFAULT 'text',
    language VARCHAR(16) DEFAULT 'en',
    country VARCHAR(32) DEFAULT 'ANY',
    age_verified BOOLEAN NOT NULL DEFAULT FALSE,
    age_verified_at TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    socket_id VARCHAR(64),
    ip_hash VARCHAR(64),
    banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_token ON anonymous_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_status ON anonymous_sessions(is_online, banned);

-- 2. Users Table (for optional account registration & future expansion)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    anonymous_session_id VARCHAR(64) REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(64),
    role VARCHAR(32) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Interests Catalog
CREATE TABLE IF NOT EXISTS interests (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(64) DEFAULT 'general',
    icon VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Selected Interests
CREATE TABLE IF NOT EXISTS user_interests (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    interest_id VARCHAR(64) NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_interest UNIQUE (session_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_session ON user_interests(session_id);

-- 5. User Preferences
CREATE TABLE IF NOT EXISTS preferences (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    preferred_mode VARCHAR(16) DEFAULT 'text',
    preferred_language VARCHAR(16) DEFAULT 'en',
    preferred_country VARCHAR(32) DEFAULT 'ANY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(64) PRIMARY KEY,
    user_a VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    user_b VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    mode VARCHAR(16) NOT NULL CHECK (mode IN ('text', 'video')),
    common_interests TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason VARCHAR(64),
    duration_seconds INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_matches_started ON matches(started_at);

-- 7. Messages Table (ephemeral by default, retained only during active matches or flagged abuse)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_session VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);

-- 8. User Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    reporter_session VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    reported_session VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    match_id VARCHAR(64) REFERENCES matches(id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    priority VARCHAR(16) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderation_result TEXT,
    reviewed_by VARCHAR(64),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, priority);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_session);

-- 9. User Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
    id VARCHAR(64) PRIMARY KEY,
    blocker_session VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    blocked_session VARCHAR(64) NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block_pair UNIQUE (blocker_session, blocked_session)
);

CREATE INDEX IF NOT EXISTS idx_blocks_pair ON blocks(blocker_session, blocked_session);

-- 10. Bans Table
CREATE TABLE IF NOT EXISTS bans (
    id VARCHAR(64) PRIMARY KEY,
    session_token_hash VARCHAR(128) NOT NULL,
    ip_hash VARCHAR(64),
    reason TEXT NOT NULL,
    banned_by VARCHAR(64) DEFAULT 'system',
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bans_token ON bans(session_token_hash);

-- 11. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(32) DEFAULT 'moderator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 12. Moderation Events Table
CREATE TABLE IF NOT EXISTS moderation_events (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    details TEXT,
    severity VARCHAR(16) DEFAULT 'warning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_events_type ON moderation_events(event_type, severity);
