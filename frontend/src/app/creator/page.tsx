import { createClient } from '@/lib/supabase/server';
import { Coins, Users, ShoppingBag, FileText, TrendingUp, Eye, ChevronRight } from 'lucide-react';
import { formatTokens, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
    title: 'Creator Dashboard | Rapid MVP Creator',
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
        <div className="space-y-12 animate-fade-in">
            {/* Welcome Header */}
            <div>
                <h1 className="text-4xl font-semibold mb-2 tracking-tight">
                    Creator Studio <span className="text-gray-900">✨</span>
                </h1>
                <p className="text-gray-500 text-lg">Welcome back, {profile?.display_name}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{formatTokens(totalTokensEarned)}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tokens Earned</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{uniqueFans}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Fans</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{posts?.length || 0}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Posts</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-900">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1 tracking-tight">{pendingOrders.length}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Orders</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/creator/profile" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <Users className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Manage Profile</div>
                            <div className="text-sm text-gray-500">Edit bio, packages &amp; links</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                </Link>

                <Link href="/creator/posts" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <FileText className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Create New Post</div>
                            <div className="text-sm text-gray-500">Share content with your fans</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                </Link>

                <Link href="/creator/store" className="card group hover:border-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors border border-gray-200">
                            <ShoppingBag className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">Manage Store</div>
                            <div className="text-sm text-gray-500">Create &amp; manage redemption items</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Posts */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-900" />
                            Recent Posts
                        </h3>
                        <Link href="/creator/posts" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">View all</Link>
                    </div>
                    {posts && posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.slice(0, 5).map((post) => (
                                <div key={post.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                            <span>{formatRelativeTime(post.created_at)}</span>
                                            <span className={`badge text-[10px] ${post.access_type === 'public' ? 'badge-success' : 'badge-primary'}`}>
                                                {post.access_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                        <Eye className="w-3.5 h-3.5" />
                                        {post.likes_count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                            No posts yet. Create your first one!
                        </div>
                    )}
                </div>

                {/* Pending Orders */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-gray-900" />
                            Pending Redemptions
                        </h3>
                        <Link href="/creator/store" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">View all</Link>
                    </div>
                    {pendingOrders.length > 0 ? (
                        <div className="space-y-4">
                            {pendingOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{order.item?.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            by @{order.profile?.username} · {formatRelativeTime(order.created_at)}
                                        </div>
                                    </div>
                                    <div className="badge badge-primary font-semibold">{order.points_spent} pts</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                            No pending orders
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
