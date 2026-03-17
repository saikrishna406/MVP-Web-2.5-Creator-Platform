import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Crown, Calendar, Flame, Users, Clock,
    CheckCircle, MapPin, Video, Shield
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const supabase = await createClient();
    const { data: creator } = await supabase
        .from("profiles").select("display_name, bio").eq("username", username).eq("role", "creator").maybeSingle();
    if (!creator) return { title: "Creator Not Found" };
    return {
        title: `${creator.display_name} | Black Bolts`,
        description: creator.bio || `Support ${creator.display_name} on Black Bolts.`,
    };
}

export default async function CreatorPublicPage({ params }: Props) {
    const { username } = await params;
    const supabase = await createClient();

    // Get current fan session
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch creator profile
    const { data: creator } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, bio, avatar_url, banner_image, role")
        .eq("username", username)
        .eq("role", "creator")
        .maybeSingle();

    if (!creator) return notFound();

    // Fetch tiers, events, and founder pass in parallel
    const [tiersRes, eventsRes, passRes] = await Promise.all([
        supabase.from("membership_tiers").select("*").eq("creator_id", creator.user_id).eq("is_archived", false).order("sort_order"),
        supabase.from("events").select("*").eq("creator_id", creator.user_id).eq("status", "published").gt("event_date", new Date().toISOString()).order("event_date"),
        supabase.from("founder_pass").select("*").eq("creator_id", creator.user_id).eq("is_active", true).maybeSingle(),
    ]);

    const tiers = tiersRes.data || [];
    const events = eventsRes.data || [];
    const pass = passRes.data;

    // Check fan's existing subscriptions and tickets if logged in
    let fanSubs: string[] = [];
    let fanTickets: string[] = [];
    let hasFanPass = false;

    if (user) {
        const [subRes, ticketRes, passRes2] = await Promise.all([
            supabase.from("subscriptions").select("tier_id").eq("fan_id", user.id).eq("creator_id", creator.user_id).eq("status", "active"),
            supabase.from("event_tickets").select("event_id").eq("fan_id", user.id).in("event_id", events.map(e => e.id)),
            pass ? supabase.from("founder_pass_purchases").select("id").eq("fan_id", user.id).eq("pass_id", pass.id).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        fanSubs = (subRes.data || []).map(s => s.tier_id);
        fanTickets = (ticketRes.data || []).map(t => t.event_id);
        hasFanPass = !!passRes2.data;
    }

    // Styles
    const section = (extra: React.CSSProperties = {}): React.CSSProperties => ({
        background: "var(--dash-card)", border: "1px solid var(--dash-border)",
        borderRadius: "16px", overflow: "hidden", boxShadow: "var(--dash-shadow-sm)", ...extra,
    });

    const sectionHead = (title: string, sub: string, icon: React.ReactNode) => (
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--dash-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                {icon}{title}
            </div>
            <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", margin: "4px 0 0" }}>{sub}</p>
        </div>
    );

    const passRemaining = pass ? pass.pass_limit - pass.sold : 0;

    return (
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            {/* Banner & Profile */}
            <div style={{ ...section(), marginBottom: "24px" }}>
                {/* Banner */}
                <div style={{
                    height: "200px", background: creator.banner_image ? `url(${creator.banner_image}) center/cover` : "linear-gradient(135deg, var(--dash-accent-soft) 0%, var(--dash-border) 100%)",
                    position: "relative",
                }} />
                {/* Avatar + Info */}
                <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: "0" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-40px", marginBottom: "16px" }}>
                        <div style={{
                            width: "84px", height: "84px", borderRadius: "50%",
                            border: "4px solid var(--dash-card)", overflow: "hidden",
                            background: "var(--dash-border)", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "24px", fontWeight: 700, color: "var(--dash-text-secondary)", flexShrink: 0,
                        }}>
                            {creator.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : getInitials(creator.display_name)}
                        </div>
                    </div>
                    <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                        {creator.display_name}
                    </h1>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text-secondary)", margin: "0 0 2px" }}>@{creator.username}</p>
                    {creator.bio && (
                        <p style={{ fontSize: "15px", color: "var(--dash-text-secondary)", margin: "12px 0 0", lineHeight: 1.6, maxWidth: "600px" }}>
                            {creator.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Membership Tiers */}
            {tiers.length > 0 && (
                <div style={{ ...section(), marginBottom: "24px" }}>
                    {sectionHead("Choose Your Membership", "Join a tier to access exclusive benefits.", <Crown style={{ width: "18px", height: "18px", color: "var(--dash-text-secondary)" }} />)}
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`, gap: "0" }}>
                        {tiers.map((tier, i) => {
                            const isSubscribed = fanSubs.includes(tier.id);
                            const isFull = tier.member_limit !== null && tier.members_count >= tier.member_limit;
                            return (
                                <div key={tier.id} style={{
                                    padding: "24px",
                                    borderRight: i < tiers.length - 1 ? "1px solid var(--dash-border)" : "none",
                                    display: "flex", flexDirection: "column", gap: "16px",
                                }}>
                                    {tier.badge_label && (
                                        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dash-text-muted)" }}>
                                            {tier.badge_label}
                                        </span>
                                    )}
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 4px" }}>{tier.name}</h3>
                                        <div>
                                            <span style={{ fontSize: "30px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.03em" }}>{formatCurrency(tier.price)}</span>
                                            <span style={{ fontSize: "13px", color: "var(--dash-text-muted)", fontWeight: 500 }}>/month</span>
                                        </div>
                                    </div>
                                    {tier.description && (
                                        <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: 0, lineHeight: 1.6 }}>{tier.description}</p>
                                    )}
                                    {tier.member_limit && (
                                        <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Users style={{ width: "12px", height: "12px" }} />
                                            {tier.member_limit - tier.members_count} spots left
                                        </div>
                                    )}
                                    <div style={{ marginTop: "auto" }}>
                                        {isSubscribed ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "40px", borderRadius: "10px", border: "1px solid var(--dash-border)", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "var(--dash-success-text)" }}>
                                                <CheckCircle style={{ width: "16px", height: "16px" }} /> Subscribed
                                            </div>
                                        ) : isFull ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "40px", borderRadius: "10px", border: "1px solid var(--dash-border)", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "var(--dash-text-muted)" }}>
                                                Sold Out
                                            </div>
                                        ) : (
                                            <Link
                                                href={user ? `/api/checkout/membership?tier_id=${tier.id}` : `/login?redirect=/creator/${username}`}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    height: "40px", borderRadius: "10px", border: "none",
                                                    background: "var(--dash-text-primary)", color: "var(--dash-bg)",
                                                    fontSize: "14px", fontWeight: 600, textDecoration: "none",
                                                }}
                                            >
                                                Join for {formatCurrency(tier.price)}/mo
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Founder Pass */}
            {pass && (
                <div style={{ ...section(), marginBottom: "24px", border: passRemaining <= 10 ? "1px solid rgba(239,120,56,0.4)" : "1px solid var(--dash-border)" }}>
                    <div style={{ padding: "24px 28px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <Flame style={{ width: "18px", height: "18px", color: passRemaining <= 10 ? "#F59E0B" : "var(--dash-text-secondary)" }} />
                                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: passRemaining <= 10 ? "#F59E0B" : "var(--dash-text-muted)" }}>
                                    {passRemaining <= 10 ? `Only ${passRemaining} left!` : "Founder Supporter Pass"}
                                </span>
                            </div>
                            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--dash-text-primary)", margin: "0 0 6px" }}>
                                Become a Founding Member
                            </h3>
                            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
                                Get a permanent founder badge, early access to all events, and recognition on the supporter wall.
                            </p>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <div>
                                    <span style={{ fontSize: "26px", fontWeight: 700, color: "var(--dash-text-primary)", letterSpacing: "-0.02em" }}>{formatCurrency(pass.price)}</span>
                                    <span style={{ fontSize: "13px", color: "var(--dash-text-muted)", fontWeight: 500, marginLeft: "4px" }}>one-time</span>
                                </div>
                                <span style={{ fontSize: "13px", color: "var(--dash-text-muted)", fontWeight: 500 }}>· {pass.sold}/{pass.pass_limit} claimed</span>
                            </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                            {hasFanPass ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "44px", padding: "0 22px", borderRadius: "12px", border: "1px solid var(--dash-border)", fontSize: "15px", fontWeight: 600, color: "var(--dash-success-text)" }}>
                                    <Shield style={{ width: "16px", height: "16px" }} /> Founder
                                </div>
                            ) : passRemaining === 0 ? (
                                <div style={{ height: "44px", padding: "0 22px", borderRadius: "12px", border: "1px solid var(--dash-border)", display: "flex", alignItems: "center", fontSize: "15px", fontWeight: 600, color: "var(--dash-text-muted)" }}>
                                    Sold Out
                                </div>
                            ) : (
                                <Link
                                    href={user ? `/api/checkout/founder-pass?pass_id=${pass.id}` : `/login?redirect=/creator/${username}`}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px",
                                        height: "44px", padding: "0 22px", borderRadius: "12px", border: "none",
                                        background: "var(--dash-text-primary)", color: "var(--dash-bg)",
                                        fontSize: "15px", fontWeight: 600, textDecoration: "none",
                                    }}
                                >
                                    <Flame style={{ width: "16px", height: "16px" }} />
                                    Claim Founder Pass
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            {events.length > 0 && (
                <div style={section()}>
                    {sectionHead("Upcoming Events", "Buy a ticket and attend exclusive sessions.", <Calendar style={{ width: "18px", height: "18px", color: "var(--dash-text-secondary)" }} />)}
                    {events.map((ev, i) => {
                        const hasTicket = fanTickets.includes(ev.id);
                        const isSoldOut = ev.capacity !== null && ev.tickets_sold >= ev.capacity;
                        return (
                            <div key={ev.id} style={{
                                display: "flex", alignItems: "center", gap: "18px", padding: "18px 24px",
                                borderBottom: i < events.length - 1 ? "1px solid var(--dash-border)" : "none",
                            }}>
                                <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "var(--dash-accent-soft)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Calendar style={{ width: "22px", height: "22px", color: "var(--dash-text-secondary)" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                                            <Clock style={{ width: "11px", height: "11px" }} />{formatDate(ev.event_date)}
                                        </span>
                                        {ev.location && <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                                            <MapPin style={{ width: "11px", height: "11px" }} />{ev.location}
                                        </span>}
                                        {ev.stream_url && <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                                            <Video style={{ width: "11px", height: "11px" }} />Virtual
                                        </span>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--dash-text-primary)" }}>
                                            {ev.price === 0 ? "Free" : formatCurrency(ev.price)}
                                        </div>
                                        {ev.capacity && <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: 500 }}>{ev.capacity - ev.tickets_sold} left</div>}
                                    </div>
                                    {hasTicket ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px", height: "36px", padding: "0 14px", borderRadius: "10px", border: "1px solid var(--dash-border)", fontSize: "13px", fontWeight: 600, color: "var(--dash-success-text)" }}>
                                            <CheckCircle style={{ width: "14px", height: "14px" }} /> Attending
                                        </div>
                                    ) : isSoldOut ? (
                                        <div style={{ height: "36px", padding: "0 14px", borderRadius: "10px", border: "1px solid var(--dash-border)", display: "flex", alignItems: "center", fontSize: "13px", fontWeight: 600, color: "var(--dash-text-muted)" }}>
                                            Sold Out
                                        </div>
                                    ) : (
                                        <Link
                                            href={user ? `/api/checkout/event?event_id=${ev.id}` : `/login?redirect=/creator/${username}`}
                                            style={{
                                                display: "flex", alignItems: "center", gap: "5px",
                                                height: "36px", padding: "0 14px", borderRadius: "10px",
                                                background: "var(--dash-text-primary)", color: "var(--dash-bg)",
                                                fontSize: "13px", fontWeight: 600, textDecoration: "none", border: "none",
                                            }}
                                        >
                                            Buy Ticket
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {tiers.length === 0 && events.length === 0 && !pass && (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-card)", border: "1px dashed var(--dash-border)", borderRadius: "16px" }}>
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text-primary)", margin: "0 0 8px" }}>
                        @{creator.username} hasn&apos;t set up offerings yet.
                    </p>
                    <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: 0 }}>Check back soon!</p>
                </div>
            )}
        </div>
    );
}
