"use client";

import { motion } from "framer-motion";
import { Users, Coins, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
    {
        num: "01",
        title: "Sign up in seconds",
        desc: "Choose Creator or Fan. Fill in your profile and go live instantly. No technical setup required — just your passion and creativity.",
        icon: Users,
        color: "#ff8c32", // Orange
        features: ["Instant profile creation", "Web3 wallet abstracted via email", "Zero gas fees"],
    },
    {
        num: "02",
        title: "Set up your economy",
        desc: "Create token-gated posts, set your pricing, and build your redemption store. Full control over what your fans can access.",
        icon: Coins,
        color: "#38bdf8", // Blue
        features: ["Custom token pricing", "Gated audio & video drops", "Create physical/digital rewards"],
    },
    {
        num: "03",
        title: "Watch revenue grow",
        desc: "Fans buy tokens to access your content, generating immediate fiat payouts for you via Stripe. Track your superfans via analytics.",
        icon: TrendingUp,
        color: "#10b981", // Green
        features: ["Instant Stripe payouts", "Leaderboards for top fans", "Detailed engagement metrics"],
    },
];

export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            style={{
                width: "100%",
                background: "#000000",
                padding: "8rem 0",
                position: "relative",
            }}
        >
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "5rem" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.35rem 1.2rem",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.65)",
                            marginBottom: "1.25rem",
                        }}
                    >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />
                        Simple Process
                    </div>
                    <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                        Up & running in <em style={{ fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>minutes.</em>
                    </h2>
                </div>

                {/* Grid Layout */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "2rem",
                    position: "relative",
                    zIndex: 10
                }}>
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "1.5rem",
                                padding: "3rem 2.5rem",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.15)";
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                            }}
                        >
                            {/* Ambient background glow */}
                            <div style={{
                                position: "absolute",
                                top: "-20%",
                                right: "-20%",
                                width: "250px",
                                height: "250px",
                                borderRadius: "50%",
                                background: step.color,
                                filter: "blur(90px)",
                                opacity: 0.1,
                                pointerEvents: "none"
                            }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                                <div style={{
                                    width: "3.5rem",
                                    height: "3.5rem",
                                    borderRadius: "1rem",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                                }}>
                                    <step.icon size={26} color="#ffffff" strokeWidth={1.5} />
                                </div>
                                <span style={{
                                    fontSize: "4rem",
                                    fontWeight: 900,
                                    color: "transparent",
                                    WebkitTextStroke: "1px rgba(255,255,255,0.15)",
                                    lineHeight: 0.8,
                                    letterSpacing: "-0.05em"
                                }}>{step.num}</span>
                            </div>

                            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
                                {step.title}
                            </h3>
                            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "2rem", flexGrow: 1 }}>
                                {step.desc}
                            </p>

                            <ul style={{ display: "flex", flexDirection: "column", gap: "0.85rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                {step.features.map(feat => (
                                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <CheckCircle2 size={12} color={step.color} strokeWidth={3} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
