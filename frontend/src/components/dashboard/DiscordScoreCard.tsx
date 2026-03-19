'use client';

/**
 * DiscordScoreCard
 * ----------------
 * Displays a user's aggregated Discord engagement points.
 * Fetches from GET /api/discord/score — no props required.
 *
 * Design: matches the existing fan dashboard card style exactly
 * (uses CSS variables: --dash-card, --dash-border, --dash-text-*, etc.)
 *
 * Usage in fan/page.tsx (Server Component):
 *   import { DiscordScoreCard } from '@/components/dashboard/DiscordScoreCard';
 *   <DiscordScoreCard />
 *
 * Future extension:
 *   - Add a "Connect Discord" button when discord_points === 0
 *   - Show per-event breakdown expandable panel
 */

import { useEffect, useState } from 'react';

// Discord logo SVG — inline to avoid external dependencies
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
    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        let cancelled = false;

        async function fetchScore() {
            try {
                const res = await fetch('/api/discord/score', { cache: 'no-store' });
                if (!res.ok) {
                    // 401 = not logged in (shouldn't happen inside fan layout), others = server error
                    if (!cancelled) setStatus('error');
                    return;
                }
                const json = await res.json();
                if (!cancelled) {
                    setDiscordPoints(json.discord_points ?? 0);
                    setStatus('success');
                }
            } catch {
                if (!cancelled) setStatus('error');
            }
        }

        fetchScore();
        return () => { cancelled = true; };
    }, []);

    // ── Styles — mirrors the dashboard card design system ─────────────────────
    const cardStyle: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '14px',
        boxShadow: 'var(--dash-shadow-sm)',
        padding: '20px',
        minHeight: '96px',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
    };

    const iconWrapStyle: React.CSSProperties = {
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

    // Subtle purple accent strip at the left edge (Discord brand nod)
    const accentStripStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        borderRadius: '14px 0 0 14px',
        background: 'linear-gradient(180deg, #5865F2 0%, #7289da 100%)',
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={cardStyle} className="hover:-translate-y-0.5">
            {/* Discord brand accent strip */}
            <div style={accentStripStyle} aria-hidden="true" />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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

            {/* Points value */}
            <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--dash-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: '6px',
            }}>
                {status === 'loading' ? (
                    // Skeleton shimmer — matches the existing dashboard loading feel
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
                {status === 'success' && discordPoints === 0
                    ? 'Connect Discord to start earning'
                    : 'Earn points by chatting in Discord'}
            </div>

            {/* Pulse animation for skeleton */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
