import { createClient } from '@/lib/supabase/server';
import { Coins, Users, ShoppingBag, FileText, TrendingUp, Eye } from 'lucide-react';
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

    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // Get creator's posts
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

    // Get token transactions (tokens spent on this creator's content)
    const { data: postUnlocks } = await supabase
        .from('post_unlocks')
        .select('*, post:posts!post_unlocks_post_id_fkey(creator_id)')
        .order('created_at', { ascending: false });

    const creatorUnlocks = postUnlocks?.filter(u => u.post?.creator_id === user.id) || [];
    const totalTokensEarned = creatorUnlocks.reduce((sum, u) => sum + (u.tokens_spent || 0), 0);
    const uniqueFans = new Set(creatorUnlocks.map(u => u.user_id)).size;

    // Get pending redemption orders
    const { data: orders } = await supabase
        .from('redemption_orders')
        .select(`
      *,
      item:redemption_items!redemption_orders_item_id_fkey(creator_id, name),
      profile:profiles!redemption_orders_user_id_fkey(display_name, username)
    `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    const pendingOrders = orders?.filter(o => o.item?.creator_id === user.id) || [];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">
                    Creator Studio <span className="gradient-text">✨</span>
                </h1>
                <p className="text-foreground-muted">Welcome back, {profile?.display_name}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-accent/20 to-accent/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-accent/20 text-accent-light">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatTokens(totalTokensEarned)}</div>
                    <div className="text-sm text-foreground-muted">Tokens Earned</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-primary/20 text-primary-light">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{uniqueFans}</div>
                    <div className="text-sm text-foreground-muted">Active Fans</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-secondary/20 to-secondary/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-secondary/20 text-secondary-light">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{posts?.length || 0}</div>
                    <div className="text-sm text-foreground-muted">Total Posts</div>
                </div>

                <div className="stat-card bg-gradient-to-br from-success/20 to-success/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-success/20 text-success">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{pendingOrders.length}</div>
                    <div className="text-sm text-foreground-muted">Pending Orders</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/creator/posts" className="card hover:border-primary/50 group transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <FileText className="w-6 h-6 text-primary-light" />
                        </div>
                        <div>
                            <div className="font-semibold">Create New Post</div>
                            <div className="text-sm text-foreground-muted">Share content with your fans</div>
                        </div>
                    </div>
                </Link>

                <Link href="/creator/store" className="card hover:border-accent/50 group transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <ShoppingBag className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <div className="font-semibold">Manage Store</div>
                            <div className="text-sm text-foreground-muted">Create & manage redemption items</div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Posts */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary-light" />
                            Recent Posts
                        </h3>
                        <Link href="/creator/posts" className="text-sm text-primary-light hover:text-primary">View all</Link>
                    </div>
                    {posts && posts.length > 0 ? (
                        <div className="space-y-3">
                            {posts.slice(0, 5).map((post) => (
                                <div key={post.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{post.title}</div>
                                        <div className="text-xs text-foreground-muted flex items-center gap-2">
                                            <span>{formatRelativeTime(post.created_at)}</span>
                                            <span className={`badge text-[10px] ${post.access_type === 'public' ? 'badge-success' :
                                                post.access_type === 'token_gated' ? 'badge-accent' :
                                                    'badge-primary'
                                                }`}>
                                                {post.access_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.likes_count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">No posts yet. Create your first one!</p>
                    )}
                </div>

                {/* Pending Orders */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-accent" />
                            Pending Redemptions
                        </h3>
                        <Link href="/creator/store" className="text-sm text-primary-light hover:text-primary">View all</Link>
                    </div>
                    {pendingOrders.length > 0 ? (
                        <div className="space-y-3">
                            {pendingOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div>
                                        <div className="text-sm font-medium">{order.item?.name}</div>
                                        <div className="text-xs text-foreground-muted">
                                            by @{order.profile?.username} · {formatRelativeTime(order.created_at)}
                                        </div>
                                    </div>
                                    <div className="badge badge-accent">{order.points_spent} pts</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground-muted text-sm text-center py-6">No pending orders</p>
                    )}
                </div>
            </div>
        </div>
    );
}
