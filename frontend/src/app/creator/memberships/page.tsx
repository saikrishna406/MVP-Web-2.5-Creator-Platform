"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Users, DollarSign, Plus, Edit3, Trash2, Archive,
    CheckCircle, Loader2, X, ChevronDown, Crown,
    AlertTriangle, BarChart3
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Tier = {
    id: string;
    name: string;
    price: number;
    description: string;
    member_limit: number | null;
    members_count: number;
    badge_label: string | null;
    is_archived: boolean;
    sort_order: number;
};

type ModalMode = "create" | "edit" | null;

export default function MembershipsPage() {
    const supabase = createClient();
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<ModalMode>(null);
    const [editingTier, setEditingTier] = useState<Tier | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [form, setForm] = useState({
        name: "", price: "", description: "", member_limit: "", badge_label: "",
    });

    useEffect(() => { fetchTiers(); }, []);

    const fetchTiers = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("membership_tiers")
            .select("*")
            .eq("creator_id", user.id)
            .eq("is_archived", false)
            .order("sort_order", { ascending: true });
        setTiers(data || []);
        setLoading(false);
    };

    const openCreate = () => {
        setEditingTier(null);
        setForm({ name: "", price: "", description: "", member_limit: "", badge_label: "" });
        setErrorMsg("");
        setModal("create");
    };

    const openEdit = (tier: Tier) => {
        setEditingTier(tier);
        setForm({
            name: tier.name,
            price: (tier.price / 100).toFixed(2),
            description: tier.description,
            member_limit: tier.member_limit?.toString() ?? "",
            badge_label: tier.badge_label ?? "",
        });
        setErrorMsg("");
        setModal("edit");
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) { setErrorMsg("Name and price are required."); return; }
        const price = Math.round(parseFloat(form.price) * 100);
        if (isNaN(price) || price < 0) { setErrorMsg("Enter a valid price."); return; }

        setSaving(true);
        setErrorMsg("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (modal === "create") {
                const { error } = await supabase.from("membership_tiers").insert({
                    creator_id: user.id,
                    name: form.name.trim(),
                    price,
                    description: form.description.trim(),
                    member_limit: form.member_limit ? parseInt(form.member_limit) : null,
                    badge_label: form.badge_label.trim() || null,
                    sort_order: tiers.length,
                });
                if (error) { setErrorMsg(error.message); return; }
            } else if (editingTier) {
                const { error } = await supabase.from("membership_tiers").update({
                    name: form.name.trim(),
                    price,
                    description: form.description.trim(),
                    member_limit: form.member_limit ? parseInt(form.member_limit) : null,
                    badge_label: form.badge_label.trim() || null,
                }).eq("id", editingTier.id);
                if (error) { setErrorMsg(error.message); return; }
            }
            setModal(null);
            fetchTiers();
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (id: string) => {
        await supabase.from("membership_tiers").update({ is_archived: true }).eq("id", id);
        setDeleteConfirmId(null);
        fetchTiers();
    };

    const card: React.CSSProperties = {
        background: "var(--dash-card)", border: "1px solid var(--dash-border)",
        borderRadius: "16px", boxShadow: "var(--dash-shadow-sm)",
    };

    const inputStyle: React.CSSProperties = {
        height: "40px", padding: "0 12px", borderRadius: "8px",
        border: "1px solid var(--dash-border)", background: "var(--dash-bg)",
        color: "var(--dash-text-primary)", fontSize: "14px", fontWeight: 500, width: "100%", outline: "none",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)",
        display: "block", marginBottom: "6px",
    };

    const activeTiers = tiers.length;
    const canCreateMore = activeTiers < 3;

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
                        Membership Tiers
                    </h1>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text-secondary)", margin: 0 }}>
                        Up to 3 tiers. Your primary revenue engine.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={!canCreateMore}
                    style={{
                        height: "40px", padding: "0 18px", borderRadius: "10px", border: "none",
                        background: canCreateMore ? "var(--dash-text-primary)" : "var(--dash-border)",
                        color: canCreateMore ? "var(--dash-bg)" : "var(--dash-text-muted)",
                        fontSize: "14px", fontWeight: 600, cursor: canCreateMore ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", gap: "6px",
                    }}
                >
                    <Plus style={{ width: "16px", height: "16px" }} />
                    {canCreateMore ? "New Tier" : `Max 3 reached`}
                </button>
            </div>

            {/* Tiers Grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                    {[1,2,3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : tiers.length === 0 ? (
                <EmptyTiers onCreateClick={openCreate} />
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                    {tiers.map((tier) => (
                        <div key={tier.id} style={{ ...card, padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Header row */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dash-text-muted)", margin: "0 0 4px" }}>
                                        {tier.badge_label || "Tier"}
                                    </p>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: 0 }}>
                                        {tier.name}
                                    </h3>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <IconBtn onClick={() => openEdit(tier)} title="Edit">
                                        <Edit3 style={{ width: "14px", height: "14px" }} />
                                    </IconBtn>
                                    <IconBtn onClick={() => setDeleteConfirmId(tier.id)} title="Archive" danger>
                                        <Archive style={{ width: "14px", height: "14px" }} />
                                    </IconBtn>
                                </div>
                            </div>

                            {/* Price */}
                            <div style={{ padding: "14px 0", borderTop: "1px solid var(--dash-border)", borderBottom: "1px solid var(--dash-border)" }}>
                                <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.03em" }}>
                                    {formatCurrency(tier.price)}
                                </span>
                                <span style={{ fontSize: "14px", color: "var(--dash-text-muted)", fontWeight: 500, marginLeft: "4px" }}>/month</span>
                            </div>

                            {/* Description */}
                            {tier.description && (
                                <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                                    {tier.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                                <StatPill icon={<Users style={{ width: "12px", height: "12px" }} />}
                                    label={`${tier.members_count}${tier.member_limit ? `/${tier.member_limit}` : ""} members`} />
                            </div>

                            {/* Capacity Bar */}
                            {tier.member_limit && (
                                <div>
                                    <div style={{ height: "4px", borderRadius: "2px", background: "var(--dash-border)", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%", borderRadius: "2px", background: "var(--dash-text-primary)",
                                            width: `${Math.min(100, (tier.members_count / tier.member_limit) * 100)}%`,
                                            transition: "width 0.4s ease",
                                        }} />
                                    </div>
                                    <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", margin: "4px 0 0", textAlign: "right" }}>
                                        {tier.member_limit - tier.members_count} spots left
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal && (
                <Modal title={modal === "create" ? "Create New Tier" : "Edit Tier"} onClose={() => setModal(null)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Tier Name *</label>
                            <input style={inputStyle} value={form.name} maxLength={100} placeholder="e.g. VIP Access"
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Monthly Price (USD) *</label>
                            <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} placeholder="e.g. 25.00"
                                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea style={{ ...inputStyle, height: "80px", padding: "10px 12px", resize: "vertical" as const } as React.CSSProperties}
                                value={form.description} placeholder="What do members get?"
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Member Limit (optional)</label>
                                <input style={inputStyle} type="number" min="1" value={form.member_limit} placeholder="Unlimited"
                                    onChange={e => setForm(f => ({ ...f, member_limit: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Badge Label</label>
                                <input style={inputStyle} value={form.badge_label} placeholder="e.g. Elite"
                                    onChange={e => setForm(f => ({ ...f, badge_label: e.target.value }))} />
                            </div>
                        </div>
                        {errorMsg && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                <AlertTriangle style={{ width: "14px", height: "14px", color: "#EF4444", flexShrink: 0 }} />
                                <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{errorMsg}</p>
                            </div>
                        )}
                        <button onClick={handleSave} disabled={saving} style={{
                            height: "42px", borderRadius: "10px", border: "none",
                            background: "var(--dash-text-primary)", color: "var(--dash-bg)",
                            fontSize: "15px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}>
                            {saving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <CheckCircle style={{ width: "16px", height: "16px" }} />}
                            {saving ? "Saving…" : modal === "create" ? "Create Tier" : "Save Changes"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Archive Confirm Modal */}
            {deleteConfirmId && (
                <Modal title="Archive Tier?" onClose={() => setDeleteConfirmId(null)}>
                    <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
                        Archiving this tier will end all active subscriptions at next billing cycle. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setDeleteConfirmId(null)} style={{
                            flex: 1, height: "40px", borderRadius: "10px", border: "1px solid var(--dash-border)",
                            background: "transparent", color: "var(--dash-text-primary)", fontWeight: 600, cursor: "pointer",
                        }}>Cancel</button>
                        <button onClick={() => handleArchive(deleteConfirmId)} style={{
                            flex: 1, height: "40px", borderRadius: "10px", border: "none",
                            background: "#EF4444", color: "#fff", fontWeight: 600, cursor: "pointer",
                        }}>Archive Tier</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--dash-text-secondary)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "8px", padding: "4px 10px" }}>
            {icon}{label}
        </div>
    );
}

function IconBtn({ children, onClick, title, danger = false }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
    return (
        <button onClick={onClick} title={title} style={{
            width: "30px", height: "30px", borderRadius: "8px",
            border: `1px solid ${danger ? "rgba(239,68,68,0.3)" : "var(--dash-border)"}`,
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: danger ? "#EF4444" : "var(--dash-text-secondary)",
        }}>{children}</button>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)", borderRadius: "20px", width: "100%", maxWidth: "480px", padding: "28px", boxShadow: "var(--dash-shadow-lg)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--dash-border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-text-secondary)" }}>
                        <X style={{ width: "14px", height: "14px" }} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)", borderRadius: "16px", padding: "24px", height: "200px", animation: "pulse 1.5s ease-in-out infinite" }} />
    );
}

function EmptyTiers({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-card)", border: "1px dashed var(--dash-border)", borderRadius: "16px" }}>
            <Crown style={{ width: "32px", height: "32px", color: "var(--dash-text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 8px" }}>No tiers yet</h3>
            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 20px" }}>Create your first membership tier to start earning recurring revenue.</p>
            <button onClick={onCreateClick} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Create First Tier
            </button>
        </div>
    );
}
