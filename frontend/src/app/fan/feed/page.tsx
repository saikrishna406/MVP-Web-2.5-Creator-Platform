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
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Content Feed</h1>
                <p className="text-foreground-muted">Discover and unlock exclusive creator content</p>
            </div>

            {posts.length === 0 ? (
                <div className="card text-center py-16">
                    <Eye className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-foreground-muted">Check back soon for new creator content!</p>
                </div>
            ) : (
                <div className="space-y-6 max-w-2xl">
                    {posts.map((post) => (
                        <div key={post.id} className="card overflow-hidden">
                            {/* Post Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {post.creator?.avatar_url ? (
                                        <img src={post.creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        getInitials(post.creator?.display_name || 'C')
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm">{post.creator?.display_name}</div>
                                    <div className="text-xs text-foreground-muted">@{post.creator?.username} · {formatRelativeTime(post.created_at)}</div>
                                </div>
                                {/* Access badge */}
                                {post.access_type !== 'public' && (
                                    <div className={`badge ${post.is_unlocked ? 'badge-success' : 'badge-accent'}`}>
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

                            {/* Post Title */}
                            <h3 className="text-lg font-bold mb-2">{post.title}</h3>

                            {/* Post Content */}
                            {isContentVisible(post) ? (
                                <div className="text-foreground-muted leading-relaxed mb-4 whitespace-pre-wrap">
                                    {post.content}
                                </div>
                            ) : (
                                <div className="relative mb-4">
                                    <div className="text-foreground-muted leading-relaxed blur-sm select-none">
                                        {truncateText(post.content, 200)}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={() => handleUnlock(post.id)}
                                            disabled={unlocking === post.id}
                                            className="btn-accent"
                                        >
                                            {unlocking === post.id ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
                                <div className="rounded-xl overflow-hidden mb-4">
                                    <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center gap-2 text-sm transition-all ${post.is_liked ? 'text-error' : 'text-foreground-muted hover:text-error'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                                    {post.likes_count || 0}
                                </button>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {post.comments_count || 0}
                                    {expandedComments.has(post.id) ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments.has(post.id) && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                    {comments[post.id]?.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground-muted shrink-0">
                                                {getInitials(comment.profile?.display_name || 'U')}
                                            </div>
                                            <div className="flex-1 bg-background rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold">{comment.profile?.display_name}</span>
                                                    <span className="text-xs text-foreground-muted">{formatRelativeTime(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-foreground-muted">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New comment input */}
                                    <div className="flex gap-3 items-end">
                                        <input
                                            type="text"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            placeholder="Write a comment..."
                                            className="input flex-1 text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={!newComment[post.id]?.trim()}
                                            className="btn-primary px-3 py-2.5"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
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
