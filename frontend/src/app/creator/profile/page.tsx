'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    User, Camera, MapPin, Link2, Edit, Plus, Trash2, X,
    FileText, Users, Coins, Crown, Shield, Award, ExternalLink,
    Twitter, Instagram, Youtube, Globe, Package, Settings, Grid, LayoutGrid, Bookmark, Film
} from 'lucide-react';
import { formatTokens, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import type { Profile, CreatorPackage } from '@/types';

const CATEGORIES = [
    'Music', 'Art', 'Gaming', 'Fitness', 'Education',
    'Photography', 'Writing', 'Comedy', 'Cooking', 'Tech',
    'Film', 'Podcast', 'Other',
];

export default function CreatorProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [packages, setPackages] = useState<CreatorPackage[]>([]);
    const [stats, setStats] = useState({ post_count: 0, fan_count: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Edit Profile Modal
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        avatar_url: '',
        banner_url: '',
        category: '',
        social_links: {} as Record<string, string>,
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Package Modal
    const [showPkgModal, setShowPkgModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState<CreatorPackage | null>(null);
    const [pkgForm, setPkgForm] = useState({
        name: '',
        token_price: 50,
        post_limit: 10,
        description: '',
        badge_name: '',
    });
    const [savingPkg, setSavingPkg] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/profile');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Failed to fetch profile (${res.status})`);
            }
            const data = await res.json();
            setProfile(data.profile);
            setStats(data.stats ?? { post_count: 0, fan_count: 0 });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Could not load profile';
            setToast({ message: msg, type: 'error' });
        }
    }, []);

    const fetchPackages = useCallback(async () => {
        try {
            const res = await fetch('/api/creator-packages');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Failed to fetch packages (${res.status})`);
            }
            const data = await res.json();
            setPackages(data.packages ?? []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Could not load packages';
            setToast({ message: msg, type: 'error' });
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchProfile(), fetchPackages()]).finally(() => setLoading(false));
    }, [fetchProfile, fetchPackages]);

    // ─── Profile Edit ───
    const handleOpenEditProfile = () => {
        if (!profile) return;
        setEditForm({
            display_name: profile.display_name || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || '',
            banner_url: profile.banner_url || '',
            category: profile.category || '',
            social_links: profile.social_links || {},
        });
        setShowEditProfile(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');
            setToast({ message: 'Profile updated!', type: 'success' });
            setShowEditProfile(false);
            fetchProfile();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update profile';
            setToast({ message: msg, type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    // ─── Package CRUD ───
    const handleOpenCreatePkg = () => {
        setEditingPkg(null);
        setPkgForm({ name: '', token_price: 50, post_limit: 10, description: '', badge_name: '' });
        setShowPkgModal(true);
    };

    const handleOpenEditPkg = (pkg: CreatorPackage) => {
        setEditingPkg(pkg);
        setPkgForm({
            name: pkg.name,
            token_price: pkg.token_price,
            post_limit: pkg.post_limit,
            description: pkg.description || '',
            badge_name: pkg.badge_name || '',
        });
        setShowPkgModal(true);
    };

    const handleSavePkg = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPkg(true);
        try {
            const url = '/api/creator-packages';
            const method = editingPkg ? 'PUT' : 'POST';
            const body = editingPkg ? { id: editingPkg.id, ...pkgForm } : pkgForm;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save package');
            setToast({ message: `Package ${editingPkg ? 'updated' : 'created'}!`, type: 'success' });
            setShowPkgModal(false);
            fetchPackages();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save package';
            setToast({ message: msg, type: 'error' });
        } finally {
            setSavingPkg(false);
        }
    };

    const handleDeletePkg = async (id: string) => {
        if (!confirm('Delete this package?')) return;
        const res = await fetch(`/api/creator-packages?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            setToast({ message: 'Package deleted', type: 'success' });
            fetchPackages();
        } else {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    if (loading) return <PageLoader />;
    if (!profile) return null;

    return (
        <div className="animate-fade-in max-w-[935px] mx-auto pb-12 mt-8">

            {/* ═══════════════ PROFILE HEADER ═══════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10 px-4 sm:px-0 mt-6 mb-10">

                {/* Avatar */}
                <div className="flex justify-center sm:justify-start shrink-0">
                    <div className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        {profile.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt={profile.display_name} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-4xl sm:text-5xl font-bold text-gray-400">{getInitials(profile.display_name)}</span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-3">

                    {/* Row 1: Username */}
                    <h1 className="text-xl font-light tracking-tight leading-none" style={{ color: 'var(--dash-text-primary, #0F172A)' }}>
                        {profile.username || profile.display_name}
                    </h1>

                    {/* Row 2: Display name + category */}
                    <div className="font-semibold text-[14px] flex items-center gap-2 flex-wrap" style={{ color: 'var(--dash-text-primary, #0F172A)' }}>
                        {profile.display_name}
                        {profile.category && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium border" style={{ background: 'var(--dash-card, #f1f5f9)', color: 'var(--dash-text-secondary, #64748B)', borderColor: 'var(--dash-border, #E2E8F0)' }}>
                                {profile.category}
                            </span>
                        )}
                    </div>

                    {/* Row 3: Stats */}
                    <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--dash-text-secondary, #64748B)' }}>
                        <span><span className="font-semibold" style={{ color: 'var(--dash-text-primary, #0F172A)' }}>{stats.post_count}</span> posts</span>
                        <span><span className="font-semibold" style={{ color: 'var(--dash-text-primary, #0F172A)' }}>{stats.fan_count}</span> followers</span>
                        <span><span className="font-semibold" style={{ color: 'var(--dash-text-primary, #0F172A)' }}>{packages.length}</span> following</span>
                    </div>

                    {/* Row 4: Bio */}
                    {profile.bio && (
                        <div className="whitespace-pre-wrap text-[14px] leading-snug" style={{ color: 'var(--dash-text-secondary, #64748B)' }}>
                            {profile.bio}
                        </div>
                    )}

                    {/* Row 5: Social links */}
                    {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                        <div className="flex flex-col gap-0.5">
                            {Object.entries(profile.social_links).map(([key, url]) => {
                                if (!url) return null;
                                return (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                        className="text-[#00376b] dark:text-[#8ac7ff] font-semibold flex items-center gap-1.5 hover:underline text-[13px] truncate max-w-xs">
                                        <Link2 className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 6: Wide action buttons at the bottom — matching Instagram layout */}
                    <div className="flex items-center gap-3 mt-1">
                        <Button
                            variant="dark"
                            size="md"
                            onClick={handleOpenEditProfile}
                            className="flex-1 rounded-lg justify-center py-2"
                        >
                            Edit profile
                        </Button>
                        <Button
                            variant="dark"
                            size="md"
                            className="flex-1 rounded-lg justify-center py-2"
                        >
                            View archive
                        </Button>
                        <button className="shrink-0 p-[7px] hover:bg-gray-100 dark:hover:bg-[#363636] rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            </div>

            {/* ═══════════════ HIGHLIGHTS (Packages as Stories) ═══════════════ */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 pb-2">
                <div className="flex items-start gap-6 overflow-x-auto hide-scrollbar px-4 sm:px-0 pb-2">
                    {packages.map((pkg, i) => (
                        <div key={pkg.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={() => handleOpenEditPkg(pkg)}>
                            <div className="w-16 h-16 sm:w-[77px] sm:h-[77px] rounded-full p-[2px] bg-gradient-to-tr from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 group-hover:from-gray-400 dark:group-hover:from-gray-500 transition-all">
                                <div className="w-full h-full rounded-full bg-white dark:bg-[#1a1a2e] flex items-center justify-center p-[2px]">
                                    <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500 dark:text-gray-400 stroke-[1.5]" />
                                    </div>
                                </div>
                            </div>
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate w-16 sm:w-[74px] text-center">
                                {pkg.badge_name || pkg.name}
                            </span>
                        </div>
                    ))}
                    {packages.length < 3 && (
                        <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={handleOpenCreatePkg}>
                            <div className="w-16 h-16 sm:w-[77px] sm:h-[77px] rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500 flex items-center justify-center transition-colors">
                                <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400 dark:text-gray-500" />
                            </div>
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">New</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════ TABS ═══════════════ */}
            <div className="border-t border-gray-200 dark:border-gray-700 flex justify-center gap-12 text-[12px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <button className="flex items-center gap-1.5 h-[48px] border-t-2 border-gray-800 dark:border-white text-gray-900 dark:text-white -mt-[2px] px-2">
                    <Grid className="w-3 h-3" /> PACKAGES
                </button>
                <button className="flex items-center gap-1.5 h-[48px] hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2">
                    <Film className="w-3 h-3" /> REELS
                </button>
                <button className="hidden sm:flex items-center gap-1.5 h-[48px] hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2">
                    <Bookmark className="w-3 h-3" /> SAVED
                </button>
                <button className="hidden sm:flex items-center gap-1.5 h-[48px] hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2">
                    <User className="w-3 h-3" /> TAGGED
                </button>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4 mt-1">
                {packages.map((pkg, i) => (
                    <div key={pkg.id} className="group relative aspect-square bg-gray-100 dark:bg-gray-800/50 overflow-hidden cursor-pointer" onClick={() => handleOpenEditPkg(pkg)}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 md:p-6 text-center">
                            <Package className="w-8 h-8 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mb-1 md:mb-3" />
                            <h3 className="text-xs md:text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{pkg.name}</h3>
                            <div className="hidden md:flex text-gray-500 dark:text-gray-400 font-semibold mt-1 items-center gap-1">
                                {formatTokens(pkg.token_price)} tokens
                            </div>
                        </div>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 md:gap-4 text-white font-bold">
                            <div className="flex items-center gap-1 md:gap-2">
                                <FileText className="w-4 h-4 md:w-6 md:h-6 fill-white text-white" />
                                <span className="text-sm md:text-lg">{pkg.post_limit} Posts</span>
                            </div>
                            <div className="flex gap-2 md:gap-4 mt-1 md:mt-2">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditPkg(pkg); }} className="p-1.5 md:p-2.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors backdrop-blur-sm">
                                    <Edit className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePkg(pkg.id); }} className="p-1.5 md:p-2.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm">
                                    <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>


            {/* ═══════════════ EDIT PROFILE MODAL ═══════════════ */}
            {showEditProfile && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl ring-1 ring-gray-900/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Edit Profile</h2>
                            <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            {/* Images Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Profile Image URL</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                            {editForm.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={editForm.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                                            ) : (
                                                <Camera className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={editForm.avatar_url}
                                            onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                                            placeholder="https://..."
                                            className="input flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Banner Image URL</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                            {editForm.banner_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={editForm.banner_url} alt="Banner" className="object-cover w-full h-full" />
                                            ) : (
                                                <Camera className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={editForm.banner_url}
                                            onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                                            placeholder="https://..."
                                            className="input flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Display Name</label>
                                    <input
                                        type="text"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                        className="input"
                                        maxLength={100}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">Select category...</option>
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">
                                    Bio <span className="text-gray-400 font-normal">({editForm.bio.length}/250)</span>
                                </label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 250) })}
                                    placeholder="Tell fans about yourself..."
                                    className="textarea min-h-[100px]"
                                    maxLength={250}
                                />
                            </div>

                            {/* Social Links */}
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-gray-900">Social Links <span className="text-gray-400 font-normal">(optional)</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['twitter', 'instagram', 'youtube', 'website'].map(key => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase w-20 shrink-0">{key}</span>
                                            <input
                                                type="url"
                                                value={editForm.social_links[key] || ''}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    social_links: { ...editForm.social_links, [key]: e.target.value }
                                                })}
                                                placeholder={`https://${key}.com/...`}
                                                className="input flex-1 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Profile Preview */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 overflow-hidden shrink-0">
                                        {editForm.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={editForm.avatar_url} alt="" className="object-cover w-full h-full" />
                                        ) : (
                                            getInitials(editForm.display_name || 'C')
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 tracking-tight">{editForm.display_name || 'Your Name'}</div>
                                        {editForm.category && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{editForm.category}</span>}
                                        {editForm.bio && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{editForm.bio}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowEditProfile(false)} className="btn-secondary w-full">Cancel</button>
                                <button type="submit" disabled={savingProfile} className="btn-primary w-full">
                                    {savingProfile ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </span>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════ PACKAGE MODAL ═══════════════ */}
            {showPkgModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-lg shadow-xl ring-1 ring-gray-900/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{editingPkg ? 'Edit Package' : 'Create Package'}</h2>
                            <button onClick={() => setShowPkgModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePkg} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Package Name</label>
                                <input
                                    type="text"
                                    value={pkgForm.name}
                                    onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                                    placeholder="e.g., Basic Supporter, VIP Fan..."
                                    className="input"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Token Price</label>
                                    <input
                                        type="number"
                                        value={pkgForm.token_price}
                                        onChange={(e) => setPkgForm({ ...pkgForm, token_price: Number(e.target.value) })}
                                        min={1}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Post Limit</label>
                                    <input
                                        type="number"
                                        value={pkgForm.post_limit}
                                        onChange={(e) => setPkgForm({ ...pkgForm, post_limit: Number(e.target.value) })}
                                        min={1}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Benefits Description</label>
                                <textarea
                                    value={pkgForm.description}
                                    onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                                    placeholder="Describe what fans get with this package..."
                                    className="textarea min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">
                                    Badge Name <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={pkgForm.badge_name}
                                    onChange={(e) => setPkgForm({ ...pkgForm, badge_name: e.target.value })}
                                    placeholder="e.g., Supporter, VIP, Legend..."
                                    className="input"
                                    maxLength={50}
                                />
                            </div>

                            {/* Package Preview */}
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-gray-900 tracking-tight">{pkgForm.name || 'Package Name'}</div>
                                        <div className="text-sm text-gray-500 mt-1">Access to {pkgForm.post_limit} premium posts</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-gray-900 tracking-tight">{formatTokens(pkgForm.token_price)}</div>
                                        <div className="text-xs text-gray-500">tokens</div>
                                    </div>
                                </div>
                                {pkgForm.description && (
                                    <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200 line-clamp-2">{pkgForm.description}</p>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowPkgModal(false)} className="btn-secondary w-full">Cancel</button>
                                <button type="submit" disabled={savingPkg} className="btn-primary w-full">
                                    {savingPkg ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {editingPkg ? 'Saving...' : 'Creating...'}
                                        </span>
                                    ) : (editingPkg ? 'Save Changes' : 'Create Package')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
