'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Lock, Globe, Shield, Eye, Heart, MessageCircle, X } from 'lucide-react';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Post } from '@/types';

export default function CreatorPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
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
                access_type: accessType,
                token_cost: accessType === 'token_gated' ? tokenCost : 0,
                threshold_amount: accessType === 'threshold_gated' ? thresholdAmount : 0,
            }),
        });

        if (res.ok) {
            setToast({ message: 'Post created successfully!', type: 'success' });
            setTitle('');
            setContent('');
            setAccessType('public');
            setShowCreate(false);
            fetchPosts();
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to create post', type: 'error' });
        }
        setCreating(false);
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
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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
                                        <span className="flex items-center gap-2">
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
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="card hover:border-border-light transition-all">
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
                                    <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                                    <p className="text-sm text-foreground-muted mb-3">{truncateText(post.content, 150)}</p>
                                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                                        <span>{formatRelativeTime(post.created_at)}</span>
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count || 0}</span>
                                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count || 0}</span>
                                    </div>
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
