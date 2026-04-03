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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-500 font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading social integrations...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
            
            {/* Header */}
            <div className="animate-fade-in-up mt-4 mb-8">
                <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tighter text-gray-900 pb-2">
                    Social Hub
                </h1>
                <p className="text-gray-500 text-xl md:text-2xl font-light tracking-wide max-w-2xl">
                    Connect platforms, track community activity, and discover top fans.
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100 animate-fade-in-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="ml-auto opacity-50 hover:opacity-100">×</button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fade-in-up">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="ml-auto opacity-50 hover:opacity-100">×</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ══════════════════════════════════════════════ */}
                {/* Section A: Discord Connection                 */}
                {/* ══════════════════════════════════════════════ */}
                <div className="card h-fit">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Discord Integration</h2>
                            <p className="text-sm text-gray-500 mt-1">Track community engagement</p>
                        </div>
                        {isConnected && (
                            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Connected
                            </span>
                        )}
                    </div>

                    {isConnected && connection ? (
                        <div className="space-y-6">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3 text-gray-500 font-medium">
                                        <Hash className="w-4 h-4" /> Server Name
                                    </div>
                                    <span className="font-semibold text-gray-900">{connection.channel_name || 'Unnamed Server'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3 text-gray-500 font-medium">
                                        <Shield className="w-4 h-4" /> Server ID
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                            {connection.external_channel_id}
                                        </code>
                                        <button onClick={() => handleCopy(connection.external_channel_id)} className="text-gray-400 hover:text-gray-900 p-1">
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-3 text-gray-500 font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> Status
                                    </div>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                                        Active Tracking
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                {disconnecting ? 'Disconnecting...' : 'Disconnect Server'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">1</div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-1">Add bot to server</h3>
                                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">Invite the Black Bolts bot. It only requires read permissions.</p>
                                    <a
                                        href={BOT_INVITE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-500" /> Invite Bot
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">2</div>
                                <div className="flex-1 w-full">
                                    <h3 className="text-sm font-bold text-gray-900 mb-1">Enter your Server ID</h3>
                                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">Right-click your server name → Copy Server ID. (Requires Developer Mode in Discord Settings)</p>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Server ID *</label>
                                            <input
                                                type="text"
                                                value={guildId}
                                                onChange={(e) => setGuildId(e.target.value)}
                                                placeholder="e.g. 123456789012345678"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Server Name (optional)</label>
                                            <input
                                                type="text"
                                                value={guildName}
                                                onChange={(e) => setGuildName(e.target.value)}
                                                placeholder="e.g. Creator Community"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleConnect}
                                            disabled={saving || !guildId.trim()}
                                            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-all"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
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
                <div className="card h-fit">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-gray-900" />
                            Discord Leaderboard
                        </h3>
                        {totalFans > 0 && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{totalFans} Tracked Fans</span>}
                    </div>

                    {fansLoading ? (
                        <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin" /> Fetching leaderboard...
                        </div>
                    ) : fans.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                            <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No fan activity yet</h3>
                            <p className="text-xs text-gray-500 max-w-[250px] mx-auto">Connect your server and fans engagement will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fans.map((fan, i) => (
                                <div key={fan.external_user_id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 hover:-mx-4 hover:px-4 rounded-lg transition-colors">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${i === 0 ? 'bg-gray-900 text-white border-gray-900' :
                                        i === 1 ? 'bg-gray-100 text-gray-900 border-gray-200' :
                                        i === 2 ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                        'bg-white text-gray-400 border-gray-100'
                                    }`}>
                                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    
                                    <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {fan.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={fan.avatar_url} alt={fan.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-500">{fan.display_name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 truncate tracking-tight flex items-center gap-1.5">
                                            {fan.display_name}
                                            {fan.is_linked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-label="Linked account" />}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                            @{fan.username}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-900 flex-shrink-0">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="flex items-center gap-1 text-gray-500"><MessageSquare className="w-3 h-3" /> {fan.message_count} msgs</span>
                                            <span className="flex items-center gap-1 text-gray-900"><Crown className="w-3.5 h-3.5 text-amber-500" /> {fan.score} pts</span>
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

