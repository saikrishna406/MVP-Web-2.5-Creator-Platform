'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    X, Edit, Plus, Trash2, Camera,
    Globe, Grid3X3, Package, Settings, Link2,
    Twitter, Instagram, Youtube, Coins, FileText, Crown, ChevronRight,
    CheckCircle, AlertCircle
} from 'lucide-react';
import { formatTokens, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { Profile, CreatorPackage, Post } from '@/types';

const CATEGORIES = [
    'Music','Art','Gaming','Fitness','Education',
    'Photography','Writing','Comedy','Cooking','Tech','Film','Podcast','Other',
];
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
    twitter: <Twitter size={13}/>, instagram: <Instagram size={13}/>,
    youtube: <Youtube size={13}/>, website: <Globe size={13}/>,
};

export default function CreatorProfilePage() {
    const [profile, setProfile]   = useState<(Profile & { banner_url?: string; category?: string; social_links?: Record<string,string> }) | null>(null);
    const [packages, setPackages] = useState<CreatorPackage[]>([]);
    const [posts, setPosts]       = useState<Post[]>([]);
    const [stats, setStats]       = useState({ post_count: 0, fan_count: 0 });
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState<{message:string;type:'success'|'error'|'info'}|null>(null);
    const [activeTab, setActiveTab] = useState<'posts'|'packages'>('posts');

    // Edit Profile panel
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ display_name:'', bio:'', avatar_url:'', banner_url:'', category:'', social_links:{} as Record<string,string> });
    const [saving, setSaving]     = useState(false);
    const [saved, setSaved]       = useState(false);

    // Package modal
    const [pkgOpen, setPkgOpen]       = useState(false);
    const [editingPkg, setEditingPkg] = useState<CreatorPackage|null>(null);
    const [pkgForm, setPkgForm]       = useState({ name:'', token_price:50, post_limit:10, description:'', badge_name:'' });
    const [savingPkg, setSavingPkg]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string|null>(null);

    // Post detail modal
    const [viewPost, setViewPost] = useState<Post|null>(null);

    const fetchProfile = useCallback(async () => {
        const res = await fetch('/api/profile');
        if (res.ok) { const d = await res.json(); setProfile(d.profile); setStats(d.stats ?? {post_count:0,fan_count:0}); }
    }, []);
    const fetchPackages = useCallback(async () => {
        const res = await fetch('/api/creator-packages');
        if (res.ok) { const d = await res.json(); setPackages(d.packages ?? []); }
    }, []);
    const fetchPosts = useCallback(async () => {
        const res = await fetch('/api/posts?creator_id=me');
        if (res.ok) { const d = await res.json(); setPosts(d.posts ?? []); }
    }, []);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchPackages(), fetchPosts()]).finally(() => setLoading(false));
    }, [fetchProfile, fetchPackages, fetchPosts]);

    const openEdit = () => {
        if (!profile) return;
        setEditForm({ display_name:profile.display_name||'', bio:profile.bio||'', avatar_url:profile.avatar_url||'', banner_url:profile.banner_url||'', category:profile.category||'', social_links:profile.social_links||{} });
        setSaved(false); setEditOpen(true);
    };
    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const res = await fetch('/api/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editForm) });
        if (res.ok) { setSaved(true); await fetchProfile(); setTimeout(() => setEditOpen(false), 900); }
        else { const d = await res.json(); setToast({ message: d.error||'Failed', type:'error' }); }
        setSaving(false);
    };

    const openCreatePkg = () => { setEditingPkg(null); setPkgForm({ name:'', token_price:50, post_limit:10, description:'', badge_name:'' }); setPkgOpen(true); };
    const openEditPkg = (pkg: CreatorPackage) => { setEditingPkg(pkg); setPkgForm({ name:pkg.name, token_price:pkg.token_price, post_limit:pkg.post_limit, description:pkg.description||'', badge_name:pkg.badge_name||'' }); setPkgOpen(true); };
    const savePkg = async (e: React.FormEvent) => {
        e.preventDefault(); setSavingPkg(true);
        const res = await fetch('/api/creator-packages', { method:editingPkg?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editingPkg?{id:editingPkg.id,...pkgForm}:pkgForm) });
        if (res.ok) { setToast({ message:`Package ${editingPkg?'updated':'created'}!`, type:'success' }); setPkgOpen(false); fetchPackages(); }
        else { const d = await res.json(); setToast({ message:d.error||'Failed', type:'error' }); }
        setSavingPkg(false);
    };
    const deletePkg = async (id: string) => {
        setDeleteTarget(id);
        const res = await fetch(`/api/creator-packages?id=${id}`, { method:'DELETE' });
        if (res.ok) { setToast({ message:'Package deleted', type:'info' }); fetchPackages(); }
        else setToast({ message:'Failed to delete', type:'error' });
        setDeleteTarget(null);
    };

    if (loading) return <PageLoader />;
    if (!profile) return null;

    const primaryLink = profile.social_links ? Object.values(profile.social_links).find(Boolean) : null;
    const primaryKey  = profile.social_links ? Object.entries(profile.social_links).find(([,v]) => !!v)?.[0] : null;

    return (
        <>
        <div className="ig-page">

            {/* ════════════ HEADER — Instagram style ════════════ */}
            <div className="ig-header">

                {/* Left: Avatar */}
                <div className="ig-avatar-col">
                    <div className="ig-avatar-ring">
                        <div className="ig-avatar">
                            {profile.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={profile.avatar_url} alt={profile.display_name} className="ig-avatar-img"/>
                                : <span className="ig-avatar-init">{getInitials(profile.display_name)}</span>
                            }
                        </div>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="ig-info-col">

                    {/* Row 1: username + buttons */}
                    <div className="ig-row-1">
                        <h1 className="ig-username">{profile.username || profile.display_name}</h1>
                        <button className="ig-btn-outline" onClick={openEdit}><Edit size={14}/> Edit profile</button>
                        <button className="ig-btn-icon" title="Settings" onClick={openEdit}><Settings size={18}/></button>
                    </div>

                    {/* Row 2: stats */}
                    <div className="ig-row-2">
                        <span className="ig-stat"><strong>{stats.post_count}</strong> posts</span>
                        <span className="ig-stat"><strong>{stats.fan_count}</strong> fans</span>
                        <span className="ig-stat"><strong>{packages.length}</strong> packages</span>
                    </div>

                    {/* Row 3: display name */}
                    {profile.display_name && <div className="ig-display-name">{profile.display_name}</div>}

                    {/* Row 4: category badge */}
                    {profile.category && <div className="ig-category">{profile.category}</div>}

                    {/* Row 5: bio */}
                    {profile.bio && <p className="ig-bio">{profile.bio}</p>}

                    {/* Row 6: link */}
                    {primaryLink && (
                        <a href={primaryLink} target="_blank" rel="noopener noreferrer" className="ig-link">
                            {SOCIAL_ICONS[primaryKey!] ?? <Link2 size={13}/>}
                            {primaryLink.replace(/^https?:\/\/(www\.)?/,'')}
                        </a>
                    )}
                </div>
            </div>

            {/* Mobile stats (shown below avatar on small screens) */}
            <div className="ig-mobile-stats">
                <span className="ig-stat"><strong>{stats.post_count}</strong> posts</span>
                <span className="ig-stat"><strong>{stats.fan_count}</strong> fans</span>
                <span className="ig-stat"><strong>{packages.length}</strong> packages</span>
            </div>

            {/* ════════════ HIGHLIGHTS (packages as story circles) ════════════ */}
            <div className="ig-highlights">
                {packages.map(pkg => (
                    <button key={pkg.id} className="ig-highlight" onClick={() => openEditPkg(pkg)}>
                        <div className="ig-hl-ring">
                            <div className="ig-hl-inner"><Crown size={22} className="ig-hl-icon"/></div>
                        </div>
                        <span className="ig-hl-label">{pkg.badge_name || pkg.name}</span>
                    </button>
                ))}
                <button className="ig-highlight" onClick={openCreatePkg}>
                    <div className="ig-hl-ring ig-hl-ring--new">
                        <div className="ig-hl-inner"><Plus size={22} className="ig-hl-icon"/></div>
                    </div>
                    <span className="ig-hl-label">New</span>
                </button>
            </div>

            {/* ════════════ TABS ════════════ */}
            <div className="ig-tabs">
                <button className={`ig-tab${activeTab==='posts'?' ig-tab--active':''}`} onClick={() => setActiveTab('posts')}>
                    <Grid3X3 size={16}/> <span>Posts</span>
                </button>
                <button className={`ig-tab${activeTab==='packages'?' ig-tab--active':''}`} onClick={() => setActiveTab('packages')}>
                    <Package size={16}/> <span>Packages</span>
                </button>
            </div>

            {/* ════════════ POST GRID ════════════ */}
            {activeTab === 'posts' && (
                posts.length === 0 ? (
                    <div className="ig-empty">
                        <div className="ig-empty-circle"><FileText size={32}/></div>
                        <h3 className="ig-empty-h">Share your first post</h3>
                        <p className="ig-empty-p">When you share posts, they'll appear here.</p>
                        <a href="/creator/posts" className="ig-btn-outline">Create Post <ChevronRight size={13}/></a>
                    </div>
                ) : (
                    <div className="ig-grid">
                        {posts.map(post => (
                            <div key={post.id} className="ig-cell" onClick={() => setViewPost(post)}>
                                {post.image_url
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={post.image_url} alt={post.title} className="ig-cell-img" loading="lazy"/>
                                    : <div className="ig-cell-noimg"><FileText size={24}/></div>
                                }
                                <div className="ig-cell-overlay">
                                    <span className="ig-cell-stat">♥ {post.likes_count||0}</span>
                                    <span className="ig-cell-stat">💬 {post.comments_count||0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ════════════ PACKAGES GRID ════════════ */}
            {activeTab === 'packages' && (
                <div className="ig-pkg-grid">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="ig-pkg-card">
                            <div className="ig-pkg-top">
                                <Crown size={24} className="ig-pkg-crown"/>
                                {pkg.badge_name && <span className="ig-pkg-badge">{pkg.badge_name}</span>}
                            </div>
                            <div className="ig-pkg-body">
                                <h3 className="ig-pkg-name">{pkg.name}</h3>
                                {pkg.description && <p className="ig-pkg-desc">{pkg.description}</p>}
                                <div className="ig-pkg-meta">
                                    <span><Coins size={12}/> {formatTokens(pkg.token_price)} tokens</span>
                                    <span><FileText size={12}/> {pkg.post_limit} posts</span>
                                </div>
                            </div>
                            <div className="ig-pkg-footer">
                                <button className="ig-pkg-btn" onClick={() => openEditPkg(pkg)}><Edit size={13}/> Edit</button>
                                <button className="ig-pkg-btn ig-pkg-btn--del" onClick={() => deletePkg(pkg.id)} disabled={deleteTarget===pkg.id}>
                                    {deleteTarget===pkg.id ? <span className="ig-spin"/> : <Trash2 size={13}/>}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button className="ig-pkg-card ig-pkg-card--new" onClick={openCreatePkg}>
                        <Plus size={28} style={{color:'var(--dash-text-muted)'}}/>
                        <span style={{fontSize:13,fontWeight:700,color:'var(--dash-text-muted)'}}>New Package</span>
                    </button>
                </div>
            )}
        </div>

        {/* ════════════ POST DETAIL MODAL ════════════ */}
        {viewPost && (
            <div className="ig-modal-overlay" onClick={() => setViewPost(null)}>
                <div className="ig-post-modal" onClick={e => e.stopPropagation()}>
                    <button className="ig-modal-close" onClick={() => setViewPost(null)}><X size={20}/></button>
                    {viewPost.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={viewPost.image_url} alt={viewPost.title} className="ig-post-modal-img"/>
                    )}
                    <div className="ig-post-modal-body">
                        <div className="ig-post-modal-badge">
                            {viewPost.access_type==='public' ? <span className="ig-badge ig-badge--pub"><Globe size={10}/> Public</span>
                            : <span className="ig-badge ig-badge--gate">🔒 {viewPost.access_type==='token_gated'?`${viewPost.token_cost} tokens`:`${viewPost.threshold_amount}+ tokens`}</span>}
                        </div>
                        <h3 className="ig-post-modal-title">{viewPost.title}</h3>
                        <p className="ig-post-modal-content">{viewPost.content}</p>
                        <div className="ig-post-modal-stats">
                            <span>♥ {viewPost.likes_count||0} likes</span>
                            <span>💬 {viewPost.comments_count||0} comments</span>
                        </div>
                        <div className="ig-post-modal-actions">
                            <a href="/creator/posts" className="ig-btn-outline" style={{width:'100%',justifyContent:'center'}}>
                                <Edit size={13}/> Manage in Posts
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ════════════ EDIT PROFILE PANEL ════════════ */}
        {editOpen && (
            <div className="ig-modal-overlay" onClick={e => e.target===e.currentTarget && setEditOpen(false)}>
                <aside className="ig-side-panel">
                    <div className="ig-panel-header">
                        <h2 className="ig-panel-title">Edit Profile</h2>
                        <button className="ig-close-btn" onClick={() => setEditOpen(false)}><X size={18}/></button>
                    </div>
                    <form className="ig-panel-body" onSubmit={saveProfile}>

                        {/* Avatar preview + URL */}
                        <div className="ig-field">
                            <label className="ig-label">Profile Picture</label>
                            <div className="ig-avatar-edit-row">
                                <div className="ig-avatar-edit-preview">
                                    {editForm.avatar_url
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={editForm.avatar_url} alt="" className="ig-avatar-img"/>
                                        : <Camera size={20} style={{color:'var(--dash-text-muted)'}}/>
                                    }
                                </div>
                                <input type="url" value={editForm.avatar_url} onChange={e => setEditForm({...editForm,avatar_url:e.target.value})} placeholder="Paste image URL…" className="ig-input"/>
                            </div>
                        </div>

                        {/* Name + category */}
                        <div className="ig-row-fields">
                            <div className="ig-field">
                                <label className="ig-label">Name <span className="ig-req">*</span></label>
                                <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm,display_name:e.target.value})} className="ig-input" required maxLength={100}/>
                            </div>
                            <div className="ig-field">
                                <label className="ig-label">Category</label>
                                <select value={editForm.category} onChange={e => setEditForm({...editForm,category:e.target.value})} className="ig-input">
                                    <option value="">Select…</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="ig-field">
                            <label className="ig-label">Bio <span className="ig-char">{editForm.bio.length}/150</span></label>
                            <textarea value={editForm.bio} onChange={e => setEditForm({...editForm,bio:e.target.value.slice(0,150)})} className="ig-textarea" rows={3} placeholder="Write a short bio…"/>
                        </div>

                        {/* Social links */}
                        <div className="ig-field">
                            <label className="ig-label">Links</label>
                            {['website','twitter','instagram','youtube'].map(key => (
                                <div key={key} className="ig-link-row">
                                    <div className="ig-link-icon">{SOCIAL_ICONS[key]}</div>
                                    <input type="url" value={editForm.social_links[key]||''} onChange={e => setEditForm({...editForm,social_links:{...editForm.social_links,[key]:e.target.value}})} placeholder={`https://${key==='website'?'yoursite.com':key+'.com/handle'}`} className="ig-input"/>
                                </div>
                            ))}
                        </div>

                        {/* Banner */}
                        <div className="ig-field">
                            <label className="ig-label">Banner Image URL</label>
                            <input type="url" value={editForm.banner_url} onChange={e => setEditForm({...editForm,banner_url:e.target.value})} className="ig-input" placeholder="https://…"/>
                        </div>

                    </form>
                    <div className="ig-panel-footer">
                        <button type="button" className="ig-btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                        <button className={`ig-btn-primary${saved?' ig-btn-primary--saved':''}`} onClick={saveProfile} disabled={saving}>
                            {saving ? <><span className="ig-spin"/> Saving…</> : saved ? <><CheckCircle size={14}/> Saved!</> : 'Save'}
                        </button>
                    </div>
                </aside>
            </div>
        )}

        {/* ════════════ PACKAGE MODAL ════════════ */}
        {pkgOpen && (
            <div className="ig-modal-overlay" onClick={e => e.target===e.currentTarget && setPkgOpen(false)}>
                <div className="ig-modal-box">
                    <div className="ig-panel-header">
                        <h2 className="ig-panel-title">{editingPkg?'Edit Package':'New Package'}</h2>
                        <button className="ig-close-btn" onClick={() => setPkgOpen(false)}><X size={18}/></button>
                    </div>
                    <form className="ig-panel-body" onSubmit={savePkg}>
                        <div className="ig-field">
                            <label className="ig-label">Name <span className="ig-req">*</span></label>
                            <input type="text" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm,name:e.target.value})} className="ig-input" required maxLength={100} placeholder="e.g., VIP Fan, Supporter…"/>
                        </div>
                        <div className="ig-row-fields">
                            <div className="ig-field">
                                <label className="ig-label">Token Price</label>
                                <input type="number" value={pkgForm.token_price} onChange={e => setPkgForm({...pkgForm,token_price:Number(e.target.value)})} min={1} className="ig-input" required/>
                            </div>
                            <div className="ig-field">
                                <label className="ig-label">Post Limit</label>
                                <input type="number" value={pkgForm.post_limit} onChange={e => setPkgForm({...pkgForm,post_limit:Number(e.target.value)})} min={1} className="ig-input" required/>
                            </div>
                        </div>
                        <div className="ig-field">
                            <label className="ig-label">Description</label>
                            <textarea value={pkgForm.description} onChange={e => setPkgForm({...pkgForm,description:e.target.value})} className="ig-textarea" rows={3} placeholder="What do fans get?"/>
                        </div>
                        <div className="ig-field">
                            <label className="ig-label">Badge Name <span className="ig-char">optional</span></label>
                            <input type="text" value={pkgForm.badge_name} onChange={e => setPkgForm({...pkgForm,badge_name:e.target.value})} className="ig-input" placeholder="e.g., Legend…" maxLength={50}/>
                        </div>
                        <div className="ig-panel-footer" style={{padding:0,marginTop:8,border:'none'}}>
                            <button type="button" className="ig-btn-ghost" onClick={() => setPkgOpen(false)}>Cancel</button>
                            <button type="submit" className="ig-btn-primary" disabled={savingPkg}>
                                {savingPkg ? <><span className="ig-spin"/> Saving…</> : editingPkg?'Save Changes':'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

        <style>{`
            /* ── Page ── */
            .ig-page { max-width: 935px; margin: 0 auto; padding-bottom: 80px; }

            /* ── HEADER ── */
            .ig-header { display: flex; align-items: flex-start; gap: 40px; padding: 32px 16px 24px; }
            .ig-avatar-col { flex-shrink: 0; }
            .ig-avatar-ring { width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); padding: 3px; }
            .ig-avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--dash-card); border: 3px solid var(--dash-bg); overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .ig-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .ig-avatar-init { font-size: 48px; font-weight: 800; color: var(--dash-text-secondary); }

            .ig-info-col { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; padding-top: 8px; }
            .ig-row-1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .ig-username { font-size: 22px; font-weight: 300; color: var(--dash-text-primary); margin: 0; letter-spacing: -0.01em; }
            .ig-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: 1.5px solid var(--dash-border); border-radius: 8px; background: var(--dash-card); color: var(--dash-text-primary); font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.15s; text-decoration: none; white-space: nowrap; }
            .ig-btn-outline:hover { background: var(--dash-border); }
            .ig-btn-icon { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--dash-border); background: var(--dash-card); color: var(--dash-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; }
            .ig-btn-icon:hover { background: var(--dash-bg); }

            .ig-row-2 { display: flex; gap: 28px; }
            .ig-stat { font-size: 16px; color: var(--dash-text-secondary); }
            .ig-stat strong { color: var(--dash-text-primary); font-weight: 700; }
            .ig-display-name { font-size: 14px; font-weight: 700; color: var(--dash-text-primary); }
            .ig-category { display: inline-block; font-size: 12px; font-weight: 600; color: #3897f0; }
            .ig-bio { font-size: 14px; color: var(--dash-text-primary); line-height: 1.6; margin: 0; white-space: pre-wrap; }
            .ig-link { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 600; color: #00376b; text-decoration: none; }
            .dark .ig-link { color: #8ac7ff; }
            .ig-link:hover { text-decoration: underline; }

            /* Mobile stats row (hidden on desktop) */
            .ig-mobile-stats { display: none; justify-content: space-around; padding: 12px 0; border-top: 1px solid var(--dash-border); border-bottom: 1px solid var(--dash-border); margin: 0 0 4px; }
            .ig-mobile-stats .ig-stat { font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 1px; }

            /* ── HIGHLIGHTS ── */
            .ig-highlights { display: flex; gap: 20px; overflow-x: auto; padding: 16px; scrollbar-width: none; border-bottom: 1px solid var(--dash-border); }
            .ig-highlights::-webkit-scrollbar { display: none; }
            .ig-highlight { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; flex-shrink: 0; }
            .ig-hl-ring { width: 77px; height: 77px; border-radius: 50%; background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); padding: 2.5px; }
            .ig-hl-ring--new { background: none; border: 2px solid var(--dash-border); }
            .ig-hl-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--dash-card); border: 2.5px solid var(--dash-bg); display: flex; align-items: center; justify-content: center; }
            .ig-hl-icon { color: var(--dash-text-secondary); }
            .ig-hl-label { font-size: 12px; font-weight: 400; color: var(--dash-text-primary); max-width: 80px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

            /* ── TABS ── */
            .ig-tabs { display: flex; justify-content: center; border-bottom: 1px solid var(--dash-border); }
            .ig-tab { display: flex; align-items: center; gap: 6px; padding: 12px 28px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dash-text-muted); background: none; border: none; border-top: 2px solid transparent; cursor: pointer; transition: 0.15s; margin-top: -1px; }
            .ig-tab:hover { color: var(--dash-text-primary); }
            .ig-tab--active { color: var(--dash-text-primary); border-top-color: var(--dash-text-primary); }

            /* ── POST GRID (Instagram 3-col) ── */
            .ig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-top: 3px; }
            .ig-cell { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--dash-border); cursor: pointer; }
            .ig-cell-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
            .ig-cell:hover .ig-cell-img { transform: scale(1.06); }
            .ig-cell-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--dash-text-muted); background: var(--dash-bg); }
            .ig-cell-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; gap: 20px; opacity: 0; transition: opacity 0.2s; }
            .ig-cell:hover .ig-cell-overlay { opacity: 1; }
            .ig-cell-stat { font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 5px; }

            /* ── PACKAGES GRID ── */
            .ig-pkg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 20px 0; }
            .ig-pkg-card { background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s; }
            .ig-pkg-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .ig-pkg-top { padding: 18px; background: linear-gradient(135deg, rgba(188,24,136,0.08) 0%, rgba(240,148,51,0.08) 100%); border-bottom: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: space-between; }
            .ig-pkg-crown { color: #bc1888; }
            .ig-pkg-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(188,24,136,0.1); color: #bc1888; border: 1px solid rgba(188,24,136,0.2); text-transform: uppercase; }
            .ig-pkg-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
            .ig-pkg-name { font-size: 15px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
            .ig-pkg-desc { font-size: 13px; color: var(--dash-text-muted); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .ig-pkg-meta { display: flex; gap: 10px; margin-top: auto; font-size: 12px; font-weight: 600; color: var(--dash-text-secondary); }
            .ig-pkg-meta span { display: flex; align-items: center; gap: 4px; }
            .ig-pkg-footer { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--dash-border); }
            .ig-pkg-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s; }
            .ig-pkg-btn:hover { background: var(--dash-border); }
            .ig-pkg-btn--del { flex: 0 0 34px; color: #ef4444; border-color: rgba(239,68,68,0.2); }
            .ig-pkg-btn--del:hover { background: rgba(239,68,68,0.1); }
            .ig-pkg-btn--del:disabled { opacity: 0.5; cursor: not-allowed; }
            .ig-pkg-card--new { align-items: center; justify-content: center; gap: 8px; min-height: 140px; border: 2px dashed var(--dash-border); background: transparent; cursor: pointer; }
            .ig-pkg-card--new:hover { border-color: var(--dash-text-muted); }

            /* ── EMPTY STATE ── */
            .ig-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; }
            .ig-empty-circle { width: 64px; height: 64px; border-radius: 50%; border: 2.5px solid var(--dash-text-primary); display: flex; align-items: center; justify-content: center; color: var(--dash-text-primary); }
            .ig-empty-h { font-size: 20px; font-weight: 600; color: var(--dash-text-primary); margin: 0; }
            .ig-empty-p { font-size: 14px; color: var(--dash-text-muted); margin: 0; }

            /* ── POST DETAIL MODAL ── */
            .ig-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
            .ig-post-modal { background: var(--dash-card); border-radius: 4px; max-width: 900px; width: 100%; max-height: 90vh; display: flex; overflow: hidden; position: relative; }
            .ig-modal-close { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.5); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; }
            .ig-post-modal-img { width: 60%; max-height: 90vh; object-fit: cover; display: block; flex-shrink: 0; }
            .ig-post-modal-body { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
            .ig-post-modal-title { font-size: 18px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
            .ig-post-modal-content { font-size: 14px; color: var(--dash-text-secondary); line-height: 1.6; margin: 0; flex: 1; }
            .ig-post-modal-stats { display: flex; gap: 16px; font-size: 14px; font-weight: 600; color: var(--dash-text-secondary); padding-top: 12px; border-top: 1px solid var(--dash-border); }
            .ig-post-modal-actions { margin-top: auto; }
            .ig-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
            .ig-badge--pub { background: rgba(34,197,94,0.1); color: #15803d; }
            .ig-badge--gate { background: rgba(99,102,241,0.1); color: #6366f1; }
            .ig-post-modal-badge { margin-bottom: 4px; }

            /* ── SIDE PANEL ── */
            .ig-modal-overlay:has(.ig-side-panel) { align-items: stretch; justify-content: flex-end; padding: 0; }
            .ig-side-panel { width: 100%; max-width: 480px; background: var(--dash-card); display: flex; flex-direction: column; animation: ig-slide 0.25s cubic-bezier(0.32,0.72,0,1); }
            @keyframes ig-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }

            .ig-modal-box { background: var(--dash-card); border-radius: 16px; width: 100%; max-width: 480px; animation: ig-pop 0.2s ease; }
            @keyframes ig-pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

            .ig-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--dash-border); }
            .ig-panel-title { font-size: 17px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
            .ig-close-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; }
            .ig-close-btn:hover { background: var(--dash-border); }
            .ig-panel-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
            .ig-panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid var(--dash-border); flex-shrink: 0; background: var(--dash-card); }

            /* ── FORM ── */
            .ig-field { display: flex; flex-direction: column; gap: 6px; }
            .ig-row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .ig-label { font-size: 13px; font-weight: 700; color: var(--dash-text-primary); display: flex; align-items: center; gap: 6px; }
            .ig-req { color: #ef4444; }
            .ig-char { font-size: 11px; font-weight: 400; color: var(--dash-text-muted); }
            .ig-input { width: 100%; padding: 9px 12px; border-radius: 9px; border: 1.5px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-primary); font-size: 14px; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
            .ig-input:focus { border-color: var(--dash-text-primary); }
            .ig-textarea { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1.5px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-primary); font-size: 14px; line-height: 1.6; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
            .ig-textarea:focus { border-color: var(--dash-text-primary); }
            .ig-avatar-edit-row { display: flex; align-items: center; gap: 10px; }
            .ig-avatar-edit-preview { width: 56px; height: 56px; border-radius: 50%; background: var(--dash-border); border: 2px solid var(--dash-border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
            .ig-link-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
            .ig-link-icon { width: 30px; height: 30px; border-radius: 8px; background: var(--dash-bg); border: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: center; color: var(--dash-text-muted); flex-shrink: 0; }

            /* ── BUTTONS ── */
            .ig-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 8px; border: none; background: #0095f6; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; min-width: 100px; justify-content: center; }
            .ig-btn-primary:hover { opacity: 0.88; }
            .ig-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            .ig-btn-primary--saved { background: #22c55e; }
            .ig-btn-ghost { display: inline-flex; align-items: center; padding: 9px 16px; border-radius: 8px; border: 1.5px solid var(--dash-border); background: transparent; color: var(--dash-text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; }
            .ig-btn-ghost:hover { background: var(--dash-bg); }

            /* ── SPINNER ── */
            .ig-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: ig-spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
            @keyframes ig-spin { to { transform: rotate(360deg); } }

            /* ── RESPONSIVE ── */
            @media (max-width: 735px) {
                .ig-header { gap: 24px; padding: 20px 12px 16px; }
                .ig-avatar-ring { width: 86px; height: 86px; }
                .ig-avatar-init { font-size: 28px; }
                .ig-username { font-size: 18px; }
                .ig-row-2 { display: none; }
                .ig-mobile-stats { display: flex; }
                .ig-row-fields { grid-template-columns: 1fr; }
                .ig-post-modal { flex-direction: column; max-height: 95vh; border-radius: 12px; }
                .ig-post-modal-img { width: 100%; height: 50vw; max-height: 360px; }
                .ig-side-panel { max-width: 100%; }
            }
        `}</style>
        </>
    );
}
