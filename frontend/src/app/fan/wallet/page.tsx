'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coins, Star, CreditCard, ArrowUpRight, ArrowDownRight, Sparkles, Check } from 'lucide-react';
import { formatTokens, formatPoints, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';

interface WalletData {
    wallet: { token_balance: number; points_balance: number };
    tokenTransactions: Array<{
        id: string; amount: number; type: string; description: string; created_at: string;
    }>;
    pointTransactions: Array<{
        id: string; amount: number; type: string; action: string; description: string; created_at: string;
    }>;
    packages: Array<{
        id: string; name: string; description: string; token_amount: number; price_cents: number;
    }>;
}

const packageBadges: Record<string, string | null> = {
    Starter: null,
    Popular: 'Most Popular',
    Pro: 'Best Value',
    Whale: '🐋 Whale',
};

export default function WalletPage() {
    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [activeTab, setActiveTab] = useState<'tokens' | 'points'>('tokens');

    const fetchWallet = useCallback(async () => {
        const res = await fetch('/api/wallet');
        if (res.ok) {
            const walletData = await res.json();
            setData(walletData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchWallet();
        // Check for success/cancelled params
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            const tokens = params.get('tokens');
            setToast({ message: `🎉 Successfully purchased ${tokens} tokens!`, type: 'success' });
            window.history.replaceState({}, '', '/fan/wallet');
            // Refresh data
            setTimeout(fetchWallet, 1000);
        } else if (params.get('cancelled') === 'true') {
            setToast({ message: 'Purchase cancelled', type: 'info' });
            window.history.replaceState({}, '', '/fan/wallet');
        }
    }, [fetchWallet]);

    const handlePurchase = async (packageId: string) => {
        setPurchasing(packageId);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId }),
            });

            const result = await res.json();
            if (result.url) {
                window.location.href = result.url;
            } else {
                setToast({ message: result.error || 'Failed to create checkout', type: 'error' });
            }
        } catch {
            setToast({ message: 'Failed to process purchase', type: 'error' });
        }
        setPurchasing(null);
    };

    if (loading) return <PageLoader />;
    if (!data) return <div className="text-center text-foreground-muted py-10">Failed to load wallet</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Your Wallet</h1>
                <p className="text-foreground-muted">Manage your tokens and points</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-gradient-to-br from-accent/15 to-transparent border-accent/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-accent/20">
                            <Coins className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <div className="text-sm text-foreground-muted">Creator Tokens</div>
                            <div className="text-3xl font-bold">{formatTokens(data.wallet.token_balance)}</div>
                        </div>
                    </div>
                    <div className="text-xs text-foreground-muted flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Use tokens to unlock exclusive content
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-secondary/15 to-transparent border-secondary/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-secondary/20">
                            <Star className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <div className="text-sm text-foreground-muted">Points Balance</div>
                            <div className="text-3xl font-bold">{formatPoints(data.wallet.points_balance)}</div>
                        </div>
                    </div>
                    <div className="text-xs text-foreground-muted flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Earn points through engagement, redeem in store
                    </div>
                </div>
            </div>

            {/* Token Packages */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-light" /> Buy Tokens
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.packages.map((pkg) => {
                        const badge = packageBadges[pkg.name];
                        const isPopular = pkg.name === 'Popular';
                        return (
                            <div
                                key={pkg.id}
                                className={`card relative overflow-hidden transition-all hover:scale-[1.02] ${isPopular ? 'border-primary/50 shadow-lg shadow-primary/10' : ''
                                    }`}
                            >
                                {badge && (
                                    <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${isPopular ? 'bg-primary text-white' : 'bg-accent/20 text-accent-light'
                                        }`}>
                                        {badge}
                                    </div>
                                )}
                                <div className="text-lg font-bold mb-1">{pkg.name}</div>
                                <div className="text-sm text-foreground-muted mb-4">{pkg.description}</div>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-bold gradient-text">{formatTokens(pkg.token_amount)}</span>
                                    <span className="text-foreground-muted text-sm">tokens</span>
                                </div>
                                <div className="text-lg font-semibold mb-4">{formatCurrency(pkg.price_cents)}</div>
                                <div className="text-xs text-foreground-muted mb-4">
                                    {formatCurrency(Math.round(pkg.price_cents / pkg.token_amount * 100) / 100)} per token
                                </div>
                                <button
                                    onClick={() => handlePurchase(pkg.id)}
                                    disabled={purchasing === pkg.id}
                                    className={`w-full ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {purchasing === pkg.id ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        'Purchase'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tokens' ? 'bg-accent/20 text-accent-light' : 'text-foreground-muted hover:text-foreground'
                            }`}
                    >
                        Token History
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'points' ? 'bg-secondary/20 text-secondary-light' : 'text-foreground-muted hover:text-foreground'
                            }`}
                    >
                        Points History
                    </button>
                </div>

                <div className="card">
                    {activeTab === 'tokens' ? (
                        data.tokenTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {data.tokenTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-success/15' : 'bg-error/15'}`}>
                                                {tx.amount > 0 ? (
                                                    <ArrowDownRight className="w-4 h-4 text-success" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4 text-error" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{tx.description}</div>
                                                <div className="text-xs text-foreground-muted">{formatRelativeTime(tx.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatTokens(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-foreground-muted py-8">No token transactions yet. Purchase tokens to get started!</p>
                        )
                    ) : (
                        data.pointTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {data.pointTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-success/15' : 'bg-error/15'}`}>
                                                {tx.amount > 0 ? (
                                                    <ArrowDownRight className="w-4 h-4 text-success" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4 text-error" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{tx.description}</div>
                                                <div className="text-xs text-foreground-muted">{formatRelativeTime(tx.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatPoints(tx.amount)} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-foreground-muted py-8">Engage with content to earn points!</p>
                        )
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
