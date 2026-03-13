import { createClient } from '@/lib/supabase/server';
import {
    Coins, Star, Newspaper, ShoppingBag,
    TrendingUp, Gift, ChevronRight, ArrowUpRight,
    ArrowDownRight, Clock
} from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

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

    const { data: unlockedPosts } = await supabase
        .from('post_unlocks')
        .select('id')
        .eq('user_id', user.id);

    const { data: orders } = await supabase
        .from('redemption_orders')
        .select('id')
        .eq('user_id', user.id);

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
            value: unlockedPosts?.length || 0,
            desc: 'Premium posts accessed',
            icon: Newspaper,
        },
        {
            label: 'Items Redeemed',
            value: orders?.length || 0,
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
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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

            {/* Responsive overrides */}
            <style>{`
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
