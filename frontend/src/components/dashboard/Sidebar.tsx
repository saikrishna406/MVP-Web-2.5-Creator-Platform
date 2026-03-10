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
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star, User,
} from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Newspaper, Wallet: WalletIcon, ShoppingBag,
    FileText, BarChart3, User,
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
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="p-6">
                <Link href={`/${profile.role}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">Rapid MVP</span>
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
                        </div>
                    </div>
                </div>
            )}

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
            </div>
        </div>
    );

    return (
        <>
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

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                    }`}
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
