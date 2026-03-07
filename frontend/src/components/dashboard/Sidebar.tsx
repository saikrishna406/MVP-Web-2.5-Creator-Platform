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
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star, Trophy, User
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
    const supabase = createClient();

    const navItems = profile.role === 'creator' ? NAV_ITEMS_CREATOR : NAV_ITEMS_FAN;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-r border-black/5 dark:border-white/5">
            {/* Logo */}
            <div className="p-6 flex items-center justify-between">
                <Link href={`/${profile.role}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        <Zap className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-black dark:text-white">Rapid MVP</span>
                </Link>
                {/* Mobile Close Button inside sidebar */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">

                {/* User info */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 border-2 border-white dark:border-[#1A1A1A]">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                getInitials(profile.display_name)
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate text-black dark:text-white">{profile.display_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{profile.username}</div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${profile.role === 'creator'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                            }`}>
                            {profile.role === 'creator' ? 'Creator' : 'Fan'}
                        </span>
                    </div>
                </div>

                {/* Wallet summary */}
                {wallet && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mb-2">
                                <Coins className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="text-base font-bold text-black dark:text-white leading-none mb-1">{formatTokens(wallet.token_balance)}</div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Tokens</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-2">
                                <Star className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-base font-bold text-black dark:text-white leading-none mb-1">{formatPoints(wallet.points_balance)}</div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Points</div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="space-y-1">
                    <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Menu</div>
                    {navItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Logout */}
            <div className="p-4 mt-auto border-t border-black/5 dark:border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 shadow-sm text-black dark:text-white"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-[280px] z-50 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
