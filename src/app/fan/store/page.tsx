'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Star, Package, Check } from 'lucide-react';
import { formatPoints, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { RedemptionItem } from '@/types';

export default function FanStorePage() {
    const [items, setItems] = useState<RedemptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const fetchItems = useCallback(async () => {
        const res = await fetch('/api/redemption');
        if (res.ok) {
            const data = await res.json();
            setItems(data.items);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleRedeem = async (itemId: string) => {
        setRedeeming(itemId);
        const res = await fetch('/api/redemption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'redeem', itemId }),
        });

        const data = await res.json();
        if (res.ok) {
            setToast({ message: `🎉 Successfully redeemed! -${data.pointsSpent} points`, type: 'success' });
            fetchItems(); // Refresh
        } else {
            setToast({ message: data.error || 'Failed to redeem', type: 'error' });
        }
        setRedeeming(null);
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Redemption Store</h1>
                <p className="text-foreground-muted">Spend your earned points on exclusive rewards</p>
            </div>

            {items.length === 0 ? (
                <div className="card text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items available</h3>
                    <p className="text-foreground-muted">Creators haven&apos;t added any store items yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="card overflow-hidden group hover:border-secondary/50 transition-all hover:scale-[1.01]">
                            {/* Item image placeholder */}
                            <div className="h-40 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl mb-4 flex items-center justify-center">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <Package className="w-12 h-12 text-foreground-muted/50" />
                                )}
                            </div>

                            {/* Creator info */}
                            {item.creator && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold">
                                        {getInitials(item.creator.display_name || 'C')}
                                    </div>
                                    <span className="text-xs text-foreground-muted">by {item.creator.display_name}</span>
                                </div>
                            )}

                            <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                            <p className="text-sm text-foreground-muted mb-4 line-clamp-2">{item.description}</p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-secondary" />
                                    <span className="font-bold text-secondary">{formatPoints(item.point_cost)} pts</span>
                                </div>
                                <span className="text-xs text-foreground-muted">
                                    {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Out of stock'}
                                </span>
                            </div>

                            <button
                                onClick={() => handleRedeem(item.id)}
                                disabled={redeeming === item.id || item.quantity_available <= 0}
                                className="btn-primary w-full mt-4"
                            >
                                {redeeming === item.id ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Redeeming...
                                    </span>
                                ) : item.quantity_available <= 0 ? (
                                    'Out of Stock'
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Redeem
                                    </span>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
