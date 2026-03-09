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
        <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-4">Your Store</h1>
                    <p className="text-gray-500">Create items fans can redeem with points</p>
                </div>
                <button onClick={handleOpenCreate} className="btn-primary">
                    <Plus className="w-4 h-4" /> New Item
                </button>
            </div>

            {/* Create / Edit Item Modal */}
            {showCreate && (
<<<<<<< HEAD
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Create Store Item</h2>
                            <button onClick={() => setShowCreate(false)} className="text-foreground-muted hover:text-foreground">
=======
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-lg shadow-xl ring-1 ring-gray-900/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Store Item' : 'Create Store Item'}</h2>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
>>>>>>> hasif_branch
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
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No store items yet</h3>
                    <p className="text-gray-500 mb-6">Create items for fans to redeem with their points!</p>
                    <button onClick={handleOpenCreate} className="btn-primary">
                        <Plus className="w-4 h-4" /> Create First Item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5 group hover:border-gray-400 transition-all flex flex-col justify-between">
                            <div>
                                <div className="h-40 bg-gray-50 border border-gray-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                                    <Package className="w-10 h-10 text-gray-300" />
                                    {/* Action overlay on hover for desktop */}
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(item)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm rounded-lg hover:bg-gray-50 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 shadow-sm rounded-lg hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1 tracking-tight line-clamp-1">{item.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-gray-900" />
                                        <span className="font-bold text-gray-900">{formatPoints(item.point_cost)} pts</span>
                                    </div>
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${item.quantity_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Out of stock'}
                                    </span>
                                </div>
                                {/* Mobile-only edit buttons inside grid flow */}
                                <div className="flex lg:hidden gap-1.5">
                                    <button onClick={() => handleOpenEdit(item)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg bg-gray-50 border border-gray-100">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg bg-red-50 border border-red-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
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
