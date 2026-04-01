'use client';

import { useState, useEffect, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import {
    Plus, FileText, Lock, Globe, Shield, Heart, MessageCircle,
    X, Edit, Trash2, Image as ImageIcon, Upload, CheckCircle,
    Zap, Eye, BarChart2, Clock, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import type { Post } from '@/types';

// ─── Skeleton loader ────────────────────────────────────────────────
function PostSkeleton() {
    return (
        <div className="cp-card cp-skeleton" aria-hidden="true">
            <div className="cp-sk-img" />
            <div className="cp-card-body">
                <div className="cp-sk-line" style={{ width: '60%', height: 20, marginBottom: 12 }} />
                <div className="cp-sk-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
                <div className="cp-sk-line" style={{ width: '70%', height: 14 }} />
            </div>
        </div>
    );
}

// ─── Access badge ────────────────────────────────────────────────────
function AccessBadge({ type, cost, threshold }: { type: string; cost?: number | null; threshold?: number | null }) {
    if (type === 'public') return (
        <span className="cp-badge cp-badge--public"><Globe size={11} /> Public</span>
    );
    if (type === 'token_gated') return (
        <span className="cp-badge cp-badge--token"><Lock size={11} /> {cost} tokens</span>
    );
    return (
        <span className="cp-badge cp-badge--threshold"><Shield size={11} /> Hold {threshold}+</span>
    );
}

export default function CreatorPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [published, setPublished] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [accessType, setAccessType] = useState<'public' | 'token_gated' | 'threshold_gated'>('public');
    const [tokenCost, setTokenCost] = useState(10);
    const [thresholdAmount, setThresholdAmount] = useState(100);
    const [titleError, setTitleError] = useState('');
    const [contentError, setContentError] = useState('');

    const titleRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPosts = useCallback(async () => {
        const res = await fetch('/api/posts?creator_id=me');
        if (res.ok) {
            const data = await res.json();
            setPosts(data.posts);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    // Focus title when panel opens
    useEffect(() => {
        if (panelOpen) setTimeout(() => titleRef.current?.focus(), 300);
    }, [panelOpen]);

    // Keyboard shortcut: Cmd/Ctrl+Enter = publish
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && panelOpen && !submitting) {
                handleSubmit();
            }
            if (e.key === 'Escape' && panelOpen) closePanel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panelOpen, submitting, title, content, imageUrl, accessType, tokenCost, thresholdAmount, editingId]);

    const openCreate = () => {
        setEditingId(null);
        setTitle(''); setContent(''); setImageUrl(''); setImagePreview('');
        setAccessType('public'); setTokenCost(10); setThresholdAmount(100);
        setTitleError(''); setContentError(''); setPublished(false);
        setPanelOpen(true);
    };

    const openEdit = (post: Post) => {
        setEditingId(post.id);
        setTitle(post.title); setContent(post.content);
        setImageUrl(post.image_url || ''); setImagePreview(post.image_url || '');
        setAccessType(post.access_type);
        setTokenCost(post.token_cost || 10);
        setThresholdAmount(post.threshold_amount || 100);
        setTitleError(''); setContentError(''); setPublished(false);
        setPanelOpen(true);
    };

    const closePanel = () => { setPanelOpen(false); setPublished(false); };

    const validate = () => {
        let ok = true;
        if (!title.trim()) { setTitleError('Title is required'); ok = false; } else setTitleError('');
        if (!content.trim()) { setContentError('Content is required'); ok = false; } else setContentError('');
        return ok;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);

        const url = editingId ? `/api/posts/${editingId}` : '/api/posts';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, content,
                image_url: imageUrl || null,
                access_type: accessType,
                token_cost: accessType === 'token_gated' ? tokenCost : 0,
                threshold_amount: accessType === 'threshold_gated' ? thresholdAmount : 0,
            }),
        });

        if (res.ok) {
            setPublished(true);
            await fetchPosts();
            setTimeout(closePanel, 1400);
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to save post', type: 'error' });
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setToast({ message: 'Post deleted', type: 'info' });
            setPosts(posts.filter(p => p.id !== id));
        } else {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
        setDeleteConfirm(null);
    };

    // Image URL → live preview
    const handleImageUrl = (val: string) => {
        setImageUrl(val);
        setImagePreview(val);
    };

    // Upload a File object to /api/upload and get back a public URL
    const uploadFile = async (file: File) => {
        const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        if (!ALLOWED.includes(file.type)) {
            setToast({ message: 'Only JPG, PNG, GIF, WebP, or AVIF images are allowed', type: 'error' });
            return;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 10) {
            setToast({ message: `Image is ${sizeMB.toFixed(1)} MB — max 10 MB`, type: 'error' });
            return;
        }
        setUploading(true);
        setUploadProgress(`Uploading ${file.name}…`);
        // Show local object URL as instant preview while uploading
        const localPreview = URL.createObjectURL(file);
        setImagePreview(localPreview);

        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();

        if (res.ok && data.url) {
            setImageUrl(data.url);
            setImagePreview(data.url);
            setUploadProgress('');
            setToast({ message: 'Image uploaded!', type: 'success' });
        } else {
            setImageUrl('');
            setImagePreview('');
            setToast({ message: data.error || 'Upload failed', type: 'error' });
        }
        URL.revokeObjectURL(localPreview);
        setUploading(false);
        setUploadProgress('');
    };

    // Drag-and-drop: handles both FILE drops and URL text drops
    const onDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragOver(false);
        // Prefer actual file (dragged from Finder/Explorer)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await uploadFile(e.dataTransfer.files[0]);
            return;
        }
        // Fallback: URL text dragged from browser
        const text = e.dataTransfer.getData('text/plain');
        if (text && (text.startsWith('http') || text.startsWith('/'))) {
            handleImageUrl(text);
        }
    };

    // File picker change handler
    const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await uploadFile(file);
        // Reset so same file can be re-selected
        e.target.value = '';
    };

    return (
        <>
            {/* ── Page ──────────────────────────────────────── */}
            <div className="cp-page">

                {/* Header */}
                <div className="cp-header">
                    <div>
                        <h1 className="cp-h1">Posts</h1>
                        <p className="cp-sub">Publish content your fans will love</p>
                    </div>
                    <button id="new-post-btn" className="cp-btn-primary" onClick={openCreate}>
                        <Plus size={18} strokeWidth={2.5} /> New Post
                    </button>
                </div>

                {/* Stat strip */}
                <div className="cp-stats">
                    {[
                        { label: 'Total Posts', value: posts.length, icon: FileText },
                        { label: 'Total Likes', value: posts.reduce((s, p) => s + (p.likes_count || 0), 0), icon: Heart },
                        { label: 'Comments', value: posts.reduce((s, p) => s + (p.comments_count || 0), 0), icon: MessageCircle },
                        { label: 'Gated Posts', value: posts.filter(p => p.access_type !== 'public').length, icon: Lock },
                    ].map(s => (
                        <div className="cp-stat" key={s.label}>
                            <s.icon size={16} className="cp-stat-icon" />
                            <span className="cp-stat-val">{s.value}</span>
                            <span className="cp-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Posts grid */}
                {loading ? (
                    <div className="cp-grid">
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="cp-empty">
                        <div className="cp-empty-icon"><Sparkles size={32} /></div>
                        <h3 className="cp-empty-h">Your stage is empty</h3>
                        <p className="cp-empty-p">Create your first post and start engaging with your fans today.</p>
                        <button className="cp-btn-primary" onClick={openCreate}>
                            <Plus size={16} /> Create First Post
                        </button>
                    </div>
                ) : (
                    <div className="cp-grid">
                        {posts.map(post => (
                            <article key={post.id} className="cp-card group">
                                {/* Hero / thumb */}
                                {post.image_url ? (
                                    <div className="cp-card-img">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={post.image_url} alt="" className="cp-card-img-el" loading="lazy" />
                                        <div className="cp-card-img-overlay" />
                                        <div className="cp-card-img-actions">
                                            <button className="cp-icon-btn" onClick={() => openEdit(post)} title="Edit"><Edit size={14} /></button>
                                            <button className="cp-icon-btn cp-icon-btn--danger" onClick={() => setDeleteConfirm(post.id)} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cp-card-noimg">
                                        <FileText size={28} className="cp-card-noimg-icon" />
                                        <div className="cp-card-noimg-actions">
                                            <button className="cp-icon-btn" onClick={() => openEdit(post)} title="Edit"><Edit size={14} /></button>
                                            <button className="cp-icon-btn cp-icon-btn--danger" onClick={() => setDeleteConfirm(post.id)} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                )}

                                {/* Body */}
                                <div className="cp-card-body">
                                    <div className="cp-card-meta">
                                        <AccessBadge type={post.access_type} cost={post.token_cost} threshold={post.threshold_amount} />
                                        <span className="cp-card-time"><Clock size={10} /> {formatRelativeTime(post.created_at)}</span>
                                    </div>
                                    <h3 className="cp-card-title">{post.title}</h3>
                                    <p className="cp-card-content">{post.content}</p>
                                    <div className="cp-card-footer">
                                        <span className="cp-card-stat"><Heart size={13} /> {post.likes_count || 0}</span>
                                        <span className="cp-card-stat"><MessageCircle size={13} /> {post.comments_count || 0}</span>
                                        <span className="cp-card-stat"><Eye size={13} /> {post.access_type === 'public' ? 'Public' : 'Gated'}</span>
                                    </div>
                                </div>

                                {/* Delete confirm inline */}
                                {deleteConfirm === post.id && (
                                    <div className="cp-delete-confirm">
                                        <AlertCircle size={16} className="cp-delete-icon" />
                                        <span>Delete this post?</span>
                                        <button className="cp-delete-yes" onClick={() => handleDelete(post.id)}>Delete</button>
                                        <button className="cp-delete-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Slide-in Composer Panel ────────────────────── */}
            {panelOpen && (
                <div className="cp-overlay" onClick={(e) => e.target === e.currentTarget && closePanel()}>
                    <aside className="cp-panel">

                        {/* Published success state */}
                        {published && (
                            <div className="cp-success">
                                <CheckCircle size={48} className="cp-success-icon" />
                                <h3 className="cp-success-h">{editingId ? 'Post Updated!' : 'Post Published!'}</h3>
                                <p className="cp-success-p">Your fans can now see this content.</p>
                            </div>
                        )}

                        {!published && (
                            <>
                                {/* Panel header */}
                                <div className="cp-panel-header">
                                    <div>
                                        <h2 className="cp-panel-title">{editingId ? 'Edit Post' : 'Create Post'}</h2>
                                        <p className="cp-panel-hint">⌘ + Enter to publish</p>
                                    </div>
                                    <button className="cp-close-btn" onClick={closePanel} aria-label="Close"><X size={18} /></button>
                                </div>

                                {/* Scrollable body */}
                                <div className="cp-panel-body">

                                    {/* 1 — Media URL / drag zone */}
                                    <div
                                        className={`cp-dropzone${dragOver ? ' cp-dropzone--active' : ''}${imagePreview ? ' cp-dropzone--has-img' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={onDrop}
                                        onClick={() => !imagePreview && !uploading && fileInputRef.current?.click()}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {uploading ? (
                                            <div className="cp-dropzone-uploading">
                                                <span className="cp-spinner" style={{ borderTopColor: 'var(--dash-text-primary)', borderColor: 'var(--dash-border)', width: 28, height: 28, borderWidth: 3 }} />
                                                <p className="cp-dropzone-label">{uploadProgress || 'Uploading…'}</p>
                                            </div>
                                        ) : imagePreview ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={imagePreview} alt="" className="cp-dropzone-preview" loading="lazy" />
                                                <div className="cp-dropzone-remove-wrap">
                                                    <button
                                                        className="cp-dropzone-remove"
                                                        onClick={(e) => { e.stopPropagation(); setImageUrl(''); setImagePreview(''); }}
                                                    >
                                                        <X size={14} /> Remove
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="cp-dropzone-idle">
                                                <div className="cp-dropzone-icon"><Upload size={22} /></div>
                                                <p className="cp-dropzone-label">Drag & drop an image or</p>
                                                <span className="cp-dropzone-link">click to browse files</span>
                                                <span className="cp-dropzone-hint">JPG, PNG, GIF, WebP · max 10 MB</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Image URL input */}
                                    <div className="cp-field">
                                        <div className="cp-input-wrap cp-input-wrap--icon">
                                            <ImageIcon size={15} className="cp-input-icon" />
                                            <input
                                                type="url"
                                                value={imageUrl}
                                                onChange={(e) => handleImageUrl(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="cp-input cp-input--with-icon"
                                            />
                                            {imageUrl && (
                                                <button className="cp-input-clear" onClick={() => { setImageUrl(''); setImagePreview(''); }}>
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2 — Title */}
                                    <div className="cp-field">
                                        <label className="cp-label">Title <span className="cp-required">*</span></label>
                                        <div className="cp-input-wrap">
                                            <input
                                                ref={titleRef}
                                                type="text"
                                                value={title}
                                                onChange={(e) => { setTitle(e.target.value); if (e.target.value) setTitleError(''); }}
                                                placeholder="Give your post a title..."
                                                className={`cp-input${titleError ? ' cp-input--error' : ''}`}
                                                maxLength={200}
                                            />
                                            <span className="cp-char-count">{title.length}/200</span>
                                        </div>
                                        {titleError && <p className="cp-field-error"><AlertCircle size={12} />{titleError}</p>}
                                    </div>

                                    {/* 3 — Content */}
                                    <div className="cp-field">
                                        <label className="cp-label">Caption <span className="cp-required">*</span>
                                            <span className="cp-label-hint">Write a caption that connects with your audience…</span>
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => { setContent(e.target.value); if (e.target.value) setContentError(''); }}
                                            placeholder="Share something meaningful with your community..."
                                            className={`cp-textarea${contentError ? ' cp-input--error' : ''}`}
                                            rows={5}
                                        />
                                        <div className="cp-textarea-footer">
                                            {contentError && <p className="cp-field-error"><AlertCircle size={12} />{contentError}</p>}
                                            <span className="cp-textarea-count">{content.length} chars</span>
                                        </div>
                                    </div>

                                    {/* 4 — Access type */}
                                    <div className="cp-field">
                                        <label className="cp-label">Access</label>
                                        <div className="cp-access-row">
                                            {([
                                                { value: 'public', label: 'Public', icon: Globe, hint: 'Everyone can see' },
                                                { value: 'token_gated', label: 'Token Gate', icon: Lock, hint: 'Fans pay tokens' },
                                                { value: 'threshold_gated', label: 'Threshold', icon: Shield, hint: 'Hold tokens' },
                                            ] as const).map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setAccessType(opt.value)}
                                                    className={`cp-access-btn${accessType === opt.value ? ' cp-access-btn--active' : ''}`}
                                                >
                                                    <opt.icon size={16} />
                                                    <span className="cp-access-label">{opt.label}</span>
                                                    <span className="cp-access-hint">{opt.hint}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Progressive disclosure */}
                                        {accessType === 'token_gated' && (
                                            <div className="cp-gate-config">
                                                <Zap size={14} className="cp-gate-icon" />
                                                <label className="cp-gate-label">Token cost per unlock</label>
                                                <input
                                                    type="number" min={1} value={tokenCost}
                                                    onChange={(e) => setTokenCost(Number(e.target.value))}
                                                    className="cp-gate-input"
                                                />
                                                <span className="cp-gate-unit">tokens</span>
                                            </div>
                                        )}
                                        {accessType === 'threshold_gated' && (
                                            <div className="cp-gate-config">
                                                <BarChart2 size={14} className="cp-gate-icon" />
                                                <label className="cp-gate-label">Minimum tokens held</label>
                                                <input
                                                    type="number" min={1} value={thresholdAmount}
                                                    onChange={(e) => setThresholdAmount(Number(e.target.value))}
                                                    className="cp-gate-input"
                                                />
                                                <span className="cp-gate-unit">tokens</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sticky footer */}
                                <div className="cp-panel-footer">
                                    <button className="cp-btn-ghost" onClick={closePanel}>Discard</button>
                                    <button
                                        id="publish-btn"
                                        className="cp-btn-primary cp-btn-publish"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <><span className="cp-spinner" /> {editingId ? 'Saving…' : 'Publishing…'}</>
                                        ) : (
                                            <>{editingId ? 'Save Changes' : 'Publish'} <ChevronRight size={16} /></>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            )}

            {/* hidden file input for future file upload */}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" className="hidden" onChange={onFileChange} />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Scoped styles ──────────────────────────────── */}
            <style>{`
                /* Page */
                .cp-page { max-width: 1100px; margin: 0 auto; padding-bottom: 80px; }

                /* Header */
                .cp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
                .cp-h1 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.03em; color: var(--dash-text-primary); margin: 0; line-height: 1; }
                .cp-sub { font-size: 14px; color: var(--dash-text-muted); margin: 6px 0 0; font-weight: 500; }

                /* Stat strip */
                .cp-stats { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
                .cp-stat { display: flex; align-items: center; gap: 8px; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 10px; padding: 10px 16px; }
                .cp-stat-icon { color: var(--dash-text-muted); flex-shrink: 0; }
                .cp-stat-val { font-size: 18px; font-weight: 800; color: var(--dash-text-primary); letter-spacing: -0.02em; }
                .cp-stat-label { font-size: 11px; font-weight: 600; color: var(--dash-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

                /* Buttons */
                .cp-btn-primary {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: var(--dash-text-primary); color: var(--dash-bg);
                    border: none; border-radius: 10px; padding: 10px 20px;
                    font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: -0.01em;
                    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .cp-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
                .cp-btn-primary:active { transform: translateY(0); }
                .cp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .cp-btn-ghost {
                    background: transparent; border: 1px solid var(--dash-border); border-radius: 10px;
                    padding: 10px 18px; font-size: 14px; font-weight: 600;
                    color: var(--dash-text-secondary); cursor: pointer;
                    transition: background 0.15s, border-color 0.15s;
                }
                .cp-btn-ghost:hover { background: var(--dash-bg); border-color: var(--dash-border-hover); }

                /* Post grid */
                .cp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

                /* Post card */
                .cp-card {
                    background: var(--dash-card); border: 1px solid var(--dash-border);
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    transition: box-shadow 0.2s ease, transform 0.2s ease;
                    position: relative; display: flex; flex-direction: column;
                }
                .cp-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.10); transform: translateY(-2px); }

                /* Card image */
                .cp-card-img { position: relative; height: 200px; overflow: hidden; background: #111; flex-shrink: 0; }
                .cp-card-img-el { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
                .cp-card:hover .cp-card-img-el { transform: scale(1.04); }
                .cp-card-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%); }
                .cp-card-img-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
                .cp-card:hover .cp-card-img-actions { opacity: 1; }

                .cp-card-noimg { height: 100px; background: var(--dash-bg); display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 1px solid var(--dash-border); }
                .cp-card-noimg-icon { color: var(--dash-border-hover); }
                .cp-card-noimg-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
                .cp-card:hover .cp-card-noimg-actions { opacity: 1; }

                .cp-icon-btn {
                    width: 30px; height: 30px; border-radius: 8px; border: none;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
                    color: #fff; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: background 0.15s;
                }
                .cp-icon-btn:hover { background: rgba(0,0,0,0.75); }
                .cp-icon-btn--danger { background: rgba(220,38,38,0.7); }
                .cp-icon-btn--danger:hover { background: rgba(185,28,28,0.9); }

                /* Card body */
                .cp-card-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .cp-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                .cp-card-time { font-size: 11px; color: var(--dash-text-muted); font-weight: 500; display: flex; align-items: center; gap: 4px; }
                .cp-card-title { font-size: 16px; font-weight: 700; color: var(--dash-text-primary); letter-spacing: -0.01em; line-height: 1.3; margin: 0; }
                .cp-card-content { font-size: 13px; color: var(--dash-text-secondary); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
                .cp-card-footer { display: flex; align-items: center; gap: 14px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--dash-border); }
                .cp-card-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--dash-text-muted); }

                /* Badges */
                .cp-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; }
                .cp-badge--public { background: rgba(34,197,94,0.12); color: #15803d; border: 1px solid rgba(34,197,94,0.25); }
                .cp-badge--token { background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
                .cp-badge--threshold { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }

                /* Empty state */
                .cp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 24px; text-align: center; background: var(--dash-card); border: 1.5px dashed var(--dash-border); border-radius: 20px; }
                .cp-empty-icon { width: 64px; height: 64px; border-radius: 18px; background: var(--dash-bg); border: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: center; color: var(--dash-text-secondary); }
                .cp-empty-h { font-size: 20px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
                .cp-empty-p { font-size: 14px; color: var(--dash-text-muted); margin: 0; max-width: 320px; }

                /* Skeleton */
                .cp-skeleton { pointer-events: none; }
                .cp-sk-img { height: 200px; background: var(--dash-border); }
                .cp-sk-line { background: var(--dash-border); border-radius: 6px; animation: cp-pulse 1.6s ease-in-out infinite; }
                @keyframes cp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }

                /* Delete confirm */
                .cp-delete-confirm { position: absolute; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 16px; z-index: 10; }
                .cp-delete-icon { color: #f87171; flex-shrink: 0; }
                .cp-delete-confirm span { color: #fff; font-size: 13px; font-weight: 600; }
                .cp-delete-yes { background: #dc2626; color: #fff; border: none; border-radius: 7px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
                .cp-delete-no { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 7px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }

                /* ── Overlay + panel ── */
                .cp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); z-index: 50; display: flex; align-items: stretch; justify-content: flex-end; }
                .cp-panel {
                    width: 100%; max-width: 520px; background: var(--dash-card);
                    border-left: 1px solid var(--dash-border);
                    display: flex; flex-direction: column;
                    animation: cp-slide-in 0.25s cubic-bezier(0.32, 0.72, 0, 1);
                    overflow: hidden;
                }
                @keyframes cp-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

                .cp-panel-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 24px 24px 16px; border-bottom: 1px solid var(--dash-border); flex-shrink: 0; }
                .cp-panel-title { font-size: 20px; font-weight: 800; color: var(--dash-text-primary); margin: 0; letter-spacing: -0.02em; }
                .cp-panel-hint { font-size: 11px; color: var(--dash-text-muted); margin: 4px 0 0; font-weight: 500; }
                .cp-close-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; flex-shrink: 0; }
                .cp-close-btn:hover { background: var(--dash-border); }

                .cp-panel-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
                .cp-panel-footer { padding: 16px 24px; border-top: 1px solid var(--dash-border); display: flex; gap: 10px; align-items: center; justify-content: flex-end; flex-shrink: 0; background: var(--dash-card); }

                /* Dropzone */
                .cp-dropzone {
                    border: 2px dashed var(--dash-border); border-radius: 14px;
                    min-height: 140px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: border-color 0.2s, background 0.2s;
                    overflow: hidden; position: relative; background: var(--dash-bg);
                }
                .cp-dropzone:hover { border-color: var(--dash-border-hover); }
                .cp-dropzone--active { border-color: var(--dash-accent, #6366f1); background: rgba(99,102,241,0.04); }
                .cp-dropzone--has-img { cursor: default; min-height: 200px; border-style: solid; border-color: transparent; }

                .cp-dropzone-idle { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 24px; text-align: center; }
                .cp-dropzone-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--dash-card); border: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: center; color: var(--dash-text-secondary); }
                .cp-dropzone-label { font-size: 13px; color: var(--dash-text-secondary); font-weight: 500; margin: 0; }
                .cp-dropzone-link { font-size: 13px; color: var(--dash-accent, #6366f1); font-weight: 600; }
                .cp-dropzone-hint { font-size: 11px; color: var(--dash-text-muted); font-weight: 500; margin-top: 2px; }
                .cp-dropzone-uploading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px; }

                .cp-dropzone-preview { width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }
                .cp-dropzone-remove-wrap { position: absolute; bottom: 10px; right: 10px; z-index: 2; }
                .cp-dropzone-remove { display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }

                /* Form fields */
                .cp-field { display: flex; flex-direction: column; gap: 6px; }
                .cp-label { font-size: 13px; font-weight: 700; color: var(--dash-text-primary); display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
                .cp-required { color: #ef4444; }
                .cp-label-hint { font-size: 11px; font-weight: 400; color: var(--dash-text-muted); }

                .cp-input-wrap { position: relative; display: flex; align-items: center; }
                .cp-input-wrap--icon .cp-input { padding-left: 36px; }
                .cp-input-icon { position: absolute; left: 12px; color: var(--dash-text-muted); pointer-events: none; flex-shrink: 0; }
                .cp-input-clear { position: absolute; right: 10px; background: none; border: none; color: var(--dash-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; }

                .cp-input {
                    width: 100%; padding: 10px 14px; border-radius: 10px;
                    border: 1.5px solid var(--dash-border); background: var(--dash-bg);
                    color: var(--dash-text-primary); font-size: 14px; font-weight: 500;
                    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
                    box-sizing: border-box;
                }
                .cp-input:focus { border-color: var(--dash-text-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
                .cp-input--error { border-color: #ef4444 !important; }
                .cp-input--with-icon { padding-left: 36px; padding-right: 36px; }
                .cp-char-count { position: absolute; right: 12px; font-size: 11px; color: var(--dash-text-muted); font-weight: 500; pointer-events: none; }
                .cp-input-wrap .cp-char-count { right: 38px; }

                .cp-textarea {
                    width: 100%; padding: 12px 14px; border-radius: 10px;
                    border: 1.5px solid var(--dash-border); background: var(--dash-bg);
                    color: var(--dash-text-primary); font-size: 14px; font-weight: 400; line-height: 1.6;
                    resize: vertical; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
                    font-family: inherit; box-sizing: border-box;
                }
                .cp-textarea:focus { border-color: var(--dash-text-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
                .cp-textarea-footer { display: flex; align-items: center; justify-content: flex-end; }
                .cp-textarea-count { font-size: 11px; color: var(--dash-text-muted); font-weight: 500; }

                .cp-field-error { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #ef4444; font-weight: 500; margin: 0; }

                /* Access selector */
                .cp-access-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
                .cp-access-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px;
                    border-radius: 12px; border: 1.5px solid var(--dash-border); background: var(--dash-bg);
                    cursor: pointer; transition: all 0.15s; text-align: center;
                }
                .cp-access-btn:hover { border-color: var(--dash-border-hover); background: var(--dash-card); }
                .cp-access-btn--active { border-color: var(--dash-text-primary); background: var(--dash-card); box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
                .cp-access-label { font-size: 12px; font-weight: 700; color: var(--dash-text-primary); }
                .cp-access-hint { font-size: 10px; color: var(--dash-text-muted); font-weight: 500; }

                /* Gate config */
                .cp-gate-config { display: flex; align-items: center; gap: 10px; margin-top: 10px; background: var(--dash-bg); border: 1px solid var(--dash-border); border-radius: 10px; padding: 12px 14px; animation: cp-fade-in 0.2s ease; }
                @keyframes cp-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                .cp-gate-icon { color: var(--dash-text-secondary); flex-shrink: 0; }
                .cp-gate-label { font-size: 13px; font-weight: 600; color: var(--dash-text-primary); flex: 1; }
                .cp-gate-input { width: 80px; padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--dash-border); background: var(--dash-card); color: var(--dash-text-primary); font-size: 14px; font-weight: 700; text-align: right; outline: none; }
                .cp-gate-input:focus { border-color: var(--dash-text-primary); }
                .cp-gate-unit { font-size: 12px; color: var(--dash-text-muted); font-weight: 600; flex-shrink: 0; }

                /* Publish button */
                .cp-btn-publish { min-width: 140px; justify-content: center; }
                .cp-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Success state */
                .cp-success { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px 32px; text-align: center; animation: cp-fade-in 0.3s ease; }
                .cp-success-icon { color: #22c55e; animation: cp-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1); }
                @keyframes cp-bounce { 0% { transform: scale(0); } 100% { transform: scale(1); } }
                .cp-success-h { font-size: 24px; font-weight: 800; color: var(--dash-text-primary); margin: 0; letter-spacing: -0.02em; }
                .cp-success-p { font-size: 14px; color: var(--dash-text-muted); margin: 0; }

                /* Responsive */
                @media (max-width: 640px) {
                    .cp-panel { max-width: 100%; }
                    .cp-grid { grid-template-columns: 1fr; }
                    .cp-access-row { grid-template-columns: 1fr; }
                    .cp-stats { gap: 8px; }
                }
            `}</style>
        </>
    );
}
