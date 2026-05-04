import { createClient } from '@/lib/supabase/server';
import {
    Coins,
    Users,
    ShoppingBag,
    FileText,
    TrendingUp,
    Eye,
    ArrowRight,
    Clock,
    Plus,
    BarChart3,
    Settings,
    Store
} from 'lucide-react';
import { formatTokens, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Creator Dashboard | Black Bolts Provisions',
    description: 'Manage your content, track earnings, and engage with fans.',
};

export default async function CreatorDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

    // Fetch unlock stats scoped to this creator's posts only (server-side aggregation)
    const { data: unlockStats } = await supabase
        .from('post_unlocks')
        .select('user_id, tokens_spent, posts!inner(creator_id)')
        .eq('posts.creator_id', user.id);

    const creatorUnlocks = unlockStats || [];
    const totalTokensEarned = creatorUnlocks.reduce((sum, u) => sum + (u.tokens_spent || 0), 0);
    const uniqueFans = new Set(creatorUnlocks.map((u: any) => u.user_id)).size;

    // Fetch pending redemption orders scoped to creator's own items
    const { data: orders } = await supabase
        .from('redemption_orders')
        .select(`
      *,
      item:redemption_items!redemption_orders_item_id_fkey(creator_id, name),
      profile:profiles!redemption_orders_user_id_fkey(display_name, username)
    `)
        .eq('status', 'pending')
        .eq('redemption_items.creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    const pendingOrders = orders?.filter((o: any) => o.item?.creator_id === user.id) || [];

    const stats = [
        { label: 'Tokens Earned', value: formatTokens(totalTokensEarned), icon: Coins, desc: 'Total revenue from fans' },
        { label: 'Active Fans', value: uniqueFans, icon: Users, desc: 'Your engaged audience' },
        { label: 'Total Posts', value: posts?.length || 0, icon: FileText, desc: 'Published content' },
        { label: 'Pending Orders', value: pendingOrders.length, icon: ShoppingBag, desc: 'Items to fulfill' },
    ];

    const actions = [
        { href: '/creator/posts', icon: FileText, title: 'Create New Post', sub: 'Share content with fans' },
        { href: '/creator/profile', icon: Settings, title: 'Edit Profile', sub: 'Update bio & links' },
        { href: '/creator/store', icon: Store, title: 'Manage Store', sub: 'Create & manage items' },
        { href: '/creator/analytics', icon: BarChart3, title: 'View Analytics', sub: 'Track your performance' },
    ];

    const cardStyle: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '14px',
        transition: 'all 0.15s ease',
        boxShadow: 'var(--dash-shadow-sm)',
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

    return (
        <div>
            {/* Header */}
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
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    Here's what's happening in your creator studio today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="creator-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '24px',
            }}>
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
                            fontSize: '32px',
                            fontWeight: 700,
                            color: 'var(--dash-text-primary)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                            marginBottom: '6px',
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
            <div style={{ marginTop: '32px' }}>
                <h2 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--dash-text-primary)',
                    marginBottom: '12px',
                }}>
                    Quick Actions
                </h2>
                <div className="creator-actions-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '24px',
                }}>
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
                            <div style={{ ...iconWrapStyle, width: '40px', height: '40px', borderRadius: '12px', transition: 'all 0.15s ease' }}>
                                <action.icon style={{ width: '20px', height: '20px', color: 'var(--dash-text-secondary)', transition: 'color 0.15s' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dash-text-primary)', lineHeight: 1.3 }}>
                                    {action.title}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                                    {action.sub}
                                </div>
                            </div>
                            <ArrowRight style={{ width: '16px', height: '16px', color: 'var(--dash-border-hover)', flexShrink: 0, transition: 'all 0.15s' }} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content Sections */}
            <div className="creator-content-grid" style={{
                marginTop: '28px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
            }}>
                {/* Recent Posts */}
                <div style={{ ...cardStyle, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--dash-border)',
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: 0 }}>
                            <TrendingUp style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                            Recent Posts
                        </h3>
                        {posts && posts.length > 0 && (
                            <Link href="/creator/posts" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none' }}>
                                View all
                            </Link>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        {posts && posts.length > 0 ? (
                            <div>
                                {posts.slice(0, 5).map((post, i) => (
                                    <div
                                        key={post.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '14px 24px',
                                            borderBottom: i < Math.min(posts.length, 5) - 1 ? '1px solid var(--dash-border)' : 'none',
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{post.title}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                <Clock style={{ width: '13px', height: '13px', color: 'var(--dash-text-muted)' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-secondary)' }}>{formatRelativeTime(post.created_at)}</span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '99px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: post.access_type === 'public' ? 'var(--dash-success-bg)' : 'var(--dash-accent-soft)',
                                                    color: post.access_type === 'public' ? 'var(--dash-success-text)' : 'var(--dash-accent)',
                                                }}>
                                                    {post.access_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)',
                                            background: 'var(--dash-bg)', border: '1px solid var(--dash-border)',
                                            padding: '4px 10px', borderRadius: '8px', flexShrink: 0,
                                        }}>
                                            <Eye style={{ width: '14px', height: '14px', color: 'var(--dash-text-muted)' }} />
                                            {post.likes_count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                textAlign: 'center' as const, padding: '40px 24px', height: '100%',
                            }}>
                                <div style={{ ...iconWrapStyle, width: '48px', height: '48px', borderRadius: '14px', marginBottom: '12px' }}>
                                    <FileText style={{ width: '22px', height: '22px', color: 'var(--dash-text-muted)' }} />
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '6px' }}>
                                    No posts yet
                                </h4>
                                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-secondary)', maxWidth: '240px', marginBottom: '14px' }}>
                                    Create your first post to start engaging with your fans.
                                </p>
                                <Link
                                    href="/creator/posts"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        background: 'var(--dash-accent)', color: 'var(--dash-btn-text)',
                                        height: '40px', padding: '0 16px', borderRadius: '10px',
                                        fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                                        marginTop: '10px', transition: 'all 0.15s',
                                    }}
                                >
                                    <Plus style={{ width: '16px', height: '16px' }} />
                                    Create First Post
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Redemptions */}
                <div style={{ ...cardStyle, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 24px', borderBottom: '1px solid var(--dash-border)',
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: 0 }}>
                            <ShoppingBag style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                            Pending Redemptions
                        </h3>
                        {pendingOrders.length > 0 && (
                            <Link href="/creator/store" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-accent)', textDecoration: 'none' }}>
                                View all
                            </Link>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        {pendingOrders.length > 0 ? (
                            <div>
                                {pendingOrders.slice(0, 5).map((order, i) => (
                                    <div
                                        key={order.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 24px',
                                            borderBottom: i < Math.min(pendingOrders.length, 5) - 1 ? '1px solid var(--dash-border)' : 'none',
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{order.item?.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dash-text-secondary)' }}>@{order.profile?.username}</span>
                                                <span style={{ color: 'var(--dash-border)' }}>•</span>
                                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)' }}>{formatRelativeTime(order.created_at)}</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)',
                                            background: 'var(--dash-bg)', border: '1px solid var(--dash-border)',
                                            padding: '4px 12px', borderRadius: '8px', flexShrink: 0,
                                        }}>
                                            {order.points_spent} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                textAlign: 'center' as const, padding: '40px 24px', height: '100%',
                            }}>
                                <div style={{ ...iconWrapStyle, width: '48px', height: '48px', borderRadius: '14px', marginBottom: '12px' }}>
                                    <ShoppingBag style={{ width: '22px', height: '22px', color: 'var(--dash-text-muted)' }} />
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '6px' }}>
                                    You're all caught up 🎉
                                </h4>
                                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-secondary)' }}>
                                    You have no pending redemptions right now.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Responsive overrides */}
            <style>{`
                @media (max-width: 1024px) {
                    .creator-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .creator-actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .creator-content-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .creator-stats-grid { grid-template-columns: 1fr !important; }
                    .creator-actions-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
