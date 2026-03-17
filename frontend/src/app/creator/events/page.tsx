"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar, Ticket, Plus, Edit3, Archive,
    CheckCircle, Loader2, X, AlertTriangle,
    Clock, DollarSign, Users, MapPin, Video
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type Event = {
    id: string;
    title: string;
    description: string;
    event_date: string;
    price: number;
    capacity: number | null;
    tickets_sold: number;
    status: string;
    image_url: string | null;
    location: string | null;
    stream_url: string | null;
};

export default function EventsPage() {
    const supabase = createClient();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | "edit" | null>(null);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [archiveId, setArchiveId] = useState<string | null>(null);

    const emptyForm = {
        title: "", description: "", event_date: "", event_time: "",
        price: "", capacity: "", location: "", stream_url: "",
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("events")
            .select("*")
            .eq("creator_id", user.id)
            .neq("status", "canceled")
            .order("event_date", { ascending: true });
        setEvents(data || []);
        setLoading(false);
    };

    const openCreate = () => {
        setEditingEvent(null);
        setForm(emptyForm);
        setErrorMsg("");
        setModal("create");
    };

    const openEdit = (ev: Event) => {
        setEditingEvent(ev);
        const d = new Date(ev.event_date);
        setForm({
            title: ev.title,
            description: ev.description,
            event_date: d.toISOString().split("T")[0],
            event_time: d.toTimeString().slice(0, 5),
            price: (ev.price / 100).toFixed(2),
            capacity: ev.capacity?.toString() ?? "",
            location: ev.location ?? "",
            stream_url: ev.stream_url ?? "",
        });
        setErrorMsg("");
        setModal("edit");
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.event_date) { setErrorMsg("Title and date are required."); return; }
        const price = Math.round(parseFloat(form.price || "0") * 100);
        if (isNaN(price)) { setErrorMsg("Enter a valid price."); return; }
        const eventDate = new Date(`${form.event_date}T${form.event_time || "00:00"}`);

        setSaving(true); setErrorMsg("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                creator_id: user.id,
                title: form.title.trim(),
                description: form.description.trim(),
                event_date: eventDate.toISOString(),
                price,
                capacity: form.capacity ? parseInt(form.capacity) : null,
                location: form.location.trim() || null,
                stream_url: form.stream_url.trim() || null,
            };

            if (modal === "create") {
                const { error } = await supabase.from("events").insert({ ...payload, status: "published" });
                if (error) { setErrorMsg(error.message); return; }
            } else if (editingEvent) {
                const { error } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
                if (error) { setErrorMsg(error.message); return; }
            }
            setModal(null);
            fetchEvents();
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id: string) => {
        await supabase.from("events").update({ status: "canceled" }).eq("id", id);
        setArchiveId(null);
        fetchEvents();
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

    const upcomingEvents = events.filter(e => e.status === "published" && new Date(e.event_date) > new Date());
    const pastEvents = events.filter(e => e.status === "completed" || new Date(e.event_date) <= new Date());

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
                        Events
                    </h1>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text-secondary)", margin: 0 }}>
                        Host paid sessions — Q&As, livestreams, exclusive meetups.
                    </p>
                </div>
                <button onClick={openCreate} style={{
                    height: "40px", padding: "0 18px", borderRadius: "10px", border: "none",
                    background: "var(--dash-text-primary)", color: "var(--dash-bg)",
                    fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                }}>
                    <Plus style={{ width: "16px", height: "16px" }} /> Host Event
                </button>
            </div>

            {/* Stats Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
                {[
                    { label: "Upcoming", value: upcomingEvents.length, icon: <Calendar style={{ width: "16px", height: "16px" }} /> },
                    { label: "Total Tickets Sold", value: events.reduce((s, e) => s + e.tickets_sold, 0), icon: <Ticket style={{ width: "16px", height: "16px" }} /> },
                    { label: "Total Revenue", value: formatCurrency(events.reduce((s, e) => s + e.price * e.tickets_sold, 0)), icon: <DollarSign style={{ width: "16px", height: "16px" }} />, isString: true },
                ].map(stat => (
                    <div key={stat.label} style={{ ...card, padding: "18px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--dash-text-secondary)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                            {stat.icon}{stat.label}
                        </div>
                        <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em" }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length === 0 && !loading ? (
                <EmptyEvents onCreateClick={openCreate} />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {upcomingEvents.map(ev => (
                        <EventRow key={ev.id} event={ev} onEdit={openEdit} onCancel={setArchiveId} />
                    ))}
                </div>
            )}

            {/* Past Events (collapsed section) */}
            {pastEvents.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--dash-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Past Events</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", opacity: 0.7 }}>
                        {pastEvents.map(ev => (
                            <EventRow key={ev.id} event={ev} onEdit={openEdit} onCancel={setArchiveId} readonly />
                        ))}
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal && (
                <Modal title={modal === "create" ? "Host New Event" : "Edit Event"} onClose={() => setModal(null)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={labelStyle}>Event Title *</label>
                            <input style={inputStyle} value={form.title} placeholder="Studio Backstage Session"
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea style={{ ...inputStyle, height: "72px", padding: "10px 12px", resize: "vertical" as const } as React.CSSProperties}
                                value={form.description} placeholder="What will fans experience?"
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Date *</label>
                                <input style={inputStyle} type="date" value={form.event_date}
                                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Time</label>
                                <input style={inputStyle} type="time" value={form.event_time}
                                    onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Ticket Price (USD) *</label>
                                <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} placeholder="0 = Free"
                                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Capacity (optional)</label>
                                <input style={inputStyle} type="number" min="1" value={form.capacity} placeholder="Unlimited"
                                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Location (for in-person events)</label>
                            <input style={inputStyle} value={form.location} placeholder="e.g. Los Angeles, CA"
                                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Stream URL (for virtual events)</label>
                            <input style={inputStyle} value={form.stream_url} placeholder="https://..."
                                onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))} />
                        </div>
                        {errorMsg && <ErrorBanner msg={errorMsg} />}
                        <SaveBtn onClick={handleSave} saving={saving} label={modal === "create" ? "Host Event" : "Save Changes"} />
                    </div>
                </Modal>
            )}

            {archiveId && (
                <Modal title="Cancel Event?" onClose={() => setArchiveId(null)}>
                    <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
                        Canceling this event will revoke all tickets. Refunds must be processed separately through Stripe.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setArchiveId(null)} style={{ flex: 1, height: "40px", borderRadius: "10px", border: "1px solid var(--dash-border)", background: "transparent", color: "var(--dash-text-primary)", fontWeight: 600, cursor: "pointer" }}>Keep Event</button>
                        <button onClick={() => handleCancel(archiveId)} style={{ flex: 1, height: "40px", borderRadius: "10px", border: "none", background: "#EF4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel Event</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function EventRow({ event, onEdit, onCancel, readonly = false }: { event: Event; onEdit: (e: Event) => void; onCancel: (id: string) => void; readonly?: boolean }) {
    const card: React.CSSProperties = {
        background: "var(--dash-card)", border: "1px solid var(--dash-border)", borderRadius: "12px",
        padding: "18px 22px", display: "flex", alignItems: "center", gap: "16px",
    };
    const ticketPct = event.capacity ? (event.tickets_sold / event.capacity) * 100 : null;

    return (
        <div style={card}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--dash-accent-soft)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar style={{ width: "20px", height: "20px", color: "var(--dash-text-secondary)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock style={{ width: "11px", height: "11px" }} />{formatDate(event.event_date)}
                    </span>
                    {event.location && <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin style={{ width: "11px", height: "11px" }} />{event.location}
                    </span>}
                    {event.stream_url && <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Video style={{ width: "11px", height: "11px" }} />Virtual
                    </span>}
                </div>
                {ticketPct !== null && (
                    <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "var(--dash-border)", overflow: "hidden", maxWidth: "200px" }}>
                        <div style={{ height: "100%", background: "var(--dash-text-primary)", borderRadius: "2px", width: `${Math.min(100, ticketPct)}%` }} />
                    </div>
                )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>{formatCurrency(event.price)}</div>
                    <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: 500 }}>{event.tickets_sold}{event.capacity ? `/${event.capacity}` : ""} sold</div>
                </div>
                {!readonly && (
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => onEdit(event)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--dash-border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-text-secondary)" }}>
                            <Edit3 style={{ width: "14px", height: "14px" }} />
                        </button>
                        <button onClick={() => onCancel(event.id)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                            <Archive style={{ width: "14px", height: "14px" }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyEvents({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-card)", border: "1px dashed var(--dash-border)", borderRadius: "16px" }}>
            <Calendar style={{ width: "32px", height: "32px", color: "var(--dash-text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 8px" }}>No events yet</h3>
            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 20px" }}>Host an exclusive session and sell tickets directly to your fans.</p>
            <button onClick={onCreateClick} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Host First Event
            </button>
        </div>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "var(--dash-shadow-lg)" }}>
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

function ErrorBanner({ msg }: { msg: string }) {
    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle style={{ width: "14px", height: "14px", color: "#EF4444", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{msg}</p>
        </div>
    );
}

function SaveBtn({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
    return (
        <button onClick={onClick} disabled={saving} style={{ height: "42px", borderRadius: "10px", border: "none", background: "var(--dash-text-primary)", color: "var(--dash-bg)", fontSize: "15px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {saving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <CheckCircle style={{ width: "16px", height: "16px" }} />}
            {saving ? "Saving…" : label}
        </button>
    );
}
