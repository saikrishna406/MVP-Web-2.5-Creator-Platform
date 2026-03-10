'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Lock, Globe, Shield, Eye, Heart, MessageCircle, X, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Post } from '@/types';

export default function CreatorPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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
                image_url: imageUrl,
                access_type: accessType,
                token_cost: accessType === 'token_gated' ? tokenCost : 0,
                threshold_amount: accessType === 'threshold_gated' ? thresholdAmount : 0,
            }),
        });

        if (res.ok) {
            setToast({ message: `Post ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
            setShowCreate(false);
            fetchPosts();
        } else {
            const data = await res.json();
            setToast({ message: data.error || `Failed to ${editingId ? 'update' : 'create'} post`, type: 'error' });
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

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
        <div className="space-y-12 animate-fade-in-up pb-24 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 mt-4 text-center sm:text-left gap-6">
                <div>
                    <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tighter text-gray-900 mb-4 pb-2">Your Posts</h1>
                    <p className="text-gray-500 text-xl md:text-2xl font-light tracking-wide">Create and manage your content.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="btn-primary shrink-0 text-lg px-6 py-4 rounded-full flex items-center gap-2 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all"
                >
                    <Plus className="w-6 h-6" /> New Post
                </button>
            </div>

            {/* Create / Edit Post Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Media / Image URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-5 h-5 text-gray-400" />
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

                            <div className="pt-2">
                                <label className="block text-sm font-semibold mb-4 text-gray-900">Access Type</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('public')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'public'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <Globe className={`w-5 h-5 ${accessType === 'public' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-semibold ${accessType === 'public' ? 'text-gray-900' : 'text-gray-500'}`}>Public</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('token_gated')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'token_gated'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <Lock className={`w-5 h-5 ${accessType === 'token_gated' ? 'text-gray-900' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-semibold ${accessType === 'token_gated' ? 'text-gray-900' : 'text-gray-500'}`}>Token Gated</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessType('threshold_gated')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${accessType === 'threshold_gated'
                                            ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
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

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary w-full">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary w-full">
                                    {submitting ? (
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
                <div className="card flex flex-col items-center justify-center py-32 text-center rounded-3xl border-dashed">
                    <FileText className="w-16 h-16 text-gray-200 mb-6" />
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 text-lg mb-8">Start creating content for your fans!</p>
                    <button onClick={handleOpenCreate} className="btn-primary shrink-0 text-base px-6 py-4 rounded-full flex items-center gap-2 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                        <Plus className="w-5 h-5" /> Create First Post
                    </button>
                </div>
            ) : (
                <div className="space-y-12 pb-12">
                    {posts.map((post, index) => (
                        <div key={post.id}
                            className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 ease-out border border-gray-100 relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* IF HAS IMAGE: Edge-to-Edge Hero Image */}
                            {post.image_url ? (
                                <div className="relative w-full h-[400px] sm:h-[500px] bg-gray-900 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-500" />

                                    {/* Header (Over Image) */}
                                    <div className="absolute top-6 left-6 right-6 flex items-start justify-between z-10">
                                        <div className="flex flex-col gap-2">
                                            <span className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg border w-fit ${post.access_type === 'public' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/10 text-white border-white/20'}`}>
                                                {getAccessIcon(post.access_type)}
                                                {post.access_type === 'public' ? 'Public' :
                                                    post.access_type === 'token_gated' ? `${post.token_cost} tokens` :
                                                        `Hold ${post.threshold_amount}+`}
                                            </span>
                                            <span className="text-xs text-white/70 uppercase tracking-widest ml-1">{formatRelativeTime(post.created_at)}</span>
                                        </div>

                                        <div className="flex gap-2 backdrop-blur-md bg-white/10 rounded-full p-1 border border-white/20 shadow-lg">
                                            <button onClick={() => handleOpenEdit(post)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(post.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-300 hover:text-red-100 hover:bg-red-500/30 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title (Over Image) */}
                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                        <h3 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-heading)] text-white mb-2 tracking-tight leading-tight drop-shadow-lg transform transition-transform duration-500 group-hover:translate-x-1">
                                            {post.title}
                                        </h3>
                                    </div>
                                </div>
                            ) : (
                                /* IF NO IMAGE: Standard Header */
                                <div className="relative p-6 md:p-8 pb-4">
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit ${post.access_type === 'public' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {getAccessIcon(post.access_type)}
                                                {post.access_type === 'public' ? 'Public' :
                                                    post.access_type === 'token_gated' ? `${post.token_cost} tokens` :
                                                        `Hold ${post.threshold_amount}+`}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase tracking-widest ml-1">{formatRelativeTime(post.created_at)}</span>
                                        </div>

                                        <div className="flex gap-2 rounded-full p-1 bg-gray-50 border border-gray-100">
                                            <button onClick={() => handleOpenEdit(post)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all shadow-sm">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(post.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-gray-900 mb-2 tracking-tight leading-tight">
                                        {post.title}
                                    </h3>
                                </div>
                            )}

                            {/* Content Body */}
                            <div className="p-6 md:p-8 pt-4">
                                <div className="text-gray-600 text-lg font-light leading-relaxed mb-8 whitespace-pre-wrap line-clamp-4">
                                    {post.content}
                                </div>

                                {/* Metrics Footer */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-gray-400">
                                            <div className="p-2 rounded-full bg-gray-50">
                                                <Heart className="w-5 h-5 text-red-400" />
                                            </div>
                                            {post.likes_count || 0}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-gray-400">
                                            <div className="p-2 rounded-full bg-gray-50">
                                                <MessageCircle className="w-5 h-5 text-gray-400" />
                                            </div>
                                            {post.comments_count || 0}
                                        </div>
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
