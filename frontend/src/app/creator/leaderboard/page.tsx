import { createClient } from '@/lib/supabase/server';
import { Trophy, Star, Medal, Crown } from 'lucide-react';
import { formatPoints } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Leaderboard | Rapid MVP Creator',
    description: 'Top fans and creators on the platform.',
};

export default async function LeaderboardPage() {
    const supabase = await createClient();

    // Top 50 users by points
    const { data: topWallets } = await supabase
        .from('wallets')
        .select('user_id, points_balance')
        .order('points_balance', { ascending: false })
        .limit(50);

    const userIds = topWallets?.map(w => w.user_id) || [];
    let profiles: any[] = [];

    if (userIds.length > 0) {
        const { data } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, role')
            .in('user_id', userIds);
        profiles = data || [];
    }

    const leaderboardData = topWallets?.map((wallet, index) => {
        const profile = profiles.find(p => p.user_id === wallet.user_id);
        return {
            rank: index + 1,
            wallet,
            profile,
        };
    }) || [];

    const topCreators = leaderboardData.filter(d => d.profile?.role === 'creator').slice(0, 10);
    const topFans = leaderboardData.filter(d => d.profile?.role === 'fan').slice(0, 50);

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    Platform Leaderboard <Trophy className="w-8 h-8 text-accent" />
                </h1>
                <p className="text-foreground-muted">See who's leading the way with the most points earned.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Fans */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary-light">
                            <Star className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Top Fans</h2>
                    </div>

                    {topFans.length > 0 ? (
                        <div className="space-y-4">
                            {topFans.map((entry) => (
                                <LeaderboardRow key={entry.wallet.user_id} entry={entry} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-center py-8">No fans ranked yet</p>
                    )}
                </div>

                {/* Top Creators */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-xl bg-accent/20 text-accent-light">
                            <Crown className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Top Creators</h2>
                    </div>

                    {topCreators.length > 0 ? (
                        <div className="space-y-4">
                            {topCreators.map((entry) => (
                                <LeaderboardRow key={entry.wallet.user_id} entry={entry} isCreator />
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-center py-8">No creators ranked yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function LeaderboardRow({ entry, isCreator = false }: { entry: any, isCreator?: boolean }) {
    const { rank, wallet, profile } = entry;

    return (
        <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-background/50 rounded-lg px-2 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${rank === 1 ? 'bg-accent/20 text-accent' :
                rank === 2 ? 'bg-foreground-muted/30 text-foreground' :
                    rank === 3 ? 'bg-accent/10 text-accent-light' :
                        'bg-background text-foreground-muted'
                }`}>
                {rank === 1 ? <Trophy className="w-4 h-4" /> : rank === 2 ? <Medal className="w-4 h-4" /> : rank === 3 ? <Medal className="w-4 h-4" /> : `#${rank}`}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                    {profile?.display_name || 'Unknown User'}
                    {isCreator && <span className="ml-2 text-[10px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Creator</span>}
                </div>
                <div className="text-xs text-foreground-muted truncate">
                    @{profile?.username || 'unknown'}
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                {formatPoints(wallet.points_balance)}
            </div>
        </div>
    );
}
