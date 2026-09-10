import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  MessageSquare,
  Video,
  Flag,
  Ban,
  Clock,
  Activity,
  LogOut,
  CheckCircle,
  XCircle,
  Database,
  BarChart3,
  Search,
  RefreshCw,
  PhoneOff,
  AlertTriangle,
} from 'lucide-react';
import { PlatformStats } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('to_get_her_admin_token'));
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'sessions' | 'reports' | 'bans' | 'moderation' | 'schema' | 'analytics'
  >('overview');

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [moderationEvents, setModerationEvents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('to_get_her_admin_token', data.token);
        setToken(data.token);
      } else {
        setLoginError('Invalid administrator credentials.');
      }
    } catch {
      setLoginError('Failed to authenticate.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('to_get_her_admin_token');
    setToken(null);
  };

  // Fetch admin data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { 'x-admin-token': token };

    try {
      const [statsRes, sessRes, repRes, bansRes, modRes, analRes, schemaRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/live-sessions', { headers }),
        fetch('/api/admin/reports', { headers }),
        fetch('/api/admin/bans', { headers }),
        fetch('/api/admin/moderation-events', { headers }),
        fetch('/api/admin/analytics', { headers }),
        fetch('/api/database/schema'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (sessRes.ok) setLiveSessions(await sessRes.json());
      if (repRes.ok) setReports(await repRes.json());
      if (bansRes.ok) setBans(await bansRes.json());
      if (modRes.ok) setModerationEvents(await modRes.json());
      if (analRes.ok) setAnalytics(await analRes.json());
      if (schemaRes.ok) setSchemaSql(await schemaRes.text());
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 6000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Admin Actions
  const handleDisconnectSession = async (id: string) => {
    if (!token) return;
    await fetch(`/api/admin/live-sessions/${id}/disconnect`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
    fetchData();
  };

  const handleReportAction = async (reportId: string, action: string, banUser = false) => {
    if (!token) return;
    await fetch(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({
        action,
        moderationResult: `Processed by administrator (${action})`,
        banUser,
      }),
    });
    fetchData();
  };

  const handleUnban = async (tokenHash: string) => {
    if (!token) return;
    await fetch(`/api/admin/bans/${tokenHash}/unban`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
    fetchData();
  };

  // If not logged in, show login form
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-1">Admin Safety Portal</h3>
          <p className="text-slate-400 text-xs text-center mb-6">
            Enter administrative credentials to access moderation and live metrics.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: admin123"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back to Site
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Access Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden" id="admin-dashboard-container">
      {/* Top Bar */}
      <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>TO-GET-HER Admin & Moderation</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                SECURE
              </span>
            </div>
            <div className="text-xs text-slate-400">PostgreSQL + Redis Queue Management Console</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-2 bg-slate-900/60 border-b border-slate-800 flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: BarChart3 },
          { id: 'sessions', label: `Live Sessions (${liveSessions.length})`, icon: Activity },
          { id: 'reports', label: `Reports (${reports.filter((r) => r.status === 'pending').length} pending)`, icon: Flag },
          { id: 'bans', label: `Banned Users (${bans.length})`, icon: Ban },
          { id: 'moderation', label: `Moderation Events (${moderationEvents.length})`, icon: AlertTriangle },
          { id: 'analytics', label: 'Analytics', icon: Users },
          { id: 'schema', label: 'PostgreSQL Schema', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Users</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.onlineUsers || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Text Chats</span>
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-400">{stats?.activeTextChats || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Video Chats</span>
                  <Video className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{stats?.activeVideoChats || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Matches Today</span>
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.matchesToday || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Reports Today</span>
                  <Flag className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{stats?.reportsToday || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Blocks</span>
                  <Ban className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.blocksToday || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Bans Enforced</span>
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400">{bans.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Avg Duration</span>
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.averageSessionSeconds || 45}s</div>
              </div>
            </div>

            {/* Quick Live sessions preview */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4">Active Peer Connections</h3>
              {liveSessions.length === 0 ? (
                <div className="text-slate-500 text-xs py-8 text-center">
                  No active chats currently in progress. Open a second browser tab to test live matchmaking!
                </div>
              ) : (
                <div className="space-y-3">
                  {liveSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-mono text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Match {s.id}</span>
                          <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {s.mode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Started: {new Date(s.startedAt).toLocaleTimeString()} • Reports on match: {s.reportCount}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnectSession(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Live Real-Time Sessions</h3>
              <span className="text-xs text-slate-400">Socket.IO + WebRTC State</span>
            </div>

            {liveSessions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
                No live active sessions at the moment. Users are queued or idle.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Started</th>
                      <th className="p-3">User A</th>
                      <th className="p-3">User B</th>
                      <th className="p-3">Reports</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {liveSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-850">
                        <td className="p-3 font-mono text-white">{s.id}</td>
                        <td className="p-3 uppercase font-semibold text-rose-400">{s.mode}</td>
                        <td className="p-3">{new Date(s.startedAt).toLocaleTimeString()}</td>
                        <td className="p-3 font-mono text-slate-400">{s.userA}</td>
                        <td className="p-3 font-mono text-slate-400">{s.userB}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              s.reportCount > 0 ? 'bg-rose-950 text-rose-400 font-bold' : 'text-slate-500'
                            }`}
                          >
                            {s.reportCount}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleDisconnectSession(s.id)}
                            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200"
                          >
                            Disconnect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Abuse & Safety Reports Queue</h3>
            {reports.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
                No reports submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{r.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/30">
                          {r.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            r.priority === 'critical'
                              ? 'bg-rose-600 text-white'
                              : r.priority === 'high'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <strong>Reported session:</strong> <code className="text-slate-400">{r.reportedSession}</code>
                      <br />
                      <strong>Reporter session:</strong> <code className="text-slate-400">{r.reporterSession}</code>
                      {r.description && (
                        <div className="mt-2 text-slate-200 italic">"{r.description}"</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-white capitalize">{r.status}</strong>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReportAction(r.id, 'dismiss')}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleReportAction(r.id, 'resolve')}
                          className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleReportAction(r.id, 'ban', true)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                        >
                          Ban User
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BANS */}
        {activeTab === 'bans' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Banned Sessions & Tokens</h3>
            {bans.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
                No active bans recorded.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Ban ID</th>
                      <th className="p-3">Token Hash</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Banned At</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {bans.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-850">
                        <td className="p-3 font-mono text-rose-400">{b.id}</td>
                        <td className="p-3 font-mono text-slate-400 truncate max-w-[200px]">{b.sessionTokenHash}</td>
                        <td className="p-3 font-medium text-white">{b.reason}</td>
                        <td className="p-3">{new Date(b.bannedAt).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleUnban(b.sessionTokenHash)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          >
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MODERATION EVENTS */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Automated Moderation Activity</h3>
            {moderationEvents.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
                No moderation alerts triggered.
              </div>
            ) : (
              <div className="space-y-2">
                {moderationEvents.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            m.severity === 'blocked' ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                        ></span>
                        <span className="uppercase text-[10px] tracking-wider text-slate-400">{m.eventType}</span>
                        <span>•</span>
                        <span>{m.details}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Session: {m.sessionId} • {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                      {m.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Platform Health & Discovery Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Total Lifetime Matches</div>
                <div className="text-3xl font-black text-white">{analytics?.totalMatches || 0}</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Skip / Next Rate</div>
                <div className="text-3xl font-black text-amber-400">{analytics?.skipRate || 0}%</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Report Rate</div>
                <div className="text-3xl font-black text-rose-400">{analytics?.reportRate || 0}%</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white text-sm mb-2">Peak Usage Hours</h4>
              <p className="text-xs text-slate-400 mb-4">
                Estimated highest volume period: <strong>{analytics?.peakUsagePeriod || 'Evening peak hours'}</strong>
              </p>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-400 w-3/4"></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: POSTGRESQL SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">PostgreSQL Architecture Schema</h3>
                <p className="text-xs text-slate-400">12 Tables, Foreign Keys, Indexes & Constraints</p>
              </div>
              <a
                href="/api/database/schema"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Raw SQL Download
              </a>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[500px]">
              {schemaSql || 'Loading schema...'}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
