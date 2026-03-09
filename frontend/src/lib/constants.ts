import { PointAction } from '@/types';

export const SITE_NAME = 'Black Bolts Provisions';
export const SITE_DESCRIPTION = 'A Web 2.5 creator monetization platform with token economics';

export const POINT_ACTIONS: Record<string, PointAction> = {
    daily_login: {
        action: 'daily_login',
        points: 10,
        daily_limit: 1,
        description: 'Daily login bonus',
    },
    like_post: {
        action: 'like_post',
        points: 2,
        daily_limit: 20,
        description: 'Like a post',
    },
    comment_post: {
        action: 'comment_post',
        points: 5,
        daily_limit: 10,
        description: 'Comment on a post',
    },
    share_post: {
        action: 'share_post',
        points: 3,
        daily_limit: 5,
        description: 'Share a post',
    },
};

export const TOKEN_PACKAGES = [
    {
        name: 'Starter',
        description: 'Perfect for trying out the platform',
        token_amount: 100,
        price_cents: 499,
        badge: null,
    },
    {
        name: 'Popular',
        description: 'Most popular choice for fans',
        token_amount: 500,
        price_cents: 1999,
        badge: 'Most Popular',
    },
    {
        name: 'Pro',
        description: 'Best value for dedicated supporters',
        token_amount: 1200,
        price_cents: 3999,
        badge: 'Best Value',
    },
    {
        name: 'Whale',
        description: 'Maximum tokens for power users',
        token_amount: 5000,
        price_cents: 14999,
        badge: '🐋 Whale',
    },
];

export const DAILY_POINTS_CAP = 100;

export const NAV_ITEMS_FAN = [
    { href: '/fan', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/fan/feed', label: 'Feed', icon: 'Newspaper' },
    { href: '/fan/wallet', label: 'Wallet', icon: 'Wallet' },
    { href: '/fan/store', label: 'Store', icon: 'ShoppingBag' },
];

export const NAV_ITEMS_CREATOR = [
    { href: '/creator', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/creator/posts', label: 'Posts', icon: 'FileText' },
    { href: '/creator/store', label: 'Store', icon: 'ShoppingBag' },
    { href: '/creator/analytics', label: 'Analytics', icon: 'BarChart3' },
];
