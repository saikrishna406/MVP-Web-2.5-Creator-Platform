import { createClient } from '@/lib/supabase/server';
import { Coins, Star, Newspaper, ShoppingBag, TrendingUp, Gift } from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Fan Dashboard | Black Bolts Provisions',
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
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, <span className="gradient-text">{profile?.display_name}</span> 👋
                </h1>
                <p className="text-foreground-muted">Here&apos;s your creator economy overview</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-accent/20 to-accent/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-accent/20 text-accent-light">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatTokens(wallet?.token_balance || 0)}</div>
                    <div className="text-sm text-foreground-muted">Creator Tokens</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-secondary/20 to-secondary/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-secondary/20 text-secondary-light">
                            <Star className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatPoints(wallet?.points_balance || 0)}</div>
                    <div className="text-sm text-foreground-muted">Points Earned</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-primary/20 text-primary-light">
                            <Newspaper className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{unlockedPosts?.length || 0}</div>
                    <div className="text-sm text-foreground-muted">Content Unlocked</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-success/20 to-success/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-success/20 text-success">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{orders?.length || 0}</div>
                    <div className="text-sm text-foreground-muted">Items Redeemed</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/fan/wallet" className="card hover:border-accent/50 group transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <Coins className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <div className="font-semibold">Buy Tokens</div>
                            <div className="text-sm text-foreground-muted">Support your favorite creators</div>
                        </div>
                    </div>
                </Link>

                <Link href="/fan/feed" className="card hover:border-primary/50 group transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Newspaper className="w-6 h-6 text-primary-light" />
                        </div>
                        <div>
                            <div className="font-semibold">Browse Feed</div>
                            <div className="text-sm text-foreground-muted">Discover exclusive content</div>
                        </div>
                    </div>
                </Link>

                <Link href="/fan/store" className="card hover:border-success/50 group transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                            <Gift className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <div className="font-semibold">Redeem Points</div>
                            <div className="text-sm text-foreground-muted">Get rewards for engagement</div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Token Transactions */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            Recent Token Activity
                        </h3>
                        <Link href="/fan/wallet" className="text-sm text-primary-light hover:text-primary">View all</Link>
                    </div>
                    {recentTokenTxs && recentTokenTxs.length > 0 ? (
                        <div className="space-y-3">
                            {recentTokenTxs.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div>
                                        <div className="text-sm font-medium">{tx.description}</div>
                                        <div className="text-xs text-foreground-muted">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} tokens
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">No token activity yet</p>
                    )}
                </div>

                {/* Point Transactions */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Star className="w-4 h-4 text-secondary" />
                            Recent Points Activity
                        </h3>
                    </div>
                    {recentPointTxs && recentPointTxs.length > 0 ? (
                        <div className="space-y-3">
                            {recentPointTxs.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div>
                                        <div className="text-sm font-medium">{tx.description}</div>
                                        <div className="text-xs text-foreground-muted">{formatRelativeTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">Start engaging to earn points!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
