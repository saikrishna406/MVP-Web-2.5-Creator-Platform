"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Github, Twitter, Linkedin, Mail, Lock, User, Palette, Heart, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SignInFloProps {
    initialMode?: "signin" | "signup";
}

export const SignInFlo: React.FC<SignInFloProps> = ({ initialMode = "signin" }) => {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<"fan" | "creator">("fan");
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [authTab, setAuthTab] = useState<"password" | "magic">("password");

    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
            router.push(profile?.role === "creator" ? "/creator" : "/fan");
        }
    };

    const handleSignUp = async () => {
        if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
        const { data, error: authError } = await supabase.auth.signUp({
            email, password,
            options: {
                data: { username: username.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""), full_name: name || username, role },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (authError) { setError(authError.message); return; }
        if (data.session) { router.push(role === "creator" ? "/creator" : "/fan"); }
        else { setSuccess("Account created! Check your email to verify your account."); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(""); setSuccess("");
        try {
            if (isSignUp) await handleSignUp();
            else await handleSignIn();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setEmail(""); setPassword(""); setName(""); setUsername("");
        setShowPassword(false); setError(""); setSuccess("");
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fff0f0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Back to home button */}
            <Link
                href="/"
                style={{
                    position: "absolute",
                    top: "1.5rem",
                    left: "1.5rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #E8E8E8",
                    background: "#FFFFFF",
                    color: "#4A4A4A",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                    zIndex: 20,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#FF424D"; e.currentTarget.style.color = "#FF424D"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#E8E8E8"; e.currentTarget.style.color = "#4A4A4A"; }}
            >
                <ArrowLeft size={14} />
                Back to Home
            </Link>

            {/* Background accent blobs */}
            <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,66,77,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,66,77,0.04)", filter: "blur(60px)", pointerEvents: "none" }} />

            <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>

                {/* Header above card */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "64px", height: "64px",
                        background: "rgba(255,66,77,0.12)",
                        borderRadius: "20px",
                        marginBottom: "1rem",
                        boxShadow: "0 4px 20px rgba(255,66,77,0.15)",
                    }}>
                        <User size={28} color="#FF424D" strokeWidth={1.8} />
                    </div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0D0D0D", marginBottom: "0.375rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p style={{ fontSize: "0.9rem", color: "#6E6E6E", lineHeight: 1.5 }}>
                        {isSignUp ? "Join the creator economy revolution" : "Sign in to the creator economy"}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "#FFFFFF",
                    borderRadius: "24px",
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
                            <button onClick={toggleMode} style={{ color: "#FF424D", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: "2rem" }}>
                            <form onSubmit={handleSubmit}>

                                {/* Auth tab toggle — sign in only */}
                                {!isSignUp && (
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
                                )}

                                {/* Role selector — sign up only */}
                                {isSignUp && (
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
                                                        cursor: "pointer",
                                                        transition: "all 0.2s",
                                                        boxShadow: role === val ? "0 2px 12px rgba(255,66,77,0.12)" : "none",
                                                    }}
                                                >
                                                    <Icon size={20} />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Name + Username — sign up only */}
                                {isSignUp && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                        {[
                                            { placeholder: "Full Name", value: name, onChange: (v: string) => setName(v), type: "text" },
                                            { placeholder: "Username", value: username, onChange: (v: string) => setUsername(v), type: "text", required: true },
                                        ].map(field => (
                                            <div key={field.placeholder} style={{ position: "relative" }}>
                                                <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#A8A8A8", pointerEvents: "none" }} />
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={field.value}
                                                    onChange={e => field.onChange(e.target.value)}
                                                    required={field.required}
                                                    style={{
                                                        width: "100%", boxSizing: "border-box",
                                                        background: "#F9F9F9",
                                                        border: "1.5px solid #E8E8E8",
                                                        borderRadius: "12px",
                                                        padding: "13px 14px 13px 36px",
                                                        fontSize: "0.875rem", color: "#0D0D0D",
                                                        outline: "none",
                                                        transition: "border-color 0.2s",
                                                    }}
                                                    onFocus={e => (e.target.style.borderColor = "#FF424D")}
                                                    onBlur={e => (e.target.style.borderColor = "#E8E8E8")}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

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
                                {(isSignUp || authTab === "password") && (
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
                                {!isSignUp && authTab === "password" && (
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
                                            {isSignUp ? "Creating account..." : "Signing in..."}</>
                                    ) : (
                                        <>{isSignUp ? "Create Account" : authTab === "magic" ? "Send Magic Link" : "Sign In"} <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0 1.25rem" }}>
                                <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
                                <span style={{ fontSize: "0.75rem", color: "#A8A8A8", fontWeight: 500, whiteSpace: "nowrap" }}>Or continue with</span>
                                <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
                            </div>

                            {/* Social buttons */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                {[
                                    { icon: <Github size={18} />, label: "GitHub" },
                                    { icon: <Twitter size={18} />, label: "Twitter" },
                                    { icon: <Linkedin size={18} />, label: "LinkedIn" },
                                ].map(s => (
                                    <button
                                        key={s.label}
                                        type="button"
                                        title={s.label}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: "12px",
                                            borderRadius: "12px",
                                            border: "1.5px solid #E8E8E8",
                                            background: "#FAFAFA",
                                            cursor: "pointer",
                                            color: "#4A4A4A",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = "#D0D0D0"; e.currentTarget.style.background = "#F2F2F2"; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = "#E8E8E8"; e.currentTarget.style.background = "#FAFAFA"; }}
                                    >
                                        {s.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Switch mode — below card */}
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "#6E6E6E" }}>
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            style={{ color: "#FF424D", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
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
