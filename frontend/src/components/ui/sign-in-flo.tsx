"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Palette, Heart, Sparkles, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
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
    const [role, setRole] = useState<"fan" | "creator">("fan");
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
            setError('Authentication failed. Please try again.');
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
                    // Generate a username suggestion from email
                    const emailPrefix = user.email?.split('@')[0] || '';
                    setUsername(emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsProfile]);

    // ── Google OAuth ──
    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
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
            // Browser will redirect — no need to setIsGoogleLoading(false)
        } catch (err: any) {
            setError(err.message || "Failed to initiate Google sign-in");
            setIsGoogleLoading(false);
        }
    };

    // ── Complete Profile (after first Google OAuth) ──
    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
        setCompletingProfile(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Session expired. Please sign in again."); setCompletingProfile(false); return; }

            const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

            // Create profile via API
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
        if (authTab === "magic") {
            // Magic link flow
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
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



    // ── Profile Completion Screen ──
    if (needsProfile) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fff0f0 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2rem",
                fontFamily: "var(--font-sans, Inter, sans-serif)",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,66,77,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />

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
                        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0D0D0D", marginBottom: "0.375rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                            Complete Your Profile
                        </h1>
                        <p style={{ fontSize: "0.9rem", color: "#6E6E6E", lineHeight: 1.5 }}>
                            One last step — choose your role and username
                        </p>
                    </div>

                    <div style={{
                        background: "#FFFFFF", borderRadius: "24px",
                        border: "1.5px solid #E8E8E8",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                        padding: "2rem",
                    }}>
                        <form onSubmit={handleCompleteProfile}>
                            {/* Role selector */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#4A4A4A", marginBottom: "0.625rem" }}>I am a...</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    {[
                                        { val: "fan" as const, label: "Fan", Icon: Heart },
                                        { val: "creator" as const, label: "Creator", Icon: Palette },
                                    ].map(({ val, label, Icon }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setRole(val)}
                                            style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                gap: "8px", padding: "18px 12px",
                                                borderRadius: "14px",
                                                border: role === val ? "2px solid #FF424D" : "2px solid #E8E8E8",
                                                background: role === val ? "rgba(255,66,77,0.06)" : "#FAFAFA",
                                                color: role === val ? "#FF424D" : "#6E6E6E",
                                                fontWeight: 600, fontSize: "0.875rem",
                                                cursor: "pointer", transition: "all 0.2s",
                                                boxShadow: role === val ? "0 2px 12px rgba(255,66,77,0.12)" : "none",
                                            }}
                                        >
                                            <Icon size={20} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name + Username */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                <div style={{ position: "relative" }}>
                                    <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#A8A8A8", pointerEvents: "none" }} />
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#F9F9F9", border: "1.5px solid #E8E8E8",
                                            borderRadius: "12px", padding: "13px 14px 13px 36px",
                                            fontSize: "0.875rem", color: "#0D0D0D", outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#FF424D")}
                                        onBlur={e => (e.target.style.borderColor = "#E8E8E8")}
                                    />
                                </div>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#A8A8A8", pointerEvents: "none", fontSize: "0.875rem", fontWeight: 600 }}>@</span>
                                    <input
                                        type="text"
                                        placeholder="username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        required
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#F9F9F9", border: "1.5px solid #E8E8E8",
                                            borderRadius: "12px", padding: "13px 14px 13px 32px",
                                            fontSize: "0.875rem", color: "#0D0D0D", outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#FF424D")}
                                        onBlur={e => (e.target.style.borderColor = "#E8E8E8")}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div style={{
                                    marginBottom: "12px", padding: "12px 14px", borderRadius: "10px",
                                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                                    color: "#DC2626", fontSize: "0.8125rem",
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
                                    background: completingProfile ? "#E5333D" : "#FF424D",
                                    color: "#FFFFFF", border: "none", borderRadius: "12px",
                                    padding: "15px 24px", fontSize: "0.9375rem", fontWeight: 700,
                                    cursor: completingProfile ? "not-allowed" : "pointer",
                                    opacity: completingProfile ? 0.8 : 1,
                                    transition: "all 0.2s", letterSpacing: "-0.01em",
                                    boxShadow: "0 4px 16px rgba(255,66,77,0.3)",
                                }}
                            >
                                {completingProfile ? (
                                    <>
                                        <span style={{ width: "16px", height: "16px", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
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

    // ── Main Login / Sign Up Screen ──
    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fff0f0 100%)",
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
                    border: "1.5px solid #E8E8E8", background: "#FFFFFF",
                    color: "#4A4A4A", fontSize: "0.8125rem", fontWeight: 600,
                    textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    transition: "all 0.2s", zIndex: 20,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#FF424D"; e.currentTarget.style.color = "#FF424D"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#E8E8E8"; e.currentTarget.style.color = "#4A4A4A"; }}
            >
                <ArrowLeft size={14} />
                Back to Home
            </Link>

            {/* Accent blobs */}
            <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,66,77,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,66,77,0.04)", filter: "blur(60px)", pointerEvents: "none" }} />

            <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>

                {/* Header above card */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "64px", height: "64px",
                        background: "rgba(255,66,77,0.12)",
                        borderRadius: "20px", marginBottom: "1rem",
                        boxShadow: "0 4px 20px rgba(255,66,77,0.15)",
                    }}>
                        <User size={28} color="#FF424D" strokeWidth={1.8} />
                    </div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0D0D0D", marginBottom: "0.375rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        Welcome Back
                    </h1>
                    <p style={{ fontSize: "0.9rem", color: "#6E6E6E", lineHeight: 1.5 }}>
                        Sign in to the creator economy
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "#FFFFFF", borderRadius: "24px",
                    border: "1.5px solid #E8E8E8",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                }}>
                    {success ? (
                        <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                <Mail size={30} color="#10B981" />
                            </div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0D0D0D", marginBottom: "0.75rem" }}>Check your email</h2>
                            <p style={{ fontSize: "0.875rem", color: "#6E6E6E", marginBottom: "2rem", lineHeight: 1.6 }}>{success}</p>
                            <button onClick={() => { setEmail(""); setPassword(""); setShowPassword(false); setError(""); setSuccess(""); }} style={{ color: "#FF424D", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: "2rem" }}>
                            {/* ── Google OAuth Button (Primary CTA) ── */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    padding: "14px 24px",
                                    borderRadius: "12px",
                                    border: "1.5px solid #E8E8E8",
                                    background: "#FFFFFF",
                                    color: "#3C4043",
                                    fontSize: "0.9375rem",
                                    fontWeight: 600,
                                    cursor: isGoogleLoading ? "not-allowed" : "pointer",
                                    opacity: isGoogleLoading ? 0.7 : 1,
                                    transition: "all 0.2s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    marginBottom: "1.25rem",
                                }}
                                onMouseOver={e => !isGoogleLoading && ((e.currentTarget.style.background = "#F8F9FA"), (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)"))}
                                onMouseOut={e => !isGoogleLoading && ((e.currentTarget.style.background = "#FFFFFF"), (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"))}
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <span style={{ width: "16px", height: "16px", border: "2.5px solid #E8E8E8", borderTopColor: "#4285F4", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
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
                                <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
                                <span style={{ fontSize: "0.75rem", color: "#A8A8A8", fontWeight: 500, whiteSpace: "nowrap" }}>or sign in with email</span>
                                <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
                            </div>

                            <form onSubmit={handleSubmit}>

                                {/* Auth tab toggle */}
                                <div style={{ display: "flex", background: "#F2F2F2", borderRadius: "14px", padding: "4px", marginBottom: "1.5rem" }}>
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
                                                    background: authTab === tab ? "#FFFFFF" : "transparent",
                                                    color: authTab === tab ? "#0D0D0D" : "#6E6E6E",
                                                    boxShadow: authTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                                }}
                                            >
                                                {tab === "magic" && <Sparkles size={14} />}
                                                {tab === "password" ? "Password" : "Magic Link"}
                                            </button>
                                        ))}
                                    </div>

                                {/* Email */}
                                <div style={{ position: "relative", marginBottom: "10px" }}>
                                    <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#A8A8A8", pointerEvents: "none" }} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        style={{
                                            width: "100%", boxSizing: "border-box",
                                            background: "#F9F9F9",
                                            border: "1.5px solid #E8E8E8",
                                            borderRadius: "12px",
                                            padding: "14px 16px 14px 40px",
                                            fontSize: "0.9rem", color: "#0D0D0D",
                                            outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "#FF424D")}
                                        onBlur={e => (e.target.style.borderColor = "#E8E8E8")}
                                    />
                                </div>

                                {/* Password */}
                                {authTab === "password" && (
                                    <div style={{ position: "relative", marginBottom: "10px" }}>
                                        <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#A8A8A8", pointerEvents: "none" }} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            style={{
                                                width: "100%", boxSizing: "border-box",
                                                background: "#F9F9F9",
                                                border: "1.5px solid #E8E8E8",
                                                borderRadius: "12px",
                                                padding: "14px 44px 14px 40px",
                                                fontSize: "0.9rem", color: "#0D0D0D",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }}
                                            onFocus={e => (e.target.style.borderColor = "#FF424D")}
                                            onBlur={e => (e.target.style.borderColor = "#E8E8E8")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A8A8", display: "flex" }}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                )}

                                {/* Forgot password */}
                                {authTab === "password" && (
                                    <div style={{ textAlign: "right", marginBottom: "6px" }}>
                                        <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "#A8A8A8", textDecoration: "none", fontWeight: 500 }}
                                            onMouseOver={e => (e.currentTarget.style.color = "#FF424D")}
                                            onMouseOut={e => (e.currentTarget.style.color = "#A8A8A8")}
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
                                        background: "rgba(239,68,68,0.08)",
                                        border: "1px solid rgba(239,68,68,0.2)",
                                        color: "#DC2626", fontSize: "0.8125rem",
                                        display: "flex", alignItems: "flex-start", gap: "8px",
                                    }}>
                                        <span>⚠</span> {error}
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        marginTop: "8px",
                                        background: isSubmitting ? "#E5333D" : "#FF424D",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: "12px",
                                        padding: "15px 24px",
                                        fontSize: "0.9375rem",
                                        fontWeight: 700,
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.8 : 1,
                                        transition: "all 0.2s",
                                        letterSpacing: "-0.01em",
                                        boxShadow: "0 4px 16px rgba(255,66,77,0.3)",
                                    }}
                                    onMouseOver={e => !isSubmitting && ((e.currentTarget.style.background = "#E5333D"), (e.currentTarget.style.transform = "translateY(-1px)"), (e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,66,77,0.38)"))}
                                    onMouseOut={e => !isSubmitting && ((e.currentTarget.style.background = "#FF424D"), (e.currentTarget.style.transform = ""), (e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,66,77,0.3)"))}
                                >
                                    {isSubmitting ? (
                                        <><span style={{ width: "16px", height: "16px", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                            Signing in...</>
                                    ) : (
                                        <>{authTab === "magic" ? "Send Magic Link" : "Sign In"} <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Switch mode — below card */}
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "#6E6E6E" }}>
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            style={{ color: "#FF424D", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", textDecoration: "none" }}
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: #A8A8A8; }
            `}</style>
        </div>
    );
};
