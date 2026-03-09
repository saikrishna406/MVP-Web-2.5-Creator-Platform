'use client';

import { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import { Plus, FileText, Lock, Globe, Shield, Eye, Heart, MessageCircle, X, Trash2, Image as ImageIcon } from 'lucide-react';
=======
import { Plus, FileText, Lock, Globe, Shield, Eye, Heart, MessageCircle, X, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
>>>>>>> hasif_branch
import { formatRelativeTime, truncateText } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Post } from '@/types';

export default function CreatorPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
<<<<<<< HEAD
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
=======
    const [submitting, setSubmitting] = useState(false);
>>>>>>> hasif_branch
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
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

    const handleOpenCreate = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setImageUrl('');
        setAccessType('public');
        setTokenCost(10);
        setThresholdAmount(100);
        setShowCreate(true);
    };

    const handleOpenEdit = (post: Post) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setImageUrl(post.image_url || '');
        setAccessType(post.access_type);
        setTokenCost(post.token_cost || 10);
        setThresholdAmount(post.threshold_amount || 100);
        setShowCreate(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const url = editingId ? `/api/posts/${editingId}` : '/api/posts';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content,
<<<<<<< HEAD
                image_url: imageUrl || undefined,
=======
                image_url: imageUrl,
>>>>>>> hasif_branch
                access_type: accessType,
                token_cost: accessType === 'token_gated' ? tokenCost : 0,
                threshold_amount: accessType === 'threshold_gated' ? thresholdAmount : 0,
            }),
        });

        if (res.ok) {
<<<<<<< HEAD
            setToast({ message: 'Post created successfully!', type: 'success' });
            setTitle('');
            setContent('');
            setImageUrl('');
            setAccessType('public');
=======
            setToast({ message: `Post ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
>>>>>>> hasif_branch
            setShowCreate(false);
            fetchPosts();
        } else {
            const data = await res.json();
            setToast({ message: data.error || `Failed to ${editingId ? 'update' : 'create'} post`, type: 'error' });
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setToast({ message: 'Post deleted successfully', type: 'success' });
            fetchPosts();
        } else {
            setToast({ message: 'Failed to delete post', type: 'error' });
        }
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
            case 'public': return <Globe className="w-4 h-4" />;
            case 'token_gated': return <Lock className="w-4 h-4" />;
            case 'threshold_gated': return <Shield className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Posts</h1>
                    <p className="text-gray-500">Create and manage your content</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" /> New Post
                </button>
            </div>

            {/* Create / Edit Post Modal */}
            {showCreate && (
<<<<<<< HEAD
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
=======
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
>>>>>>> hasif_branch
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Post' : 'Create New Post'}</h2>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Title</label>
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
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your content here..."
                                    className="textarea min-h-[200px]"
                                    required
                                />
                            </div>

                            <div>
<<<<<<< HEAD
                                <label className="block text-sm font-medium mb-2 text-foreground-muted">Image URL (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <div className="bg-background-secondary p-2.5 rounded-xl border border-border">
                                        <ImageIcon className="w-5 h-5 text-foreground-muted" />
=======
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Media / Image URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-5 h-5 text-gray-400" />
>>>>>>> hasif_branch
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

<<<<<<< HEAD
                            <div>
                                <label className="block text-sm font-medium mb-3 text-foreground-muted">Access Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('public')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'public'
                                            ? 'border-success bg-success/10'
                                            : 'border-border hover:border-border-light'
=======
                            <div className="pt-2">
                                <label className="block text-sm font-semibold mb-4 text-gray-900">Access Type</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('public')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'public'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
>>>>>>> hasif_branch
                                            }`}
                                    >
                                        <Globe className={`w-5 h-5 ${accessType === 'public' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-semibold ${accessType === 'public' ? 'text-gray-900' : 'text-gray-500'}`}>Public</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('token_gated')}
<<<<<<< HEAD
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'token_gated'
                                            ? 'border-accent bg-accent/10'
                                            : 'border-border hover:border-border-light'
=======
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'token_gated'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
>>>>>>> hasif_branch
                                            }`}
                                    >
                                        <Lock className={`w-5 h-5 ${accessType === 'token_gated' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-semibold ${accessType === 'token_gated' ? 'text-gray-900' : 'text-gray-500'}`}>Token Gated</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('threshold_gated')}
<<<<<<< HEAD
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessType === 'threshold_gated'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-border-light'
=======
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'threshold_gated'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
>>>>>>> hasif_branch
                                            }`}
                                    >
                                        <Shield className={`w-5 h-5 ${accessType === 'threshold_gated' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-semibold ${accessType === 'threshold_gated' ? 'text-gray-900' : 'text-gray-500'}`}>Threshold</div>
                                    </button>
                                </div>
                            </div>

                            {accessType === 'token_gated' && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Token Cost</label>
                                    <input
                                        type="number"
                                        value={tokenCost}
                                        onChange={(e) => setTokenCost(Number(e.target.value))}
                                        min={1}
                                        className="input bg-white"
                                        required
                                    />
                                    <p className="text-xs font-medium text-gray-500 mt-2">Fans pay this many tokens to unlock</p>
                                </div>
                            )}

                            {accessType === 'threshold_gated' && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Token Threshold</label>
                                    <input
                                        type="number"
                                        value={thresholdAmount}
                                        onChange={(e) => setThresholdAmount(Number(e.target.value))}
                                        min={1}
                                        className="input bg-white"
                                        required
                                    />
                                    <p className="text-xs font-medium text-gray-500 mt-2">Fans must hold at least this many tokens (not spent)</p>
                                </div>
                            )}

<<<<<<< HEAD
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={creating} className="btn-primary flex-1">
                                    {creating ? (
=======
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary w-full">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary w-full">
                                    {submitting ? (
>>>>>>> hasif_branch
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {editingId ? 'Saving...' : 'Publishing...'}
                                        </span>
                                    ) : (
                                        editingId ? 'Save Changes' : 'Publish Post'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-6">Start creating content for your fans!</p>
                    <button onClick={handleOpenCreate} className="btn-primary">
                        <Plus className="w-4 h-4" /> Create First Post
                    </button>
                </div>
            ) : (
<<<<<<< HEAD
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
=======
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div key={post.id} className="card p-0 hover:border-gray-300 hover:shadow-md transition-all">
                            <div className="p-6">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`badge px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 ${post.access_type === 'public' ? 'bg-green-50 text-green-700' :
                                                post.access_type === 'token_gated' ? 'bg-gray-100 text-gray-900' :
                                                    'bg-gray-100 text-gray-900'
                                                }`}>
                                                {getAccessIcon(post.access_type)}
>>>>>>> hasif_branch
                                                {post.access_type === 'public' ? 'Public' :
                                                    post.access_type === 'token_gated' ? `${post.token_cost} tokens` :
                                                        `Hold ${post.threshold_amount}+`}
                                            </span>
<<<<<<< HEAD
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
=======
                                            <span className="text-xs font-medium text-gray-400 ml-2">{formatRelativeTime(post.created_at)}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{post.title}</h3>
                                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{truncateText(post.content, 200)}</p>

                                        {post.image_url && (
                                            <div className="relative w-full h-48 mb-4 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={post.image_url} alt={post.title} className="object-cover w-full h-full" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 pt-2">
                                            <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors"><Heart className="w-4 h-4" />{post.likes_count || 0}</span>
                                            <span className="flex items-center gap-1.5 hover:text-gray-900 cursor-pointer transition-colors"><MessageCircle className="w-4 h-4" />{post.comments_count || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => handleOpenEdit(post)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
>>>>>>> hasif_branch
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
