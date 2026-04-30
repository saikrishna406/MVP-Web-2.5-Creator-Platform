import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Crown, Calendar, Flame, Grid3x3, CheckCircle } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { CreatorPostsGrid } from "@/components/dashboard/CreatorPostsGrid";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const supabase = await createClient();
    const { data: creator } = await supabase
        .from("profiles").select("display_name, bio").eq("username", username).eq("role", "creator").maybeSingle();
    if (!creator) return { title: "Creator Not Found" };
    return {
        title: `${creator.display_name} (@${username}) • Black Bolts photos and videos`,
        description: creator.bio || `Support ${creator.display_name} on Black Bolts.`,
    };
}

export default async function CreatorPublicPage({ params }: Props) {
    const { username } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: creator } = await supabase
        .from("profiles").select("user_id, display_name, username, bio, avatar_url, role")
        .eq("username", username).eq("role", "creator").maybeSingle();
    if (!creator) return notFound();

    const [tiersRes, eventsRes, passRes, discordRes, postCountRes] = await Promise.all([
        supabase.from("membership_tiers").select("*").eq("creator_id", creator.user_id).eq("is_archived", false).order("sort_order"),
        supabase.from("events").select("*").eq("creator_id", creator.user_id).eq("status", "published").gt("event_date", new Date().toISOString()).order("event_date"),
        supabase.from("founder_pass").select("*").eq("creator_id", creator.user_id).eq("is_active", true).maybeSingle(),
        supabase.from("creator_channels").select("channel_name, discord_invite_url, external_channel_id").eq("creator_id", creator.user_id).eq("platform", "discord").eq("is_active", true).maybeSingle(),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.user_id),
    ]);

    const tiers = tiersRes.data || [];
    const events = eventsRes.data || [];
    const pass = passRes.data;
    const discord = discordRes.data;
    const postCount = postCountRes.count || 0;
    const totalMembers = tiers.reduce((sum, t) => sum + (t.members_count || 0), 0);

    let fanSubs: string[] = [];
    let fanTickets: string[] = [];
    let hasFanPass = false;

    if (user) {
        const [s, t, p] = await Promise.all([
            supabase.from("subscriptions").select("tier_id").eq("fan_id", user.id).eq("creator_id", creator.user_id).eq("status", "active"),
            supabase.from("event_tickets").select("event_id").eq("fan_id", user.id).in("event_id", events.map(e => e.id)),
            pass ? supabase.from("founder_pass_purchases").select("id").eq("fan_id", user.id).eq("pass_id", pass.id).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        fanSubs = (s.data || []).map(x => x.tier_id);
        fanTickets = (t.data || []).map(x => x.event_id);
        hasFanPass = !!p.data;
    }

    const passRemaining = pass ? pass.pass_limit - pass.sold : 0;

    return (
        <div style={{ maxWidth: "935px", margin: "0 auto", padding: "30px 20px" }}>
            {/* ── Header (Instagram Style) ── */}
            <header style={{ display: "flex", marginBottom: "44px", alignItems: "flex-start" }}>
                {/* Avatar Left */}
                <div style={{ flex: "1 0 0", display: "flex", justifyContent: "center", marginRight: "30px" }}>
                    <div style={{
                        width: "150px", height: "150px", borderRadius: "50%",
                        background: "var(--dash-border)", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "48px", fontWeight: 700, color: "var(--dash-text-secondary)",
                        flexShrink: 0,
                    }}>
                        {creator.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={creator.avatar_url} alt={creator.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : getInitials(creator.display_name)}
                    </div>
                </div>

                {/* Info Right */}
                <section style={{ flex: "2 0 0", color: "var(--dash-text-primary)" }}>
                    {/* Row 1: Username & Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 400, margin: 0, lineHeight: 1 }}>{creator.username}</h2>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {discord?.external_channel_id && (
                                <a
                                    href={discord.discord_invite_url || `https://discord.com/channels/${discord.external_channel_id}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        padding: "7px 16px", borderRadius: "8px", background: "#5865F2", color: "#fff",
                                        fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px"
                                    }}
                                >
                                    Join Discord Server
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Stats */}
                    <ul style={{ display: "flex", gap: "40px", listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: "16px" }}>
                        <li><span style={{ fontWeight: 600 }}>{postCount}</span> posts</li>
                        <li><span style={{ fontWeight: 600 }}>{totalMembers}</span> members</li>
                        <li><span style={{ fontWeight: 600 }}>{tiers.length}</span> tiers</li>
                    </ul>

                    {/* Row 3: Name & Bio */}
                    <div>
                        <h1 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>{creator.display_name}</h1>
                        {creator.bio && (
                            <div style={{ fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                                {creator.bio}
                            </div>
                        )}
                    </div>
                </section>
            </header>

            {/* ── "Highlights" Section (Tiers, Events, Founder Pass) ── */}
            {(tiers.length > 0 || events.length > 0 || (pass && passRemaining > 0)) && (
                <div style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "30px", marginBottom: "10px", scrollbarWidth: "none" }}>
                    
                    {/* Founder Pass Highlight */}
                    {pass && !hasFanPass && passRemaining > 0 && (
                        <Link href={user ? `/api/checkout/founder-pass?pass_id=${pass.id}` : `/login?redirect=/fan/${username}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "85px", flexShrink: 0 }}>
                            <div style={{ width: "77px", height: "77px", borderRadius: "50%", border: "1px solid var(--dash-border)", padding: "3px" }}>
                                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Flame size={28} color="#F59E0B" />
                                </div>
                            </div>
                            <div style={{ textAlign: "center", width: "100%" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--dash-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Founder</div>
                                <div style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>{formatCurrency(pass.price)}</div>
                            </div>
                        </Link>
                    )}

                    {/* Tiers Highlights */}
                    {tiers.map(tier => {
                        const isSub = fanSubs.includes(tier.id);
                        const isFull = tier.member_limit !== null && tier.members_count >= tier.member_limit;
                        const url = isSub || isFull ? "#" : (user ? `/api/checkout/membership?tier_id=${tier.id}` : `/login?redirect=/fan/${username}`);
                        
                        return (
                            <Link key={tier.id} href={url} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "85px", flexShrink: 0, opacity: isFull && !isSub ? 0.5 : 1, cursor: isFull && !isSub ? "default" : "pointer" }}>
                                <div style={{ width: "77px", height: "77px", borderRadius: "50%", border: "1px solid var(--dash-border)", padding: "3px" }}>
                                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--dash-border)" }}>
                                        {isSub ? <CheckCircle size={28} color="#15803d" /> : <Crown size={28} color="var(--dash-text-primary)" />}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center", width: "100%" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--dash-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tier.name}</div>
                                    <div style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                                        {isSub ? "Joined" : isFull ? "Sold Out" : `${formatCurrency(tier.price)}/mo`}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Events Highlights */}
                    {events.map(ev => {
                        const hasTkt = fanTickets.includes(ev.id);
                        const isSoldOut = ev.capacity !== null && ev.tickets_sold >= ev.capacity;
                        const url = hasTkt || isSoldOut ? "#" : (user ? `/api/checkout/event?event_id=${ev.id}` : `/login?redirect=/fan/${username}`);
                        
                        return (
                            <Link key={ev.id} href={url} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "85px", flexShrink: 0, opacity: isSoldOut && !hasTkt ? 0.5 : 1, cursor: isSoldOut && !hasTkt ? "default" : "pointer" }}>
                                <div style={{ width: "77px", height: "77px", borderRadius: "50%", border: "1px solid var(--dash-border)", padding: "3px" }}>
                                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--dash-border)" }}>
                                        {hasTkt ? <CheckCircle size={28} color="#15803d" /> : <Calendar size={28} color="var(--dash-text-primary)" />}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center", width: "100%" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--dash-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                                    <div style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                                        {hasTkt ? "Going" : isSoldOut ? "Sold Out" : ev.price === 0 ? "Free" : formatCurrency(ev.price)}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* ── Tabs Divider ── */}
            <div style={{ borderTop: "1px solid var(--dash-border)", display: "flex", justifyContent: "center" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "15px 0", borderTop: "1px solid var(--dash-text-primary)",
                    marginTop: "-1px", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--dash-text-primary)"
                }}>
                    <Grid3x3 size={12} /> POSTS
                </div>
            </div>

            {/* ── Grid ── */}
            <CreatorPostsGrid creatorId={creator.user_id} limit={30} />
            
            <style>{`
                @media (max-width: 735px) {
                    header { flex-direction: column; align-items: flex-start; }
                    header > div { margin: 0 0 20px 0 !important; }
                    header > section { width: 100%; }
                    ul { justify-content: space-between; gap: 0 !important; border-top: 1px solid var(--dash-border); border-bottom: 1px solid var(--dash-border); padding: 12px 0 !important; margin-bottom: 16px !important; }
                    ul li { text-align: center; display: flex; flex-direction: column; font-size: 14px !important; color: var(--dash-text-muted); }
                    ul li span { color: var(--dash-text-primary); font-size: 14px; }
                }
            `}</style>
        </div>
    );
}
