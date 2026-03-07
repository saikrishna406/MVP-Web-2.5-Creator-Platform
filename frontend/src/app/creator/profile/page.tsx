'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    User, Camera, MapPin, Link2, Edit, Plus, Trash2, X,
    FileText, Users, Coins, Crown, Shield, Award, ExternalLink,
    Twitter, Instagram, Youtube, Globe, Package,
} from 'lucide-react';
import { formatTokens, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
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
        const res = await fetch('/api/profile');
        if (res.ok) {
            const data = await res.json();
            setProfile(data.profile);
            setStats(data.stats);
        }
    }, []);

    const fetchPackages = useCallback(async () => {
        const res = await fetch('/api/creator-packages');
        if (res.ok) {
            const data = await res.json();
            setPackages(data.packages);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchPackages()]).then(() => setLoading(false));
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

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });

        if (res.ok) {
            setToast({ message: 'Profile updated!', type: 'success' });
            setShowEditProfile(false);
            fetchProfile();
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to update', type: 'error' });
        }
        setSavingProfile(false);
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

        const url = '/api/creator-packages';
        const method = editingPkg ? 'PUT' : 'POST';
        const body = editingPkg ? { id: editingPkg.id, ...pkgForm } : pkgForm;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setToast({ message: `Package ${editingPkg ? 'updated' : 'created'}!`, type: 'success' });
            setShowPkgModal(false);
            fetchPackages();
        } else {
            const data = await res.json();
            setToast({ message: data.error || 'Failed to save package', type: 'error' });
        }
        setSavingPkg(false);
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
        <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">

            {/* ═══════════════ PROFILE HEADER ═══════════════ */}
            <div className="card p-0 overflow-hidden">
                {/* Banner */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {profile.banner_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.banner_url} alt="Banner" className="object-cover w-full h-full" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8 -mt-12 relative">
                    <div className="flex items-end gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-gray-900 overflow-hidden shrink-0">
                            {profile.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt={profile.display_name} className="object-cover w-full h-full" />
                            ) : (
                                <span className="bg-gray-100 w-full h-full flex items-center justify-center">{getInitials(profile.display_name)}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pt-14">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.display_name}</h1>
                                {profile.category && (
                                    <span className="badge text-xs">{profile.category}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
                        </div>

                        <button onClick={handleOpenEditProfile} className="btn-secondary shrink-0">
                            <Edit className="w-4 h-4" /> Edit Profile
                        </button>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="text-gray-600 mt-6 leading-relaxed max-w-2xl">{profile.bio}</p>
                    )}

                    {/* Social Links */}
                    {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                            {Object.entries(profile.social_links).map(([key, url]) => {
                                if (!url) return null;
                                const iconMap: Record<string, React.ReactNode> = {
                                    twitter: <Twitter className="w-4 h-4" />,
                                    instagram: <Instagram className="w-4 h-4" />,
                                    youtube: <Youtube className="w-4 h-4" />,
                                    website: <Globe className="w-4 h-4" />,
                                };
                                return (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-gray-300">
                                        {iconMap[key] || <Link2 className="w-4 h-4" />}
                                        <span className="capitalize">{key}</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{stats.post_count}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Posts</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{stats.fan_count}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Fans</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{packages.length}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Packages</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ MONETIZATION PACKAGES ═══════════════ */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Monetization Packages</h2>
                        <p className="text-sm text-gray-500 mt-1">Define up to 3 packages your fans can subscribe to</p>
                    </div>
                    <button
                        onClick={handleOpenCreatePkg}
                        disabled={packages.length >= 3}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" /> Add Package
                    </button>
                </div>

                {packages.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center py-16 text-center">
                        <Package className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">Create monetization packages so fans can unlock premium content at different tiers.</p>
                        <button onClick={handleOpenCreatePkg} className="btn-primary">
                            <Plus className="w-4 h-4" /> Create First Package
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((pkg, i) => (
                            <div key={pkg.id} className="card p-0 flex flex-col overflow-hidden group hover:border-gray-400 transition-all">
                                {/* Package Header */}
                                <div className={`px-6 pt-6 pb-4 ${i === 0 ? 'bg-gray-50' : i === 1 ? 'bg-gray-50' : 'bg-gray-900 text-white'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        {pkg.badge_name ? (
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${i === 2 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                                }`}>{pkg.badge_name}</span>
                                        ) : (
                                            <span className={`text-xs font-bold uppercase tracking-wider ${i === 2 ? 'text-gray-400' : 'text-gray-500'
                                                }`}>Tier {i + 1}</span>
                                        )}
                                        {/* Edit/Delete Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEditPkg(pkg)}
                                                className={`p-1.5 rounded-lg transition-colors ${i === 2 ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'}`}>
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeletePkg(pkg.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${i === 2 ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className={`text-lg font-bold tracking-tight ${i === 2 ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className={`text-3xl font-bold tracking-tight ${i === 2 ? 'text-white' : 'text-gray-900'}`}>{formatTokens(pkg.token_price)}</span>
                                        <span className={`text-sm font-medium ${i === 2 ? 'text-gray-400' : 'text-gray-500'}`}>tokens</span>
                                    </div>
                                </div>

                                {/* Package Body */}
                                <div className="px-6 py-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span>Access to <strong>{pkg.post_limit}</strong> premium posts</span>
                                    </div>
                                    {pkg.description && (
                                        <p className="text-sm text-gray-500 leading-relaxed mb-4">{pkg.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {packages.length >= 3 && (
                    <p className="text-center text-sm text-gray-400 mt-4">
                        Maximum 3 packages reached. Delete one to create a new package.
                    </p>
                )}
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
