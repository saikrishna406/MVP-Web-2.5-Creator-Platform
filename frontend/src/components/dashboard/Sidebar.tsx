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
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star, Trophy, User,
    Search, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Newspaper, Wallet: WalletIcon, ShoppingBag,
    FileText, BarChart3, Trophy, User
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
                        </div>
                    </div>
                </div>
            )}

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
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="sidebar-mobile-trigger"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="sidebar-mobile-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar-aside ${sidebarWidth} ${mobileOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'}`}
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
