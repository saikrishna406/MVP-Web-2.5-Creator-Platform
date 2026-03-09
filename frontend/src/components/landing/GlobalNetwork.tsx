"use client";
import { WorldMap } from "@/components/ui/map";

export function GlobalNetwork() {
    return (
        <div
            id="network"
            style={{
                background: '#0d0c14',
                width: '100%',
                padding: '8rem 0',
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* ambient glows */}
            <div style={{ position: 'absolute', top: 0, left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.015)', filter: 'blur(160px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: 0, right: '20%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(99,102,241,0.015)', filter: 'blur(160px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* centred wrapper */}
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

                {/* heading block – all centred */}
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
                        Global Reach
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.2, letterSpacing: '-0.025em',
                        margin: '0 0 1rem',
                    }}>
                        Connect with Superfans Worldwide
                    </h2>

                    <p style={{
                        fontSize: '1.05rem',
                        color: 'rgba(255,255,255,0.45)',
                        maxWidth: '560px',
                        margin: '0 auto',
                        lineHeight: 1.7,
                        textAlign: 'center',
                    }}>
                        Our platform enables seamless token economics across borders. Break geographical limitations and monetize your audience effortlessly, anywhere in the world.
                    </p>
                </div>

                {/* map */}
                <WorldMap
                    lineColor="#ffffff"
                    dots={[
                        { start: { lat: 34.0522, lng: -118.2437, label: "Los Angeles" }, end: { lat: 40.7128, lng: -74.0060, label: "New York" } },
                        { start: { lat: 40.7128, lng: -74.0060, label: "New York" }, end: { lat: 51.5074, lng: -0.1278, label: "London" } },
                        { start: { lat: 51.5074, lng: -0.1278, label: "London" }, end: { lat: 25.2048, lng: 55.2708, label: "Dubai" } },
                        { start: { lat: 25.2048, lng: 55.2708, label: "Dubai" }, end: { lat: 1.3521, lng: 103.8198, label: "Singapore" } },
                        { start: { lat: 1.3521, lng: 103.8198, label: "Singapore" }, end: { lat: 35.6762, lng: 139.6503, label: "Tokyo" } },
                        { start: { lat: 34.0522, lng: -118.2437, label: "Los Angeles" }, end: { lat: -23.5505, lng: -46.6333, label: "São Paulo" } },
                    ]}
                />
            </div>
        </div>
    );
}
