'use client';

/**
 * DiscordScoreCard
 * ----------------
 * Displays a user's aggregated Discord engagement points and linking status.
 * Allows users to link their Discord account by generating a link code.
 *
 * Design: matches the existing fan dashboard card style exactly.
 */

import { useEffect, useState, CSSProperties } from 'react';
import { X, Copy, Check, Shield, CheckCircle2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

function DiscordIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
    );
}

type Status = 'loading' | 'success' | 'error';

export function DiscordScoreCard() {
    const [discordPoints, setDiscordPoints] = useState<number>(0);
    const [linked, setLinked] = useState<boolean>(false);
    const [discordUsername, setDiscordUsername] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>('loading');

    // Modal / linking flow state
    const [showModal, setShowModal] = useState<boolean>(false);
    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [generatingCode, setGeneratingCode] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    async function fetchScore(isSilent = false) {
        if (!isSilent) setStatus('loading');
        try {
            const res = await fetch('/api/discord/score', { cache: 'no-store' });
            if (!res.ok) {
                if (!isSilent) setStatus('error');
                return null;
            }
            const json = await res.json();
            setDiscordPoints(json.discord_points ?? 0);
            setLinked(json.linked ?? false);
            setDiscordUsername(json.discord_username ?? null);
            if (!isSilent) setStatus('success');
            return json;
        } catch {
            if (!isSilent) setStatus('error');
            return null;
        }
    }

    useEffect(() => {
        fetchScore();
    }, []);

    const handleGenerateCode = async () => {
        setGeneratingCode(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/link/discord/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (!res.ok) {
                setErrorMsg(json.error || 'Failed to generate code');
            } else {
                setLinkCode(json.code);
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setGeneratingCode(false);
        }
    };

    const openLinkModal = () => {
        setShowModal(true);
        setLinkCode(null);
        setErrorMsg(null);
        handleGenerateCode();
    };

    const handleCopyCode = () => {
        if (!linkCode) return;
        navigator.clipboard.writeText(linkCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckStatus = async () => {
        setRefreshing(true);
        const data = await fetchScore(true);
        setRefreshing(false);
        if (data && data.linked) {
            setShowModal(false);
        }
    };

    // ── Styles — mirrors the dashboard card design system ─────────────────────
    const cardStyle: CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '14px',
        boxShadow: 'var(--dash-shadow-sm)',
        padding: '20px',
        minHeight: '136px',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    };

    const iconWrapStyle: CSSProperties = {
        borderRadius: '10px',
        background: 'var(--dash-bg)',
        border: '1px solid var(--dash-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '36px',
        height: '36px',
    };

    const accentStripStyle: CSSProperties = {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        borderRadius: '14px 0 0 14px',
        background: 'linear-gradient(180deg, #5865F2 0%, #7289da 100%)',
    };

    const connectBtnStyle: CSSProperties = {
        background: '#5865F2',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background 0.2s',
        width: 'fit-content',
        marginTop: '8px',
    };

    // Modal specific styles
    const modalOverlayStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
    };

    const modalStyle: CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: 'var(--dash-shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        color: 'var(--dash-text-primary)',
    };

    const codeBoxStyle: CSSProperties = {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontWeight: 'bold',
        padding: '16px',
        background: 'var(--dash-bg)',
        border: '1px solid var(--dash-border)',
        borderRadius: '8px',
        textAlign: 'center',
        letterSpacing: '2px',
        color: '#5865F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
    };

    const stepStyle: CSSProperties = {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '13px',
        lineHeight: '1.4',
        color: 'var(--dash-text-secondary)',
    };

    const stepNumStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#5865F2',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
        flexShrink: 0,
        marginTop: '2px',
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <div style={cardStyle} className="hover:-translate-y-0.5">
                {/* Discord brand accent strip */}
                <div style={accentStripStyle} aria-hidden="true" />

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ ...iconWrapStyle, color: '#5865F2' }}>
                            <DiscordIcon size={18} />
                        </div>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--dash-text-secondary)',
                        }}>
                            Discord Activity
                        </span>
                    </div>

                    {status === 'success' && linked && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: 'var(--dash-success-bg)',
                            color: 'var(--dash-success-text)',
                            border: '1px solid var(--dash-border)',
                        }}>
                            <Check className="w-3 h-3" /> Connected
                        </span>
                    )}
                </div>

                {/* Points value */}
                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--dash-text-primary)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        marginBottom: '6px',
                    }}>
                        {status === 'loading' ? (
                            <span style={{
                                display: 'inline-block',
                                width: '64px',
                                height: '32px',
                                borderRadius: '6px',
                                background: 'var(--dash-border)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} aria-label="Loading Discord points" />
                        ) : status === 'error' ? (
                            <span style={{ fontSize: '20px', color: 'var(--dash-text-muted)' }}>—</span>
                        ) : (
                            discordPoints.toLocaleString()
                        )}
                    </div>

                    {/* Subtitle */}
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--dash-text-muted)',
                    }}>
                        {status === 'success' && linked ? (
                            <span>Linked as <strong style={{ color: 'var(--dash-text-secondary)' }}>@{discordUsername}</strong></span>
                        ) : status === 'success' ? (
                            'Link your account to earn points'
                        ) : (
                            'Earn points by chatting in Discord'
                        )}
                    </div>
                </div>

                {/* Connect button if not linked */}
                {status === 'success' && !linked && (
                    <button
                        style={connectBtnStyle}
                        onClick={openLinkModal}
                        className="hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Shield className="w-3.5 h-3.5" />
                        Connect Discord
                    </button>
                )}
            </div>

            {/* Account Linking Modal */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--dash-text-muted)',
                                cursor: 'pointer',
                            }}
                            className="hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Modal Header */}
                        <div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                margin: '0 0 6px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{ color: '#5865F2', display: 'flex' }}><DiscordIcon size={20} /></span>
                                Link Discord Account
                            </h3>
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--dash-text-muted)',
                                margin: 0,
                            }}>
                                Connect your Discord profile to start earning and tracking points.
                            </p>
                        </div>

                        {/* Code box section */}
                        <div>
                            {generatingCode ? (
                                <div style={{ ...codeBoxStyle, fontSize: '14px', letterSpacing: 'normal' }}>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Generating your link code...
                                </div>
                            ) : errorMsg ? (
                                <div style={{
                                    ...codeBoxStyle,
                                    fontSize: '13px',
                                    letterSpacing: 'normal',
                                    color: 'var(--dash-text-secondary)',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                }}>
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            ) : (
                                <div style={codeBoxStyle}>
                                    <span>{linkCode}</span>
                                    <button
                                        onClick={handleCopyCode}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: copied ? 'var(--dash-success-text)' : 'var(--dash-text-muted)',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                        }}
                                        className="hover:bg-slate-800 transition-colors"
                                        title="Copy code"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Setup steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dash-text-muted)', margin: 0 }}>
                                Instructions
                            </h4>

                            <div style={stepStyle}>
                                <div style={stepNumStyle}>1</div>
                                <div>
                                    Copy the code above. It is valid for 10 minutes.
                                </div>
                            </div>

                            <div style={stepStyle}>
                                <div style={stepNumStyle}>2</div>
                                <div>
                                    Open the creator&apos;s Discord server. If you haven&apos;t joined yet, get the invite link from the creator page.
                                </div>
                            </div>

                            <div style={stepStyle}>
                                <div style={stepNumStyle}>3</div>
                                <div>
                                    In any channel, type the slash command:
                                    <code style={{
                                        display: 'block',
                                        marginTop: '6px',
                                        padding: '4px 8px',
                                        background: 'var(--dash-bg)',
                                        border: '1px solid var(--dash-border)',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: '#5865F2',
                                        fontWeight: 600,
                                        width: 'fit-content',
                                    }}>
                                        /link code: {linkCode || 'LINK-XXXX'}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={handleCheckStatus}
                                disabled={refreshing || generatingCode || !!errorMsg}
                                style={{
                                    flex: 1,
                                    background: '#5865F2',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'opacity 0.2s',
                                }}
                                className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {refreshing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Check Link Status
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'var(--dash-bg)',
                                    color: 'var(--dash-text-primary)',
                                    border: '1px solid var(--dash-border)',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                className="hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
