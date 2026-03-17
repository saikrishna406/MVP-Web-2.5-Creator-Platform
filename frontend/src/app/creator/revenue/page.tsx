import { createClient } from "@/lib/supabase/server";
import { DollarSign, Users, Ticket, TrendingUp, Crown, Calendar, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
    title: "Revenue Analytics | Creator Dashboard",
};

export default async function RevenueAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Membership data
    const { data: tiers } = await supabase
        .from("membership_tiers").select("id, name, price, members_count, is_archived")
        .eq("creator_id", user.id).eq("is_archived", false);

    const { data: activeSubs } = await supabase
        .from("subscriptions").select("id, tier_id, created_at")
        .eq("creator_id", user.id).eq("status", "active");

    // Events data
    const { data: events } = await supabase
        .from("events").select("id, title, price, tickets_sold, event_date, status")
        .eq("creator_id", user.id).neq("status", "canceled")
        .order("event_date", { ascending: false });

    // Founder pass data
    const { data: founderPass } = await supabase
        .from("founder_pass").select("price, sold").eq("creator_id", user.id).maybeSingle();

    // Revenue calculations
    const membershipMRR = (tiers || []).reduce((sum, tier) => {
        const tierSubs = (activeSubs || []).filter(s => s.tier_id === tier.id).length;
        return sum + (tierSubs * tier.price);
    }, 0);

    const eventRevenue = (events || []).reduce((sum, ev) => sum + (ev.price * ev.tickets_sold), 0);
    const founderRevenue = founderPass ? founderPass.price * founderPass.sold : 0;
    const totalRevenue = membershipMRR + eventRevenue + founderRevenue;

    const card: React.CSSProperties = {
        background: "var(--dash-card)", border: "1px solid var(--dash-border)",
        borderRadius: "16px", boxShadow: "var(--dash-shadow-sm)",
    };

    const summaryStats = [
        { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "All time", icon: DollarSign, highlight: true },
        { label: "Monthly Recurring", value: formatCurrency(membershipMRR), sub: "From memberships/mo", icon: TrendingUp },
        { label: "Active Members", value: (activeSubs?.length || 0).toString(), sub: "Across all tiers", icon: Users },
        { label: "Tickets Sold", value: (events || []).reduce((s, e) => s + e.tickets_sold, 0).toString(), sub: "Total event tickets", icon: Ticket },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
                    Revenue Analytics
                </h1>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text-secondary)", margin: 0 }}>
                    Track your earnings across memberships, events, and founder passes.
                </p>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
                {summaryStats.map(stat => (
                    <div key={stat.label} style={{ ...card, padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <stat.icon style={{ width: "16px", height: "16px", color: "var(--dash-text-secondary)" }} />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)" }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", marginTop: "4px" }}>{stat.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Membership Breakdown */}
                <div style={{ ...card, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "18px 22px", borderBottom: "1px solid var(--dash-border)", fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                        <Crown style={{ width: "16px", height: "16px", color: "var(--dash-text-secondary)" }} /> Membership Tiers
                    </div>
                    {tiers && tiers.length > 0 ? tiers.map((tier, i) => {
                        const tierSubs = (activeSubs || []).filter(s => s.tier_id === tier.id).length;
                        const tierMRR = tierSubs * tier.price;
                        return (
                            <div key={tier.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: i < tiers.length - 1 ? "1px solid var(--dash-border)" : "none" }}>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text-primary)" }}>{tier.name}</div>
                                    <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "2px" }}>{tierSubs} active members · {formatCurrency(tier.price)}/month</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>{formatCurrency(tierMRR)}</div>
                                    <div style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>MRR</div>
                                </div>
                            </div>
                        );
                    }) : (
                        <EmptySection label="No tiers yet" icon={<Crown style={{ width: "18px", height: "18px" }} />} />
                    )}
                </div>

                {/* Revenue Breakdown */}
                <div style={{ ...card, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "18px 22px", borderBottom: "1px solid var(--dash-border)", fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                        <BarChart3 style={{ width: "16px", height: "16px", color: "var(--dash-text-secondary)" }} /> Revenue Split
                    </div>
                    <div style={{ padding: "22px" }}>
                        {[
                            { label: "Memberships (MRR)", value: membershipMRR, total: totalRevenue },
                            { label: "Events", value: eventRevenue, total: totalRevenue },
                            { label: "Founder Passes", value: founderRevenue, total: totalRevenue },
                        ].map(item => {
                            const pct = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
                            return (
                                <div key={item.label} style={{ marginBottom: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--dash-text-secondary)" }}>{item.label}</span>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dash-text-primary)" }}>{formatCurrency(item.value)} <span style={{ fontWeight: 500, color: "var(--dash-text-muted)" }}>({pct.toFixed(0)}%)</span></span>
                                    </div>
                                    <div style={{ height: "6px", borderRadius: "3px", background: "var(--dash-border)", overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: "3px", background: "var(--dash-text-primary)", width: `${pct}%`, transition: "width 0.5s ease" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Events Performance */}
                <div style={{ ...card, overflow: "hidden", gridColumn: "span 2" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "18px 22px", borderBottom: "1px solid var(--dash-border)", fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                        <Calendar style={{ width: "16px", height: "16px", color: "var(--dash-text-secondary)" }} /> Event Performance
                    </div>
                    {events && events.length > 0 ? (
                        <div>
                            {events.slice(0, 8).map((ev, i) => {
                                const evRevenue = ev.price * ev.tickets_sold;
                                return (
                                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 22px", borderBottom: i < Math.min(7, events.length - 1) ? "1px solid var(--dash-border)" : "none" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text-primary)" }}>{ev.title}</div>
                                            <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "2px" }}>{new Date(ev.event_date).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ fontSize: "13px", color: "var(--dash-text-secondary)", fontWeight: 500 }}>{ev.tickets_sold} tickets</div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--dash-text-primary)" }}>{formatCurrency(evRevenue)}</div>
                                        <div style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: ev.status === "published" ? "var(--dash-success-bg)" : "var(--dash-accent-soft)", color: ev.status === "published" ? "var(--dash-success-text)" : "var(--dash-text-muted)" }}>
                                            {ev.status}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptySection label="No events yet" icon={<Calendar style={{ width: "18px", height: "18px" }} />} />
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptySection({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", gap: "8px", color: "var(--dash-text-muted)" }}>
            {icon}
            <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>{label}</p>
        </div>
    );
}
