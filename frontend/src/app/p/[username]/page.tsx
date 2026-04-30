import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Crown, FileText, ExternalLink, Link2, Grid3X3 } from "lucide-react";
import { getInitials, formatTokens } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ username: string }> };

const RESERVED = ["login","register","auth","creator","fan","api","demo","privacy","favicon.ico"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    if (RESERVED.includes(username)) return {};
    const supabase = await createClient();
    const { data: c } = await supabase.from("profiles").select("display_name, bio, avatar_url").eq("username", username).eq("role", "creator").maybeSingle();
    if (!c) return { title: "Not Found" };
    return {
        title: `${c.display_name} | Black Bolts`,
        description: c.bio || `Support ${c.display_name} on Black Bolts.`,
        openGraph: { title: `${c.display_name} | Black Bolts`, description: c.bio || `Support ${c.display_name} on Black Bolts.`, images: c.avatar_url ? [c.avatar_url] : [] },
    };
}

export default async function PublicCreatorPage({ params }: Props) {
    const { username } = await params;
    if (RESERVED.includes(username)) return notFound();
    const supabase = await createClient();

    const { data: creator } = await supabase.from("profiles")
        .select("user_id, display_name, username, bio, avatar_url, role, social_links, category")
        .eq("username", username).eq("role", "creator").maybeSingle();
    if (!creator) return notFound();

    const [discordRes, postsRes, pkgRes] = await Promise.all([
        supabase.from("creator_channels").select("channel_name, discord_invite_url").eq("creator_id", creator.user_id).eq("platform", "discord").eq("is_active", true).maybeSingle(),
        supabase.from("posts").select("id, title, image_url, likes_count, comments_count").eq("creator_id", creator.user_id).order("created_at", { ascending: false }).limit(12),
        supabase.from("creator_packages").select("id, name, token_price, post_limit, description, badge_name").eq("creator_id", creator.user_id).eq("is_active", true).order("sort_order"),
    ]);
    const discord = discordRes.data;
    const posts = postsRes.data || [];
    const packages = pkgRes.data || [];
    const { count: fanCount } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("creator_id", creator.user_id).eq("status", "active");
    const socialLinks = (creator.social_links || {}) as Record<string, string>;
    const primaryLink = Object.values(socialLinks).find(Boolean);

    return (
        <>
        <div className="pub-page">
            {/* HEADER */}
            <div className="pub-header">
                <div className="pub-avatar-col">
                    <div className="pub-avatar-ring">
                        <div className="pub-avatar">
                            {creator.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={creator.avatar_url} alt={creator.display_name} className="pub-avatar-img"/>
                                : <span className="pub-avatar-init">{getInitials(creator.display_name)}</span>}
                        </div>
                    </div>
                </div>
                <div className="pub-info-col">
                    <div className="pub-row-1">
                        <h1 className="pub-username">{creator.username}</h1>
                        {discord?.discord_invite_url && (
                            <a href={discord.discord_invite_url} target="_blank" rel="noopener noreferrer" className="pub-btn-discord">
                                <ExternalLink size={13}/> Join Server
                            </a>
                        )}
                    </div>
                    <div className="pub-row-2">
                        <span className="pub-stat"><strong>{posts.length}</strong> posts</span>
                        <span className="pub-stat"><strong>{fanCount||0}</strong> fans</span>
                        <span className="pub-stat"><strong>{packages.length}</strong> packages</span>
                    </div>
                    {creator.display_name && <div className="pub-display-name">{creator.display_name}</div>}
                    {creator.category && <div className="pub-category">{creator.category}</div>}
                    {creator.bio && <p className="pub-bio">{creator.bio}</p>}
                    {primaryLink && <a href={primaryLink} target="_blank" rel="noopener noreferrer" className="pub-link"><Link2 size={13}/>{primaryLink.replace(/^https?:\/\/(www\.)?/,'')}</a>}
                    <div className="pub-cta-row">
                        <Link href="/register" className="pub-btn-primary">Sign Up Free</Link>
                        <Link href="/login" className="pub-btn-outline">Log In</Link>
                    </div>
                </div>
            </div>
            {/* Mobile stats */}
            <div className="pub-mobile-stats">
                <span className="pub-stat"><strong>{posts.length}</strong> posts</span>
                <span className="pub-stat"><strong>{fanCount||0}</strong> fans</span>
                <span className="pub-stat"><strong>{packages.length}</strong> packages</span>
            </div>
            {/* Highlights */}
            {packages.length > 0 && (
                <div className="pub-highlights">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="pub-highlight">
                            <div className="pub-hl-ring"><div className="pub-hl-inner"><Crown size={22} className="pub-hl-icon"/></div></div>
                            <span className="pub-hl-label">{pkg.badge_name||pkg.name}</span>
                        </div>
                    ))}
                </div>
            )}
            {/* Discord banner */}
            {discord?.discord_invite_url && (
                <div className="pub-discord-banner">
                    <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#5865F2,#7289DA)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--dash-text-primary)'}}>{discord.channel_name||'Discord Community'}</div>
                        <div style={{fontSize:12,color:'var(--dash-text-muted)'}}>Join &amp; engage to earn rewards</div>
                    </div>
                    <a href={discord.discord_invite_url} target="_blank" rel="noopener noreferrer" className="pub-btn-discord-sm"><ExternalLink size={13}/> Join</a>
                </div>
            )}
            {/* Tabs */}
            <div className="pub-tabs"><span className="pub-tab pub-tab--active"><Grid3X3 size={16}/><span>Posts</span></span></div>
            {/* Post grid */}
            {posts.length===0 ? (
                <div className="pub-empty">
                    <div className="pub-empty-circle"><FileText size={32}/></div>
                    <h3 className="pub-empty-h">No posts yet</h3>
                    <p className="pub-empty-p">Check back soon for new content!</p>
                </div>
            ) : (
                <div className="pub-grid">
                    {posts.map(post => (
                        <div key={post.id} className="pub-cell">
                            {post.image_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={post.image_url} alt={post.title} className="pub-cell-img" loading="lazy"/>
                                : <div className="pub-cell-noimg"><FileText size={24}/></div>}
                            <div className="pub-cell-overlay">
                                <span className="pub-cell-stat">&#9829; {post.likes_count||0}</span>
                                <span className="pub-cell-stat">&#128172; {post.comments_count||0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <style>{`
            .pub-page{max-width:935px;margin:0 auto;padding-bottom:80px}
            .pub-header{display:flex;align-items:flex-start;gap:40px;padding:32px 16px 24px}
            .pub-avatar-col{flex-shrink:0}
            .pub-avatar-ring{width:150px;height:150px;border-radius:50%;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);padding:3px}
            .pub-avatar{width:100%;height:100%;border-radius:50%;background:var(--dash-card);border:3px solid var(--dash-bg);overflow:hidden;display:flex;align-items:center;justify-content:center}
            .pub-avatar-img{width:100%;height:100%;object-fit:cover;display:block}
            .pub-avatar-init{font-size:48px;font-weight:800;color:var(--dash-text-secondary)}
            .pub-info-col{flex:1;display:flex;flex-direction:column;gap:12px;min-width:0;padding-top:8px}
            .pub-row-1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
            .pub-username{font-size:22px;font-weight:300;color:var(--dash-text-primary);margin:0;letter-spacing:-0.01em}
            .pub-row-2{display:flex;gap:28px}
            .pub-stat{font-size:16px;color:var(--dash-text-secondary)}
            .pub-stat strong{color:var(--dash-text-primary);font-weight:700}
            .pub-display-name{font-size:14px;font-weight:700;color:var(--dash-text-primary)}
            .pub-category{display:inline-block;font-size:12px;font-weight:600;color:#3897f0}
            .pub-bio{font-size:14px;color:var(--dash-text-primary);line-height:1.6;margin:0;white-space:pre-wrap}
            .pub-link{display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:600;color:#8ac7ff;text-decoration:none}
            .pub-link:hover{text-decoration:underline}
            .pub-cta-row{display:flex;gap:8px;margin-top:4px}
            .pub-btn-primary{display:inline-flex;align-items:center;gap:6px;padding:7px 20px;border-radius:8px;border:none;background:#0095f6;color:#fff;font-size:14px;font-weight:600;text-decoration:none;transition:.15s}
            .pub-btn-primary:hover{opacity:.88}
            .pub-btn-outline{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border:1.5px solid var(--dash-border);border-radius:8px;background:var(--dash-card);color:var(--dash-text-primary);font-size:14px;font-weight:600;text-decoration:none;transition:.15s}
            .pub-btn-outline:hover{background:var(--dash-border)}
            .pub-btn-discord{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;border:none;background:#5865F2;color:#fff;font-size:14px;font-weight:600;text-decoration:none;transition:.15s}
            .pub-btn-discord:hover{opacity:.88}
            .pub-btn-discord-sm{display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:8px;border:none;background:#5865F2;color:#fff;font-size:13px;font-weight:600;text-decoration:none;flex-shrink:0}
            .pub-discord-banner{display:flex;align-items:center;gap:12px;padding:14px 20px;margin:0 16px 4px;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:12px}
            .pub-mobile-stats{display:none;justify-content:space-around;padding:12px 0;border-top:1px solid var(--dash-border);border-bottom:1px solid var(--dash-border);margin:0 0 4px}
            .pub-mobile-stats .pub-stat{font-size:14px;display:flex;flex-direction:column;align-items:center;gap:1px}
            .pub-highlights{display:flex;gap:20px;overflow-x:auto;padding:16px;scrollbar-width:none;border-bottom:1px solid var(--dash-border)}
            .pub-highlights::-webkit-scrollbar{display:none}
            .pub-highlight{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0}
            .pub-hl-ring{width:77px;height:77px;border-radius:50%;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);padding:2.5px}
            .pub-hl-inner{width:100%;height:100%;border-radius:50%;background:var(--dash-card);border:2.5px solid var(--dash-bg);display:flex;align-items:center;justify-content:center}
            .pub-hl-icon{color:var(--dash-text-secondary)}
            .pub-hl-label{font-size:12px;font-weight:400;color:var(--dash-text-primary);max-width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .pub-tabs{display:flex;justify-content:center;border-bottom:1px solid var(--dash-border)}
            .pub-tab{display:flex;align-items:center;gap:6px;padding:12px 28px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dash-text-muted);border-top:2px solid transparent;margin-top:-1px}
            .pub-tab--active{color:var(--dash-text-primary);border-top-color:var(--dash-text-primary)}
            .pub-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:3px}
            .pub-cell{position:relative;aspect-ratio:1;overflow:hidden;background:var(--dash-border);cursor:pointer}
            .pub-cell-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
            .pub-cell:hover .pub-cell-img{transform:scale(1.06)}
            .pub-cell-noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dash-text-muted);background:var(--dash-bg)}
            .pub-cell-overlay{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;gap:20px;opacity:0;transition:opacity .2s}
            .pub-cell:hover .pub-cell-overlay{opacity:1}
            .pub-cell-stat{font-size:16px;font-weight:700;color:#fff;display:flex;align-items:center;gap:5px}
            .pub-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 24px;text-align:center}
            .pub-empty-circle{width:64px;height:64px;border-radius:50%;border:2.5px solid var(--dash-text-primary);display:flex;align-items:center;justify-content:center;color:var(--dash-text-primary)}
            .pub-empty-h{font-size:20px;font-weight:600;color:var(--dash-text-primary);margin:0}
            .pub-empty-p{font-size:14px;color:var(--dash-text-muted);margin:0}
            @media(max-width:735px){
                .pub-header{gap:24px;padding:20px 12px 16px}
                .pub-avatar-ring{width:86px;height:86px}
                .pub-avatar-init{font-size:28px}
                .pub-username{font-size:18px}
                .pub-row-2{display:none}
                .pub-mobile-stats{display:flex}
                .pub-cta-row{flex-wrap:wrap}
            }
        `}</style>
        </>
    );
}
