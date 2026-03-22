'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/theme-provider';
import {
    X, Edit2, Globe, Sun, Moon, Save, Loader2, CheckCircle,
    Lock, Heart, MessageCircle, Coins, Star, Grid3X3, Link2,
    Twitter, Instagram, Youtube, Camera, Bookmark
} from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { getInitials } from '@/lib/utils';

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
    twitter: <Twitter size={13}/>, instagram: <Instagram size={13}/>,
    youtube: <Youtube size={13}/>,  website: <Globe size={13}/>,
};

export default function FanProfilePage() {
    const supabase = createClient();
    const { theme, toggleTheme } = useTheme();

    const [profile, setProfile]   = useState<Record<string,unknown>|null>(null);
    const [stats, setStats]       = useState({ liked:0, commented:0, tokens:0, points:0 });
    const [likedPosts, setLikedPosts] = useState<Array<{id:string;title:string;image_url:string|null;creator?:{display_name:string};likes_count:number}>>([]);
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState<{message:string;type:'success'|'error'|'info'}|null>(null);
    const [activeTab, setActiveTab] = useState<'liked'|'saved'>('liked');

    // Edit panel
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm]         = useState({ display_name:'', bio:'', avatar_url:'', social_links:{} as Record<string,string> });
    const [saving, setSaving]     = useState(false);
    const [saved, setSaved]       = useState(false);

    // Password
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSent, setPwSent]       = useState(false);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
            if (p) {
                setProfile(p);
                setForm({ display_name: p.display_name||'', bio: p.bio||'', avatar_url: p.avatar_url||'', social_links: p.social_links||{} });
            }

            const [likesRes, commentsRes, walletRes] = await Promise.all([
                supabase.from('post_likes').select('id', { count:'exact', head:true }).eq('user_id', user.id),
                supabase.from('post_comments').select('id', { count:'exact', head:true }).eq('user_id', user.id),
                supabase.from('profiles').select('token_balance, points').eq('user_id', user.id).single(),
            ]);

            setStats({
                liked: likesRes.count||0,
                commented: commentsRes.count||0,
                tokens: walletRes.data?.token_balance||0,
                points: walletRes.data?.points||0,
            });

            // Liked posts for grid
            const { data: likedPostIds } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).limit(30);
            if (likedPostIds && likedPostIds.length>0) {
                const ids = likedPostIds.map((l: {post_id: string}) => l.post_id);
                const { data: postsData } = await supabase.from('posts').select('id,title,image_url,likes_count').in('id', ids);
                if (postsData) setLikedPosts(postsData);
            }

            setLoading(false);
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openEdit = () => { setSaved(false); setEditOpen(true); };

    const saveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ display_name:form.display_name, bio:form.bio, avatar_url:form.avatar_url, social_links:form.social_links }).eq('user_id', profile.user_id as string);
        if (!error) {
            setSaved(true);
            setProfile({ ...profile, ...form });
            setTimeout(() => { setSaved(false); setEditOpen(false); }, 900);
        } else {
            setToast({ message: error.message||'Failed to save', type:'error' });
        }
        setSaving(false);
    };

    const handlePasswordReset = async () => {
        const email = profile?.email as string;
        if (!email) return;
        setPwLoading(true);
        await supabase.auth.resetPasswordForEmail(email);
        setPwSent(true); setPwLoading(false);
        setTimeout(() => setPwSent(false), 5000);
    };

    if (loading) {
        return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
            <div className="fp-loading-ring"/>
        </div>;
    }

    const primaryLink = profile?.social_links ? Object.values(profile.social_links as Record<string,string>).find(Boolean) : null;
    const primaryKey  = profile?.social_links ? Object.entries(profile.social_links as Record<string,string>).find(([,v])=>!!v)?.[0] : null;

    return (
        <>
        <div className="fp-page">

            {/* ════════════ HEADER — Instagram style ════════════ */}
            <div className="fp-header">

                {/* Avatar */}
                <div className="fp-avatar-col">
                    <div className="fp-avatar-ring">
                        <div className="fp-avatar">
                            {profile?.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={profile.avatar_url as string} alt="" className="fp-avatar-img"/>
                                : <span className="fp-avatar-init">{getInitials((profile?.display_name as string)||'F')}</span>
                            }
                        </div>
                    </div>
                </div>

                {/* Info column */}
                <div className="fp-info-col">

                    {/* Row 1: username + edit button */}
                    <div className="fp-row-1">
                        <h1 className="fp-username">{profile?.username as string}</h1>
                        <button className="fp-btn-outline" onClick={openEdit}><Edit2 size={14}/> Edit profile</button>
                    </div>

                    {/* Row 2: stats */}
                    <div className="fp-row-2">
                        <span className="fp-stat"><strong>{stats.liked}</strong> liked</span>
                        <span className="fp-stat"><strong>{stats.commented}</strong> comments</span>
                        <span className="fp-stat"><strong>{stats.tokens}</strong> tokens</span>
                        <span className="fp-stat"><strong>{stats.points}</strong> pts</span>
                    </div>

                    {/* Row 3: display name */}
                    {profile?.display_name && <div className="fp-display-name">{profile.display_name as string}</div>}

                    {/* Row 4: bio */}
                    {profile?.bio && <p className="fp-bio">{profile.bio as string}</p>}

                    {/* Row 5: link */}
                    {primaryLink && (
                        <a href={primaryLink} target="_blank" rel="noopener noreferrer" className="fp-link">
                            {SOCIAL_ICONS[primaryKey!] ?? <Link2 size={13}/>}
                            {primaryLink.replace(/^https?:\/\/(www\.)?/,'').split('/')[0]}
                        </a>
                    )}

                    {/* Row 6: account info row */}
                    <div className="fp-account-strip">
                        <span className="fp-account-item"><span className="fp-account-label">Email:</span> {profile?.email as string}</span>
                        <button className="fp-link-btn" onClick={handlePasswordReset} disabled={pwLoading||pwSent}>
                            {pwLoading ? <Loader2 size={12} className="fp-spin"/> : pwSent ? <><CheckCircle size={12}/> Sent!</> : <><Lock size={12}/> Reset password</>}
                        </button>
                        <button className="fp-theme-btn" onClick={toggleTheme}>
                            {theme==='dark' ? <Sun size={14}/> : <Moon size={14}/>} {theme==='dark'?'Light':'Dark'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile stats */}
            <div className="fp-mobile-stats">
                <span className="fp-stat fp-stat--col"><strong>{stats.liked}</strong> liked</span>
                <span className="fp-stat fp-stat--col"><strong>{stats.commented}</strong> comments</span>
                <span className="fp-stat fp-stat--col"><strong>{stats.tokens}</strong> tokens</span>
                <span className="fp-stat fp-stat--col"><strong>{stats.points}</strong> pts</span>
            </div>

            {/* ════════════ TABS ════════════ */}
            <div className="fp-tabs">
                <button className={`fp-tab${activeTab==='liked'?' fp-tab--active':''}`} onClick={() => setActiveTab('liked')}>
                    <Heart size={15}/> <span>Liked Posts</span>
                </button>
                <button className={`fp-tab${activeTab==='saved'?' fp-tab--active':''}`} onClick={() => setActiveTab('saved')}>
                    <Bookmark size={15}/> <span>Activity</span>
                </button>
            </div>

            {/* ════════════ LIKED POSTS GRID ════════════ */}
            {activeTab==='liked' && (
                likedPosts.length===0 ? (
                    <div className="fp-empty">
                        <div className="fp-empty-circle"><Heart size={32}/></div>
                        <h3 className="fp-empty-h">No liked posts yet</h3>
                        <p className="fp-empty-p">Posts you like will appear here.</p>
                        <a href="/fan/feed" className="fp-btn-outline">Browse Feed</a>
                    </div>
                ) : (
                    <div className="fp-grid">
                        {likedPosts.map(post => (
                            <div key={post.id} className="fp-cell">
                                {post.image_url
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={post.image_url} alt={post.title} className="fp-cell-img" loading="lazy"/>
                                    : <div className="fp-cell-noimg"><Grid3X3 size={20}/></div>
                                }
                                <div className="fp-cell-overlay">
                                    <span className="fp-cell-stat">♥ {post.likes_count||0}</span>
                                    <span className="fp-cell-title">{post.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ════════════ ACTIVITY TAB ════════════ */}
            {activeTab==='saved' && (
                <div className="fp-activity">
                    {[
                        { label:'Posts Liked', value:stats.liked, icon:Heart, color:'#ef4444' },
                        { label:'Comments Made', value:stats.commented, icon:MessageCircle, color:'#6366f1' },
                        { label:'Token Balance', value:stats.tokens, icon:Coins, color:'#f59e0b' },
                        { label:'Points Earned', value:stats.points, icon:Star, color:'#10b981' },
                    ].map(s => (
                        <div className="fp-activity-card" key={s.label}>
                            <div className="fp-act-icon" style={{background:`${s.color}18`,color:s.color}}><s.icon size={22}/></div>
                            <div>
                                <div className="fp-act-val">{s.value.toLocaleString()}</div>
                                <div className="fp-act-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* ════════════ EDIT PANEL ════════════ */}
        {editOpen && (
            <div className="fp-overlay" onClick={e => e.target===e.currentTarget && setEditOpen(false)}>
                <aside className="fp-panel">
                    <div className="fp-panel-header">
                        <h2 className="fp-panel-title">Edit Profile</h2>
                        <button className="fp-close-btn" onClick={() => setEditOpen(false)}><X size={18}/></button>
                    </div>
                    <div className="fp-panel-body">

                        {/* Avatar */}
                        <div className="fp-field">
                            <label className="fp-label">Profile Picture</label>
                            <div className="fp-avatar-row">
                                <div className="fp-avatar-mini">
                                    {form.avatar_url
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={form.avatar_url} alt="" className="fp-avatar-img"/>
                                        : <Camera size={20} style={{color:'var(--dash-text-muted)'}}/>
                                    }
                                </div>
                                <input type="url" value={form.avatar_url} onChange={e => setForm({...form,avatar_url:e.target.value})} placeholder="Paste image URL…" className="fp-input"/>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="fp-field">
                            <label className="fp-label">Display Name</label>
                            <input type="text" value={form.display_name} onChange={e => setForm({...form,display_name:e.target.value})} className="fp-input" maxLength={100} placeholder="Your name"/>
                        </div>

                        {/* Bio */}
                        <div className="fp-field">
                            <label className="fp-label">Bio <span className="fp-char">{form.bio.length}/150</span></label>
                            <textarea value={form.bio} onChange={e => setForm({...form,bio:e.target.value.slice(0,150)})} className="fp-textarea" rows={3} placeholder="Write something about yourself…"/>
                        </div>

                        {/* Social links */}
                        <div className="fp-field">
                            <label className="fp-label">Links</label>
                            {['website','twitter','instagram','youtube'].map(key => (
                                <div key={key} className="fp-link-input-row">
                                    <div className="fp-link-icon-wrap">{SOCIAL_ICONS[key]}</div>
                                    <input type="url" value={(form.social_links as Record<string,string>)[key]||''} onChange={e => setForm({...form,social_links:{...form.social_links,[key]:e.target.value}})} placeholder={`https://${key==='website'?'yoursite.com':key+'.com/handle'}`} className="fp-input"/>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="fp-panel-footer">
                        <button className="fp-btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                        <button className={`fp-btn-save${saved?' fp-btn-save--saved':''}`} onClick={saveProfile} disabled={saving}>
                            {saving ? <><Loader2 size={14} className="fp-spin"/> Saving…</> : saved ? <><CheckCircle size={14}/> Saved!</> : <><Save size={14}/> Save</>}
                        </button>
                    </div>
                </aside>
            </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

        <style>{`
            .fp-loading-ring { width: 36px; height: 36px; border: 3px solid var(--dash-border); border-top-color: var(--dash-text-primary); border-radius: 50%; animation: fp-spin 0.7s linear infinite; }

            /* Page */
            .fp-page { max-width: 935px; margin: 0 auto; padding-bottom: 80px; }

            /* HEADER */
            .fp-header { display: flex; align-items: flex-start; gap: 40px; padding: 32px 16px 24px; }
            .fp-avatar-col { flex-shrink: 0; }
            .fp-avatar-ring { width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); padding: 3px; }
            .fp-avatar { width: 100%; height: 100%; border-radius: 50%; background: var(--dash-card); border: 3px solid var(--dash-bg); overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .fp-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .fp-avatar-init { font-size: 48px; font-weight: 800; color: var(--dash-text-secondary); }

            .fp-info-col { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-top: 8px; }
            .fp-row-1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .fp-username { font-size: 22px; font-weight: 300; color: var(--dash-text-primary); margin: 0; letter-spacing: -0.01em; }
            .fp-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: 1.5px solid var(--dash-border); border-radius: 8px; background: var(--dash-card); color: var(--dash-text-primary); font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.15s; white-space: nowrap; text-decoration: none; }
            .fp-btn-outline:hover { background: var(--dash-border); }

            .fp-row-2 { display: flex; gap: 20px; flex-wrap: wrap; }
            .fp-stat { font-size: 16px; color: var(--dash-text-secondary); }
            .fp-stat strong { color: var(--dash-text-primary); font-weight: 700; }
            .fp-stat--col { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 14px; }
            .fp-display-name { font-size: 14px; font-weight: 700; color: var(--dash-text-primary); }
            .fp-bio { font-size: 14px; color: var(--dash-text-primary); line-height: 1.6; margin: 0; white-space: pre-wrap; }
            .fp-link { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 600; color: #00376b; text-decoration: none; }
            .dark .fp-link { color: #8ac7ff; }
            .fp-link:hover { text-decoration: underline; }

            /* Account strip */
            .fp-account-strip { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 4px; border-top: 1px solid var(--dash-border); margin-top: 2px; }
            .fp-account-label { font-weight: 700; color: var(--dash-text-primary); margin-right: 2px; }
            .fp-account-item { font-size: 13px; color: var(--dash-text-muted); }
            .fp-link-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s; }
            .fp-link-btn:hover { color: var(--dash-text-primary); }
            .fp-link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .fp-theme-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s; }
            .fp-theme-btn:hover { color: var(--dash-text-primary); }

            /* Mobile stats */
            .fp-mobile-stats { display: none; justify-content: space-around; padding: 12px 0; border-top: 1px solid var(--dash-border); border-bottom: 1px solid var(--dash-border); }

            /* TABS */
            .fp-tabs { display: flex; justify-content: center; border-bottom: 1px solid var(--dash-border); }
            .fp-tab { display: flex; align-items: center; gap: 6px; padding: 12px 28px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dash-text-muted); background: none; border: none; border-top: 2px solid transparent; cursor: pointer; transition: 0.15s; margin-top: -1px; }
            .fp-tab:hover { color: var(--dash-text-primary); }
            .fp-tab--active { color: var(--dash-text-primary); border-top-color: var(--dash-text-primary); }

            /* Grid */
            .fp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-top: 3px; }
            .fp-cell { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--dash-border); cursor: pointer; }
            .fp-cell-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s; }
            .fp-cell:hover .fp-cell-img { transform: scale(1.06); }
            .fp-cell-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--dash-bg); color: var(--dash-text-muted); }
            .fp-cell-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; opacity: 0; transition: opacity 0.2s; padding: 8px; }
            .fp-cell:hover .fp-cell-overlay { opacity: 1; }
            .fp-cell-stat { font-size: 15px; font-weight: 700; color: #fff; }
            .fp-cell-title { font-size: 12px; color: rgba(255,255,255,0.85); text-align: center; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

            /* Empty */
            .fp-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; }
            .fp-empty-circle { width: 64px; height: 64px; border-radius: 50%; border: 2.5px solid var(--dash-text-primary); display: flex; align-items: center; justify-content: center; color: var(--dash-text-primary); }
            .fp-empty-h { font-size: 20px; font-weight: 600; color: var(--dash-text-primary); margin: 0; }
            .fp-empty-p { font-size: 14px; color: var(--dash-text-muted); margin: 0; }

            /* Activity */
            .fp-activity { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 20px 0; }
            .fp-activity-card { background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; }
            .fp-act-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .fp-act-val { font-size: 24px; font-weight: 800; color: var(--dash-text-primary); letter-spacing: -0.03em; }
            .fp-act-label { font-size: 13px; color: var(--dash-text-muted); font-weight: 500; margin-top: 1px; }

            /* OVERLAY + PANEL */
            .fp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); background-clip: border-box; backdrop-filter: blur(6px); z-index: 50; display: flex; align-items: stretch; justify-content: flex-end; }
            .fp-panel { width: 100%; max-width: 440px; background: var(--dash-card); border-left: 1px solid var(--dash-border); display: flex; flex-direction: column; animation: fp-slide 0.25s cubic-bezier(0.32,0.72,0,1); }
            @keyframes fp-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
            .fp-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--dash-border); flex-shrink: 0; }
            .fp-panel-title { font-size: 17px; font-weight: 700; color: var(--dash-text-primary); margin: 0; }
            .fp-close-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; }
            .fp-close-btn:hover { background: var(--dash-border); }
            .fp-panel-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
            .fp-panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid var(--dash-border); flex-shrink: 0; background: var(--dash-card); }

            /* Fields */
            .fp-field { display: flex; flex-direction: column; gap: 6px; }
            .fp-label { font-size: 13px; font-weight: 700; color: var(--dash-text-primary); display: flex; align-items: center; gap: 6px; }
            .fp-char { font-size: 11px; font-weight: 400; color: var(--dash-text-muted); }
            .fp-input { width: 100%; padding: 9px 12px; border-radius: 9px; border: 1.5px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-primary); font-size: 14px; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
            .fp-input:focus { border-color: var(--dash-text-primary); }
            .fp-textarea { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1.5px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text-primary); font-size: 14px; line-height: 1.6; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
            .fp-textarea:focus { border-color: var(--dash-text-primary); }

            .fp-avatar-row { display: flex; align-items: center; gap: 10px; }
            .fp-avatar-mini { width: 52px; height: 52px; border-radius: 50%; background: var(--dash-border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
            .fp-link-input-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
            .fp-link-icon-wrap { width: 30px; height: 30px; border-radius: 8px; background: var(--dash-bg); border: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: center; color: var(--dash-text-muted); flex-shrink: 0; }

            /* Buttons */
            .fp-btn-save { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 8px; border: none; background: #0095f6; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; min-width: 90px; justify-content: center; }
            .fp-btn-save:hover { opacity: 0.88; }
            .fp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
            .fp-btn-save--saved { background: #22c55e; }
            .fp-btn-ghost { display: inline-flex; align-items: center; padding: 9px 16px; border-radius: 8px; border: 1.5px solid var(--dash-border); background: transparent; color: var(--dash-text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; }
            .fp-btn-ghost:hover { background: var(--dash-bg); }

            @keyframes fp-spin { to { transform: rotate(360deg); } }
            .fp-spin { animation: fp-spin 0.7s linear infinite; }

            @media (max-width: 735px) {
                .fp-header { gap: 20px; padding: 20px 12px 16px; }
                .fp-avatar-ring { width: 86px; height: 86px; }
                .fp-avatar-init { font-size: 28px; }
                .fp-username { font-size: 18px; }
                .fp-row-2 { display: none; }
                .fp-mobile-stats { display: flex; }
                .fp-activity { grid-template-columns: 1fr; }
                .fp-panel { max-width: 100%; }
                .fp-account-strip { flex-direction: column; align-items: flex-start; }
            }
        `}</style>
        </>
    );
}
