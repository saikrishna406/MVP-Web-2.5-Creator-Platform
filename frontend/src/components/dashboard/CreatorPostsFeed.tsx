'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Heart, MessageCircle, Lock, Unlock, Eye,
    Coins, Send, Globe, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatRelativeTime, getInitials, truncateText } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import type { Post, PostComment } from '@/types';

interface CreatorPostsFeedProps {
    /** If provided, only shows posts from this creator (by user_id / creator_id) */
    creatorId?: string;
    /** Max posts to show */
    limit?: number;
    /** Compact mode hides the creator avatar row (used when creator is already shown in context) */
    hideCreatorInfo?: boolean;
}

export function CreatorPostsFeed({
    creatorId,
    limit = 10,
    hideCreatorInfo = false,
}: CreatorPostsFeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [comments, setComments] = useState<Record<string, PostComment[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [unlocking, setUnlocking] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: String(limit) });
        if (creatorId) params.set('creator_id', creatorId);
        const res = await fetch(`/api/posts?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            setPosts(data.posts || []);
        } else {
            setPosts([]);
        }
        setLoading(false);
    }, [creatorId, limit]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const submitLockRef = useRef<Set<string>>(new Set());

    const handleLike = async (postId: string) => {
        if (submitLockRef.current.has(postId)) return;
        submitLockRef.current.add(postId);

        // Record the current state just in case we need to revert
        const targetPost = posts.find(p => p.id === postId);
        const wasLiked = targetPost?.is_liked || false;
        const nextLiked = !wasLiked;

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return {
                ...p,
                is_liked: nextLiked,
                likes_count: nextLiked
                    ? (p.likes_count || 0) + 1
                    : Math.max(0, (p.likes_count || 0) - 1),
            };
        }));

        try {
            const res = await fetch('/api/posts/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, action: 'like' }),
            });

            if (res.ok) {
                const data = await res.json();
                // If it earned points for a new like
                if (data.pointsEarned && nextLiked) {
                    setToast({ message: `+${data.pointsEarned} pts for liking!`, type: 'success' });
                }
                
                // If the server disagreed with our optimistic update for some reason, sync it
                if (data.liked !== nextLiked) {
                    setPosts(prev => prev.map(p => {
                        if (p.id !== postId) return p;
                        return {
                            ...p,
                            is_liked: data.liked,
                            likes_count: data.liked
                                ? (p.likes_count || 0) + 1
                                : Math.max(0, (p.likes_count || 1) - 1)
                        };
                    }));
                }
            } else {
                throw new Error('API failure');
            }
        } catch (error) {
            // Revert on network failure or 500
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                return {
                    ...p,
                    is_liked: wasLiked,
                    // Reversing what we added/subtracted
                    likes_count: wasLiked
                        ? (p.likes_count || 0) + 1
                        : Math.max(0, (p.likes_count || 0) - 1)
                };
            }));
            setToast({ message: 'Failed to like post', type: 'error' });
        } finally {
            submitLockRef.current.delete(postId);
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
        const next = new Set(expandedComments);
        if (next.has(postId)) {
            next.delete(postId);
        } else {
            next.add(postId);
            if (!comments[postId]) {
                const res = await fetch(`/api/posts/comments?post_id=${postId}`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(prev => ({ ...prev, [postId]: data.comments }));
                }
            }
        }
        setExpandedComments(next);
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
            setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));
            if (data.pointsEarned) {
                setToast({ message: `+${data.pointsEarned} pts for commenting!`, type: 'success' });
            }
        } else {
            const d = await res.json();
            setToast({ message: d.error || 'Login to comment', type: 'error' });
        }
    };

    const isVisible = (post: Post) => post.access_type === 'public' || !!post.is_unlocked;

    const getAccessBadge = (post: Post) => {
        if (post.access_type === 'public')
            return { icon: <Globe className="w-3 h-3" />, label: 'Public', style: { background: 'rgba(34,197,94,0.12)', color: '#15803d', border: '1px solid rgba(34,197,94,0.25)' } };
        if (post.access_type === 'token_gated')
            return { icon: <Lock className="w-3 h-3" />, label: `${post.token_cost} tokens`, style: { background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' } };
        return { icon: <Shield className="w-3 h-3" />, label: `Hold ${post.threshold_amount}+`, style: { background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' } };
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    background: 'var(--dash-card)', border: '1px solid var(--dash-border)',
                    borderRadius: '16px', padding: '24px', animation: 'pulse 2s infinite',
                }}>
                    <div style={{ height: '16px', background: 'var(--dash-border)', borderRadius: '8px', width: '60%', marginBottom: '12px' }} />
                    <div style={{ height: '12px', background: 'var(--dash-border)', borderRadius: '8px', width: '80%', marginBottom: '8px' }} />
                    <div style={{ height: '12px', background: 'var(--dash-border)', borderRadius: '8px', width: '40%' }} />
                </div>
            ))}
        </div>
    );

    if (posts.length === 0) return (
        <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--dash-card)', border: '1px dashed var(--dash-border)',
            borderRadius: '16px',
        }}>
            <Eye style={{ width: '32px', height: '32px', color: 'var(--dash-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dash-text-primary)', margin: '0 0 4px' }}>
                No posts yet
            </p>
            <p style={{ fontSize: '13px', color: 'var(--dash-text-muted)', margin: 0 }}>
                Check back soon for new content!
            </p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => {
                const badge = getAccessBadge(post);
                const visible = isVisible(post);
                const commentsOpen = expandedComments.has(post.id);

                return (
                    <article key={post.id} style={{
                        background: 'var(--dash-card)',
                        border: '1px solid var(--dash-border)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: 'var(--dash-shadow-sm)',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--dash-shadow-md, 0 4px 20px rgba(0,0,0,0.12))';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--dash-shadow-sm)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Hero image */}
                        {post.image_url && visible && (
                            <div style={{ position: 'relative', width: '100%', height: '260px', overflow: 'hidden', background: '#111' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={post.image_url} alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                                }} />
                                <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px' }}>
                                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                        )}

                        {/* Header / Meta */}
                        <div style={{ padding: '18px 20px', paddingBottom: post.image_url && visible ? '0' : '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Creator info row */}
                                {!hideCreatorInfo && post.creator && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{
                                            width: '34px', height: '34px', borderRadius: '50%',
                                            background: 'var(--dash-border)', overflow: 'hidden', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-secondary)',
                                        }}>
                                            {post.creator.avatar_url
                                                // eslint-disable-next-line @next/next/no-img-element
                                                ? <img src={post.creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : getInitials(post.creator.display_name || 'C')
                                            }
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>
                                                {post.creator.display_name}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--dash-text-muted)', marginLeft: '6px' }}>
                                                · {formatRelativeTime(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Title (if no image or locked) */}
                                {!(post.image_url && visible) && (
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: '0 0 4px', lineHeight: 1.4 }}>
                                        {post.title}
                                    </h3>
                                )}
                                {hideCreatorInfo && (
                                    <span style={{ fontSize: '11px', color: 'var(--dash-text-muted)', fontWeight: 500 }}>
                                        {formatRelativeTime(post.created_at)}
                                    </span>
                                )}
                            </div>

                            {/* Access badge */}
                            <span style={{
                                ...badge.style,
                                fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                                textTransform: 'uppercase', padding: '4px 10px',
                                borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px',
                                flexShrink: 0,
                                ...(post.is_unlocked && post.access_type !== 'public'
                                    ? { background: 'rgba(34,197,94,0.12)', color: '#15803d', border: '1px solid rgba(34,197,94,0.25)' }
                                    : {}),
                            }}>
                                {post.is_unlocked && post.access_type !== 'public'
                                    ? <><Unlock className="w-3 h-3" /> Unlocked</>
                                    : <>{badge.icon}{badge.label}</>
                                }
                            </span>
                        </div>

                        {/* Content body */}
                        <div style={{ padding: '0 20px 16px' }}>
                            {visible ? (
                                <p style={{
                                    fontSize: '14px', color: 'var(--dash-text-secondary)',
                                    lineHeight: 1.7, margin: '8px 0', fontWeight: 400,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {post.content}
                                </p>
                            ) : (
                                /* Locked overlay */
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--dash-bg)', padding: '20px', margin: '8px 0', border: '1px solid var(--dash-border)' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--dash-text-muted)', filter: 'blur(5px)', userSelect: 'none', margin: 0, lineHeight: 1.6 }}>
                                        {truncateText(post.content || 'This is exclusive content. Unlock it to read more.', 200)}
                                    </p>
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(var(--dash-card-rgb, 255,255,255)/0.6)',
                                        backdropFilter: 'blur(2px)',
                                    }}>
                                        <button
                                            onClick={() => handleUnlock(post.id)}
                                            disabled={unlocking === post.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 22px', borderRadius: '10px', border: 'none',
                                                background: 'var(--dash-text-primary)', color: 'var(--dash-bg)',
                                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            {unlocking === post.id ? (
                                                <>
                                                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                                    Unlocking...
                                                </>
                                            ) : post.access_type === 'token_gated' ? (
                                                <><Coins className="w-4 h-4" /> Unlock for {post.token_cost} Tokens</>
                                            ) : (
                                                <><Lock className="w-4 h-4" /> Requires {post.threshold_amount}+ Tokens</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action bar */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                paddingTop: '12px', borderTop: '1px solid var(--dash-border)', marginTop: '12px',
                            }}>
                                {/* Like */}
                                <button
                                    onClick={() => handleLike(post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                        background: post.is_liked ? 'rgba(239,68,68,0.1)' : 'var(--dash-bg)',
                                        color: post.is_liked ? '#ef4444' : 'var(--dash-text-secondary)',
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    title="Like"
                                >
                                    <Heart
                                        className="w-4 h-4"
                                        style={{ fill: post.is_liked ? '#ef4444' : 'none', transition: 'fill 0.15s' }}
                                    />
                                    {post.likes_count || 0}
                                </button>

                                {/* Comment toggle */}
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                        background: commentsOpen ? 'var(--dash-accent-soft)' : 'var(--dash-bg)',
                                        color: 'var(--dash-text-secondary)',
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    title="Comments"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {post.comments_count || 0}
                                    {commentsOpen
                                        ? <ChevronUp className="w-3 h-3" style={{ marginLeft: '2px' }} />
                                        : <ChevronDown className="w-3 h-3" style={{ marginLeft: '2px' }} />
                                    }
                                </button>
                            </div>

                            {/* Comments section */}
                            {commentsOpen && (
                                <div style={{
                                    marginTop: '12px', paddingTop: '12px',
                                    borderTop: '1px solid var(--dash-border)',
                                }}>
                                    {/* New comment input */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <input
                                            type="text"
                                            value={newComment[post.id] || ''}
                                            onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                            placeholder="Add a comment..."
                                            style={{
                                                flex: 1, padding: '8px 14px', borderRadius: '10px',
                                                border: '1px solid var(--dash-border)',
                                                background: 'var(--dash-bg)', color: 'var(--dash-text-primary)',
                                                fontSize: '13px', fontWeight: 500, outline: 'none',
                                            }}
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={!newComment[post.id]?.trim()}
                                            style={{
                                                padding: '8px 14px', borderRadius: '10px', border: 'none',
                                                background: 'var(--dash-text-primary)', color: 'var(--dash-bg)',
                                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                opacity: !newComment[post.id]?.trim() ? 0.4 : 1,
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                transition: 'opacity 0.15s',
                                            }}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Comment list */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {(comments[post.id] || []).length === 0 ? (
                                            <p style={{ fontSize: '13px', color: 'var(--dash-text-muted)', margin: 0, textAlign: 'center', padding: '8px' }}>
                                                Be the first to comment!
                                            </p>
                                        ) : (comments[post.id] || []).map(c => (
                                            <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{
                                                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                                    background: 'var(--dash-border)', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                                                    color: 'var(--dash-text-secondary)',
                                                }}>
                                                    {getInitials(c.profile?.display_name || 'U')}
                                                </div>
                                                <div style={{
                                                    flex: 1, background: 'var(--dash-bg)',
                                                    borderRadius: '10px', padding: '8px 12px',
                                                    border: '1px solid var(--dash-border)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>
                                                            {c.profile?.display_name}
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: 'var(--dash-text-muted)', fontWeight: 500 }}>
                                                            {formatRelativeTime(c.created_at)}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: 'var(--dash-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                                        {c.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}
