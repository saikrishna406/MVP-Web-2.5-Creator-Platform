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
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Feed</h1>
                <p className="text-gray-500">Discover and unlock exclusive creator content</p>
            </div>

            {posts.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <Eye className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Check back soon for new creator content!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div key={post.id} className="card p-6 overflow-hidden">
                            {/* Post Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-bold text-sm shrink-0 overflow-hidden">
                                    {post.creator?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={post.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(post.creator?.display_name || 'C')
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 text-sm tracking-tight">{post.creator?.display_name}</div>
                                    <div className="text-xs text-gray-500">@{post.creator?.username} · {formatRelativeTime(post.created_at)}</div>
                                </div>
                                {/* Access badge */}
                                {post.access_type !== 'public' && (
                                    <div className={`badge ${post.is_unlocked ? 'badge-success' : 'badge-primary'}`}>
                                        {post.is_unlocked ? (
                                            <><Unlock className="w-3 h-3 mr-1" /> Unlocked</>
                                        ) : post.access_type === 'token_gated' ? (
                                            <><Lock className="w-3 h-3 mr-1" /> {post.token_cost} tokens</>
                                        ) : (
                                            <><Lock className="w-3 h-3 mr-1" /> Hold {post.threshold_amount}+</>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Post Title */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{post.title}</h3>

                            {/* Post Content */}
                            {isContentVisible(post) ? (
                                <div className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                                    {post.content}
                                </div>
                            ) : (
                                <div className="relative mb-6">
                                    <div className="text-gray-400 leading-relaxed blur-[4px] select-none opacity-50">
                                        {truncateText(post.content || "This is restricted content that must be unlocked. This content requires specific conditions to be met before you can view it.", 300)}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform hover:scale-[1.02]">
                                        <button
                                            onClick={() => handleUnlock(post.id)}
                                            disabled={unlocking === post.id}
                                            className="btn-primary"
                                        >
                                            {unlocking === post.id ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Unlocking...
                                                </span>
                                            ) : post.access_type === 'token_gated' ? (
                                                <span className="flex items-center gap-2">
                                                    <Coins className="w-4 h-4" />
                                                    Unlock for {post.token_cost} tokens
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Lock className="w-4 h-4" />
                                                    Requires {post.threshold_amount}+ tokens
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Post Image */}
                            {post.image_url && isContentVisible(post) && (
                                <div className="rounded-xl overflow-hidden mb-6 border border-gray-100 bg-gray-50 flex justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={post.image_url} alt="" className="max-w-full max-h-[500px] object-contain" />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-all ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                                    {post.likes_count || 0}
                                </button>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {post.comments_count || 0}
                                    {expandedComments.has(post.id) ? (
                                        <ChevronUp className="w-4 h-4 ml-0.5" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 ml-0.5" />
                                    )}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments.has(post.id) && (
                                <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                                    {/* New comment input */}
                                    <div className="flex gap-3 mb-6">
                                        <input
                                            type="text"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            placeholder="Write a comment..."
                                            className="input flex-1 text-sm bg-gray-50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={!newComment[post.id]?.trim()}
                                            className="btn-primary !px-4"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Comments list */}
                                    <div className="space-y-4">
                                        {comments[post.id]?.map((comment, idx) => (
                                            <div key={comment.id} className={`flex gap-3 ${idx > 0 && 'pt-4 border-t border-gray-50'}`}>
                                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                                    {getInitials(comment.profile?.display_name || 'U')}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-gray-900 tracking-tight">{comment.profile?.display_name}</span>
                                                        <span className="text-xs text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
