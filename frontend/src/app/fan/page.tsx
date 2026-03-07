import { createClient } from '@/lib/supabase/server';
import { Coins, Star, Newspaper, ShoppingBag, TrendingUp, Gift, ChevronRight } from 'lucide-react';
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
<<<<<<< HEAD
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
=======
        <div className="space-y-12 animate-fade-in">
            {/* Welcome Header */}
            <div>
                <h1 className="text-4xl font-semibold mb-2 tracking-tight">
                    Welcome back, {profile?.display_name} 👋
                </h1>
                <p className="text-gray-500 text-lg">Here&apos;s your creator economy overview</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{formatTokens(wallet?.token_balance || 0)}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Creator Tokens</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <Star className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{formatPoints(wallet?.points_balance || 0)}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Points Earned</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <Newspaper className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{unlockedPosts?.length || 0}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Content Unlocked</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{orders?.length || 0}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Items Redeemed</div>
>>>>>>> hasif_branch
                </div>
            </div>

            {/* Quick Actions */}
<<<<<<< HEAD
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
=======
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/fan/wallet" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <Coins className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Buy Tokens</div>
                            <div className="text-sm text-gray-500">Support your favorite creators</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                </Link>

                <Link href="/fan/feed" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <Newspaper className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Browse Feed</div>
                            <div className="text-sm text-gray-500">Discover exclusive content</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                </Link>

                <Link href="/fan/store" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <Gift className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Redeem Points</div>
                            <div className="text-sm text-gray-500">Get rewards for engagement</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
>>>>>>> hasif_branch
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
<<<<<<< HEAD
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
=======
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Token Transactions */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-900" />
                            Recent Token Activity
                        </h3>
                        <Link href="/fan/wallet" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">View all</Link>
                    </div>
                    {recentTokenTxs && recentTokenTxs.length > 0 ? (
                        <div className="space-y-4">
                            {recentTokenTxs.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${tx.amount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
>>>>>>> hasif_branch
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} tokens
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
<<<<<<< HEAD
                        <p className="fan-activity-empty">No token activity yet</p>
=======
                        <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                            No token activity yet
                        </div>
>>>>>>> hasif_branch
                    )}
                </div>

                {/* Point Transactions */}
<<<<<<< HEAD
                <div className="fan-activity-card">
                    <div className="fan-activity-header">
                        <h3 className="fan-activity-title">
                            <Star className="fan-activity-title-icon fan-activity-title-icon-points" />
=======
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Star className="w-5 h-5 text-gray-900" />
>>>>>>> hasif_branch
                            Recent Points Activity
                        </h3>
                    </div>
                    {recentPointTxs && recentPointTxs.length > 0 ? (
<<<<<<< HEAD
                        <div className="fan-activity-list">
                            {recentPointTxs.map((tx) => (
                                <div key={tx.id} className="fan-activity-item">
                                    <div>
                                        <div className="fan-activity-item-desc">{tx.description}</div>
                                        <div className="fan-activity-item-time">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`fan-activity-item-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
=======
                        <div className="space-y-4">
                            {recentPointTxs.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${tx.amount > 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
>>>>>>> hasif_branch
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
<<<<<<< HEAD
                        <p className="fan-activity-empty">Start engaging to earn points!</p>
=======
                        <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                            Start engaging to earn points!
                        </div>
>>>>>>> hasif_branch
                    )}
                </div>
            </div>
        </div>
    );
}
