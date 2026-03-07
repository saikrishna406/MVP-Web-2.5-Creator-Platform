'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NAV_ITEMS_FAN, NAV_ITEMS_CREATOR } from '@/lib/constants';
import { Profile, Wallet } from '@/types';
import { formatTokens, formatPoints, getInitials } from '@/lib/utils';
import {
    LayoutDashboard, Newspaper, Wallet as WalletIcon, ShoppingBag,
<<<<<<< HEAD
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star, Trophy, User,
    Search, ChevronLeft, ChevronRight, Settings
=======
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star, User,
>>>>>>> hasif_branch
} from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Newspaper, Wallet: WalletIcon, ShoppingBag,
<<<<<<< HEAD
    FileText, BarChart3, Trophy, User
=======
    FileText, BarChart3, User,
>>>>>>> hasif_branch
};

interface SidebarProps {
    profile: Profile;
    wallet: Wallet | null;
}

export default function Sidebar({ profile, wallet }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    const navItems = profile.role === 'creator' ? NAV_ITEMS_CREATOR : NAV_ITEMS_FAN;

    const filteredNavItems = searchQuery
        ? navItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : navItems;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Emit custom event for layout to listen to
    useEffect(() => {
        const event = new CustomEvent('sidebar-toggle', { detail: { collapsed } });
        window.dispatchEvent(event);
    }, [collapsed]);

    const sidebarWidth = collapsed ? 'w-[76px]' : 'w-[260px]';

    const sidebarContent = (
<<<<<<< HEAD
        <div className="sidebar-container flex flex-col h-full" data-collapsed={collapsed}>
            {/* Header: Logo + Collapse Toggle */}
            <div className="sidebar-header">
                <Link href={`/${profile.role}`} className="sidebar-logo-link">
                    <div className="sidebar-logo-mark">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="sidebar-logo-text">Rapid MVP</span>
                    )}
=======
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="p-6">
                <Link href={`/${profile.role}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">Rapid MVP</span>
>>>>>>> hasif_branch
                </Link>
                {/* Desktop collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="sidebar-collapse-btn hidden lg:flex"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                {/* Mobile close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="sidebar-collapse-btn lg:hidden"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

<<<<<<< HEAD
            {/* Search */}
            {!collapsed && (
                <div className="sidebar-search-wrapper">
                    <div className="sidebar-search">
                        <Search className="sidebar-search-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sidebar-search-input"
                        />
                    </div>
                </div>
            )}
            {collapsed && (
                <div className="sidebar-search-wrapper sidebar-search-collapsed">
                    <button className="sidebar-icon-btn" title="Search">
                        <Search className="w-[18px] h-[18px]" />
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {filteredNavItems.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutDashboard;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <div className="sidebar-nav-icon-wrapper">
                                <Icon className="sidebar-nav-icon" />
                            </div>
                            {!collapsed && (
                                <span className="sidebar-nav-label">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Wallet Summary (only when expanded) */}
            {wallet && !collapsed && (
                <div className="sidebar-wallet-section">
                    <div className="sidebar-wallet-card">
                        <div className="sidebar-wallet-item">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <div className="sidebar-wallet-info">
                                <span className="sidebar-wallet-value">{formatTokens(wallet.token_balance)}</span>
                                <span className="sidebar-wallet-label">Tokens</span>
                            </div>
                        </div>
                        <div className="sidebar-wallet-divider" />
                        <div className="sidebar-wallet-item">
                            <Star className="w-4 h-4 text-blue-500" />
                            <div className="sidebar-wallet-info">
                                <span className="sidebar-wallet-value">{formatPoints(wallet.points_balance)}</span>
                                <span className="sidebar-wallet-label">Points</span>
                            </div>
=======
            {/* Navigation */}
            <nav className="px-4 flex-1 py-4">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Wallet summary */}
            {wallet && (
                <div className="px-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
                            <Coins className="w-4 h-4 text-gray-900 mx-auto mb-1" />
                            <div className="text-sm font-semibold text-gray-900">{formatTokens(wallet.token_balance)}</div>
                            <div className="text-[10px] uppercase tracking-wider font-medium text-gray-500">Tokens</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
                            <Star className="w-4 h-4 text-gray-900 mx-auto mb-1" />
                            <div className="text-sm font-semibold text-gray-900">{formatPoints(wallet.points_balance)}</div>
                            <div className="text-[10px] uppercase tracking-wider font-medium text-gray-500">Points</div>
>>>>>>> hasif_branch
                        </div>
                    </div>
                </div>
            )}

<<<<<<< HEAD
            {/* Settings Link */}
            <div className="sidebar-bottom-actions">
                <button
                    className={`sidebar-nav-item`}
                    title={collapsed ? 'Settings' : undefined}
                >
                    <div className="sidebar-nav-icon-wrapper">
                        <Settings className="sidebar-nav-icon" />
                    </div>
                    {!collapsed && (
                        <span className="sidebar-nav-label">Settings</span>
                    )}
                </button>
            </div>

            {/* User Profile at Bottom */}
            <div className="sidebar-user-section">
                <div className="sidebar-user-info">
                    <div className="sidebar-user-avatar">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            getInitials(profile.display_name)
                        )}
                    </div>
                    {!collapsed && (
                        <div className="sidebar-user-details">
                            <span className="sidebar-user-name">{profile.display_name}</span>
                            <span className="sidebar-user-email">@{profile.username}</span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={handleLogout}
                        className="sidebar-logout-btn"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
=======
            {/* User info & Logout */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 font-semibold text-xs border border-gray-200 overflow-hidden">
                            {profile.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(profile.display_name)
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate tracking-tight">{profile.display_name}</div>
                            <div className="text-xs text-gray-500">@{profile.username}</div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
>>>>>>> hasif_branch
            </div>
        </div>
    );

    return (
        <>
<<<<<<< HEAD
            {/* Mobile toggle */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="sidebar-mobile-trigger"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}
=======
            {/* Mobile toggle bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div className="ml-2 font-bold tracking-tight text-gray-900">Rapid MVP</div>
            </div>
>>>>>>> hasif_branch

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
<<<<<<< HEAD
                    className="sidebar-mobile-overlay"
=======
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
>>>>>>> hasif_branch
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
<<<<<<< HEAD
                className={`sidebar-aside ${sidebarWidth} ${mobileOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'}`}
=======
                className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                    }`}
>>>>>>> hasif_branch
            >
                {sidebarContent}
            </aside>

            {/* Spacer div to push main content — only on desktop */}
            <div
                className={`sidebar-spacer ${collapsed ? 'w-[76px]' : 'w-[260px]'}`}
            />
        </>
    );
}
