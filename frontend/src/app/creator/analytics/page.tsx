import { createClient } from '@/lib/supabase/server';
import { BarChart3, Coins, Users, Eye, Heart, TrendingUp, Trophy, Star } from 'lucide-react';
import { formatTokens, formatPoints, formatRelativeTime } from '@/lib/utils';

export const metadata = {
    title: 'Analytics | Rapid MVP Creator',
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
        <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-4 tracking-tight">Analytics</h1>
                <p className="text-gray-500">Track your performance and audience engagement</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-900 w-fit mb-4 border border-gray-200 shadow-sm">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-semibold text-gray-900 mb-1 tracking-tight">{formatTokens(totalTokensFromUnlocks)}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tokens Earned</div>
                </div>

                <div className="stat-card">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-900 w-fit mb-4 border border-gray-200 shadow-sm">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-semibold text-gray-900 mb-1 tracking-tight">{uniqueFans}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unique Fans</div>
                </div>

                <div className="stat-card">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-900 w-fit mb-4 border border-gray-200 shadow-sm">
                        <Heart className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-semibold text-gray-900 mb-1 tracking-tight">{totalLikes}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Likes</div>
                </div>

                <div className="stat-card">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-900 w-fit mb-4 border border-gray-200 shadow-sm">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-semibold text-gray-900 mb-1 tracking-tight">{totalComments}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Comments</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Posts */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-900" />
                        Top Performing Posts
                    </h3>
                    {topPosts.length > 0 ? (
                        <div className="space-y-4">
                            {topPosts.map((post, i) => (
                                <div key={post.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${i === 0 ? 'bg-gray-900 text-white border-gray-900' :
                                        i === 1 ? 'bg-gray-100 text-gray-900 border-gray-200' :
                                            'bg-white text-gray-500 border-gray-100'
                                        }`}>
                                        #{i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate tracking-tight">{post.title}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(post.created_at)}</div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                        <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-gray-400" />{post.likes_count || 0}</span>
                                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-gray-400" />{post.comments_count || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-100">No posts yet</div>
                    )}
                </div>

                {/* Fan Leaderboard */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gray-900" />
                        Top Fans (by Tokens Spent)
                    </h3>
                    {topFans.length > 0 ? (
                        <div className="space-y-4">
                            {topFans.map((fan, i) => (
                                <div key={fan.username} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${i === 0 ? 'bg-gray-900 text-white border-gray-900' :
                                        i === 1 ? 'bg-gray-100 text-gray-900 border-gray-200' :
                                            'bg-white text-gray-500 border-gray-100'
                                        }`}>
                                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 tracking-tight">{fan.display_name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">@{fan.username}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                        <Coins className="w-4 h-4" /> {formatTokens(fan.total_spent)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-100">No fan activity yet</div>
                    )}
                </div>
            </div>

            {/* Points Leaderboard Preview (all users) */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-gray-900" />
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
        return <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-100">No leaderboard data yet</div>;
    }

    const userIds = topWallets.map(w => w.user_id);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, role')
        .in('user_id', userIds);

    return (
        <div className="space-y-4">
            {topWallets.map((wallet, i) => {
                const profile = profiles?.find(p => p.user_id === wallet.user_id);
                return (
                    <div key={wallet.user_id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border ${i === 0 ? 'bg-gray-900 text-white border-gray-900 shadow-sm' :
                            i === 1 ? 'bg-gray-100 text-gray-900 border-gray-200' :
                                i === 2 ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                    'bg-white text-gray-400 border-gray-100'
                            }`}>
                            {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 tracking-tight">{profile?.display_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                @{profile?.username || 'unknown'} · {profile?.role === 'creator' ? '✨ Creator' : '❤️ Fan'}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-base font-bold text-gray-900">
                            <Star className="w-5 h-5 fill-current text-gray-900" /> {formatPoints(wallet.points_balance)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
