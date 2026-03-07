'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Lock, Globe, Shield, Eye, Heart, MessageCircle, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Post } from '@/types';

export default function CreatorPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [accessType, setAccessType] = useState<'public' | 'token_gated' | 'threshold_gated'>('public');
    const [tokenCost, setTokenCost] = useState(10);
    const [thresholdAmount, setThresholdAmount] = useState(100);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content,
                image_url: imageUrl || undefined,
                access_type: accessType,
                token_cost: accessType === 'token_gated' ? tokenCost : 0,
                threshold_amount: accessType === 'threshold_gated' ? thresholdAmount : 0,
            }),
        });

        if (res.ok) {
            setToast({ message: 'Post created successfully!', type: 'success' });
            setTitle('');
            setContent('');
            setImageUrl('');
            setAccessType('public');
            setShowCreate(false);
            fetchPosts();
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to create post', type: 'error' });
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        setDeletingId(id);
        const res = await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setToast({ message: 'Post deleted successfully', type: 'success' });
            setPosts(posts.filter(p => p.id !== id));
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to delete post', type: 'error' });
        }
        setDeletingId(null);
    };

    const getAccessIcon = (type: string) => {
        switch (type) {
            case 'public': return <Globe className="w-4 h-4 text-success" />;
            case 'token_gated': return <Lock className="w-4 h-4 text-accent" />;
            case 'threshold_gated': return <Shield className="w-4 h-4 text-primary-light" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Your Posts</h1>
                    <p className="text-foreground-muted">Create and manage your content</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" /> New Post
                </button>
            </div>

            {/* Create Post Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Create New Post</h2>
                            <button onClick={() => setShowCreate(false)} className="text-foreground-muted hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground-muted">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Give your post a title..."
                                    className="input"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground-muted">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your content here..."
                                    className="textarea min-h-[200px]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground-muted">Image URL (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <div className="bg-background-secondary p-2.5 rounded-xl border border-border">
                                        <ImageIcon className="w-5 h-5 text-foreground-muted" />
                                    </div>
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="input flex-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3 text-foreground-muted">Access Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('public')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'public'
                                            ? 'border-success bg-success/10'
                                            : 'border-border hover:border-border-light'
                                            }`}
                                    >
                                        <Globe className={`w-5 h-5 mx-auto mb-1 ${accessType === 'public' ? 'text-success' : 'text-foreground-muted'}`} />
                                        <div className="text-xs font-semibold">Public</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('token_gated')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'token_gated'
                                            ? 'border-accent bg-accent/10'
                                            : 'border-border hover:border-border-light'
                                            }`}
                                    >
                                        <Lock className={`w-5 h-5 mx-auto mb-1 ${accessType === 'token_gated' ? 'text-accent' : 'text-foreground-muted'}`} />
                                        <div className="text-xs font-semibold">Token Gated</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('threshold_gated')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'threshold_gated'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-border-light'
                                            }`}
                                    >
                                        <Shield className={`w-5 h-5 mx-auto mb-1 ${accessType === 'threshold_gated' ? 'text-primary-light' : 'text-foreground-muted'}`} />
                                        <div className="text-xs font-semibold">Threshold</div>
                                    </button>
                                </div>
                            </div>

                            {accessType === 'token_gated' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Token Cost</label>
                                    <input
                                        type="number"
                                        value={tokenCost}
                                        onChange={(e) => setTokenCost(Number(e.target.value))}
                                        min={1}
                                        className="input"
                                        required
                                    />
                                    <p className="text-xs text-foreground-muted mt-1">Fans pay this many tokens to unlock</p>
                                </div>
                            )}

                            {accessType === 'threshold_gated' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Token Threshold</label>
                                    <input
                                        type="number"
                                        value={thresholdAmount}
                                        onChange={(e) => setThresholdAmount(Number(e.target.value))}
                                        min={1}
                                        className="input"
                                        required
                                    />
                                    <p className="text-xs text-foreground-muted mt-1">Fans must hold at least this many tokens (not spent)</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={creating} className="btn-primary flex-1">
                                    {creating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Publishing...
                                        </span>
                                    ) : (
                                        'Publish Post'
                                    )}
                                </button>
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="card text-center py-16">
                    <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-foreground-muted mb-4">Start creating content for your fans!</p>
                    <button onClick={() => setShowCreate(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> Create First Post
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <div key={post.id} className="card hover:border-border-light transition-all flex flex-col overflow-hidden p-0">
                            {post.image_url ? (
                                <div className="w-full h-48 bg-background-secondary overflow-hidden relative">
                                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover shrink-0" />
                                </div>
                            ) : null}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getAccessIcon(post.access_type)}
                                            <span className={`badge text-xs ${post.access_type === 'public' ? 'badge-success' :
                                                post.access_type === 'token_gated' ? 'badge-accent' :
                                                    'badge-primary'
                                                }`}>
                                                {post.access_type === 'public' ? 'Public' :
                                                    post.access_type === 'token_gated' ? `${post.token_cost} tokens` :
                                                        `Hold ${post.threshold_amount}+`}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 truncate">{post.title}</h3>
                                        <p className="text-sm text-foreground-muted mb-3 line-clamp-2 min-h-[40px]">{truncateText(post.content, 120)}</p>
                                    </div>
                                </div>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
                                        <span>{formatRelativeTime(post.created_at)}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count || 0}</span>
                                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count || 0}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        disabled={deletingId === post.id}
                                        className="p-1.5 text-foreground-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors ml-2"
                                        title="Delete Post"
                                    >
                                        {deletingId === post.id ? (
                                            <span className="w-4 h-4 border-2 border-error/30 border-t-error rounded-full animate-spin block" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
