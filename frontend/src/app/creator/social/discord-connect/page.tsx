'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CheckCircle2, AlertCircle, Loader2, ArrowLeft,
    Server, Crown, Shield, ChevronRight,
} from 'lucide-react';

/* ─────────── Types ─────────── */
interface DiscordGuildInfo {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
}

interface DiscordUserInfo {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
}

interface CallbackData {
    discord_user: DiscordUserInfo;
    guilds: DiscordGuildInfo[];
    bot_guild_id: string | null;
    bot_guild_name: string | null;
}

/* ─────────── Inner Component (uses useSearchParams) ─────────── */
function DiscordConnectInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [data, setData] = useState<CallbackData | null>(null);
    const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Parse the data from URL on mount
    useEffect(() => {
        const encoded = searchParams.get('data');
        if (!encoded) {
            setError('No Discord data received. Please try connecting again.');
            return;
        }
        try {
            const decoded = JSON.parse(
                Buffer.from(encoded, 'base64url').toString('utf-8')
            );
            setData(decoded);
            // Auto-select the guild where bot was added (if any)
            if (decoded.bot_guild_id) {
                setSelectedGuild(decoded.bot_guild_id);
            }
        } catch {
            setError('Failed to parse Discord data. Please try connecting again.');
        }
    }, [searchParams]);

    /* ─── Save selected guild ─── */
    const handleSave = async () => {
        if (!selectedGuild || !data) return;

        const guild = data.guilds.find((g) => g.id === selectedGuild);
        if (!guild && selectedGuild !== data.bot_guild_id) {
            setError('Please select a server.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const guildName = guild?.name || data.bot_guild_name || 'Discord Server';
            const res = await fetch('/api/creator/social/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guild_id: selectedGuild,
                    guild_name: guildName,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Failed to save connection');
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push('/creator/social'), 2000);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getGuildIcon = (guild: DiscordGuildInfo) => {
        if (guild.icon) {
            return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
        }
        return null;
    };

    /* ─── Loading / Error states ─── */
    if (error && !data) {
        return (
            <div className="max-w-lg mx-auto mt-12 space-y-6 animate-fade-in">
                <div className="card p-8">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertCircle className="w-6 h-6" />
                        <h2 className="text-lg font-bold">Connection Failed</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/creator/social')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Social Hub
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center gap-3 py-20 text-gray-500 font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading Discord data...</span>
            </div>
        );
    }

    /* ─── Success state ─── */
    if (success) {
        return (
            <div className="max-w-lg mx-auto mt-12 animate-fade-in">
                <div className="card p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Server Connected!</h2>
                    <p className="text-sm text-gray-500">
                        Your Discord server is now linked. The bot will start tracking
                        community engagement automatically.
                    </p>
                    <p className="text-xs text-gray-400">Redirecting to Social Hub...</p>
                </div>
            </div>
        );
    }

    /* ─── Server selection ─── */
    const allGuilds = [...data.guilds];
    // If bot was added to a guild not in the user's list, add it
    if (data.bot_guild_id && !allGuilds.find((g) => g.id === data.bot_guild_id)) {
        allGuilds.unshift({
            id: data.bot_guild_id,
            name: data.bot_guild_name || 'Discord Server',
            icon: null,
            owner: true,
        });
    }

    return (
        <div className="max-w-2xl mx-auto mt-8 space-y-8 pb-12 animate-fade-in">
            {/* Back button */}
            <button
                onClick={() => router.push('/creator/social')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Social Hub
            </button>

            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Select Your Server</h1>
                        <p className="text-gray-500 mt-1">
                            Connected as <span className="font-semibold text-gray-700">{data.discord_user.global_name || data.discord_user.username}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Bot added notification */}
            {data.bot_guild_id && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>
                        Bot was added to <strong>{data.bot_guild_name || 'your server'}</strong>.
                        {data.bot_guild_id === selectedGuild
                            ? ' This server is selected below.'
                            : ' Select it below to start tracking.'}
                    </span>
                </div>
            )}

            {/* Server list */}
            <div className="card">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Your Servers ({allGuilds.length})
                </h3>

                {allGuilds.length === 0 ? (
                    <div className="text-center py-10">
                        <Server className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                            No servers found where you have manage permissions.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allGuilds.map((guild) => {
                            const iconUrl = getGuildIcon(guild);
                            const isSelected = selectedGuild === guild.id;
                            const isBotGuild = guild.id === data.bot_guild_id;

                            return (
                                <button
                                    key={guild.id}
                                    onClick={() => setSelectedGuild(guild.id)}
                                    className={`
                                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                                        ${isSelected
                                            ? 'border-gray-900 bg-gray-50 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {/* Server icon */}
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {iconUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={iconUrl}
                                                alt={guild.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-400">
                                                {guild.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Server info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                                            {guild.name}
                                            {guild.owner && (
                                                <Crown className="w-3.5 h-3.5 text-amber-500" aria-label="Owner" />
                                            )}
                                            {isBotGuild && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                                    <Shield className="w-2.5 h-2.5" /> Bot Added
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5 font-mono">
                                            ID: {guild.id}
                                        </div>
                                    </div>

                                    {/* Selection indicator */}
                                    <div className="flex-shrink-0">
                                        {isSelected ? (
                                            <CheckCircle2 className="w-5 h-5 text-gray-900" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-300" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action button */}
            <button
                onClick={handleSave}
                disabled={saving || !selectedGuild}
                className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                {saving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting Server...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        Connect Selected Server
                    </>
                )}
            </button>
        </div>
    );
}

/* ─────────── Page Wrapper (Suspense boundary for useSearchParams) ─── */
export default function DiscordConnectPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center gap-3 py-20 text-gray-500 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            }
        >
            <DiscordConnectInner />
        </Suspense>
    );
}
