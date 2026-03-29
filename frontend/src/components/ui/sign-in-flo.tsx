"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Palette, Heart, Sparkles, Users, ArrowRight, ArrowLeft, CheckCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Google "G" SVG Icon
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const SignInFlo: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<"fan" | "creator" | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [authTab, setAuthTab] = useState<"password" | "magic">("password");

    // Profile completion flow (after Google OAuth first-time login)
    const [needsProfile, setNeedsProfile] = useState(false);
    const [completingProfile, setCompletingProfile] = useState(false);

    // Check if we need to complete profile (redirected from callback with ?complete=true)
    useEffect(() => {
        const complete = searchParams.get('complete');
        const authError = searchParams.get('error');
        if (complete === 'true') {
            setNeedsProfile(true);
        }
        if (authError) {
            const decodedError = decodeURIComponent(authError);
            setError(decodedError === 'auth_failed' 
                ? 'Authentication failed. Please try again.' 
                : decodedError);
        }
    }, [searchParams]);

    // Pre-fill name from Google user metadata when completing profile
    useEffect(() => {
        if (needsProfile) {
            (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const meta = user.user_metadata;
                    if (meta?.full_name) setName(meta.full_name);
                    if (meta?.name) setName(meta.name);
                    const emailPrefix = user.email?.split('@')[0] || '';
                    setUsername(emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsProfile]);

    // ── Google OAuth ──
    const handleGoogleSignIn = async () => {
        if (!role) {
            setError("Please select whether you are a Creator or a Fan before signing in with Google.");
            return;
        }
        setIsGoogleLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) {
                setError(error.message);
                setIsGoogleLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "Failed to initiate Google sign-in");
            setIsGoogleLoading(false);
        }
    };

    // ── Complete Profile (after first Google OAuth) ──
    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) { setError("Please select a role"); return; }
        if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
        setCompletingProfile(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Session expired. Please sign in again."); setCompletingProfile(false); return; }

            const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

            const res = await fetch('/api/auth/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: cleanUsername,
                    display_name: name || cleanUsername,
                    role,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to create profile');
                setCompletingProfile(false);
                return;
            }

            router.push(role === 'creator' ? '/creator' : '/fan');
        } catch (err: any) {
            setError(err.message || "Failed to complete profile");
            setCompletingProfile(false);
        }
    };

    // ── Email/Password Sign In ──
    const handleSignIn = async () => {
        if (!role) {
            setError("Please select whether you are a Creator or a Fan before signing in.");
            return;
        }

        if (authTab === "magic") {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?role=${role}`,
                },
            });
            if (error) { setError(error.message); return; }
            setSuccess("Magic link sent! Check your email inbox.");
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
            router.push(profile?.role === "creator" ? "/creator" : "/fan");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(""); setSuccess("");
        try {
            await handleSignIn();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Shared role card component ──
    const RoleSelector = ({ compact = false }: { compact?: boolean }) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: compact ? "1rem" : "20px" }}>
            {/* Creator Option */}
            <button
                type="button"
                onClick={() => { setRole('creator'); setError(''); }}
                style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: compact ? "8px" : "10px", padding: compact ? "16px 12px" : "20px 16px",
                    background: role === 'creator' ? "rgba(139, 92, 246, 0.15)" : "#111111",
                    border: role === 'creator' ? "2px solid #8B5CF6" : "1.5px solid #222",
                    borderRadius: "14px", cursor: "pointer",
                    transition: "all 0.25s ease",
                    position: "relative", overflow: "hidden"
                }}
            >
                {role === 'creator' && (
                    <div style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Check size={12} color="#FFFFFF" />
                    </div>
                )}
                <div style={{
                    width: compact ? "38px" : "44px", height: compact ? "38px" : "44px", borderRadius: "12px",
                    background: role === 'creator' ? "rgba(139, 92, 246, 0.25)" : "#1A1A1A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.25s"
                }}>
                    <Sparkles size={compact ? 18 : 22} color={role === 'creator' ? "#A78BFA" : "#666"} />
                </div>
                <div>
                    <div style={{ fontSize: compact ? "0.9rem" : "1rem", fontWeight: 700, color: role === 'creator' ? "#FFFFFF" : "#CCC", marginBottom: "2px" }}>Creator</div>
                    <div style={{ fontSize: "0.7rem", color: role === 'creator' ? "#A78BFA" : "#666", lineHeight: "1.3" }}>Monetize your content</div>
                </div>
            </button>

            {/* Fan Option */}
            <button
                type="button"
                onClick={() => { setRole('fan'); setError(''); }}
                style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: compact ? "8px" : "10px", padding: compact ? "16px 12px" : "20px 16px",
                    background: role === 'fan' ? "rgba(59, 130, 246, 0.15)" : "#111111",
                    border: role === 'fan' ? "2px solid #3B82F6" : "1.5px solid #222",
                    borderRadius: "14px", cursor: "pointer",
                    transition: "all 0.25s ease",
                    position: "relative", overflow: "hidden"
                }}
            >
                {role === 'fan' && (
                    <div style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Check size={12} color="#FFFFFF" />
                    </div>
                )}
                <div style={{
                    width: compact ? "38px" : "44px", height: compact ? "38px" : "44px", borderRadius: "12px",
                    background: role === 'fan' ? "rgba(59, 130, 246, 0.25)" : "#1A1A1A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.25s"
                }}>
                    <Users size={compact ? 18 : 22} color={role === 'fan' ? "#60A5FA" : "#666"} />
                </div>
                <div>
                    <div style={{ fontSize: compact ? "0.9rem" : "1rem", fontWeight: 700, color: role === 'fan' ? "#FFFFFF" : "#CCC", marginBottom: "2px" }}>Fan</div>
                    <div style={{ fontSize: "0.7rem", color: role === 'fan' ? "#60A5FA" : "#666", lineHeight: "1.3" }}>Support creators you love</div>
                </div>
            </button>
        </div>
    );

    // ── Profile Completion Screen ──
    if (needsProfile) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#000000",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2rem",
                fontFamily: "var(--font-sans, Inter, sans-serif)",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", filter: "blur(60px)", pointerEvents: "none" }} />

                <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: "64px", height: "64px",
                            background: "rgba(16,185,129,0.12)",
                            borderRadius: "20px", marginBottom: "1rem",
                            boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
                        }}>
                            <CheckCircle size={28} color="#10B981" strokeWidth={1.8} />
                        </div>
                        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.375rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                            Complete Your Profile
                        </h1>
                        <p style={{ fontSize: "0.9rem", color: "#A0A0A0", lineHeight: 1.5 }}>
                            One last step — choose your role and username
                        </p>
                    </div>

                    <div style={{
                        background: "#0A0A0A", borderRadius: "24px",
                        border: "1px solid #222222",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
                        padding: "2rem",
                    }}>
                        <form onSubmit={handleCompleteProfile}>
                            {/* Role selector */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.625rem" }}>I am a...</p>
                                <RoleSelector compact />
                            </div>

                            {/* Name + Username */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                <div style={{ position: "relative" }}>
                                    <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666666", pointerEvents: "none" }} />
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#1A1A1A", border: "1.5px solid #333333",
                                            borderRadius: "12px", padding: "13px 14px 13px 36px",
                                            fontSize: "0.875rem", color: "#FFFFFF", outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#555555")}
                                        onBlur={e => (e.target.style.borderColor = "#333333")}
                                    />
                                </div>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666666", pointerEvents: "none", fontSize: "0.875rem", fontWeight: 600 }}>@</span>
                                    <input
                                        type="text"
                                        placeholder="username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        required
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#1A1A1A", border: "1.5px solid #333333",
                                            borderRadius: "12px", padding: "13px 14px 13px 32px",
                                            fontSize: "0.875rem", color: "#FFFFFF", outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#555555")}
                                        onBlur={e => (e.target.style.borderColor = "#333333")}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div style={{
                                    marginBottom: "12px", padding: "12px 14px", borderRadius: "10px",
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                                    color: "#FF6B6B", fontSize: "0.8125rem",
                                    display: "flex", alignItems: "flex-start", gap: "8px",
                                }}>
                                    <span>⚠</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={completingProfile}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                    marginTop: "8px",
                                    background: completingProfile ? "#D4D4D4" : "#FFFFFF",
                                    color: "#000000", border: "none", borderRadius: "12px",
                                    padding: "15px 24px", fontSize: "0.9375rem", fontWeight: 700,
                                    cursor: completingProfile ? "not-allowed" : "pointer",
                                    opacity: completingProfile ? 0.8 : 1,
                                    transition: "all 0.2s", letterSpacing: "-0.01em",
                                    boxShadow: "0 4px 16px rgba(255,255,255,0.06)",
                                }}
                            >
                                {completingProfile ? (
                                    <>
                                        <span style={{ width: "16px", height: "16px", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                        Setting up...
                                    </>
                                ) : (
                                    <>Get Started <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ── Main Login Screen ──
    return (
        <div style={{
            minHeight: "100vh",
            background: "#000000",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "2rem",
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            position: "relative", overflow: "hidden",
        }}>
            {/* Back to home button */}
            <Link
                href="/"
                style={{
                    position: "absolute", top: "1.5rem", left: "1.5rem",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 14px", borderRadius: "10px",
                    border: "1px solid #333333", background: "#0A0A0A",
                    color: "#A0A0A0", fontSize: "0.8125rem", fontWeight: 600,
                    textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    transition: "all 0.2s", zIndex: 20,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#555555"; e.currentTarget.style.color = "#FFFFFF"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#333333"; e.currentTarget.style.color = "#A0A0A0"; }}
            >
                <ArrowLeft size={14} />
                Back to Home
            </Link>

            {/* Accent blobs */}
            <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.015)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.01)", filter: "blur(60px)", pointerEvents: "none" }} />

            <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>

                {/* Header above card */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "64px", height: "64px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "20px", marginBottom: "1rem",
                        boxShadow: "0 4px 20px rgba(255,255,255,0.04)",
                    }}>
                        <User size={28} color="#FFFFFF" strokeWidth={1.8} />
                    </div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.375rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        Welcome Back
                    </h1>
                    <p style={{ fontSize: "0.9rem", color: "#A0A0A0", lineHeight: 1.5 }}>
                        Sign in to the creator economy
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "#0A0A0A", borderRadius: "24px",
                    border: "1px solid #222222",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                }}>
                    {success ? (
                        <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                <Mail size={30} color="#10B981" />
                            </div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.75rem" }}>Check your email</h2>
                            <p style={{ fontSize: "0.875rem", color: "#A0A0A0", marginBottom: "2rem", lineHeight: 1.6 }}>{success}</p>
                            <button onClick={() => { setEmail(""); setPassword(""); setShowPassword(false); setError(""); setSuccess(""); }} style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: "2rem" }}>
                            
                            {/* ── Role Selection ── */}
                            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.625rem" }}>Are you a...</p>
                            <RoleSelector compact />

                            {/* ── Google OAuth Button ── */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    padding: "14px 24px",
                                    borderRadius: "12px",
                                    border: "1px solid #333333",
                                    background: role ? "#1A1A1A" : "#111",
                                    color: role ? "#FFFFFF" : "#555",
                                    fontSize: "0.9375rem",
                                    fontWeight: 600,
                                    cursor: isGoogleLoading ? "not-allowed" : role ? "pointer" : "not-allowed",
                                    opacity: isGoogleLoading ? 0.7 : role ? 1 : 0.5,
                                    transition: "all 0.2s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                    marginBottom: "1.25rem",
                                }}
                                onMouseOver={e => { if (!isGoogleLoading && role) { e.currentTarget.style.background = "#222222"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)"; }}}
                                onMouseOut={e => { if (!isGoogleLoading && role) { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)"; }}}
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <span style={{ width: "16px", height: "16px", border: "2.5px solid #333", borderTopColor: "#4285F4", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                        Redirecting to Google...
                                    </>
                                ) : (
                                    <>
                                        <GoogleIcon />
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 1.25rem" }}>
                                <div style={{ flex: 1, height: "1px", background: "#333333" }} />
                                <span style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 500, whiteSpace: "nowrap" }}>or sign in with email</span>
                                <div style={{ flex: 1, height: "1px", background: "#333333" }} />
                            </div>

                            <form onSubmit={handleSubmit}>

                                {/* Auth tab toggle */}
                                <div style={{ display: "flex", background: "#1A1A1A", borderRadius: "14px", padding: "4px", marginBottom: "1.5rem" }}>
                                        {["password", "magic"].map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setAuthTab(tab as "password" | "magic")}
                                                style={{
                                                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                                    padding: "10px 16px",
                                                    borderRadius: "10px",
                                                    border: "none",
                                                    fontSize: "0.875rem", fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                    background: authTab === tab ? "#333333" : "transparent",
                                                    color: authTab === tab ? "#FFFFFF" : "#666666",
                                                    boxShadow: authTab === tab ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                                                }}
                                            >
                                                {tab === "magic" && <Sparkles size={14} />}
                                                {tab === "password" ? "Password" : "Magic Link"}
                                            </button>
                                        ))}
                                    </div>

                                {/* Email */}
                                <div style={{ position: "relative", marginBottom: "10px" }}>
                                    <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#666666", pointerEvents: "none" }} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#1A1A1A",
                                            border: "1.5px solid #333333",
                                            borderRadius: "12px",
                                            padding: "14px 16px 14px 40px",
                                            fontSize: "0.9rem", color: "#FFFFFF",
                                            outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#555555")}
                                        onBlur={e => (e.target.style.borderColor = "#333333")}
                                    />
                                </div>

                                {/* Password */}
                                {authTab === "password" && (
                                    <div style={{ position: "relative", marginBottom: "10px" }}>
                                        <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#666666", pointerEvents: "none" }} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            style={{
                                                width: "100%", boxSizing: "border-box",
                                                background: "#1A1A1A",
                                                border: "1.5px solid #333333",
                                                borderRadius: "12px",
                                                padding: "14px 44px 14px 40px",
                                                fontSize: "0.9rem", color: "#FFFFFF",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }}
                                            onFocus={e => (e.target.style.borderColor = "#555555")}
                                            onBlur={e => (e.target.style.borderColor = "#333333")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666666", display: "flex" }}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                )}

                                {/* Forgot password */}
                                {authTab === "password" && (
                                    <div style={{ textAlign: "right", marginBottom: "6px" }}>
                                        <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "#666666", textDecoration: "none", fontWeight: 500 }}
                                            onMouseOver={e => (e.currentTarget.style.color = "#FFFFFF")}
                                            onMouseOut={e => (e.currentTarget.style.color = "#666666")}
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div style={{
                                        marginBottom: "12px", padding: "12px 14px",
                                        borderRadius: "10px",
                                        background: "rgba(239,68,68,0.1)",
                                        border: "1px solid rgba(239,68,68,0.25)",
                                        color: "#FF6B6B", fontSize: "0.8125rem",
                                        display: "flex", alignItems: "flex-start", gap: "8px",
                                    }}>
                                        <span>⚠</span> {error}
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !role}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        marginTop: "8px",
                                        background: isSubmitting ? "#D4D4D4" : role ? "#FFFFFF" : "#333",
                                        color: role ? "#000000" : "#888",
                                        border: "none",
                                        borderRadius: "12px",
                                        padding: "15px 24px",
                                        fontSize: "0.9375rem",
                                        fontWeight: 700,
                                        cursor: isSubmitting || !role ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.8 : 1,
                                        transition: "all 0.2s",
                                        letterSpacing: "-0.01em",
                                        boxShadow: role ? "0 4px 16px rgba(255,255,255,0.06)" : "none",
                                    }}
                                    onMouseOver={e => { if (!isSubmitting && role) { e.currentTarget.style.background = "#E5E5E5"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,255,255,0.08)"; }}}
                                    onMouseOut={e => { if (!isSubmitting && role) { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,255,255,0.06)"; }}}
                                >
                                    {isSubmitting ? (
                                        <><span style={{ width: "16px", height: "16px", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                            Signing in...</>
                                    ) : !role ? (
                                        "Select a role to sign in"
                                    ) : (
                                        <>{authTab === "magic" ? "Send Magic Link" : `Sign In as ${role === 'creator' ? 'Creator' : 'Fan'}`} <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Switch mode — below card */}
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "#A0A0A0" }}>
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            style={{ color: "#FFFFFF", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", textDecoration: "none" }}
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Role indicator below card */}
                {role && (
                    <div className="animate-in fade-in duration-300" style={{ textAlign: "center", marginTop: "12px", color: "#666", fontSize: "0.8rem" }}>
                        Signing in as <span style={{ color: role === 'creator' ? "#A78BFA" : "#60A5FA", fontWeight: 700, textTransform: "capitalize" }}>{role}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: #666666; }
            `}</style>
        </div>
    );
};
