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
            setToast({ message: `Successfully redeemed! -${data.pointsSpent} points`, type: 'success' });
            fetchItems(); // Refresh
        } else {
            setToast({ message: data.error || 'Failed to redeem', type: 'error' });
        }
        setRedeeming(null);
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Redemption Store</h1>
                <p className="text-gray-500">Spend your earned points on exclusive rewards</p>
            </div>

            {items.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No items available</h3>
                    <p className="text-gray-500">Creators haven&apos;t added any store items yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5 flex flex-col hover:border-gray-400 group transition-all">
                            {/* Item image placeholder */}
                            <div className="h-44 bg-gray-50 border border-gray-100 rounded-lg mb-5 flex items-center justify-center overflow-hidden">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-10 h-10 text-gray-300" />
                                )}
                            </div>

                            {/* Creator info */}
                            {item.creator && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold overflow-hidden">
                                        {getInitials(item.creator.display_name || 'C')}
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">by {item.creator.display_name}</span>
                                </div>
                            )}

                            <h3 className="font-bold text-gray-900 text-lg mb-2 tracking-tight line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{item.description}</p>

                            <div className="flex items-end justify-between mt-auto mb-5">
                                <div>
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cost</div>
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-gray-900" />
                                        <span className="font-bold text-gray-900">{formatPoints(item.point_cost)} pts</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock</div>
                                    <span className={`text-sm font-semibold ${item.quantity_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Out of stock'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRedeem(item.id)}
                                disabled={redeeming === item.id || item.quantity_available <= 0}
                                className="btn-primary w-full"
                            >
                                {redeeming === item.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing
                                    </span>
                                ) : item.quantity_available <= 0 ? (
                                    'Sold Out'
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
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
