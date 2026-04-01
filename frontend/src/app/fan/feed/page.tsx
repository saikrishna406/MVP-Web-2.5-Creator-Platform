'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Heart, MessageCircle, Lock, Unlock, Coins,
    Send, Globe, Shield, Sparkles, Search, SlidersHorizontal, X
} from 'lucide-react';
import { formatRelativeTime, getInitials, truncateText } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import type { Post, PostComment } from '@/types';

// ─── Skeleton card ──────────────────────────────────────────────────
function FeedSkeleton() {
    return (
        <div className="ff-card ff-skeleton" aria-hidden="true">
            <div className="ff-sk-header">
                <div className="ff-sk-avatar" />
                <div style={{ flex: 1 }}>
                    <div className="ff-sk-line" style={{ width: '40%', height: 13, marginBottom: 6 }} />
                    <div className="ff-sk-line" style={{ width: '25%', height: 10 }} />
                </div>
            </div>
            <div className="ff-sk-img" />
            <div className="ff-sk-body">
                <div className="ff-sk-line" style={{ width: '80%', height: 16, marginBottom: 10 }} />
                <div className="ff-sk-line" style={{ width: '60%', height: 13, marginBottom: 6 }} />
                <div className="ff-sk-line" style={{ width: '70%', height: 13 }} />
            </div>
        </div>
    );
}

// ─── Double-tap heart burst ─────────────────────────────────────────
function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className="ff-heart-burst" style={{ left: x - 40, top: y - 40 }}>
            <Heart size={80} style={{ fill: '#ef4444', color: '#ef4444' }} />
        </div>
    );
}

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());
    const [comments, setComments] = useState<Record<string, PostComment[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [unlocking, setUnlocking] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'public' | 'gated'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [heartBurst, setHeartBurst] = useState<{ id: string; x: number; y: number } | null>(null);

    // Double-tap tracking
    const lastTapRef = useRef<Record<string, number>>({});
    const submitLockRef = useRef<Set<string>>(new Set());

    const fetchPosts = useCallback(async () => {
        const res = await fetch('/api/posts?limit=30');
        if (res.ok) {
            const data = await res.json();
            setPosts(data.posts || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    // Filtered + searched posts
    const visiblePosts = posts.filter(p => {
        const matchesFilter =
            filter === 'all' ? true :
            filter === 'public' ? p.access_type === 'public' :
            p.access_type !== 'public';
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            (p.creator?.display_name || '').toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

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

    // Double-tap to like
    const handleTap = (postId: string, e: React.MouseEvent) => {
        const now = Date.now();
        const last = lastTapRef.current[postId] || 0;
        if (now - last < 350) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHeartBurst({ id: postId, x: e.clientX - rect.left, y: e.clientY - rect.top });
            if (!posts.find(p => p.id === postId)?.is_liked) handleLike(postId);
        }
        lastTapRef.current[postId] = now;
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
            setToast({ message: `Unlocked! ${data.tokensSpent ? `-${data.tokensSpent} tokens` : ''}`, type: 'success' });
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
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
            if (data.pointsEarned) setToast({ message: `+${data.pointsEarned} pts for commenting!`, type: 'success' });
        }
    };

    const isVisible = (post: Post) => post.access_type === 'public' || !!post.is_unlocked;

    return (
        <>
            <div className="ff-page">

                {/* ── Page header ── */}
                <div className="ff-header">
                    <div>
                        <h1 className="ff-h1">Feed</h1>
                        <p className="ff-sub">Discover exclusive creator content</p>
                    </div>

                    {/* Search + filter */}
                    <div className="ff-toolbar">
                        <div className="ff-search-wrap">
                            <Search size={14} className="ff-search-icon" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search posts..."
                                className="ff-search"
                            />
                            {searchQuery && (
                                <button className="ff-search-clear" onClick={() => setSearchQuery('')}><X size={13} /></button>
                            )}
                        </div>
                        <div className="ff-filter-wrap">
                            <button className={`ff-filter-btn${filterOpen ? ' ff-filter-btn--active' : ''}`} onClick={() => setFilterOpen(v => !v)}>
                                <SlidersHorizontal size={14} /> Filter
                                {filter !== 'all' && <span className="ff-filter-dot" />}
                            </button>
                            {filterOpen && (
                                <div className="ff-filter-dropdown">
                                    {(['all', 'public', 'gated'] as const).map(f => (
                                        <button key={f} className={`ff-filter-opt${filter === f ? ' ff-filter-opt--active' : ''}`} onClick={() => { setFilter(f); setFilterOpen(false); }}>
                                            {f === 'all' ? <><Globe size={13} /> All Posts</> : f === 'public' ? <><Globe size={13} /> Free Only</> : <><Lock size={13} /> Exclusive</>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active filter pill */}
                {filter !== 'all' && (
                    <div className="ff-active-filter">
                        Showing: <strong>{filter === 'public' ? 'Free Posts' : 'Exclusive Posts'}</strong>
                        <button onClick={() => setFilter('all')}><X size={12} /></button>
                    </div>
                )}

                {/* Feed */}
                <div className="ff-feed">
                    {loading ? (
                        <>{[1, 2, 3].map(i => <FeedSkeleton key={i} />)}</>
                    ) : visiblePosts.length === 0 ? (
                        <div className="ff-empty">
                            <Sparkles size={32} className="ff-empty-icon" />
                            <h3 className="ff-empty-h">{searchQuery ? 'No results found' : 'Nothing here yet'}</h3>
                            <p className="ff-empty-p">{searchQuery ? 'Try a different search or filter.' : 'Check back soon — creators are cooking up content!'}</p>
                        </div>
                    ) : visiblePosts.map(post => {
                        const visible = isVisible(post);
                        const commentsOpen = expandedComments.has(post.id);
                        const captionExpanded = expandedCaptions.has(post.id);
                        const longCaption = post.content.length > 180;

                        return (
                            <article key={post.id} className="ff-card">

                                {/* Creator header */}
                                <div className="ff-card-header">
                                    <div className="ff-avatar">
                                        {post.creator?.avatar_url
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={post.creator.avatar_url} alt="" className="ff-avatar-img" />
                                            : <span className="ff-avatar-initials">{getInitials(post.creator?.display_name || 'C')}</span>
                                        }
                                    </div>
                                    <div className="ff-creator-info">
                                        <span className="ff-creator-name">{post.creator?.display_name}</span>
                                        <span className="ff-creator-meta">@{post.creator?.username} · {formatRelativeTime(post.created_at)}</span>
                                    </div>
                                    {/* Access chip */}
                                    {post.access_type === 'public' ? (
                                        <span className="ff-chip ff-chip--public"><Globe size={10} /> Free</span>
                                    ) : post.is_unlocked ? (
                                        <span className="ff-chip ff-chip--unlocked"><Unlock size={10} /> Unlocked</span>
                                    ) : (
                                        <span className="ff-chip ff-chip--gated">
                                            {post.access_type === 'token_gated' ? <><Coins size={10} /> {post.token_cost} tokens</> : <><Shield size={10} /> Hold {post.threshold_amount}+</>}
                                        </span>
                                    )}
                                </div>

                                {/* Media */}
                                {post.image_url && (
                                    <div
                                        className="ff-media"
                                        onClick={e => visible && handleTap(post.id, e)}
                                        style={{ cursor: visible ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={post.image_url} alt={post.title}
                                            className={`ff-media-img${!visible ? ' ff-media-img--locked' : ''}`}
                                            loading="lazy"
                                        />
                                        {/* Double-tap heart */}
                                        {heartBurst?.id === post.id && (
                                            <HeartBurst
                                                x={heartBurst.x} y={heartBurst.y}
                                                onDone={() => setHeartBurst(null)}
                                            />
                                        )}
                                        {/* Locked overlay on image */}
                                        {!visible && (
                                            <div className="ff-locked-overlay">
                                                <div className="ff-locked-pill">
                                                    <Lock size={14} />
                                                    {post.access_type === 'token_gated' ? `Unlock for ${post.token_cost} tokens` : `Hold ${post.threshold_amount}+ tokens`}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Body */}
                                <div className="ff-card-body">

                                    {/* Title */}
                                    <h3 className="ff-post-title">{post.title}</h3>

                                    {/* Caption / content */}
                                    {visible ? (
                                        <div className="ff-caption-wrap">
                                            <p className={`ff-caption${!captionExpanded && longCaption ? ' ff-caption--clamped' : ''}`}>
                                                {post.content}
                                            </p>
                                            {longCaption && (
                                                <button
                                                    className="ff-caption-toggle"
                                                    onClick={() => setExpandedCaptions(prev => {
                                                        const s = new Set(prev);
                                                        s.has(post.id) ? s.delete(post.id) : s.add(post.id);
                                                        return s;
                                                    })}
                                                >
                                                    {captionExpanded ? 'less' : 'more'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        /* Locked content teaser */
                                        !post.image_url && (
                                            <div className="ff-locked-text">
                                                <p className="ff-locked-teaser">{truncateText(post.content, 120)}</p>
                                                <button
                                                    className="ff-unlock-btn"
                                                    onClick={() => handleUnlock(post.id)}
                                                    disabled={unlocking === post.id}
                                                >
                                                    {unlocking === post.id ? (
                                                        <><span className="ff-spinner" /> Unlocking…</>
                                                    ) : post.access_type === 'token_gated' ? (
                                                        <><Coins size={15} /> Unlock for {post.token_cost} Tokens</>
                                                    ) : (
                                                        <><Shield size={15} /> Requires {post.threshold_amount}+ Tokens</>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    )}

                                    {/* Unlock button below image if locked and has image */}
                                    {!visible && post.image_url && (
                                        <button
                                            className="ff-unlock-btn ff-unlock-btn--below"
                                            onClick={() => handleUnlock(post.id)}
                                            disabled={unlocking === post.id}
                                        >
                                            {unlocking === post.id ? (
                                                <><span className="ff-spinner" /> Unlocking…</>
                                            ) : post.access_type === 'token_gated' ? (
                                                <><Coins size={15} /> Unlock for {post.token_cost} Tokens</>
                                            ) : (
                                                <><Shield size={15} /> Requires {post.threshold_amount}+ Tokens</>
                                            )}
                                        </button>
                                    )}

                                    {/* Action bar */}
                                    <div className="ff-actions">
                                        <button
                                            className={`ff-action-btn${post.is_liked ? ' ff-action-btn--liked' : ''}`}
                                            onClick={() => handleLike(post.id)}
                                            aria-label="Like"
                                        >
                                            <Heart size={18} className={post.is_liked ? 'ff-heart-filled' : ''} />
                                            <span>{post.likes_count || 0}</span>
                                        </button>
                                        <button
                                            className={`ff-action-btn${commentsOpen ? ' ff-action-btn--active' : ''}`}
                                            onClick={() => toggleComments(post.id)}
                                            aria-label="Comments"
                                        >
                                            <MessageCircle size={18} />
                                            <span>{post.comments_count || 0}</span>
                                        </button>
                                    </div>

                                    {/* Comments */}
                                    {commentsOpen && (
                                        <div className="ff-comments">
                                            {/* Input */}
                                            <div className="ff-comment-input-row">
                                                <input
                                                    type="text"
                                                    value={newComment[post.id] || ''}
                                                    onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                                    placeholder="Add a comment…"
                                                    className="ff-comment-input"
                                                />
                                                <button
                                                    className="ff-comment-send"
                                                    onClick={() => handleComment(post.id)}
                                                    disabled={!newComment[post.id]?.trim()}
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>

                                            {/* List */}
                                            <div className="ff-comment-list">
                                                {!comments[post.id] ? (
                                                    <p className="ff-comment-loading">Loading…</p>
                                                ) : comments[post.id].length === 0 ? (
                                                    <p className="ff-comment-empty">Be the first to comment ✨</p>
                                                ) : comments[post.id].map(c => (
                                                    <div key={c.id} className="ff-comment">
                                                        <div className="ff-comment-avatar">
                                                            {getInitials(c.profile?.display_name || 'U')}
                                                        </div>
                                                        <div className="ff-comment-bubble">
                                                            <div className="ff-comment-meta">
                                                                <span className="ff-comment-name">{c.profile?.display_name}</span>
                                                                <span className="ff-comment-time">{formatRelativeTime(c.created_at)}</span>
                                                            </div>
                                                            <p className="ff-comment-text">{c.content}</p>
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
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Scoped styles ── */}
            <style>{`
                /* Page wrapper */
                .ff-page { max-width: 680px; margin: 0 auto; padding-bottom: 80px; }

                /* Header */
                .ff-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
                .ff-h1 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.03em; color: var(--dash-text-primary); margin: 0; line-height: 1; }
                .ff-sub { font-size: 14px; color: var(--dash-text-muted); margin: 6px 0 0; font-weight: 500; }

                /* Toolbar */
                .ff-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .ff-search-wrap { position: relative; display: flex; align-items: center; }
                .ff-search-icon { position: absolute; left: 11px; color: var(--dash-text-muted); pointer-events: none; }
                .ff-search { padding: 8px 32px 8px 32px; border-radius: 10px; border: 1.5px solid var(--dash-border); background: var(--dash-card); color: var(--dash-text-primary); font-size: 13px; font-weight: 500; outline: none; width: 200px; transition: border-color 0.15s, width 0.2s; }
                .ff-search:focus { border-color: var(--dash-text-primary); width: 240px; }
                .ff-search-clear { position: absolute; right: 8px; background: none; border: none; color: var(--dash-text-muted); cursor: pointer; padding: 2px; display: flex; }

                .ff-filter-wrap { position: relative; }
                .ff-filter-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid var(--dash-border); background: var(--dash-card); color: var(--dash-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; position: relative; }
                .ff-filter-btn--active, .ff-filter-btn:hover { border-color: var(--dash-text-primary); color: var(--dash-text-primary); }
                .ff-filter-dot { width: 7px; height: 7px; border-radius: 50%; background: #6366f1; position: absolute; top: 5px; right: 5px; }
                .ff-filter-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: var(--dash-card); border: 1.5px solid var(--dash-border); border-radius: 12px; padding: 6px; z-index: 20; min-width: 160px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); display: flex; flex-direction: column; gap: 2px; }
                .ff-filter-opt { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 8px; border: none; background: none; color: var(--dash-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; transition: background 0.1s; }
                .ff-filter-opt:hover { background: var(--dash-bg); color: var(--dash-text-primary); }
                .ff-filter-opt--active { background: var(--dash-bg); color: var(--dash-text-primary); }

                /* Active filter pill */
                .ff-active-filter { display: inline-flex; align-items: center; gap: 8px; background: var(--dash-accent-soft, rgba(99,102,241,0.08)); color: var(--dash-text-secondary); border-radius: 999px; padding: 5px 12px 5px 14px; font-size: 12px; margin-bottom: 16px; border: 1px solid var(--dash-border); }
                .ff-active-filter button { background: none; border: none; cursor: pointer; color: inherit; display: flex; padding: 0; }

                /* Feed */
                .ff-feed { display: flex; flex-direction: column; gap: 20px; }

                /* Empty */
                .ff-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; background: var(--dash-card); border: 1.5px dashed var(--dash-border); border-radius: 20px; }
                .ff-empty-icon { color: var(--dash-text-secondary); }
                .ff-empty-h { font-size: 18px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
                .ff-empty-p { font-size: 14px; color: var(--dash-text-muted); margin: 0; max-width: 300px; }

                /* ── Post card ── */
                .ff-card {
                    background: var(--dash-card); border: 1px solid var(--dash-border);
                    border-radius: 20px; overflow: hidden;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    transition: box-shadow 0.2s ease;
                }
                .ff-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.09); }

                /* Creator header */
                .ff-card-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px 12px; }
                .ff-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--dash-border); display: flex; align-items: center; justify-content: center; border: 2px solid var(--dash-border); }
                .ff-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .ff-avatar-initials { font-size: 14px; font-weight: 800; color: var(--dash-text-secondary); }
                .ff-creator-info { flex: 1; min-width: 0; }
                .ff-creator-name { display: block; font-size: 14px; font-weight: 700; color: var(--dash-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .ff-creator-meta { display: block; font-size: 12px; color: var(--dash-text-muted); font-weight: 500; margin-top: 1px; }

                /* Chips */
                .ff-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; flex-shrink: 0; }
                .ff-chip--public { background: rgba(34,197,94,0.1); color: #15803d; border: 1px solid rgba(34,197,94,0.2); }
                .ff-chip--unlocked { background: rgba(34,197,94,0.1); color: #15803d; border: 1px solid rgba(34,197,94,0.2); }
                .ff-chip--gated { background: rgba(99,102,241,0.08); color: #6366f1; border: 1px solid rgba(99,102,241,0.18); }

                /* Media */
                .ff-media { width: 100%; aspect-ratio: 4/3; overflow: hidden; background: #111; flex-shrink: 0; position: relative; }
                @media (min-width: 480px) { .ff-media { aspect-ratio: 16/9; } }
                .ff-media-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
                .ff-card:hover .ff-media-img:not(.ff-media-img--locked) { transform: scale(1.02); }
                .ff-media-img--locked { filter: blur(16px) brightness(0.6); transform: scale(1.05); }

                /* Locked overlay on image */
                .ff-locked-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
                .ff-locked-pill { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: #fff; padding: 12px 20px; border-radius: 999px; font-size: 14px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); }

                /* Body */
                .ff-card-body { padding: 14px 18px 18px; display: flex; flex-direction: column; gap: 10px; }
                .ff-post-title { font-size: 17px; font-weight: 800; color: var(--dash-text-primary); margin: 0; letter-spacing: -0.02em; line-height: 1.3; }

                /* Caption */
                .ff-caption-wrap { position: relative; }
                .ff-caption { font-size: 14px; color: var(--dash-text-secondary); line-height: 1.65; margin: 0; white-space: pre-wrap; word-break: break-word; }
                .ff-caption--clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .ff-caption-toggle { background: none; border: none; color: var(--dash-text-muted); font-size: 13px; font-weight: 700; cursor: pointer; padding: 0; margin-top: 2px; }
                .ff-caption-toggle:hover { color: var(--dash-text-primary); }

                /* Locked text teaser */
                .ff-locked-text { background: var(--dash-bg); border-radius: 12px; padding: 14px; border: 1px solid var(--dash-border); display: flex; flex-direction: column; gap: 12px; }
                .ff-locked-teaser { font-size: 13px; color: var(--dash-text-muted); margin: 0; filter: blur(3px); user-select: none; line-height: 1.5; }

                /* Unlock button */
                .ff-unlock-btn {
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 12px 24px; border-radius: 12px; border: none;
                    background: var(--dash-text-primary); color: var(--dash-bg);
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    transition: opacity 0.15s, transform 0.15s;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                .ff-unlock-btn:hover { opacity: 0.88; transform: translateY(-1px); }
                .ff-unlock-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .ff-unlock-btn--below { width: 100%; margin-top: 4px; }

                /* Actions */
                .ff-actions { display: flex; align-items: center; gap: 6px; padding-top: 6px; border-top: 1px solid var(--dash-border); margin-top: 4px; }
                .ff-action-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 7px 12px; border-radius: 9px; border: none;
                    background: var(--dash-bg); color: var(--dash-text-secondary);
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    transition: all 0.15s ease;
                }
                .ff-action-btn:hover { background: var(--dash-border); color: var(--dash-text-primary); }
                .ff-action-btn--liked { color: #ef4444; background: rgba(239,68,68,0.08); }
                .ff-action-btn--liked:hover { background: rgba(239,68,68,0.14); }
                .ff-action-btn--active { color: var(--dash-text-primary); background: var(--dash-border); }
                .ff-heart-filled { fill: #ef4444; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
                .ff-action-btn--liked .ff-heart-filled { transform: scale(1.25); }

                /* Double-tap burst */
                .ff-heart-burst {
                    position: absolute; pointer-events: none; z-index: 10;
                    animation: ff-burst 0.9s ease forwards;
                }
                @keyframes ff-burst {
                    0% { transform: scale(0.2); opacity: 1; }
                    60% { transform: scale(1.1); opacity: 0.9; }
                    100% { transform: scale(1.4); opacity: 0; }
                }

                /* Comments */
                .ff-comments { display: flex; flex-direction: column; gap: 12px; padding-top: 10px; border-top: 1px solid var(--dash-border); margin-top: 4px; animation: ff-expand 0.2s ease; }
                @keyframes ff-expand { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

                .ff-comment-input-row { display: flex; gap: 8px; align-items: center; }
                .ff-comment-input {
                    flex: 1; padding: 9px 14px; border-radius: 999px;
                    border: 1.5px solid var(--dash-border); background: var(--dash-bg);
                    color: var(--dash-text-primary); font-size: 13px; font-weight: 500;
                    outline: none; transition: border-color 0.15s;
                }
                .ff-comment-input:focus { border-color: var(--dash-text-primary); }
                .ff-comment-send {
                    width: 34px; height: 34px; border-radius: 50%; border: none;
                    background: var(--dash-text-primary); color: var(--dash-bg);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
                }
                .ff-comment-send:disabled { opacity: 0.35; cursor: not-allowed; }

                .ff-comment-list { display: flex; flex-direction: column; gap: 10px; }
                .ff-comment-loading, .ff-comment-empty { font-size: 12px; color: var(--dash-text-muted); text-align: center; margin: 0; padding: 8px; }
                .ff-comment { display: flex; gap: 10px; align-items: flex-start; }
                .ff-comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--dash-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: var(--dash-text-secondary); flex-shrink: 0; }
                .ff-comment-bubble { flex: 1; background: var(--dash-bg); border-radius: 12px; border-bottom-left-radius: 4px; padding: 9px 12px; border: 1px solid var(--dash-border); }
                .ff-comment-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
                .ff-comment-name { font-size: 12px; font-weight: 700; color: var(--dash-text-primary); }
                .ff-comment-time { font-size: 10px; color: var(--dash-text-muted); font-weight: 500; }
                .ff-comment-text { font-size: 13px; color: var(--dash-text-secondary); margin: 0; line-height: 1.5; }

                /* Spinner */
                .ff-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: ff-spin 0.7s linear infinite; flex-shrink: 0; }
                @keyframes ff-spin { to { transform: rotate(360deg); } }

                /* Skeleton */
                .ff-skeleton { pointer-events: none; }
                .ff-sk-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px 12px; }
                .ff-sk-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--dash-border); flex-shrink: 0; }
                .ff-sk-img { height: 240px; background: var(--dash-border); }
                .ff-sk-body { padding: 16px 18px; }
                .ff-sk-line { background: var(--dash-border); border-radius: 6px; animation: ff-pulse 1.6s ease-in-out infinite; }
                @keyframes ff-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

                /* Responsive */
                @media (max-width: 640px) {
                    .ff-header { flex-direction: column; gap: 12px; }
                    .ff-toolbar { width: 100%; }
                    .ff-search { width: 100%; flex: 1; }
                    .ff-search:focus { width: 100%; }
                    .ff-search-wrap { flex: 1; }
                }
            `}</style>
        </>
    );
}
