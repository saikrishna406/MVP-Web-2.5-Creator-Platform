import { createClient } from '@/lib/supabase/server';
import {
    Coins, Star, Newspaper, ShoppingBag,
    TrendingUp, Gift, ChevronRight, ArrowUpRight,
    ArrowDownRight, Clock
} from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { DiscordScoreCard } from '@/components/dashboard/DiscordScoreCard';
import { CreatorPostsFeed } from '@/components/dashboard/CreatorPostsFeed';

export const metadata = {
    title: 'Fan Dashboard | Black Bolts',
    description: 'Your fan dashboard — track tokens, points, and discover content.',
};

export default async function FanDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // token_transactions table (schema.sql)
    const { data: recentTxs } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // point_transactions table (schema.sql)
    const { data: recentPointTxs } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Use count-only queries to avoid loading all rows into memory
    const { count: unlockedCount } = await supabase
        .from('post_unlocks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { count: ordersCount } = await supabase
        .from('redemption_orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Phase 2: Active memberships
    const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('id, tier_id, current_period_end, membership_tiers(name, price, creator_id, profiles!membership_tiers_creator_id_fkey(display_name, username, avatar_url))')
        .eq('fan_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // Phase 2: Upcoming event tickets
    const { data: myTickets } = await supabase
        .from('event_tickets')
        .select('id, event_id, purchased_at, events(title, event_date, location, stream_url, creator_id)')
        .eq('fan_id', user.id)
        .eq('status', 'valid')
        .order('purchased_at', { ascending: false })
        .limit(5);

    const upcomingTickets = (myTickets || []).filter(t => {
        const ev = t.events as unknown as { event_date: string } | null;
        return ev && new Date(ev.event_date) > new Date();
    });

    // Phase 2: Founder pass badges
    const { data: founderPasses } = await supabase
        .from('founder_pass_purchases')
        .select('id, creator_id, purchased_at, profiles!founder_pass_purchases_creator_id_fkey(display_name, username)')
        .eq('fan_id', user.id)
        .order('purchased_at', { ascending: false });

    // ── Styles ──────────────────────────────────────
    const cardStyle: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '14px',
        boxShadow: 'var(--dash-shadow-sm)',
        transition: 'all 0.15s ease',
    };

    const iconWrapStyle: React.CSSProperties = {
        borderRadius: '10px',
        background: 'var(--dash-bg)',
        border: '1px solid var(--dash-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };

    const stats = [
        {
            label: 'Creator Tokens',
            value: formatTokens(wallet?.token_balance || 0),
            desc: 'Unlock exclusive content',
            icon: Coins,
        },
        {
            label: 'Points Earned',
            value: formatPoints(wallet?.points_balance || 0),
            desc: 'From engagement activity',
            icon: Star,
        },
        {
            label: 'Content Unlocked',
            value: unlockedCount || 0,
            desc: 'Premium posts accessed',
            icon: Newspaper,
        },
        {
            label: 'Items Redeemed',
            value: ordersCount || 0,
            desc: 'Rewards claimed',
            icon: ShoppingBag,
        },
    ];

    const actions = [
        { href: '/fan/wallet', icon: Coins, title: 'Buy Tokens', sub: 'Support your favorite creators' },
        { href: '/fan/feed',   icon: Newspaper, title: 'Browse Feed', sub: 'Discover exclusive content' },
        { href: '/fan/store',  icon: Gift, title: 'Redeem Points', sub: 'Get rewards for engagement' },
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--dash-text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                }}>
                    Welcome back, {profile?.display_name} 👋
                </h1>
                <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--dash-text-secondary)',
                    margin: 0,
                }}>
                    Here&apos;s your creator economy overview. Support, engage, and earn.
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '20px',
                marginBottom: '24px',
            }}
                className="fan-stats-grid"
            >
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        style={{ ...cardStyle, padding: '20px', minHeight: '96px' }}
                        className="hover:-translate-y-0.5"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ ...iconWrapStyle, width: '36px', height: '36px' }}>
                                <stat.icon style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)' }}>
                                {stat.label}
                            </span>
                        </div>
                        <div style={{
                            fontSize: '32px', fontWeight: 700, color: 'var(--dash-text-primary)',
                            letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px',
                        }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)' }}>
                            {stat.desc}
                        </div>
                    </div>
                ))}
                {/* Discord Activity — 5th card, client-side fetch */}
                <DiscordScoreCard />
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '16px', fontWeight: 700,
                    color: 'var(--dash-text-primary)', marginBottom: '12px',
                }}>
                    Quick Actions
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '16px',
                }}
                    className="fan-actions-grid"
                >
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            style={{
                                ...cardStyle,
                                padding: '18px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textDecoration: 'none',
                            }}
                            className="group hover:-translate-y-0.5"
                        >
                            <div style={{ ...iconWrapStyle, width: '40px', height: '40px', borderRadius: '12px' }}>
                                <action.icon style={{ width: '20px', height: '20px', color: 'var(--dash-text-secondary)' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dash-text-primary)', lineHeight: 1.3 }}>
                                    {action.title}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                                    {action.sub}
                                </div>
                            </div>
                            <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--dash-border-hover)', flexShrink: 0 }} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Latest Posts from Creators ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '12px',
                }}>
                    <h2 style={{
                        fontSize: '16px', fontWeight: 700,
                        color: 'var(--dash-text-primary)', margin: 0,
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <Newspaper style={{ width: '16px', height: '16px', color: 'var(--dash-text-secondary)' }} />
                        Latest Posts
                    </h2>
                    <Link
                        href="/fan/feed"
                        style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none' }}
                    >
                        See all →
                    </Link>
                </div>
                {/* Client component — fetches + renders latest 3 posts with like/comment/unlock */}
                <CreatorPostsFeed limit={3} />
            </div>

            {/* Recent Activity */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
            }}
                className="fan-activity-grid"
            >
                {/* Token Activity */}
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 22px', borderBottom: '1px solid var(--dash-border)',
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: 0 }}>
                            <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--dash-text-secondary)' }} />
                            Recent Token Activity
                        </h3>
                        <Link href="/fan/wallet" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none' }}>
                            View all
                        </Link>
                    </div>
                    <div>
                        {recentTxs && recentTxs.length > 0 ? recentTxs.map((tx, i) => (
                            <div key={tx.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 22px',
                                borderBottom: i < recentTxs.length - 1 ? '1px solid var(--dash-border)' : 'none',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: tx.amount > 0 ? 'var(--dash-success-bg)' : 'var(--dash-accent-soft)',
                                    color: tx.amount > 0 ? 'var(--dash-success-text)' : 'var(--dash-text-secondary)',
                                }}>
                                    {tx.amount > 0
                                        ? <ArrowDownRight style={{ width: '14px', height: '14px' }} />
                                        : <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tx.description || tx.type}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <Clock style={{ width: '10px', height: '10px', color: 'var(--dash-text-muted)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--dash-text-muted)', fontWeight: 500 }}>
                                            {formatRelativeTime(tx.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                    color: tx.amount > 0 ? 'var(--dash-success-text)' : 'var(--dash-text-primary)',
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{formatTokens(tx.amount)}
                                </div>
                            </div>
                        )) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', padding: '32px 20px', gap: '6px',
                                color: 'var(--dash-text-muted)', textAlign: 'center',
                            }}>
                                <Coins style={{ width: '20px', height: '20px' }} />
                                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>No token activity yet</p>
                                <Link href="/fan/wallet" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none', marginTop: '4px' }}>
                                    Buy tokens →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Points Activity */}
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 22px', borderBottom: '1px solid var(--dash-border)',
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: 0 }}>
                            <Star style={{ width: '16px', height: '16px', color: 'var(--dash-text-secondary)' }} />
                            Recent Points Activity
                        </h3>
                    </div>
                    <div>
                        {recentPointTxs && recentPointTxs.length > 0 ? recentPointTxs.map((tx, i) => (
                            <div key={tx.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 22px',
                                borderBottom: i < recentPointTxs.length - 1 ? '1px solid var(--dash-border)' : 'none',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--dash-accent-soft)',
                                    color: 'var(--dash-text-secondary)',
                                }}>
                                    <Star style={{ width: '14px', height: '14px' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tx.description || tx.action}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <Clock style={{ width: '10px', height: '10px', color: 'var(--dash-text-muted)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--dash-text-muted)', fontWeight: 500 }}>
                                            {formatRelativeTime(tx.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)', flexShrink: 0 }}>
                                    +{tx.amount} pts
                                </div>
                            </div>
                        )) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', padding: '32px 20px', gap: '6px',
                                color: 'var(--dash-text-muted)', textAlign: 'center',
                            }}>
                                <Star style={{ width: '20px', height: '20px' }} />
                                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>Start engaging to earn points!</p>
                                <Link href="/fan/feed" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none', marginTop: '4px' }}>
                                    Browse content →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Phase 2: Active Memberships */}
            {activeSubs && activeSubs.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '12px' }}>
                        Active Memberships
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeSubs.map((sub: any) => {
                            const tier = sub.membership_tiers as any;
                            const creator = tier?.profiles as any;
                            return (
                                <div key={sub.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--dash-text-secondary)', flexShrink: 0, overflow: 'hidden' }}>
                                        {creator?.avatar_url
                                            ? <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : (creator?.display_name?.[0] || '?')}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>{tier?.name}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                                            @{creator?.username} · Renews {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '—'}
                                        </div>
                                    </div>
                                    <Link href={`/fan/${creator?.username}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none', flexShrink: 0 }}>
                                        View Hub →
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Phase 2: Upcoming Event Tickets */}
            {upcomingTickets.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '12px' }}>
                        Upcoming Events
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {upcomingTickets.map((t: any) => {
                            const ev = t.events as any;
                            return (
                                <div key={t.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ ...iconWrapStyle, width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }}>
                                        <Clock style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev?.title}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                                            {ev?.event_date ? new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                                            {ev?.location ? ` · ${ev.location}` : ev?.stream_url ? ' · Virtual' : ''}
                                        </div>
                                    </div>
                                    {ev?.stream_url && (
                                        <Link href={ev.stream_url} target="_blank" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none', flexShrink: 0 }}>
                                            Join →
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Phase 2: Founder Badges */}
            {founderPasses && founderPasses.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '12px' }}>
                        Founder Passes
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {founderPasses.map((fp: any) => {
                            const creator = fp.profiles as any;
                            return (
                                <div key={fp.id} style={{ ...cardStyle, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '18px' }}>🔥</div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>@{creator?.username} Founder</div>
                                        <div style={{ fontSize: '11px', color: 'var(--dash-text-muted)', marginTop: '2px' }}>Since {fp.purchased_at ? new Date(fp.purchased_at).toLocaleDateString() : '—'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Responsive overrides */}
            <style>{`
                @media (max-width: 1280px) {
                    .fan-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                }
                @media (max-width: 1024px) {
                    .fan-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .fan-actions-grid { grid-template-columns: 1fr !important; }
                    .fan-activity-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .fan-stats-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
