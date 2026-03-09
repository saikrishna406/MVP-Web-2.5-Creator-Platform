import { createClient } from '@/lib/supabase/server';
import { BarChart3, Coins, Users, Eye, Heart, TrendingUp, Trophy, Star } from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';

export const metadata = {
    title: 'Analytics | Black Bolts Provisions',
    description: 'Track your creator performance and engagement metrics.',
};

export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get creator's posts with stats
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

    // Get all unlocks for creator's posts
    const postIds = posts?.map(p => p.id) || [];
    let unlocks: Array<{ user_id: string; tokens_spent: number; created_at: string }> = [];
    if (postIds.length > 0) {
        const { data } = await supabase
            .from('post_unlocks')
            .select('user_id, tokens_spent, created_at')
            .in('post_id', postIds);
        unlocks = data || [];
    }

    const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
    const totalTokensFromUnlocks = unlocks.reduce((sum, u) => sum + (u.tokens_spent || 0), 0);
    const uniqueFans = new Set(unlocks.map(u => u.user_id)).size;

    // Leaderboard - top fans by tokens spent
    const fanSpending: Record<string, number> = {};
    unlocks.forEach(u => {
        fanSpending[u.user_id] = (fanSpending[u.user_id] || 0) + u.tokens_spent;
    });
    const topFanIds = Object.entries(fanSpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

    let topFans: Array<{ display_name: string; username: string; total_spent: number }> = [];
    if (topFanIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, username')
            .in('user_id', topFanIds);

        topFans = topFanIds.map(id => {
            const profile = profiles?.find(p => p.user_id === id);
            return {
                display_name: profile?.display_name || 'Unknown',
                username: profile?.username || 'unknown',
                total_spent: fanSpending[id] || 0,
            };
        });
    }

    // Post performance ranking
    const topPosts = [...(posts || [])]
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                <p className="text-foreground-muted">Track your performance and audience engagement</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-accent/20 to-accent/5">
                    <div className="p-2.5 rounded-xl bg-accent/20 text-accent-light w-fit mb-3">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{formatTokens(totalTokensFromUnlocks)}</div>
                    <div className="text-sm text-foreground-muted">Total Tokens Earned</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="p-2.5 rounded-xl bg-primary/20 text-primary-light w-fit mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{uniqueFans}</div>
                    <div className="text-sm text-foreground-muted">Unique Fans</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-error/20 to-error/5">
                    <div className="p-2.5 rounded-xl bg-error/20 text-error w-fit mb-3">
                        <Heart className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{totalLikes}</div>
                    <div className="text-sm text-foreground-muted">Total Likes</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-secondary/20 to-secondary/5">
                    <div className="p-2.5 rounded-xl bg-secondary/20 text-secondary-light w-fit mb-3">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{totalComments}</div>
                    <div className="text-sm text-foreground-muted">Total Comments</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Posts */}
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-light" />
                        Top Performing Posts
                    </h3>
                    {topPosts.length > 0 ? (
                        <div className="space-y-3">
                            {topPosts.map((post, i) => (
                                <div key={post.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-accent/20 text-accent' :
                                        i === 1 ? 'bg-foreground-muted/20 text-foreground-muted' :
                                            'bg-background text-foreground-muted'
                                        }`}>
                                        #{i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{post.title}</div>
                                        <div className="text-xs text-foreground-muted">{formatRelativeTime(post.created_at)}</div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-error" />{post.likes_count || 0}</span>
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.comments_count || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">No posts yet</p>
                    )}
                </div>

                {/* Fan Leaderboard */}
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        Top Fans (by Tokens Spent)
                    </h3>
                    {topFans.length > 0 ? (
                        <div className="space-y-3">
                            {topFans.map((fan, i) => (
                                <div key={fan.username} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-accent/20 text-accent' :
                                        i === 1 ? 'bg-foreground-muted/20 text-foreground-muted' :
                                            'bg-background text-foreground-muted'
                                        }`}>
                                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">{fan.display_name}</div>
                                        <div className="text-xs text-foreground-muted">@{fan.username}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-bold text-accent">
                                        <Coins className="w-3 h-3" /> {formatTokens(fan.total_spent)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">No fan activity yet</p>
                    )}
                </div>
            </div>

            {/* Points Leaderboard Preview (all users) */}
            <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    Platform Points Leaderboard (Top 10)
                </h3>
                <LeaderboardSection />
            </div>
        </div>
    );
}

async function LeaderboardSection() {
    const supabase = await createClient();

    const { data: topWallets } = await supabase
        .from('wallets')
        .select('user_id, points_balance')
        .order('points_balance', { ascending: false })
        .limit(10);

    if (!topWallets || topWallets.length === 0) {
        return <p className="text-foreground-muted text-sm text-center py-6">No leaderboard data yet</p>;
    }

    const userIds = topWallets.map(w => w.user_id);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, role')
        .in('user_id', userIds);

    return (
        <div className="space-y-3">
            {topWallets.map((wallet, i) => {
                const profile = profiles?.find(p => p.user_id === wallet.user_id);
                return (
                    <div key={wallet.user_id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-accent/20 text-accent' :
                            i === 1 ? 'bg-foreground-muted/30 text-foreground' :
                                i === 2 ? 'bg-accent/10 text-accent-light' :
                                    'bg-background text-foreground-muted'
                            }`}>
                            {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{profile?.display_name || 'Unknown'}</div>
                            <div className="text-xs text-foreground-muted">
                                @{profile?.username || 'unknown'} · {profile?.role === 'creator' ? '✨ Creator' : '❤️ Fan'}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-secondary">
                            <Star className="w-4 h-4" /> {formatPoints(wallet.points_balance)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
