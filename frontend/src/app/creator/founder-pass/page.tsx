"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Flame, Shield, Plus, Users, DollarSign,
    CheckCircle, Loader2, X, AlertTriangle, Edit3, ToggleLeft, ToggleRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type FounderPass = {
    id: string;
    price: number;
    pass_limit: number;
    sold: number;
    is_active: boolean;
};

type Purchase = {
    id: string;
    purchased_at: string;
    fan_id: string;
};

export default function FounderPassPage() {
    const supabase = createClient();
    const [pass, setPass] = useState<FounderPass | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | "edit" | null>(null);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [form, setForm] = useState({ price: "", pass_limit: "" });

    useEffect(() => { fetchPass(); }, []);

    const fetchPass = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: passData } = await supabase
            .from("founder_pass").select("*").eq("creator_id", user.id).maybeSingle();
        setPass(passData || null);

        if (passData) {
            const { data: purData } = await supabase
                .from("founder_pass_purchases").select("id, purchased_at, fan_id").eq("pass_id", passData.id).order("purchased_at", { ascending: false });
            setPurchases(purData || []);
        }
        setLoading(false);
    };

    const openCreate = () => {
        setForm({ price: "", pass_limit: "" });
        setErrorMsg("");
        setModal("create");
    };

    const openEdit = () => {
        if (!pass) return;
        setForm({ price: (pass.price / 100).toFixed(2), pass_limit: pass.pass_limit.toString() });
        setErrorMsg("");
        setModal("edit");
    };

    const handleSave = async () => {
        const price = Math.round(parseFloat(form.price) * 100);
        const limit = parseInt(form.pass_limit);
        if (isNaN(price) || price <= 0) { setErrorMsg("Enter a valid price above $0."); return; }
        if (isNaN(limit) || limit <= 0) { setErrorMsg("Enter a valid limit above 0."); return; }
        if (modal === "edit" && pass && limit < pass.sold) { setErrorMsg("Limit cannot be less than passes already sold."); return; }

        setSaving(true); setErrorMsg("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (modal === "create") {
                const { error } = await supabase.from("founder_pass").insert({ creator_id: user.id, price, pass_limit: limit });
                if (error) { setErrorMsg(error.message); return; }
            } else if (pass) {
                const { error } = await supabase.from("founder_pass").update({ price, pass_limit: limit }).eq("id", pass.id);
                if (error) { setErrorMsg(error.message); return; }
            }
            setModal(null);
            fetchPass();
        } finally { setSaving(false); }
    };

    const handleToggle = async () => {
        if (!pass) return;
        setToggling(true);
        await supabase.from("founder_pass").update({ is_active: !pass.is_active }).eq("id", pass.id);
        fetchPass();
        setToggling(false);
    };

    const card: React.CSSProperties = {
        background: "var(--dash-card)", border: "1px solid var(--dash-border)",
        borderRadius: "16px", boxShadow: "var(--dash-shadow-sm)",
    };

    const inputStyle: React.CSSProperties = {
        height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--dash-border)",
        background: "var(--dash-bg)", color: "var(--dash-text-primary)", fontSize: "14px", fontWeight: 500, width: "100%", outline: "none",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)", display: "block", marginBottom: "6px",
    };

    const sold = pass?.sold ?? 0;
    const limit = pass?.pass_limit ?? 100;
    const pct = (sold / limit) * 100;
    const revenue = sold * (pass?.price ?? 0);
    const remaining = limit - sold;

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
                        Founder Pass
                    </h1>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text-secondary)", margin: 0 }}>
                        Sell high-margin, limited early supporter passes — your scarcity engine.
                    </p>
                </div>
                {!pass && !loading && (
                    <button onClick={openCreate} style={{ height: "40px", padding: "0 18px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Plus style={{ width: "16px", height: "16px" }} /> Set Up Pass
                    </button>
                )}
            </div>

            {loading && <div style={{ ...card, padding: "40px", height: "200px", animation: "pulse 1.5s ease-in-out infinite" }} />}

            {!loading && !pass && <EmptyState onCreate={openCreate} />}

            {!loading && pass && (
                <>
                    {/* Main Stats Card */}
                    <div style={{ ...card, padding: "28px", marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--dash-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Flame style={{ width: "22px", height: "22px", color: "var(--dash-text-secondary)" }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--dash-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px" }}>Founder Supporter Pass</p>
                                    <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--dash-text-primary)", margin: 0 }}>{formatCurrency(pass.price)}</p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                {/* Status Toggle */}
                                <button onClick={handleToggle} disabled={toggling} style={{ height: "36px", padding: "0 14px", borderRadius: "8px", border: "1px solid var(--dash-border)", background: "var(--dash-bg)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: pass.is_active ? "var(--dash-success-text)" : "var(--dash-text-muted)" }}>
                                    {pass.is_active
                                        ? <ToggleRight style={{ width: "16px", height: "16px" }} />
                                        : <ToggleLeft style={{ width: "16px", height: "16px" }} />
                                    }
                                    {pass.is_active ? "Active" : "Paused"}
                                </button>
                                <button onClick={openEdit} style={{ height: "36px", padding: "0 14px", borderRadius: "8px", border: "1px solid var(--dash-border)", background: "var(--dash-bg)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)" }}>
                                    <Edit3 style={{ width: "14px", height: "14px" }} /> Edit
                                </button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)" }}>Passes Sold</span>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dash-text-primary)" }}>{sold} / {limit}</span>
                            </div>
                            <div style={{ height: "8px", borderRadius: "4px", background: "var(--dash-border)", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: "4px", background: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "var(--dash-text-primary)", width: `${Math.min(100, pct)}%`, transition: "width 0.5s ease" }} />
                            </div>
                            <p style={{ fontSize: "12px", color: pct >= 90 ? "#EF4444" : "var(--dash-text-muted)", fontWeight: 500, marginTop: "6px" }}>
                                {remaining === 0 ? "🔥 Sold Out!" : `Only ${remaining} remaining`}
                            </p>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                            {[
                                { label: "Total Revenue", value: formatCurrency(revenue), icon: <DollarSign style={{ width: "14px", height: "14px" }} /> },
                                { label: "Holders", value: sold.toString(), icon: <Users style={{ width: "14px", height: "14px" }} /> },
                                { label: "Spots Left", value: remaining.toString(), icon: <Shield style={{ width: "14px", height: "14px" }} /> },
                            ].map(s => (
                                <div key={s.label} style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "10px", padding: "14px 16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--dash-text-secondary)", marginBottom: "6px" }}>
                                        {s.icon}{s.label}
                                    </div>
                                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Holders */}
                    {purchases.length > 0 && (
                        <div style={{ ...card, overflow: "hidden" }}>
                            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--dash-border)", fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                                Recent Holders
                            </div>
                            {purchases.slice(0, 10).map((p, i) => (
                                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderBottom: i < Math.min(9, purchases.length - 1) ? "1px solid var(--dash-border)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--dash-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "var(--dash-text-secondary)" }}>
                                            {(i + 1).toString().padStart(2, "0")}
                                        </div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--dash-text-primary)" }}>Founder #{i + 1}</div>
                                    </div>
                                    <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)" }}>{new Date(p.purchased_at).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {modal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)", borderRadius: "20px", width: "100%", maxWidth: "440px", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: 0 }}>
                                {modal === "create" ? "Set Up Founder Pass" : "Edit Founder Pass"}
                            </h2>
                            <button onClick={() => setModal(null)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--dash-border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-text-secondary)" }}>
                                <X style={{ width: "14px", height: "14px" }} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Price (USD) *</label>
                                <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.price} placeholder="e.g. 150.00"
                                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                                <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: "4px 0 0" }}>Typically $50 – $250+. High value, high margin.</p>
                            </div>
                            <div>
                                <label style={labelStyle}>Total Available *</label>
                                <input style={inputStyle} type="number" min="1" max="10000" value={form.pass_limit} placeholder="e.g. 100"
                                    onChange={e => setForm(f => ({ ...f, pass_limit: e.target.value }))} />
                                <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: "4px 0 0" }}>Scarcity drives conversions. 50–200 is typical for MVP.</p>
                            </div>
                            {errorMsg && (
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <AlertTriangle style={{ width: "14px", height: "14px", color: "#EF4444", flexShrink: 0 }} />
                                    <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{errorMsg}</p>
                                </div>
                            )}
                            <button onClick={handleSave} disabled={saving} style={{ height: "42px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontSize: "15px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                {saving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <CheckCircle style={{ width: "16px", height: "16px" }} />}
                                {saving ? "Saving…" : modal === "create" ? "Launch Founder Pass" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-card)", border: "1px dashed var(--dash-border)", borderRadius: "16px" }}>
            <Flame style={{ width: "32px", height: "32px", color: "var(--dash-text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 8px" }}>No founder pass yet</h3>
            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 20px", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
                Offer your early supporters a limited, exclusive pass.  A proven way to generate upfront capital with urgency.
            </p>
            <button onClick={onCreate} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Create Founder Pass
            </button>
        </div>
    );
}
