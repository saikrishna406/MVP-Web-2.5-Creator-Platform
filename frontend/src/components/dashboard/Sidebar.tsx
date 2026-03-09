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
    FileText, BarChart3, Zap, LogOut, Menu, X, Coins, Star,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Newspaper, Wallet: WalletIcon, ShoppingBag,
    FileText, BarChart3,
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
        <>
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <Link href={`/${profile.role}`} className="flex items-center gap-3">
                    <img
                        src="/images/logo-1.jpeg"
                        alt="Black Bolts Provisions Logo"
                        className="w-10 h-10 rounded-full object-cover shadow-[0_0_10px_rgba(255,140,0,0.3)]"
                    />
                    <span className="text-lg font-bold gradient-text">Black Bolts Provisions</span>
                </Link>
            </div>

            {/* User info */}
            <div className="p-4 m-4 rounded-xl bg-background/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            getInitials(profile.display_name)
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{profile.display_name}</div>
                        <div className="text-xs text-foreground-muted">@{profile.username}</div>
                    </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${profile.role === 'creator' ? 'bg-accent/20 text-accent-light' : 'bg-primary/20 text-primary-light'
                    }`}>
                    {profile.role === 'creator' ? '✨ Creator' : '❤️ Fan'}
                </div>
            </div>

            {/* Wallet summary */}
            {wallet && (
                <div className="px-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-background/50 text-center">
                            <Coins className="w-4 h-4 text-accent mx-auto mb-1" />
                            <div className="text-sm font-bold">{formatTokens(wallet.token_balance)}</div>
                            <div className="text-[10px] text-foreground-muted">Tokens</div>
                        </div>
                        <div className="p-3 rounded-xl bg-background/50 text-center">
                            <Star className="w-4 h-4 text-secondary mx-auto mb-1" />
                            <div className="text-sm font-bold">{formatPoints(wallet.points_balance)}</div>
                            <div className="text-[10px] text-foreground-muted">Points</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="px-3 flex-1">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary/15 text-primary-light border border-primary/20'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-background/50'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-error hover:bg-error/10 transition-all w-full"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-background-card border border-border"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-background-card border-r border-border flex flex-col z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
