import { createClient } from '@/lib/supabase/server';
import { Coins, Star, Newspaper, ShoppingBag, TrendingUp, Gift } from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Fan Dashboard | Rapid MVP Creator',
    description: 'Your fan dashboard - track tokens, points, and discover content.',
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

    const { data: recentTokenTxs } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: recentPointTxs } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: unlockedPosts } = await supabase
        .from('post_unlocks')
        .select('*')
        .eq('user_id', user.id);

    const { data: orders } = await supabase
        .from('redemption_orders')
        .select('*')
        .eq('user_id', user.id);

    return (
        <div className="fan-dashboard animate-fade-in">
            {/* Welcome Header */}
            <div className="fan-welcome">
                <h1 className="fan-welcome-title">
                    Welcome back, <span className="gradient-text">{profile?.display_name}</span> 👋
                </h1>
                <p className="fan-welcome-sub">Here&apos;s your creator economy overview</p>
            </div>

            {/* Stat Cards */}
            <div className="fan-stats-grid">
                <div className="fan-stat-card fan-stat-tokens">
                    <div className="fan-stat-icon-wrap fan-stat-icon-tokens">
                        <Coins className="fan-stat-icon" />
                    </div>
                    <div className="fan-stat-value">{formatTokens(wallet?.token_balance || 0)}</div>
                    <div className="fan-stat-label">Creator Tokens</div>
                </div>

                <div className="fan-stat-card fan-stat-points">
                    <div className="fan-stat-icon-wrap fan-stat-icon-points">
                        <Star className="fan-stat-icon" />
                    </div>
                    <div className="fan-stat-value">{formatPoints(wallet?.points_balance || 0)}</div>
                    <div className="fan-stat-label">Points Earned</div>
                </div>

                <div className="fan-stat-card fan-stat-content">
                    <div className="fan-stat-icon-wrap fan-stat-icon-content">
                        <Newspaper className="fan-stat-icon" />
                    </div>
                    <div className="fan-stat-value">{unlockedPosts?.length || 0}</div>
                    <div className="fan-stat-label">Content Unlocked</div>
                </div>

                <div className="fan-stat-card fan-stat-redeemed">
                    <div className="fan-stat-icon-wrap fan-stat-icon-redeemed">
                        <ShoppingBag className="fan-stat-icon" />
                    </div>
                    <div className="fan-stat-value">{orders?.length || 0}</div>
                    <div className="fan-stat-label">Items Redeemed</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="fan-actions-grid">
                <Link href="/fan/wallet" className="fan-action-card">
                    <div className="fan-action-icon-wrap fan-action-icon-tokens">
                        <Coins className="fan-action-icon" />
                    </div>
                    <div className="fan-action-text">
                        <div className="fan-action-title">Buy Tokens</div>
                        <div className="fan-action-desc">Support your favorite creators</div>
                    </div>
                </Link>

                <Link href="/fan/feed" className="fan-action-card">
                    <div className="fan-action-icon-wrap fan-action-icon-feed">
                        <Newspaper className="fan-action-icon" />
                    </div>
                    <div className="fan-action-text">
                        <div className="fan-action-title">Browse Feed</div>
                        <div className="fan-action-desc">Discover exclusive content</div>
                    </div>
                </Link>

                <Link href="/fan/store" className="fan-action-card">
                    <div className="fan-action-icon-wrap fan-action-icon-store">
                        <Gift className="fan-action-icon" />
                    </div>
                    <div className="fan-action-text">
                        <div className="fan-action-title">Redeem Points</div>
                        <div className="fan-action-desc">Get rewards for engagement</div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="fan-activity-grid">
                {/* Token Transactions */}
                <div className="fan-activity-card">
                    <div className="fan-activity-header">
                        <h3 className="fan-activity-title">
                            <TrendingUp className="fan-activity-title-icon" />
                            Recent Token Activity
                        </h3>
                        <Link href="/fan/wallet" className="fan-activity-link">View all</Link>
                    </div>
                    {recentTokenTxs && recentTokenTxs.length > 0 ? (
                        <div className="fan-activity-list">
                            {recentTokenTxs.map((tx) => (
                                <div key={tx.id} className="fan-activity-item">
                                    <div>
                                        <div className="fan-activity-item-desc">{tx.description}</div>
                                        <div className="fan-activity-item-time">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`fan-activity-item-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} tokens
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="fan-activity-empty">No token activity yet</p>
                    )}
                </div>

                {/* Point Transactions */}
                <div className="fan-activity-card">
                    <div className="fan-activity-header">
                        <h3 className="fan-activity-title">
                            <Star className="fan-activity-title-icon fan-activity-title-icon-points" />
                            Recent Points Activity
                        </h3>
                    </div>
                    {recentPointTxs && recentPointTxs.length > 0 ? (
                        <div className="fan-activity-list">
                            {recentPointTxs.map((tx) => (
                                <div key={tx.id} className="fan-activity-item">
                                    <div>
                                        <div className="fan-activity-item-desc">{tx.description}</div>
                                        <div className="fan-activity-item-time">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`fan-activity-item-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="fan-activity-empty">Start engaging to earn points!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
