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
    Whale: 'Premium',
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
            setToast({ message: `Successfully purchased ${tokens} tokens!`, type: 'success' });
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
    if (!data) return <div className="text-center text-gray-500 py-10">Failed to load wallet</div>;

    return (
        <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wallet</h1>
                <p className="text-gray-500">Manage your tokens and points</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-white border border-gray-200 shadow-sm">
                            <Coins className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Creator Tokens</div>
                            <div className="text-4xl font-bold tracking-tight text-gray-900">{formatTokens(data.wallet.token_balance)}</div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Use tokens to unlock exclusive content
                    </div>
                </div>

                <div className="card bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-white border border-gray-200 shadow-sm">
                            <Star className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Points Balance</div>
                            <div className="text-4xl font-bold tracking-tight text-gray-900">{formatPoints(data.wallet.points_balance)}</div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Earn points via engagement, redeem in store
                    </div>
                </div>
            </div>

            {/* Token Packages */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-900" /> Buy Tokens
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {data.packages.map((pkg) => {
                        const badge = packageBadges[pkg.name];
                        const isPopular = pkg.name === 'Popular';
                        return (
                            <div
                                key={pkg.id}
                                className={`card relative flex flex-col justify-between transition-all hover:scale-[1.02] ${isPopular ? 'border-gray-900 shadow-lg ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                <div>
                                    {badge && (
                                        <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${isPopular ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}>
                                            {badge}
                                        </div>
                                    )}
                                    <div className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{pkg.name}</div>
                                    <div className="text-sm text-gray-500 mb-6 min-h-[40px]">{pkg.description}</div>
                                    <div className="flex items-baseline gap-1.5 mb-2">
                                        <span className="text-4xl font-bold text-gray-900 tracking-tight">{formatTokens(pkg.token_amount)}</span>
                                    </div>
                                    <div className="text-lg font-medium text-gray-900 mb-6">{formatCurrency(pkg.price_cents)}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-400 mb-6 border-t border-gray-100 pt-4">
                                        {formatCurrency(Math.round((pkg.price_cents / pkg.token_amount) * 100) / 100)} per token
                                    </div>
                                    <button
                                        onClick={() => handlePurchase(pkg.id)}
                                        disabled={purchasing === pkg.id}
                                        className={`w-full ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        {purchasing === pkg.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isPopular ? 'border-white/30 border-t-white' : 'border-gray-900/30 border-t-gray-900'}`} />
                                                Processing
                                            </span>
                                        ) : (
                                            'Purchase'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History */}
            <div>
                <div className="flex items-center gap-3 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tokens' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Token History
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'points' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Points History
                    </button>
                </div>

                <div className="card p-0 overflow-hidden border-gray-200">
                    {activeTab === 'tokens' ? (
                        data.tokenTransactions.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {data.tokenTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-full ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {tx.amount > 0 ? (
                                                    <ArrowDownRight className="w-5 h-5" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{tx.description}</div>
                                                <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(tx.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className={`text-base font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatTokens(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12 bg-gray-50">No token transactions yet. Purchase tokens to get started!</div>
                        )
                    ) : (
                        data.pointTransactions.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {data.pointTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-full ${tx.amount > 0 ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                                                {tx.amount > 0 ? (
                                                    <Star className="w-5 h-5" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{tx.description}</div>
                                                <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(tx.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className={`text-base font-bold text-gray-900`}>
                                            {tx.amount > 0 ? '+' : ''}{formatPoints(tx.amount)} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12 bg-gray-50">Engage with content to earn points!</div>
                        )
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
