'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Share2, Link2, Unlink, CheckCircle2, AlertCircle, Copy, Check,
    Trophy, MessageSquare, Crown, Users, ExternalLink, Loader2,
    Hash, Shield,
} from 'lucide-react';

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

/* ─────────── Component ─────────── */
export default function SocialPage() {
    // Discord connection state
    const [connection, setConnection] = useState<DiscordChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [guildId, setGuildId] = useState('');
    const [guildName, setGuildName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Top fans state
    const [fans, setFans] = useState<TopFan[]>([]);
    const [totalFans, setTotalFans] = useState(0);
    const [fansLoading, setFansLoading] = useState(true);

    // Copy state
    const [copied, setCopied] = useState(false);

    const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=66560&scope=bot`;

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

    /* ─── Connect Discord ─── */
    const handleConnect = async () => {
        setError('');
        setSuccess('');

        if (!guildId.trim()) {
            setError('Please enter your Discord Server ID');
            return;
        }

        // Basic validation: Discord IDs are numeric strings
        if (!/^\d{17,22}$/.test(guildId.trim())) {
            setError('Invalid Server ID format. Discord IDs are 17-22 digit numbers.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/creator/social/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guild_id: guildId.trim(),
                    guild_name: guildName.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to connect');
                return;
            }

            setSuccess('Discord server connected successfully!');
            setGuildId('');
            setGuildName('');
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

    /* ─── Copy Guild ID ─── */
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'social-rank social-rank--gold';
        if (rank === 2) return 'social-rank social-rank--silver';
        if (rank === 3) return 'social-rank social-rank--bronze';
        return 'social-rank';
    };

    const getRankLabel = (rank: number) => {
        if (rank === 1) return '🏆';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    if (loading) {
        return (
            <div className="social-loading">
                <Loader2 className="social-loading__spinner" />
                <span>Loading social integrations...</span>
            </div>
        );
    }

    return (
        <div className="social-page">
            {/* ─── Header ─── */}
            <div className="social-header animate-fade-in-up">
                <h1 className="social-header__title">Social</h1>
                <p className="social-header__subtitle">
                    Connect your community platforms and track fan engagement
                </p>
            </div>

            {/* ─── Alerts ─── */}
            {error && (
                <div className="social-alert social-alert--error">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="social-alert__close">×</button>
                </div>
            )}
            {success && (
                <div className="social-alert social-alert--success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="social-alert__close">×</button>
                </div>
            )}

            <div className="social-grid">
                {/* ══════════════════════════════════════════════ */}
                {/* Section A: Discord Connection                 */}
                {/* ══════════════════════════════════════════════ */}
                <div className="social-card social-card--discord">
                    <div className="social-card__header">
                        <div className="social-card__icon social-card__icon--discord">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="social-card__title">Discord Integration</h2>
                            <p className="social-card__desc">Track fan engagement from your Discord server</p>
                        </div>
                        {isConnected && (
                            <span className="social-badge social-badge--connected">
                                <span className="social-badge__dot" />
                                Connected
                            </span>
                        )}
                    </div>

                    {isConnected && connection ? (
                        /* ─── Connected State ─── */
                        <div className="social-connected">
                            <div className="social-connected__info">
                                <div className="social-connected__row">
                                    <Hash className="w-4 h-4 social-connected__icon" />
                                    <span className="social-connected__label">Server Name</span>
                                    <span className="social-connected__value">
                                        {connection.channel_name || 'Unnamed Server'}
                                    </span>
                                </div>
                                <div className="social-connected__row">
                                    <Shield className="w-4 h-4 social-connected__icon" />
                                    <span className="social-connected__label">Server ID</span>
                                    <span className="social-connected__value social-connected__value--mono">
                                        {connection.external_channel_id}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(connection.external_channel_id)}
                                        className="social-connected__copy"
                                        title="Copy Server ID"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <div className="social-connected__row">
                                    <CheckCircle2 className="w-4 h-4 social-connected__icon social-connected__icon--active" />
                                    <span className="social-connected__label">Status</span>
                                    <span className="social-connected__value social-connected__value--active">
                                        {connection.is_active ? 'Active — Tracking events' : 'Paused'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="social-btn social-btn--danger"
                            >
                                {disconnecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Unlink className="w-4 h-4" />
                                )}
                                {disconnecting ? 'Disconnecting...' : 'Disconnect Server'}
                            </button>
                        </div>
                    ) : (
                        /* ─── Not Connected State ─── */
                        <div className="social-setup">
                            {/* Step 1 */}
                            <div className="social-step">
                                <div className="social-step__number">1</div>
                                <div className="social-step__content">
                                    <h3 className="social-step__title">Add the bot to your server</h3>
                                    <p className="social-step__desc">
                                        Invite the Black Bolts bot to your Discord server. It only needs read permissions.
                                    </p>
                                    <a
                                        href={BOT_INVITE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="social-btn social-btn--outline"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Invite Bot to Server
                                    </a>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="social-step">
                                <div className="social-step__number">2</div>
                                <div className="social-step__content">
                                    <h3 className="social-step__title">Enter your Server ID</h3>
                                    <p className="social-step__desc">
                                        Right-click your server name → Copy Server ID. Enable Developer Mode in Discord Settings if needed.
                                    </p>
                                    <div className="social-form">
                                        <div className="social-input-group">
                                            <label className="social-input-label">Server ID *</label>
                                            <input
                                                type="text"
                                                value={guildId}
                                                onChange={(e) => setGuildId(e.target.value)}
                                                placeholder="e.g. 123456789012345678"
                                                className="social-input"
                                            />
                                        </div>
                                        <div className="social-input-group">
                                            <label className="social-input-label">Server Name (optional)</label>
                                            <input
                                                type="text"
                                                value={guildName}
                                                onChange={(e) => setGuildName(e.target.value)}
                                                placeholder="e.g. My Creator Community"
                                                className="social-input"
                                            />
                                        </div>
                                        <button
                                            onClick={handleConnect}
                                            disabled={saving || !guildId.trim()}
                                            className="social-btn social-btn--primary"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Link2 className="w-4 h-4" />
                                            )}
                                            {saving ? 'Connecting...' : 'Connect Server'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════ */}
                {/* Section B: Top Fans Leaderboard               */}
                {/* ══════════════════════════════════════════════ */}
                <div className="social-card">
                    <div className="social-card__header">
                        <div className="social-card__icon social-card__icon--fans">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="social-card__title">Top Fans</h2>
                            <p className="social-card__desc">
                                Your most engaged community members
                                {totalFans > 0 && <span className="social-card__count"> · {totalFans} total</span>}
                            </p>
                        </div>
                    </div>

                    {fansLoading ? (
                        <div className="social-loading social-loading--sm">
                            <Loader2 className="social-loading__spinner" />
                            <span>Loading leaderboard...</span>
                        </div>
                    ) : fans.length === 0 ? (
                        <div className="social-empty">
                            <Users className="social-empty__icon" />
                            <h3 className="social-empty__title">No fan activity yet</h3>
                            <p className="social-empty__desc">
                                Connect your Discord server and your fans&apos; engagement will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="social-leaderboard">
                            {fans.map((fan) => (
                                <div key={fan.external_user_id} className="social-fan">
                                    {/* Rank */}
                                    <div className={getRankStyle(fan.rank)}>
                                        {getRankLabel(fan.rank)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="social-fan__avatar">
                                        {fan.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={fan.avatar_url} alt={fan.display_name} className="social-fan__avatar-img" />
                                        ) : (
                                            <span className="social-fan__avatar-initials">
                                                {fan.display_name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="social-fan__info">
                                        <div className="social-fan__name">
                                            {fan.display_name}
                                            {fan.is_linked && (
                                                <span className="social-fan__linked" aria-label="Linked account">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="social-fan__username">@{fan.username}</div>
                                    </div>

                                    {/* Stats */}
                                    <div className="social-fan__stats">
                                        <div className="social-fan__stat">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>{fan.message_count}</span>
                                        </div>
                                        <div className="social-fan__score">
                                            <Crown className="w-3.5 h-3.5" />
                                            <span>{fan.score}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
