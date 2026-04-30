'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Lock, Coins, Shield, Globe, Unlock, Send, X } from 'lucide-react';
import { formatRelativeTime, getInitials, truncateText } from '@/lib/utils';
import type { Post, PostComment } from '@/types';

interface CreatorPostsGridProps {
  creatorId: string;
  limit?: number;
}

export function CreatorPostsGrid({ creatorId, limit = 30 }: CreatorPostsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const submitLock = useRef(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), creator_id: creatorId });
    const res = await fetch(`/api/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts || []);
    }
    setLoading(false);
  }, [creatorId, limit]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openPost = async (post: Post) => {
    setSelected(post);
    setNewComment('');
    setCommentsLoading(true);
    const res = await fetch(`/api/posts/comments?post_id=${post.id}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setCommentsLoading(false);
  };

  const closeModal = () => { setSelected(null); setComments([]); };

  const handleLike = async () => {
    if (!selected || submitLock.current) return;
    submitLock.current = true;
    const wasLiked = selected.is_liked;
    const next = { ...selected, is_liked: !wasLiked, likes_count: (selected.likes_count || 0) + (wasLiked ? -1 : 1) };
    setSelected(next);
    setPosts(prev => prev.map(p => p.id === next.id ? next : p));
    await fetch('/api/posts/interact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: selected.id, action: 'like' }) });
    submitLock.current = false;
  };

  const handleUnlock = async () => {
    if (!selected) return;
    setUnlocking(true);
    const res = await fetch('/api/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: selected.id }) });
    const data = await res.json();
    if (res.ok) {
      const updated = { ...selected, is_unlocked: true };
      setSelected(updated);
      setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setToast('Unlocked!');
    } else {
      setToast(data.error || 'Failed to unlock');
    }
    setUnlocking(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleComment = async () => {
    const content = newComment.trim();
    if (!content || !selected) return;
    const res = await fetch('/api/posts/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: selected.id, content }) });
    if (res.ok) {
      const data = await res.json();
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      const updated = { ...selected, comments_count: (selected.comments_count || 0) + 1 };
      setSelected(updated);
      setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const isVisible = (post: Post) => post.access_type === 'public' || !!post.is_unlocked;

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ aspectRatio: '1', background: 'var(--dash-border)', animation: 'cpg-pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
        ))}
        <style>{`@keyframes cpg-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dash-text-muted)', fontSize: '14px' }}>
        No posts yet.
      </div>
    );
  }

  return (
    <>
      {/* ── Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
        {posts.map(post => {
          const visible = isVisible(post);
          const hasImg = !!post.image_url;
          return (
            <button
              key={post.id}
              onClick={() => openPost(post)}
              style={{
                aspectRatio: '1', position: 'relative', overflow: 'hidden',
                background: hasImg ? '#111' : 'var(--dash-card)',
                border: 'none', cursor: 'pointer', padding: 0,
                display: 'block', width: '100%',
              }}
              className="cpg-tile"
            >
              {hasImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image_url!} alt=""
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    filter: visible ? 'none' : 'blur(10px) brightness(0.5)',
                    transition: 'transform 0.3s',
                  }}
                  className="cpg-tile-img"
                />
              )}
              {!hasImg && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-primary)', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.title}
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--dash-text-muted)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {visible ? truncateText(post.content, 80) : '• • •'}
                  </p>
                </div>
              )}
              {/* Lock overlay */}
              {!visible && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
                  <Lock size={20} color="#fff" />
                </div>
              )}
              {/* Hover stats */}
              <div className="cpg-hover-overlay">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                  <Heart size={15} style={{ fill: '#fff' }} /> {post.likes_count || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                  <MessageCircle size={15} style={{ fill: '#fff', color: '#fff' }} /> {post.comments_count || 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: 'var(--dash-card)', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid var(--dash-border)', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-secondary)', flexShrink: 0 }}>
                {selected.creator?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={selected.creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(selected.creator?.display_name || 'C')
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>{selected.creator?.display_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--dash-text-muted)' }}>@{selected.creator?.username} · {formatRelativeTime(selected.created_at)}</div>
              </div>
              {/* Access badge */}
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                ...(selected.access_type === 'public' || selected.is_unlocked
                  ? { background: 'rgba(34,197,94,0.12)', color: '#15803d', border: '1px solid rgba(34,197,94,0.25)' }
                  : { background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' })
              }}>
                {selected.is_unlocked && selected.access_type !== 'public' ? <><Unlock size={10} /> Unlocked</> :
                  selected.access_type === 'public' ? <><Globe size={10} /> Free</> :
                    selected.access_type === 'token_gated' ? <><Coins size={10} /> {selected.token_cost} tokens</> :
                      <><Shield size={10} /> Hold {selected.threshold_amount}+</>}
              </span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dash-text-muted)', padding: '4px', display: 'flex', borderRadius: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* Image */}
              {selected.image_url && isVisible(selected) && (
                <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', background: '#000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.image_url} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              <div style={{ padding: '18px 20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dash-text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>{selected.title}</h3>

                {isVisible(selected) ? (
                  <p style={{ fontSize: '14px', color: 'var(--dash-text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.content}</p>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--dash-bg)', padding: '20px', border: '1px solid var(--dash-border)', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'var(--dash-text-muted)', filter: 'blur(5px)', userSelect: 'none', margin: '0 0 16px', lineHeight: 1.6 }}>
                      {truncateText(selected.content, 150)}
                    </p>
                    <button onClick={handleUnlock} disabled={unlocking} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'var(--dash-text-primary)', color: 'var(--dash-bg)', fontSize: '14px', fontWeight: 700, cursor: unlocking ? 'not-allowed' : 'pointer', opacity: unlocking ? 0.6 : 1 }}>
                      {unlocking ? 'Unlocking...' : selected.access_type === 'token_gated' ? <><Coins size={14} /> Unlock for {selected.token_cost} Tokens</> : <><Shield size={14} /> Requires {selected.threshold_amount}+ Tokens</>}
                    </button>
                  </div>
                )}

                {/* Action bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--dash-border)' }}>
                  <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: 'none', background: selected.is_liked ? 'rgba(239,68,68,0.1)' : 'var(--dash-bg)', color: selected.is_liked ? '#ef4444' : 'var(--dash-text-secondary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <Heart size={16} style={{ fill: selected.is_liked ? '#ef4444' : 'none' }} /> {selected.likes_count || 0}
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', color: 'var(--dash-text-secondary)', fontSize: '13px', fontWeight: 700 }}>
                    <MessageCircle size={16} /> {selected.comments_count || 0}
                  </span>
                </div>

                {/* Comments */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="text" value={newComment} placeholder="Add a comment…"
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleComment()}
                      style={{ flex: 1, padding: '9px 14px', borderRadius: '999px', border: '1.5px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                    <button onClick={handleComment} disabled={!newComment.trim()} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'var(--dash-text-primary)', color: 'var(--dash-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: newComment.trim() ? 1 : 0.35, flexShrink: 0 }}>
                      <Send size={14} />
                    </button>
                  </div>

                  {commentsLoading ? (
                    <p style={{ fontSize: '12px', color: 'var(--dash-text-muted)', textAlign: 'center' }}>Loading…</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {comments.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--dash-text-muted)', textAlign: 'center', margin: 0, padding: '8px' }}>Be the first to comment ✨</p>
                      ) : comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--dash-text-secondary)', flexShrink: 0 }}>
                            {getInitials(c.profile?.display_name || 'U')}
                          </div>
                          <div style={{ flex: 1, background: 'var(--dash-bg)', borderRadius: '10px', padding: '8px 12px', border: '1px solid var(--dash-border)' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '2px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-primary)' }}>{c.profile?.display_name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--dash-text-muted)' }}>{formatRelativeTime(c.created_at)}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--dash-text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--dash-text-primary)', color: 'var(--dash-bg)', padding: '10px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, zIndex: 2000, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      <style>{`
        .cpg-tile { transition: opacity 0.15s; }
        .cpg-tile:hover { opacity: 0.9; }
        .cpg-tile:hover .cpg-tile-img { transform: scale(1.04); }
        .cpg-hover-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center; gap: 20px;
          opacity: 0; transition: opacity 0.2s;
        }
        .cpg-tile:hover .cpg-hover-overlay { opacity: 1; }
      `}</style>
    </>
  );
}
