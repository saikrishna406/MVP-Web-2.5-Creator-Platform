'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Lock, Unlock, Eye, Coins, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTokens, formatRelativeTime, getInitials, truncateText } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Post, PostComment } from '@/types';

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [comments, setComments] = useState<Record<string, PostComment[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [unlocking, setUnlocking] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        const res = await fetch('/api/posts');
        if (res.ok) {
            const data = await res.json();
            setPosts(data.posts);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleLike = async (postId: string) => {
        const res = await fetch('/api/posts/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, action: 'like' }),
        });

        if (res.ok) {
            const data = await res.json();
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        is_liked: data.liked,
                        likes_count: data.liked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1),
                    };
                }
                return p;
            }));
            if (data.pointsEarned) {
                setToast({ message: `+${data.pointsEarned} points for liking!`, type: 'success' });
            }
        }
    };

    const handleUnlock = async (postId: string) => {
        setUnlocking(postId);
        const res = await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId }),
        });

        const data = await res.json();
        if (res.ok) {
            setToast({ message: `Content unlocked! ${data.tokensSpent ? `-${data.tokensSpent} tokens` : ''}`, type: 'success' });
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_unlocked: true } : p));
        } else {
            setToast({ message: data.error || 'Failed to unlock', type: 'error' });
        }
        setUnlocking(null);
    };

    const toggleComments = async (postId: string) => {
        const newExpanded = new Set(expandedComments);
        if (newExpanded.has(postId)) {
            newExpanded.delete(postId);
        } else {
            newExpanded.add(postId);
            // Fetch comments if not loaded
            if (!comments[postId]) {
                const res = await fetch(`/api/posts/comments?post_id=${postId}`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(prev => ({ ...prev, [postId]: data.comments }));
                }
            }
        }
        setExpandedComments(newExpanded);
    };

    const handleComment = async (postId: string) => {
        const content = newComment[postId]?.trim();
        if (!content) return;

        const res = await fetch('/api/posts/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, content }),
        });

        if (res.ok) {
            const data = await res.json();
            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), data.comment],
            }));
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));
            if (data.pointsEarned) {
                setToast({ message: `+${data.pointsEarned} points for commenting!`, type: 'success' });
            }
        }
    };

    const isContentVisible = (post: Post) => {
        if (post.access_type === 'public') return true;
        return post.is_unlocked;
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 pb-24 animate-fade-in-up max-w-2xl mx-auto">
            <div className="mb-12 mt-4 text-center sm:text-left">
                <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tighter text-gray-900 mb-4 pb-2">
                    Content Feed
                </h1>
                <p className="text-gray-500 text-xl md:text-2xl font-light tracking-wide max-w-sm sm:max-w-2xl mx-auto sm:mx-0">
                    Discover and unlock exclusive creator content.
                </p>
            </div>

            {posts.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <Eye className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Check back soon for new creator content!</p>
                </div>
            ) : (
                <div className="space-y-12 pb-12">
                    {posts.map((post, index) => (
                        <div key={post.id}
                            className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 ease-out border border-gray-100"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* IF HAS IMAGE & VISIBLE: Edge-to-Edge Hero Image */}
                            {post.image_url && isContentVisible(post) ? (
                                <div className="relative w-full h-[400px] sm:h-[500px] bg-gray-900 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent opacity-90 transition-opacity duration-500" />

                                    {/* Header (Over Image) */}
                                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                                        <div className="flex items-center gap-3 backdrop-blur-md bg-white/10 rounded-full pr-4 p-1 border border-white/10 shadow-lg">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 font-bold text-xs shrink-0 overflow-hidden">
                                                {post.creator?.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={post.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials(post.creator?.display_name || 'C')
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-xs tracking-wide">{post.creator?.display_name}</span>
                                                <span className="text-[10px] text-white/60 uppercase">{formatRelativeTime(post.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Access badge */}
                                        {post.access_type !== 'public' && (
                                            <div className={`backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg ${post.is_unlocked ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/10'}`}>
                                                {post.is_unlocked ? (
                                                    <><Unlock className="w-3 h-3" /> Unlocked</>
                                                ) : post.access_type === 'token_gated' ? (
                                                    <><Lock className="w-3 h-3" /> {post.token_cost} tokens</>
                                                ) : (
                                                    <><Lock className="w-3 h-3" /> Hold {post.threshold_amount}+</>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Title (Over Image) */}
                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                        <h3 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-heading)] text-white mb-2 tracking-tight leading-tight drop-shadow-lg transform transition-transform duration-500 group-hover:translate-x-1">
                                            {post.title}
                                        </h3>
                                    </div>
                                </div>
                            ) : (
                                /* IF NO IMAGE OR LOCKED: Standard Header */
                                <div className="p-6 md:p-8 pb-4">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                                            {post.creator?.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={post.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                getInitials(post.creator?.display_name || 'C')
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-900 text-base tracking-tight">{post.creator?.display_name}</div>
                                            <div className="text-sm text-gray-500 font-medium">@{post.creator?.username} · <span className="text-gray-400 font-normal">{formatRelativeTime(post.created_at)}</span></div>
                                        </div>
                                        {/* Access badge */}
                                        {post.access_type !== 'public' && (
                                            <div className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 ${post.is_unlocked ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {post.is_unlocked ? (
                                                    <><Unlock className="w-3 h-3" /> Unlocked</>
                                                ) : post.access_type === 'token_gated' ? (
                                                    <><Lock className="w-3 h-3" /> {post.token_cost} tokens</>
                                                ) : (
                                                    <><Lock className="w-3 h-3" /> Hold {post.threshold_amount}+</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-gray-900 mb-2 tracking-tight leading-tight">
                                        {post.title}
                                    </h3>
                                </div>
                            )}

                            {/* Content Body */}
                            <div className="p-6 md:p-8 pt-4">
                                {isContentVisible(post) ? (
                                    <div className="text-gray-600 text-lg font-light leading-relaxed mb-6 whitespace-pre-wrap">
                                        {post.content}
                                    </div>
                                ) : (
                                    <div className="relative mb-8 mt-4 rounded-2xl overflow-hidden bg-gray-50 p-6 md:p-10 border border-gray-100">
                                        <div className="text-gray-400 text-lg font-light leading-relaxed blur-md select-none opacity-40">
                                            {truncateText(post.content || "This is exclusive premium content that must be unlocked. Once unlocked, you will get access to all the juicy details and hidden media inside. Don't miss out on what this creator has to share behind the scenes.", 300)}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 backdrop-blur-[2px]">
                                            <div className="transform transition-transform hover:scale-105 duration-300">
                                                <button
                                                    onClick={() => handleUnlock(post.id)}
                                                    disabled={unlocking === post.id}
                                                    className="bg-gray-900 text-white border-0 shadow-2xl hover:bg-gray-800 rounded-full px-8 py-4 font-bold tracking-wide text-sm"
                                                >
                                                    {unlocking === post.id ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Unlocking...
                                                        </span>
                                                    ) : post.access_type === 'token_gated' ? (
                                                        <span className="flex items-center gap-2">
                                                            <Coins className="w-5 h-5" />
                                                            Unlock for {post.token_cost} Tokens
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <Lock className="w-5 h-5" />
                                                            Requires {post.threshold_amount}+ Tokens
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions / Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className={`group/like flex items-center gap-2 text-sm font-bold tracking-wide transition-all ${post.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full transition-colors ${post.is_liked ? 'bg-red-50' : 'bg-gray-50 group-hover/like:bg-red-50'}`}>
                                                <Heart className={`w-5 h-5 transition-transform group-hover/like:scale-110 ${post.is_liked ? 'fill-current' : ''}`} />
                                            </div>
                                            {post.likes_count || 0}
                                        </button>
                                        <button
                                            onClick={() => toggleComments(post.id)}
                                            className="group/comment flex items-center gap-2 text-sm font-bold tracking-wide text-gray-400 hover:text-gray-900 transition-all"
                                        >
                                            <div className="p-2 rounded-full bg-gray-50 group-hover/comment:bg-gray-100 transition-colors">
                                                <MessageCircle className="w-5 h-5 transition-transform group-hover/comment:scale-110" />
                                            </div>
                                            {post.comments_count || 0}
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {expandedComments.has(post.id) && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 bg-gray-50/50 -mx-6 md:-mx-8 px-6 md:px-8 pb-6 md:pb-8">
                                        {/* New comment input */}
                                        <div className="flex relative items-center mb-8">
                                            <input
                                                type="text"
                                                value={newComment[post.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                placeholder="Write a comment..."
                                                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 block px-6 py-4 pr-16 shadow-sm font-medium transition-all"
                                                onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                            />
                                            <button
                                                onClick={() => handleComment(post.id)}
                                                disabled={!newComment[post.id]?.trim()}
                                                className="absolute right-2 p-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-full transition-colors"
                                            >
                                                <Send className="w-4 h-4 ml-0.5" />
                                            </button>
                                        </div>

                                        {/* Comments list */}
                                        <div className="space-y-6">
                                            {comments[post.id]?.map((comment) => (
                                                <div key={comment.id} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-sm font-bold text-gray-600 shrink-0 shadow-sm">
                                                        {getInitials(comment.profile?.display_name || 'U')}
                                                    </div>
                                                    <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                                                        <div className="flex items-baseline gap-2 mb-1">
                                                            <span className="text-sm font-bold text-gray-900 tracking-tight">{comment.profile?.display_name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{formatRelativeTime(comment.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-light leading-relaxed">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
