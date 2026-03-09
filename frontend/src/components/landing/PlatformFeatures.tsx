"use client";

import { Activity, Map as MapIcon, MessageCircle } from 'lucide-react';
import DottedMap from 'dotted-map';
import { Area, AreaChart, CartesianGrid } from 'recharts';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

/* ─── Dotted mini-map ─── */
const dottedMap = new DottedMap({ height: 50, grid: 'diagonal' });
const mapPoints = dottedMap.getPoints();

function MiniMap() {
    return (
        <svg
            viewBox="0 0 120 60"
            className="w-full"
            style={{ background: 'transparent', display: 'block' }}
        >
            {mapPoints.map((point, i) => (
                <circle key={i} cx={point.x} cy={point.y} r={0.18} fill="rgba(255,255,255,0.28)" />
            ))}
        </svg>
    );
}

/* ─── Chart ─── */
const chartConfig = {
    desktop: { label: 'Token Volume', color: '#ffffff' },
    mobile: { label: 'Active Users', color: '#555555' },
} satisfies ChartConfig;

const chartData = [
    { month: 'Jan', desktop: 120, mobile: 50 },
    { month: 'Feb', desktop: 200, mobile: 80 },
    { month: 'Mar', desktop: 150, mobile: 110 },
    { month: 'Apr', desktop: 250, mobile: 160 },
    { month: 'May', desktop: 400, mobile: 220 },
    { month: 'Jun', desktop: 380, mobile: 290 },
    { month: 'Jul', desktop: 520, mobile: 350 },
    { month: 'Aug', desktop: 800, mobile: 500 },
];

function MonitoringChart() {
    return (
        <ChartContainer className="h-[260px] md:h-[320px] w-full" config={chartConfig}>
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gfDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-desktop)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-desktop)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gfMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-mobile)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-mobile)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            className="bg-[#111116] border border-white/10 text-white rounded-lg shadow-xl"
                        />
                    }
                />
                <Area strokeWidth={2} dataKey="mobile" type="step" fill="url(#gfMobile)" fillOpacity={1} stroke="var(--color-mobile)" stackId="a" />
                <Area strokeWidth={2} dataKey="desktop" type="step" fill="url(#gfDesktop)" fillOpacity={1} stroke="var(--color-desktop)" stackId="a" />
            </AreaChart>
        </ChartContainer>
    );
}

/* ─── Main component ─── */
export function PlatformFeatures() {
    return (
        <section
            id="features"
            style={{
                background: '#000000',
                width: '100%',
                padding: '6rem 0',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* ── centred wrapper (matches other sections) ── */}
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', boxSizing: 'border-box' }}>

                {/* ── heading block ── */}
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.35rem 1.2rem', borderRadius: '999px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
                        marginBottom: '1.25rem',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                        Platform Features
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.2, letterSpacing: '-0.025em',
                        margin: 0,
                    }}>
                        Everything you need to <em style={{ fontStyle: 'italic' }}>build &amp; grow.</em>
                    </h2>
                </div>

                {/* ── bento grid ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '2rem',
                    overflow: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                }}>

                    {/* Cell 1 – Global Monetization map */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* text */}
                        <div style={{ padding: '2.5rem 2rem 1.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                                <MapIcon style={{ width: 14, height: 14 }} />
                                Global Monetization
                            </span>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>
                                Unlock superfans anywhere. Instantly map your global reach.
                            </p>
                        </div>

                        {/* map visual */}
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* floating badge */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                                background: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, padding: '0.4rem 0.85rem',
                                fontSize: '0.75rem', fontWeight: 500, color: '#fff',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 0 30px rgba(0,0,0,0.9)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                                <span>🌍</span> First transaction from Tokyo, JP
                            </div>
                            {/* vignette */}
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: 'radial-gradient(circle at center, transparent 30%, #000 85%)',
                                pointerEvents: 'none',
                            }} />
                            <MiniMap />
                        </div>
                    </div>

                    {/* Cell 2 – DM Interactions */}
                    <div style={{ background: '#060608', padding: '2.5rem 2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                            <MessageCircle style={{ width: 14, height: 14 }} />
                            Premium DM Interactions
                        </span>
                        <p style={{ margin: '0 0 2rem', fontSize: '1.25rem', fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>
                            Engage your audience with seamless 1-on-1 messages &amp; gated chats.
                        </p>

                        {/* Chat bubbles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', display: 'block' }} />
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Sat 10:42 PM</span>
                                </div>
                                <div style={{
                                    background: '#111116', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px 12px 12px 4px',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5,
                                    maxWidth: '85%',
                                }}>
                                    Loved the latest exclusive drop! How long until the next event?
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{
                                    background: '#fff', color: '#000',
                                    borderRadius: '12px 12px 4px 12px',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.5,
                                    maxWidth: '85%',
                                }}>
                                    The next VIP event is launching on Friday at exactly 8PM EST. See you there!
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem' }}>Read · Now</span>
                            </div>
                        </div>
                    </div>

                    {/* Cell 3 – Uptime banner (full width) */}
                    <div style={{
                        gridColumn: '1 / -1',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400, height: 400, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.025)',
                            filter: 'blur(80px)', pointerEvents: 'none',
                        }} />
                        <p style={{
                            margin: 0, position: 'relative', zIndex: 1,
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                            fontWeight: 800, color: '#fff',
                            letterSpacing: '-0.03em', lineHeight: 1,
                        }}>
                            99.99% Node Uptime
                        </p>
                    </div>

                    {/* Cell 4 – Chart (full width) */}
                    <div style={{ gridColumn: '1 / -1', padding: '2.5rem 2rem 0' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                            <Activity style={{ width: 14, height: 14 }} />
                            Token Protocol Growth
                        </span>
                        <p style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>
                            Monitor your creator metrics.{' '}
                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Watch your superfan liquidity thrive in real-time.</span>
                        </p>
                        <MonitoringChart />
                    </div>

                </div>
            </div>
        </section>
    );
}
