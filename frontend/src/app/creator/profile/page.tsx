'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    User, Camera, Edit3, Save, X, Eye, FileText,
    Heart, MessageCircle, Users, Coins, Star,
    Globe, Lock, Shield, Link as LinkIcon
} from 'lucide-react';
import { formatTokens, formatPoints, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';

interface ProfileData {
    profile: {
        id: string;
        user_id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        role: string;
        bio: string | null;
        created_at: string;
        updated_at: string;
    };
    stats: {
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        uniqueFans: number;
        tokenBalance: number;
        pointsBalance: number;
    };
}

interface CreatorPost {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    access_type: string;
    token_cost: number;
    threshold_amount: number;
    likes_count: number;
    comments_count: number;
    created_at: string;
}

export default function CreatorProfilePage() {
    const [data, setData] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<CreatorPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatar, setEditAvatar] = useState('');

    const fetchProfile = useCallback(async () => {
        const res = await fetch('/api/profile');
        if (res.ok) {
            const profileData = await res.json();
            setData(profileData);
            setEditName(profileData.profile.display_name);
            setEditBio(profileData.profile.bio || '');
            setEditAvatar(profileData.profile.avatar_url || '');
        }

        // Also fetch posts for the grid
        const postsRes = await fetch('/api/posts');
        if (postsRes.ok) {
            const postsData = await postsRes.json();
            setPosts(postsData.posts || []);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                display_name: editName,
                bio: editBio,
                avatar_url: editAvatar || null,
            }),
        });

        if (res.ok) {
            const result = await res.json();
            setData(prev => prev ? { ...prev, profile: result.profile } : null);
            setEditing(false);
            setToast({ message: 'Profile updated successfully!', type: 'success' });
        } else {
            const err = await res.json();
            setToast({ message: err.error || 'Failed to update profile', type: 'error' });
        }
        setSaving(false);
    };

    const getAccessIcon = (type: string) => {
        switch (type) {
            case 'public': return <Globe className="w-3 h-3" />;
            case 'token_gated': return <Lock className="w-3 h-3" />;
            case 'threshold_gated': return <Shield className="w-3 h-3" />;
            default: return <Globe className="w-3 h-3" />;
        }
    };

    if (loading) return <PageLoader />;
    if (!data) return <div className="text-center text-foreground-muted py-10">Failed to load profile</div>;

    const { profile, stats } = data;

    // VIEW MODE — Instagram-style public profile preview
    if (viewMode) {
        return (
            <div className="space-y-8 animate-fade-in">
                {/* View mode banner */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,113,227,0.06), rgba(94,92,230,0.06))' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <Eye className="w-4 h-4" />
                            You&apos;re previewing how fans see your profile
                        </div>
                        <button onClick={() => setViewMode(false)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem' }}>
                            <X className="w-3.5 h-3.5" /> Exit Preview
                        </button>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Cover area */}
                    <div style={{
                        height: 160,
                        background: 'linear-gradient(135deg, #0071e3, #5E5CE6)',
                        position: 'relative',
                    }} />

                    {/* Profile info */}
                    <div style={{ padding: '0 1.5rem 1.5rem', marginTop: -48 }}>
                        <div style={{
                            width: 96, height: 96, borderRadius: '50%',
                            border: '4px solid var(--white)',
                            background: '#0071e3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '2rem',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(profile.display_name)
                            )}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                                {profile.display_name}
                            </h1>
                            <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', marginBottom: 12 }}>
                                @{profile.username}
                            </p>
                            {profile.bio && (
                                <p style={{ fontSize: '0.9375rem', color: 'var(--fg-soft)', lineHeight: 1.6, maxWidth: 480 }}>
                                    {profile.bio}
                                </p>
                            )}
                        </div>

                        {/* Stats row */}
                        <div style={{
                            display: 'flex', gap: '2rem', marginTop: 20,
                            paddingTop: 16, borderTop: '1px solid var(--border)',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)' }}>{stats.totalPosts}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', fontWeight: 500 }}>Posts</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)' }}>{stats.uniqueFans}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', fontWeight: 500 }}>Fans</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)' }}>{stats.totalLikes}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', fontWeight: 500 }}>Likes</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Post Grid */}
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16, color: 'var(--fg)' }}>
                        Posts ({posts.length})
                    </h2>
                    {posts.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 12,
                        }}>
                            {posts.map(post => (
                                <div key={post.id} className="card" style={{
                                    padding: 0, overflow: 'hidden', position: 'relative',
                                }}>
                                    {post.image_url ? (
                                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                                            <img src={post.image_url} alt="" style={{
                                                width: '100%', height: '100%', objectFit: 'cover',
                                            }} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            aspectRatio: '1',
                                            background: 'linear-gradient(135deg, var(--gray-100), var(--gray-50))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexDirection: 'column', gap: 8,
                                        }}>
                                            <FileText style={{ width: 24, height: 24, color: 'var(--fg-muted)' }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-muted)', padding: '0 12px', textAlign: 'center' }}>
                                                {post.title}
                                            </span>
                                        </div>
                                    )}
                                    {/* Overlay with stats */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        padding: '8px 12px',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        color: '#fff', fontSize: '0.75rem',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Heart style={{ width: 12, height: 12 }} /> {post.likes_count}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MessageCircle style={{ width: 12, height: 12 }} /> {post.comments_count}
                                        </span>
                                        {post.access_type !== 'public' && (
                                            <span style={{ marginLeft: 'auto' }}>
                                                {getAccessIcon(post.access_type)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <FileText style={{ width: 40, height: 40, color: 'var(--fg-muted)', margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>No posts yet</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // EDIT/MANAGE MODE
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                    <p className="text-foreground-muted">Manage your creator profile and settings</p>
                </div>
                <button onClick={() => setViewMode(true)} className="btn-secondary">
                    <Eye className="w-4 h-4" /> Preview Profile
                </button>
            </div>

            {/* Profile Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Cover */}
                <div style={{
                    height: 120,
                    background: 'linear-gradient(135deg, #0071e3, #5E5CE6)',
                    position: 'relative',
                }} />

                <div style={{ padding: '0 1.5rem 1.5rem', marginTop: -40 }}>
                    <div className="flex items-end gap-4" style={{ marginBottom: 20 }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                border: '3px solid var(--white)',
                                background: '#0071e3',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '1.5rem',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}>
                                {(editing ? editAvatar : profile.avatar_url) ? (
                                    <img
                                        src={editing ? editAvatar : profile.avatar_url!}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    getInitials(profile.display_name)
                                )}
                            </div>
                            {editing && (
                                <div style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'var(--gray-900)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid var(--white)',
                                }}>
                                    <Camera style={{ width: 14, height: 14 }} />
                                </div>
                            )}
                        </div>

                        {/* Name + username */}
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="input"
                                    placeholder="Display Name"
                                    style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: 4 }}
                                />
                            ) : (
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)', marginBottom: 2 }}>
                                    {profile.display_name}
                                </h2>
                            )}
                            <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)' }}>@{profile.username}</p>
                        </div>

                        {/* Edit button */}
                        {!editing ? (
                            <button onClick={() => setEditing(true)} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                                <Edit3 className="w-4 h-4" /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                                    {saving ? (
                                        <span className="flex items-center gap-2">
                                            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                            Saving...
                                        </span>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Save</>
                                    )}
                                </button>
                                <button onClick={() => {
                                    setEditing(false);
                                    setEditName(profile.display_name);
                                    setEditBio(profile.bio || '');
                                    setEditAvatar(profile.avatar_url || '');
                                }} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Avatar URL input (edit mode) */}
                    {editing && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 6 }}>
                                Profile Photo URL
                            </label>
                            <div className="flex items-center gap-2">
                                <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                                    <LinkIcon style={{ width: 16, height: 16, color: 'var(--fg-muted)' }} />
                                </div>
                                <input
                                    type="url"
                                    value={editAvatar}
                                    onChange={e => setEditAvatar(e.target.value)}
                                    className="input"
                                    placeholder="https://example.com/your-photo.jpg"
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 6 }}>
                            Bio
                        </label>
                        {editing ? (
                            <textarea
                                value={editBio}
                                onChange={e => setEditBio(e.target.value)}
                                className="textarea"
                                placeholder="Tell your fans about yourself..."
                                maxLength={500}
                                style={{ minHeight: 100 }}
                            />
                        ) : (
                            <p style={{ fontSize: '0.9375rem', color: profile.bio ? 'var(--fg-soft)' : 'var(--fg-muted)', lineHeight: 1.6, fontStyle: profile.bio ? 'normal' : 'italic' }}>
                                {profile.bio || 'No bio yet — click Edit Profile to add one.'}
                            </p>
                        )}
                        {editing && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 4, textAlign: 'right' }}>
                                {editBio.length}/500
                            </p>
                        )}
                    </div>

                    {/* Member since */}
                    <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 16 }}>
                        Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--fg)' }}>
                    Your Stats
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <FileText style={{ width: 20, height: 20, color: '#0071e3', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalPosts}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <Users style={{ width: 20, height: 20, color: '#5E5CE6', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.uniqueFans}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fans</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <Heart style={{ width: 20, height: 20, color: '#FF3B30', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalLikes}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Likes</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <MessageCircle style={{ width: 20, height: 20, color: '#34C759', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalComments}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comments</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <Coins style={{ width: 20, height: 20, color: '#FF9500', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatTokens(stats.tokenBalance)}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tokens</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <Star style={{ width: 20, height: 20, color: '#5E5CE6', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatPoints(stats.pointsBalance)}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points</div>
                    </div>
                </div>
            </div>

            {/* Token Pricing Section */}
            <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--fg)' }}>
                        Content Access Pricing
                    </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginBottom: 16 }}>
                    When creating posts, you can set the access type and token cost. Here&apos;s how it works:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card" style={{ borderLeft: '3px solid #34C759' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <Globe style={{ width: 18, height: 18, color: '#34C759' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Public</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                            Free for everyone. Great for building your audience and reaching new fans.
                        </p>
                    </div>

                    <div className="card" style={{ borderLeft: '3px solid #FF9500' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <Lock style={{ width: 18, height: 18, color: '#FF9500' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Token Gated</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                            Fans pay a fixed number of tokens to unlock. You set the price per post (e.g., 10, 25, 50 tokens).
                        </p>
                    </div>

                    <div className="card" style={{ borderLeft: '3px solid #0071e3' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <Shield style={{ width: 18, height: 18, color: '#0071e3' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Threshold Gated</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                            Content visible only to fans holding a minimum token balance (e.g., 100+ tokens). Tokens aren&apos;t spent.
                        </p>
                    </div>
                </div>
            </div>

            {/* Your Posts Overview */}
            <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--fg)' }}>
                        Your Posts ({posts.length})
                    </h3>
                </div>
                {posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {posts.slice(0, 8).map(post => (
                            <div key={post.id} className="card" style={{
                                padding: 0, overflow: 'hidden', position: 'relative',
                            }}>
                                {post.image_url ? (
                                    <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                                        <img src={post.image_url} alt="" style={{
                                            width: '100%', height: '100%', objectFit: 'cover',
                                            transition: 'transform 0.3s',
                                        }} />
                                    </div>
                                ) : (
                                    <div style={{
                                        aspectRatio: '1',
                                        background: 'linear-gradient(135deg, var(--gray-100), var(--gray-50))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexDirection: 'column', gap: 6, padding: 12,
                                    }}>
                                        <FileText style={{ width: 20, height: 20, color: 'var(--fg-muted)' }} />
                                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--fg-muted)', textAlign: 'center', lineClamp: 2, overflow: 'hidden' }}>
                                            {post.title}
                                        </span>
                                    </div>
                                )}

                                {/* Bottom info bar */}
                                <div style={{
                                    padding: '8px 10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    fontSize: '0.6875rem', color: 'var(--fg-muted)',
                                    borderTop: '1px solid var(--border)',
                                }}>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1"><Heart style={{ width: 10, height: 10 }} /> {post.likes_count}</span>
                                        <span className="flex items-center gap-1"><MessageCircle style={{ width: 10, height: 10 }} /> {post.comments_count}</span>
                                    </div>
                                    <span className={`badge ${post.access_type === 'public' ? 'badge-success' : post.access_type === 'token_gated' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.5625rem', padding: '2px 6px' }}>
                                        {post.access_type === 'public' ? 'Free' : post.access_type === 'token_gated' ? `${post.token_cost}T` : `${post.threshold_amount}+`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <FileText style={{ width: 40, height: 40, color: 'var(--fg-muted)', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)' }}>No posts yet. Go to Posts to create your first one!</p>
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
