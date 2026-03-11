import { createClient } from '@/lib/supabase/server';
import { Coins, Users, ShoppingBag, FileText, TrendingUp, Eye, ChevronRight } from 'lucide-react';
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
        <div className="space-y-10 pb-24 font-sans text-zinc-100">
            {/* Header / Greeting */}
            <div className="animate-fade-in-up mt-4">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                    Welcome back, {profile?.display_name}
                </h1>
                <p className="text-zinc-400 text-base md:text-lg font-normal max-w-2xl">
                    Here's what's happening in your creator studio today.
                </p>
            </div>

            {/* Stat Cards - Vercel Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-sm transition-colors hover:bg-[#111] hover:border-white/20">
                    <div className="flex items-center justify-between mb-3 text-zinc-400">
                        <div className="text-sm font-medium tracking-wide">Tokens Earned</div>
                        <Coins className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-3xl font-semibold text-white tracking-tight">{formatTokens(totalTokensEarned)}</div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-sm transition-colors hover:bg-[#111] hover:border-white/20">
                    <div className="flex items-center justify-between mb-3 text-zinc-400">
                        <div className="text-sm font-medium tracking-wide">Active Fans</div>
                        <Users className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-3xl font-semibold text-white tracking-tight">{uniqueFans}</div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-sm transition-colors hover:bg-[#111] hover:border-white/20">
                    <div className="flex items-center justify-between mb-3 text-zinc-400">
                        <div className="text-sm font-medium tracking-wide">Total Posts</div>
                        <FileText className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-3xl font-semibold text-white tracking-tight">{posts?.length || 0}</div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-sm transition-colors hover:bg-[#111] hover:border-white/20">
                    <div className="flex items-center justify-between mb-3 text-zinc-400">
                        <div className="text-sm font-medium tracking-wide">Pending Orders</div>
                        <ShoppingBag className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-3xl font-semibold text-white tracking-tight">{pendingOrders.length}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/creator/profile" className="group bg-transparent border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors border border-white/10">
                            <Users className="w-5 h-5 text-zinc-300" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium tracking-tight text-white mb-0.5">Manage Profile</div>
                            <div className="text-sm text-zinc-400">Edit bio, packages &amp; links</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>
                </Link>

                <Link href="/creator/posts" className="group bg-transparent border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors border border-white/10">
                            <FileText className="w-5 h-5 text-zinc-300" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium tracking-tight text-white mb-0.5">Create New Post</div>
                            <div className="text-sm text-zinc-400">Share content with your fans</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>
                </Link>

                <Link href="/creator/store" className="group bg-transparent border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors border border-white/10">
                            <ShoppingBag className="w-5 h-5 text-zinc-300" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium tracking-tight text-white mb-0.5">Manage Store</div>
                            <div className="text-sm text-zinc-400">Create &amp; manage items</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Posts */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                            Recent Posts
                        </h3>
                        <Link href="/creator/posts" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">View all</Link>
                    </div>
                    <div className="p-0">
                        {posts && posts.length > 0 ? (
                            <div className="divide-y divide-white/10">
                                {posts.slice(0, 5).map((post) => (
                                    <div key={post.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[15px] font-medium text-zinc-200 truncate">{post.title}</div>
                                            <div className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                                                <span>{formatRelativeTime(post.created_at)}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${post.access_type === 'public' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                    {post.access_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                                            <Eye className="w-3.5 h-3.5 opacity-70" />
                                            {post.likes_count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-zinc-500 text-sm">
                                No posts yet. Create your first one!
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                            Pending Redemptions
                        </h3>
                        <Link href="/creator/store" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">View all</Link>
                    </div>
                    <div className="p-0">
                        {pendingOrders.length > 0 ? (
                            <div className="divide-y divide-white/10">
                                {pendingOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                                        <div>
                                            <div className="text-[15px] font-medium text-zinc-200">{order.item?.name}</div>
                                            <div className="text-sm text-zinc-500 mt-1">
                                                by @{order.profile?.username} &middot; {formatRelativeTime(order.created_at)}
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-md">
                                            {order.points_spent} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-zinc-500 text-sm">
                                No pending orders
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
