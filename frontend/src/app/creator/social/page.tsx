'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Unlink, CheckCircle2, AlertCircle, Copy, Check,
    Trophy, MessageSquare, Crown, Users, Loader2,
    Hash, Shield, ExternalLink,
} from 'lucide-react';
import './social.css';

/* ─────────── Types ─────────── */
interface DiscordChannel {
    id: string;
    creator_id: string;
    platform: string;
    external_channel_id: string;
    channel_name: string | null;
    is_active: boolean;
    created_at: string;
}

interface TopFan {
    rank: number;
    external_user_id: string;
    user_id: string | null;
    display_name: string;
    username: string;
    avatar_url: string | null;
    is_linked: boolean;
    message_count: number;
    total_events: number;
    score: number;
}

const BOT_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1497933681271242822&permissions=68608&scope=bot+applications.commands';

/* ─────────── Component ─────────── */
export default function SocialPage() {
    // Discord connection state
    const [connection, setConnection] = useState<DiscordChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Guild ID input state
    const [guildId, setGuildId] = useState('');
    const [saving, setSaving] = useState(false);

    // Top fans state
    const [fans, setFans] = useState<TopFan[]>([]);
    const [totalFans, setTotalFans] = useState(0);
    const [fansLoading, setFansLoading] = useState(true);

    // Copy state
    const [copied, setCopied] = useState(false);


    /* ─── Fetch Discord Connection ─── */
    const fetchConnection = useCallback(async () => {
        try {
            const res = await fetch('/api/creator/social/discord');
            const data = await res.json();
            if (data.connected && data.channel) {
                setConnection(data.channel);
                setIsConnected(true);
            } else {
                setConnection(null);
                setIsConnected(false);
            }
        } catch {
            console.error('Failed to fetch Discord connection');
        } finally {
            setLoading(false);
        }
    }, []);

    /* ─── Fetch Top Fans ─── */
    const fetchTopFans = useCallback(async () => {
        try {
            const res = await fetch('/api/creator/top-fans?limit=10');
            const data = await res.json();
            setFans(data.fans || []);
            setTotalFans(data.total || 0);
        } catch {
            console.error('Failed to fetch top fans');
        } finally {
            setFansLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnection();
        fetchTopFans();
    }, [fetchConnection, fetchTopFans]);

    /* ─── Connect Discord (Save Guild ID) ─── */
    const handleSaveServer = async () => {
        setError('');
        setSuccess('');

        if (!guildId.trim()) {
            setError('Please enter your Discord Server ID');
            return;
        }

        if (!/^\d{17,22}$/.test(guildId.trim())) {
            setError('Invalid Server ID format. It should be 17-22 digits.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/discord/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guild_id: guildId.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to connect server');
                return;
            }

            setSuccess('Discord server connected successfully!');
            setGuildId('');
            await fetchConnection();
            await fetchTopFans();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /* ─── Disconnect Discord ─── */
    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Discord server? Tracking will stop.')) return;

        setDisconnecting(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/creator/social/discord', { method: 'DELETE' });
            if (res.ok) {
                setConnection(null);
                setIsConnected(false);
                setSuccess('Discord server disconnected.');
            } else {
                setError('Failed to disconnect.');
            }
        } catch {
            setError('Network error.');
        } finally {
            setDisconnecting(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-3 py-20 text-gray-400 font-medium w-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Initializing Workspace...</span>
            </div>
        );
    }

    return (
        <div className="social-hub-wrapper">
            <div className="social-container">
                {/* Header */}
                <div className="social-header">
                    <h1 className="social-title">Social Hub</h1>
                    <p className="social-subtitle">
                        Connect your platforms, track real-time community activity, and discover your top fans across your entire ecosystem.
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-box alert-error">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}
                {success && (
                    <div className="alert-box alert-success">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                        <button onClick={() => setSuccess('')} className="alert-close">×</button>
                    </div>
                )}

                <div className="social-grid">
                    {/* ══════════════════════════════════════════════ */}
                    {/* Section A: Discord Connection                 */}
                    {/* ══════════════════════════════════════════════ */}
                    <div className="premium-card">
                        <div className="card-header">
                            <div className="discord-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="card-title">Discord Integration</h2>
                                <p className="card-subtitle">Server engagement analytics</p>
                            </div>
                            {isConnected && (
                                <span className="status-badge">
                                    <span className="pulse-dot" />
                                    Active
                                </span>
                            )}
                        </div>

                        {isConnected && connection ? (
                            <div>
                                <div className="info-panel">
                                    <div className="info-row">
                                        <div className="info-label">
                                            <Hash className="w-4 h-4" /> Server Name
                                        </div>
                                        <span className="info-value">{connection.channel_name || 'Unnamed Server'}</span>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-label">
                                            <Shield className="w-4 h-4" /> Server ID
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="code-box">
                                                {connection.external_channel_id}
                                            </span>
                                            <button onClick={() => handleCopy(connection.external_channel_id)} className="text-gray-400 hover:text-white p-1 transition-colors">
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="disconnect-btn"
                                >
                                    {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect Integration'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="text-center py-4 mb-4">
                                    <h3 className="text-xl font-bold text-white mb-3">Connect Your Community</h3>
                                    <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                                        Add the bot to your Discord server, then paste your Server ID below to start tracking engagement.
                                    </p>
                                </div>

                                {/* Step 1: Connect Discord Button */}
                                <a
                                    href={BOT_INVITE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="connect-btn"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 relative z-10">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    <span className="relative z-10">Connect Discord</span>
                                    <ExternalLink className="w-4 h-4 relative z-10 opacity-60" />
                                </a>

                                {/* Step 2: Server ID Input */}
                                <div className="server-id-section">
                                    <label className="server-id-label">
                                        <Shield className="w-4 h-4" />
                                        Enter your Discord Server ID
                                    </label>
                                    <div className="server-id-input-group">
                                        <input
                                            type="text"
                                            value={guildId}
                                            onChange={(e) => setGuildId(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveServer(); }}
                                            placeholder="e.g. 1234567890123456789"
                                            className="server-id-input"
                                        />
                                        <button
                                            onClick={handleSaveServer}
                                            disabled={saving || !guildId.trim()}
                                            className="save-server-btn"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            {saving ? 'Saving...' : 'Save Server'}
                                        </button>
                                    </div>
                                    <p className="server-id-hint">
                                        Open Discord → Right-click your server name → Server Settings → Widget → Copy Server ID
                                    </p>
                                </div>

                                <div className="steps-container">
                                    <h4 className="steps-title">Setup Process</h4>
                                    <div className="step-item">
                                        <div className="step-number">1</div>
                                        <span>Click &quot;Connect Discord&quot; to add the bot to your server</span>
                                    </div>
                                    <div className="step-item">
                                        <div className="step-number">2</div>
                                        <span>Copy your Discord Server ID from server settings</span>
                                    </div>
                                    <div className="step-item">
                                        <div className="step-number">3</div>
                                        <span>Paste the ID above and click &quot;Save Server&quot;</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════ */}
                    {/* Section B: Top Fans Leaderboard               */}
                    {/* ══════════════════════════════════════════════ */}
                    <div className="premium-card">
                        <div className="leaderboard-header">
                            <h3 className="leaderboard-title">
                                <Trophy className="w-6 h-6 text-indigo-400" />
                                Global Leaderboard
                            </h3>
                            {totalFans > 0 && <span className="fans-count">{totalFans} Active Fans</span>}
                        </div>

                        {fansLoading ? (
                            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin" /> Compiling rankings...
                            </div>
                        ) : fans.length === 0 ? (
                            <div className="empty-state">
                                <Users className="w-12 h-12 text-slate-600 mx-auto empty-icon" />
                                <h3 className="empty-title">Awaiting Activity</h3>
                                <p className="empty-subtitle">Once your server is linked, top contributors will be immortalized here.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {fans.map((fan, i) => (
                                    <div key={fan.external_user_id} className="fan-row">
                                        <div className={`rank-badge ${
                                            i === 0 ? 'rank-1' :
                                            i === 1 ? 'rank-2' :
                                            i === 2 ? 'rank-3' :
                                            'rank-other'
                                        }`}>
                                            {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `${i + 1}`}
                                        </div>
                                        
                                        <div className="avatar-wrapper">
                                            {fan.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={fan.avatar_url} alt={fan.display_name} className="avatar-img" />
                                            ) : (
                                                <span className="avatar-fallback">{fan.display_name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>

                                        <div className="fan-info">
                                            <div className="fan-name">
                                                {fan.display_name}
                                                {fan.is_linked && <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label="Linked account" />}
                                            </div>
                                            <div className="fan-username">
                                                @{fan.username}
                                            </div>
                                        </div>

                                        <div className="fan-stats">
                                            <div className="stat-item stat-msgs">
                                                <MessageSquare className="w-3.5 h-3.5" /> {fan.message_count}
                                            </div>
                                            <div className="stat-item stat-pts">
                                                <Crown className="w-3.5 h-3.5" /> {fan.score}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
