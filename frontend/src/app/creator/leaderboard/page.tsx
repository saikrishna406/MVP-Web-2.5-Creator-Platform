import { createClient } from '@/lib/supabase/server';
import { Trophy, Star, Medal, Crown, Users } from 'lucide-react';
import { formatPoints } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export const metadata = {
    title: 'Leaderboard | Black Bolts',
    description: 'Top fans and creators on the platform.',
};

export default async function LeaderboardPage() {
    const supabase = await createClient();

    const { data: topWallets } = await supabase
        .from('wallets')
        .select('user_id, points_balance')
        .order('points_balance', { ascending: false })
        .limit(50);

    const userIds = topWallets?.map(w => w.user_id) || [];
    let profiles: any[] = [];

    if (userIds.length > 0) {
        const { data } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url, role')
            .in('user_id', userIds);
        profiles = data || [];
    }

    const leaderboardData = topWallets?.map((wallet, index) => {
        const profile = profiles.find(p => p.user_id === wallet.user_id);
        return { rank: index + 1, wallet, profile };
    }) || [];

    const topCreators = leaderboardData.filter(d => d.profile?.role === 'creator').slice(0, 10);
    const topFans = leaderboardData.filter(d => d.profile?.role === 'fan').slice(0, 20);

    const cardStyle: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--dash-shadow-sm)',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '20px 24px',
        borderBottom: '1px solid var(--dash-border)',
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--dash-text-primary)',
    };

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '32px', fontWeight: 700, color: 'var(--dash-text-primary)',
                    letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    Leaderboard <Trophy style={{ width: '28px', height: '28px', color: 'var(--dash-text-secondary)' }} />
                </h1>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dash-text-secondary)', margin: 0 }}>
                    Top fans and creators ranked by engagement points.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Top Fans */}
                <div style={cardStyle}>
                    <div style={headerStyle}>
                        <Star style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                        Top Fans
                        <span style={{
                            marginLeft: 'auto', fontSize: '12px', fontWeight: 600,
                            color: 'var(--dash-text-muted)', background: 'var(--dash-bg)',
                            border: '1px solid var(--dash-border)', borderRadius: '8px', padding: '2px 8px',
                        }}>
                            {topFans.length} ranked
                        </span>
                    </div>
                    <div>
                        {topFans.length > 0 ? topFans.map((entry) => (
                            <LeaderboardRow key={entry.wallet.user_id} entry={entry} />
                        )) : (
                            <EmptyState label="No fans ranked yet" icon={<Users style={{ width: '20px', height: '20px' }} />} />
                        )}
                    </div>
                </div>

                {/* Top Creators */}
                <div style={cardStyle}>
                    <div style={headerStyle}>
                        <Crown style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />
                        Top Creators
                        <span style={{
                            marginLeft: 'auto', fontSize: '12px', fontWeight: 600,
                            color: 'var(--dash-text-muted)', background: 'var(--dash-bg)',
                            border: '1px solid var(--dash-border)', borderRadius: '8px', padding: '2px 8px',
                        }}>
                            {topCreators.length} ranked
                        </span>
                    </div>
                    <div>
                        {topCreators.length > 0 ? topCreators.map((entry) => (
                            <LeaderboardRow key={entry.wallet.user_id} entry={entry} isCreator />
                        )) : (
                            <EmptyState label="No creators ranked yet" icon={<Crown style={{ width: '20px', height: '20px' }} />} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LeaderboardRow({ entry, isCreator = false }: { entry: any; isCreator?: boolean }) {
    const { rank, wallet, profile } = entry;

    const rankColor =
        rank === 1 ? { bg: 'rgba(234,179,8,0.15)', color: '#CA8A04' } :
        rank === 2 ? { bg: 'rgba(148,163,184,0.15)', color: '#64748B' } :
        rank === 3 ? { bg: 'rgba(194,120,60,0.15)', color: '#C2783C' } :
        { bg: 'var(--dash-bg)', color: 'var(--dash-text-muted)' };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 24px',
            borderBottom: '1px solid var(--dash-border)',
            transition: 'background 0.12s',
        }}
            className="hover:bg-[var(--dash-accent-soft)]"
        >
            {/* Rank */}
            <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                background: rankColor.bg, color: rankColor.color,
            }}>
                {rank === 1 ? <Trophy style={{ width: '14px', height: '14px' }} /> :
                 rank === 2 ? <Medal style={{ width: '14px', height: '14px' }} /> :
                 rank === 3 ? <Medal style={{ width: '14px', height: '14px' }} /> :
                 `#${rank}`}
            </div>

            {/* Avatar */}
            <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--dash-border)', border: '2px solid var(--dash-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', fontSize: '12px', fontWeight: 700, color: 'var(--dash-text-secondary)',
            }}>
                {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    getInitials(profile?.display_name || 'U')
                )}
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                    {profile?.display_name || 'Unknown User'}
                    {isCreator && (
                        <span style={{
                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', background: 'var(--dash-accent-soft)',
                            color: 'var(--dash-accent)', padding: '1px 6px', borderRadius: '4px',
                        }}>
                            Creator
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '1px' }}>
                    @{profile?.username || 'unknown'}
                </div>
            </div>

            {/* Points */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '13px', fontWeight: 700, color: 'var(--dash-text-primary)',
                background: 'var(--dash-bg)', border: '1px solid var(--dash-border)',
                padding: '4px 10px', borderRadius: '8px', flexShrink: 0,
            }}>
                <Star style={{ width: '12px', height: '12px', color: 'var(--dash-text-secondary)' }} />
                {formatPoints(wallet.points_balance)} pts
            </div>
        </div>
    );
}

function EmptyState({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: '10px', color: 'var(--dash-text-muted)',
        }}>
            {icon}
            <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{label}</p>
        </div>
    );
}
