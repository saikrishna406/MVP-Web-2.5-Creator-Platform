'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, ShoppingBag, Check, X, Star, Edit, Trash2 } from 'lucide-react';
import { formatPoints, formatRelativeTime } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import type { RedemptionItem } from '@/types';

export default function CreatorStorePage() {
    const [items, setItems] = useState<RedemptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pointCost, setPointCost] = useState(100);
    const [quantity, setQuantity] = useState(10);

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

    const handleOpenCreate = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setPointCost(100);
        setQuantity(10);
        setShowCreate(true);
    };

    const handleOpenEdit = (item: RedemptionItem) => {
        setEditingId(item.id);
        setName(item.name);
        setDescription(item.description);
        setPointCost(item.point_cost);
        setQuantity(item.quantity_available);
        setShowCreate(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const url = editingId ? `/api/redemption/${editingId}` : '/api/redemption';
        const method = editingId ? 'PUT' : 'POST';

        const body = editingId
            ? { name, description, point_cost: pointCost, quantity_available: quantity }
            : { action: 'create', name, description, point_cost: pointCost, quantity_available: quantity };

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setToast({ message: `Item ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
            setShowCreate(false);
            fetchItems();
        } else {
            const data = await res.json();
            setToast({ message: data.error || `Failed to ${editingId ? 'update' : 'create'} item`, type: 'error' });
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this store item?')) return;

        const res = await fetch(`/api/redemption/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setToast({ message: 'Item deleted successfully', type: 'success' });
            fetchItems();
        } else {
            setToast({ message: 'Failed to delete item', type: 'error' });
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-12 animate-fade-in-up pb-24 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 mt-4 text-center sm:text-left gap-6">
                <div>
                    <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tighter text-gray-900 mb-4 pb-2">Your Store</h1>
                    <p className="text-gray-500 text-xl md:text-2xl font-light tracking-wide">Create exclusive rewards for your fans.</p>
                </div>
                <button onClick={handleOpenCreate} className="btn-primary shrink-0 text-lg px-6 py-4 rounded-full flex items-center gap-2 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                    <Plus className="w-6 h-6" /> New Item
                </button>
            </div>

            {/* Create / Edit Item Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-lg shadow-xl ring-1 ring-gray-900/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Store Item' : 'Create Store Item'}</h2>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Item Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Exclusive Shoutout, Digital Art..."
                                    className="input"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what the fan gets..."
                                    className="textarea min-h-[120px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Point Cost</label>
                                    <input
                                        type="number"
                                        value={pointCost}
                                        onChange={(e) => setPointCost(Number(e.target.value))}
                                        min={1}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900">Quantity Available</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        min={0}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary w-full">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary w-full">
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {editingId ? 'Saving...' : 'Creating...'}
                                        </span>
                                    ) : (
                                        editingId ? 'Save Changes' : 'Create Item'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Items Grid */}
            {items.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-32 text-center rounded-3xl border-dashed">
                    <ShoppingBag className="w-16 h-16 text-gray-200 mb-6" />
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-gray-900 mb-2">No store items yet</h3>
                    <p className="text-gray-500 text-lg mb-8">Create items for fans to redeem with their points!</p>
                    <button onClick={handleOpenCreate} className="btn-primary shrink-0 text-base px-6 py-4 rounded-full flex items-center gap-2 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                        <Plus className="w-5 h-5" /> Create First Item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map((item, index) => (
                        <div key={item.id}
                            className="group relative flex flex-col justify-end overflow-hidden rounded-[2rem] bg-gray-100 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl border border-gray-200"
                            style={{ minHeight: '440px', animationDelay: `${index * 50}ms` }}
                        >
                            {/* Action overlay on hover */}
                            <div className="absolute top-4 right-4 flex gap-2 z-30 transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white flex items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-110 hover:bg-white transition-all">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="w-10 h-10 rounded-full bg-red-500/90 backdrop-blur-md shadow-lg border border-red-500/20 flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Full-bleed background image with scale effect */}
                            <div className="absolute inset-0 z-0 bg-white">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                                        <Package className="w-16 h-16 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Heavy dark gradient overlay for text readability (using gray-900 for elegant contrast even without image) */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${item.image_url ? 'from-black/90 via-black/40' : 'from-gray-900/90 via-gray-900/20'} to-transparent z-10 transition-opacity duration-500 group-hover:opacity-100`} />

                            {/* Content container (Glassmorphism on hover) */}
                            <div className="relative z-20 p-6 transform transition-transform duration-500">
                                <h3 className={`font-bold text-2xl mb-2 font-[family-name:var(--font-heading)] ltracking-tight line-clamp-2 leading-tight ${item.image_url ? 'text-white' : 'text-gray-900 group-hover:text-white transition-colors duration-500'}`}>
                                    {item.name}
                                </h3>
                                <p className={`text-sm mb-6 line-clamp-2 min-h-[40px] font-light leading-relaxed ${item.image_url ? 'text-white/70' : 'text-gray-600 group-hover:text-white/80 transition-colors duration-500'}`}>
                                    {item.description}
                                </p>

                                <div className="flex items-end justify-between mt-auto">
                                    <div className={`backdrop-blur-md border rounded-2xl p-3 px-4 shadow-xl transition-colors duration-500 ${item.image_url ? 'bg-white/10 border-white/10' : 'bg-gray-100/80 border-gray-200 group-hover:bg-white/10 group-hover:border-white/10'}`}>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-500 ${item.image_url ? 'text-white/50' : 'text-gray-500 group-hover:text-white/60'}`}>Cost</div>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className={`font-bold text-lg transition-colors duration-500 ${item.image_url ? 'text-white' : 'text-gray-900 group-hover:text-white'}`}>{formatPoints(item.point_cost)} pt</span>
                                        </div>
                                    </div>
                                    <div className="text-right pb-2">
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-500 ${item.image_url ? 'text-white/50' : 'text-gray-500 group-hover:text-white/60'}`}>Status</div>
                                        <span className={`text-sm font-bold tracking-wide ${item.quantity_available > 0 ? 'text-green-500 group-hover:text-green-400' : 'text-red-500 bg-red-100 px-2 py-1 rounded-md'}`}>
                                            {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Out of stock'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
