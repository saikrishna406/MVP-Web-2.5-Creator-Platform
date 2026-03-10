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
        <div className="space-y-12 pb-24 animate-fade-in-up max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tighter text-gray-900 mb-4 pb-2">
                    Redemption Store
                </h1>
                <p className="text-gray-500 text-xl md:text-2xl font-light tracking-wide max-w-2xl">
                    Spend your earned points on exclusive lifestyle rewards.
                </p>
            </div>

            {items.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-32 text-center rounded-3xl border-dashed">
                    <ShoppingBag className="w-16 h-16 text-gray-200 mb-6" />
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-gray-900 mb-2">No items available</h3>
                    <p className="text-gray-500 text-lg">Creators haven&apos;t added any store items yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map((item, index) => (
                        <div key={item.id}
                            className="group relative flex flex-col justify-end overflow-hidden rounded-[2rem] bg-gray-100 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl"
                            style={{ minHeight: '440px', animationDelay: `${index * 50}ms` }}
                        >
                            {/* Full-bleed background image with scale effect */}
                            <div className="absolute inset-0 z-0">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                                        <Package className="w-16 h-16 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Heavy dark gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />

                            {/* Content container (Glassmorphism on hover) */}
                            <div className="relative z-20 p-6 pt-12 transform transition-transform duration-500">
                                {/* Creator Info */}
                                {item.creator && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
                                            {getInitials(item.creator.display_name || 'C')}
                                        </div>
                                        <span className="text-sm font-medium text-white/80 tracking-wide">by {item.creator.display_name}</span>
                                    </div>
                                )}

                                <h3 className="font-bold text-white text-2xl mb-2 font-[family-name:var(--font-heading)] tracking-tight line-clamp-2 leading-tight">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-white/60 mb-6 line-clamp-2 min-h-[40px] leading-relaxed font-light">
                                    {item.description}
                                </p>

                                <div className="flex items-end justify-between mt-auto mb-6">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 px-4 shadow-xl">
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Cost</div>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-bold text-white text-lg">{formatPoints(item.point_cost)} pt</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Status</div>
                                        <span className={`text-sm font-bold tracking-wide ${item.quantity_available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Sold out'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRedeem(item.id)}
                                    disabled={redeeming === item.id || item.quantity_available <= 0}
                                    className="w-full bg-white text-black font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gray-100 disabled:opacity-50 disabled:bg-white/20 disabled:text-white disabled:cursor-not-allowed group/btn hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    {redeeming === item.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Processing
                                        </span>
                                    ) : item.quantity_available <= 0 ? (
                                        'Sold Out'
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 group-hover/btn:scale-105 transition-transform">
                                            <ShoppingBag className="w-4 h-4" /> Redeem Reward
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
