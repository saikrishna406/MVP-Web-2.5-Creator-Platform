"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Image as ImageIcon, Sparkles, Users, X } from "lucide-react";

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const INTERESTS = [
    "Advice", "Animation", "Art", "Blogging", "Comedy",
    "Comics", "Commissions", "Community", "Cosplay", "Crafts",
    "Dance & Theatre", "Design", "Drawing & Painting",
    "Education", "Food & Drink", "Fundraising",
    "Game Development", "Gaming", "Health & Fitness",
    "Lifestyle", "Money", "Music", "News", "Nsfw", "Other",
    "Photography", "Podcast", "Science & Tech", "Social",
    "Software", "Spirituality", "Streaming", "Video and Film",
    "Writing"
];

export const MultiStepRegister = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Steps: 1 = Role + Signup, 2 = About You, 3 = Username, 4 = Avatar, 5 = Interests
    const [step, setStep] = useState(1);
    
    // Form data
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    const [role, setRole] = useState<'creator' | 'fan' | null>(null);
    
    const [bio, setBio] = useState("");
    const [username, setUsername] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Track if this is a Google OAuth completion flow
    const [isGoogleFlow, setIsGoogleFlow] = useState(false);

    // Privacy policy modal
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    // Detect Google OAuth return (?complete=true) — pre-fill data and skip to step 2
    useEffect(() => {
        const complete = searchParams.get('complete');
        if (complete === 'true') {
            setIsGoogleFlow(true);
            // Read role from localStorage (saved before OAuth redirect)
            const savedRole = localStorage.getItem('oauth_signup_role') as 'creator' | 'fan' | null;
            if (savedRole && ['creator', 'fan'].includes(savedRole)) {
                setRole(savedRole);
            }
            // Pre-fill from Google user metadata
            (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const meta = user.user_metadata;
                    setDisplayName(meta?.full_name || meta?.name || '');
                    setEmail(user.email || '');
                    // Generate username from Google name
                    const googleName = meta?.full_name || meta?.name || user.email?.split('@')[0] || 'user';
                    setUsername(googleName.toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 10000));
                    // Use Google avatar as preview
                    if (meta?.avatar_url || meta?.picture) {
                        setAvatarPreview(meta?.avatar_url || meta?.picture);
                    }
                } else {
                    // No session — redirect to login
                    router.push('/login?error=Session+expired.+Please+sign+in+again.');
                }
            })();
            // Jump to step 2 (About You) — they already authenticated
            setStep(2);
            setTermsAccepted(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Automatically generate username suggestion from email if empty
    useEffect(() => {
        if (step === 3 && username === "" && email) {
            const emailPrefix = email.split('@')[0];
            setUsername(emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 10000));
        }
    }, [step, email, username]);

    const totalSteps = 5;

    const handleNextStep = () => {
        setError("");
        
        if (step === 1) {
            if (!role) {
                setError("Please select whether you are a Creator or a Fan.");
                return;
            }
            if (!displayName || !email || !password) {
                setError("Please fill in all fields.");
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
            if (!termsAccepted) {
                setError("You must accept the terms to continue.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!displayName) {
                setError("Display name is required.");
                return;
            }
            if (isGoogleFlow && !role) {
                setError("Please select whether you are a Creator or a Fan.");
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (username.length < 3) {
                setError("Username must be at least 3 characters.");
                return;
            }
            setStep(4);
        } else if (step === 4) {
            setStep(5);
        } else if (step === 5) {
            handleFinalSubmit();
        }
    };

    const handleGoogleSignIn = async () => {
        if (!role) {
            setError("Please select whether you are a Creator or a Fan before signing up with Google.");
            return;
        }
        setIsGoogleLoading(true);
        setError("");
        try {
            // Save role to localStorage AND cookies
            // Cookies survive the OAuth redirect chain (query params get stripped by Supabase)
            localStorage.setItem('oauth_signup_role', role);
            document.cookie = `oauth_role=${role}; path=/; max-age=600; SameSite=Lax`;
            document.cookie = `oauth_flow=signup; path=/; max-age=600; SameSite=Lax`;

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to initiate Google sign-in");
            setIsGoogleLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            const cleanUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");

            // ── Google OAuth flow: user is already authenticated, just create profile ──
            if (isGoogleFlow) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error("Session expired. Please sign in again.");
                }

                // Upload avatar if a new file was chosen (not the Google avatar)
                let avatarUrl = avatarPreview || user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
                if (avatarFile) {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, avatarFile);
                    if (!uploadError && uploadData) {
                        const { data: publicUrlData } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(fileName);
                        avatarUrl = publicUrlData.publicUrl;
                    }
                }

                // Create profile via API
                const res = await fetch('/api/auth/complete-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: cleanUsername,
                        display_name: displayName,
                        role: role,
                        bio,
                        interests: selectedInterests,
                        avatar_url: avatarUrl
                    }),
                });

                if (!res.ok && res.status !== 409) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to create profile');
                }

                // Clean up localStorage
                localStorage.removeItem('oauth_signup_role');

                // Redirect to the correct dashboard
                router.push(role === 'creator' ? "/creator" : "/fan");
                return;
            }

            // ── Email/Password flow ──
            // 1. Sign up user
            const { data, error: authError } = await supabase.auth.signUp({
                email, 
                password,
                options: {
                    data: { 
                        username: cleanUsername, 
                        full_name: displayName, 
                        role: role,
                        bio,
                        interests: selectedInterests
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            
            if (authError) {
                throw new Error(authError.message);
            }
            
            // 2. Upload avatar if selected
            let avatarUrl = "";
            if (avatarFile && data.user) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${data.user.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);
                    
                if (!uploadError && uploadData) {
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    avatarUrl = publicUrlData.publicUrl;
                }
            }
            
            // Profile is created via backend triggers or we explicitly call the API
            if (data.session) {
                try {
                    const res = await fetch('/api/auth/complete-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: cleanUsername,
                            display_name: displayName,
                            role: role,
                            bio,
                            interests: selectedInterests,
                            avatar_url: avatarUrl
                        }),
                    });
                    
                    if (!res.ok && res.status !== 409) {
                        console.error('Failed to create profile via API');
                    }
                } catch (err) {
                    console.error('Profile creation error:', err);
                }
                
                // Redirect to the correct dashboard based on role
                router.push(role === 'creator' ? "/creator" : "/fan");
            } else {
                setSuccess("Account created! Check your email to verify your account.");
            }
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof e.target?.result === 'string') {
                    setAvatarPreview(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const renderInputStyle = {
        width: "100%", boxSizing: "border-box" as const,
        background: "#1A1A1A", border: "1.5px solid transparent",
        borderRadius: "12px", padding: "14px 16px",
        fontSize: "0.95rem", color: "#FFFFFF",
        outline: "none", transition: "all 0.2s ease",
        fontFamily: "inherit"
    };

    // Card style based on screenshots
    const cardStyle = {
        background: "#0A0A0A",
        borderRadius: "16px",
        border: "1px solid #222222",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        padding: "32px",
        width: "100%",
        maxWidth: "480px",
        position: "relative" as const,
        zIndex: 10
    };
    
    const buttonStyle = {
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        background: "#FFFFFF", color: "#000000",
        border: "none", borderRadius: "24px",
        padding: "16px", fontSize: "1rem", fontWeight: 700,
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.8 : 1, transition: "all 0.2s",
        marginTop: "16px"
    };

    // Progress bar component
    const ProgressBar = () => (
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: i < step ? "#FFFFFF" : "#333333",
                        transition: "background 0.3s ease"
                    }}
                />
            ))}
        </div>
    );

    if (success) {
        return (
            <div style={{ minHeight: "100vh", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={cardStyle}>
                    <div style={{ textAlign: "center", padding: "2rem 0" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                            <Check size={32} color="#10B981" />
                        </div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.5rem" }}>Check your email</h2>
                        <p style={{ color: "#A0A0A0" }}>{success}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "#000000",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "2rem",
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            flexDirection: "column"
        }}>
            
            <Link href="/" style={{
                position: "absolute", top: "2rem", left: "2rem",
                display: "inline-flex", alignItems: "center", gap: "6px",
                color: "#FFFFFF", fontSize: "0.9rem", fontWeight: 600,
                textDecoration: "none",
            }}>
                <ArrowLeft size={16} /> Back to Home
            </Link>

            <div style={cardStyle}>
                
                {step > 1 && <ProgressBar />}

                {error && (
                    <div style={{
                        marginBottom: "16px", padding: "12px", borderRadius: "8px",
                        background: "rgba(239,68,68,0.1)", color: "#FF6B6B", fontSize: "0.875rem",
                        display: "flex", alignItems: "flex-start", gap: "8px", border: "1px solid rgba(239,68,68,0.2)"
                    }}>
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* STEP 1: ROLE SELECTION + SIGNUP */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "6px" }}>Join the community</h1>
                            <p style={{ color: "#888", fontSize: "0.9rem" }}>Choose your role to get started</p>
                        </div>

                        {/* Role Selection */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                            {/* Creator Option */}
                            <button
                                onClick={() => setRole('creator')}
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    gap: "10px", padding: "20px 16px",
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
                                    width: "44px", height: "44px", borderRadius: "12px",
                                    background: role === 'creator' ? "rgba(139, 92, 246, 0.25)" : "#1A1A1A",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.25s"
                                }}>
                                    <Sparkles size={22} color={role === 'creator' ? "#A78BFA" : "#666"} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "1rem", fontWeight: 700, color: role === 'creator' ? "#FFFFFF" : "#CCC", marginBottom: "2px" }}>Creator</div>
                                    <div style={{ fontSize: "0.75rem", color: role === 'creator' ? "#A78BFA" : "#666", lineHeight: "1.3" }}>Monetize your content</div>
                                </div>
                            </button>

                            {/* Fan Option */}
                            <button
                                onClick={() => setRole('fan')}
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    gap: "10px", padding: "20px 16px",
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
                                    width: "44px", height: "44px", borderRadius: "12px",
                                    background: role === 'fan' ? "rgba(59, 130, 246, 0.25)" : "#1A1A1A",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.25s"
                                }}>
                                    <Users size={22} color={role === 'fan' ? "#60A5FA" : "#666"} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "1rem", fontWeight: 700, color: role === 'fan' ? "#FFFFFF" : "#CCC", marginBottom: "2px" }}>Fan</div>
                                    <div style={{ fontSize: "0.75rem", color: role === 'fan' ? "#60A5FA" : "#666", lineHeight: "1.3" }}>Support creators you love</div>
                                </div>
                            </button>
                        </div>

                        {/* Signup Fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <input
                                type="text"
                                placeholder="Display name"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                style={renderInputStyle}
                                onFocus={e => e.target.style.borderColor = "#444"}
                                onBlur={e => e.target.style.borderColor = "transparent"}
                            />
                            
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={renderInputStyle}
                                onFocus={e => e.target.style.borderColor = "#444"}
                                onBlur={e => e.target.style.borderColor = "transparent"}
                            />
                            
                            <input
                                type="password"
                                placeholder="Choose a password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={renderInputStyle}
                                onFocus={e => e.target.style.borderColor = "#444"}
                                onBlur={e => e.target.style.borderColor = "transparent"}
                            />
                            
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginTop: "4px", cursor: "pointer" }}>
                                <input 
                                    type="checkbox" 
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    style={{ 
                                        width: "18px", height: "18px", 
                                        borderRadius: "4px", marginTop: "2px",
                                        accentColor: "#FFFFFF"
                                    }} 
                                />
                                <span style={{ fontSize: "0.8rem", color: "#A0A0A0", lineHeight: "1.4" }}>
                                    I accept the <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} style={{ color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}>terms</button> and have read the <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} style={{ color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}>privacy policy</button>. You must be 18 or over.
                                </span>
                            </label>

                            <button onClick={handleNextStep} style={{
                                ...buttonStyle,
                                background: role ? "#FFFFFF" : "#333",
                                color: role ? "#000" : "#888",
                                cursor: role ? "pointer" : "not-allowed",
                            }}>
                                {role === 'creator' ? "Continue as Creator →" : role === 'fan' ? "Continue as Fan →" : "Select a role to continue"}
                            </button>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0", justifyContent: "center" }}>
                                <div style={{ flex: 1, height: "1px", background: "#222" }} />
                                <span style={{ fontSize: "0.8rem", color: "#666" }}>or sign up with</span>
                                <div style={{ flex: 1, height: "1px", background: "#222" }} />
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    padding: "14px", borderRadius: "24px",
                                    border: "1.5px solid #222", background: "#1A1A1A",
                                    color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 700,
                                    cursor: isGoogleLoading ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <GoogleIcon /> Google
                            </button>
                            
                            <div style={{ textAlign: "center", marginTop: "12px" }}>
                                <p style={{ fontSize: "0.9rem", color: "#A0A0A0" }}>
                                    Already have an account? <Link href="/login" style={{ color: "#FFFFFF", fontWeight: 700 }}>Log in</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: ABOUT YOU */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {!isGoogleFlow && (
                            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#888", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: 0 }}>
                                <ArrowLeft size={14} /> Back
                            </button>
                        )}
                        
                        {isGoogleFlow && (
                            <div style={{ 
                                display: "flex", alignItems: "center", gap: "8px", 
                                marginBottom: "16px", padding: "10px 14px",
                                background: "#111", borderRadius: "10px", border: "1px solid #222" 
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span style={{ fontSize: "0.8rem", color: "#888" }}>Signed in with Google</span>
                            </div>
                        )}

                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>About you</h1>
                        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "24px" }}>
                            Tell us a bit about yourself
                        </p>

                        {/* Role selection for Google OAuth users */}
                        {isGoogleFlow && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, marginBottom: "10px", color: "#FFFFFF" }}>I am a...</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <button
                                        onClick={() => setRole('creator')}
                                        style={{
                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                            gap: "8px", padding: "16px 12px",
                                            background: role === 'creator' ? "rgba(139, 92, 246, 0.15)" : "#111111",
                                            border: role === 'creator' ? "2px solid #8B5CF6" : "1.5px solid #222",
                                            borderRadius: "14px", cursor: "pointer",
                                            transition: "all 0.25s ease",
                                            position: "relative", overflow: "hidden"
                                        }}
                                    >
                                        {role === 'creator' && (
                                            <div style={{ position: "absolute", top: "6px", right: "6px", width: "18px", height: "18px", borderRadius: "50%", background: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Check size={10} color="#FFFFFF" />
                                            </div>
                                        )}
                                        <Sparkles size={20} color={role === 'creator' ? "#A78BFA" : "#666"} />
                                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: role === 'creator' ? "#FFFFFF" : "#CCC" }}>Creator</div>
                                    </button>
                                    <button
                                        onClick={() => setRole('fan')}
                                        style={{
                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                            gap: "8px", padding: "16px 12px",
                                            background: role === 'fan' ? "rgba(59, 130, 246, 0.15)" : "#111111",
                                            border: role === 'fan' ? "2px solid #3B82F6" : "1.5px solid #222",
                                            borderRadius: "14px", cursor: "pointer",
                                            transition: "all 0.25s ease",
                                            position: "relative", overflow: "hidden"
                                        }}
                                    >
                                        {role === 'fan' && (
                                            <div style={{ position: "absolute", top: "6px", right: "6px", width: "18px", height: "18px", borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Check size={10} color="#FFFFFF" />
                                            </div>
                                        )}
                                        <Users size={20} color={role === 'fan' ? "#60A5FA" : "#666"} />
                                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: role === 'fan' ? "#FFFFFF" : "#CCC" }}>Fan</div>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>Display name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    style={renderInputStyle}
                                    onFocus={e => e.target.style.borderColor = "#444"}
                                    onBlur={e => e.target.style.borderColor = "transparent"}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>Bio</label>
                                <textarea
                                    placeholder="Introduce yourself so others can get to know you..."
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    style={{
                                        ...renderInputStyle,
                                        minHeight: "120px",
                                        resize: "vertical"
                                    }}
                                    onFocus={e => e.target.style.borderColor = "#444"}
                                    onBlur={e => e.target.style.borderColor = "transparent"}
                                />
                            </div>

                            <button onClick={handleNextStep} style={buttonStyle}>
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: USERNAME */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#888", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: 0 }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "24px" }}>Pick a username</h1>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <p style={{ color: "#D0D0D0", fontSize: "0.95rem" }}>What would you like your link to be?</p>
                            
                            <div style={{ ...renderInputStyle, display: "flex", alignItems: "center", padding: "14px 16px" }}>
                                <span style={{ fontWeight: 700, color: "#FFFFFF", marginRight: "4px" }}>mvpcreator.com/</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    style={{
                                        border: "none", background: "transparent", outline: "none", 
                                        width: "100%", fontSize: "0.95rem", color: "#A0A0A0"
                                    }}
                                />
                            </div>
                            
                            <div style={{ 
                                background: "#1A1A1A", borderRadius: "8px", padding: "16px", 
                                display: "flex", alignItems: "center", gap: "12px", 
                                color: "#A0A0A0", fontSize: "0.9rem", border: "1px solid #222"
                            }}>
                                <span style={{ fontSize: "1.2rem" }}>💡</span>
                                <div style={{ width: "1px", height: "20px", background: "#333" }}></div>
                                You can change it anytime!
                            </div>

                            <button onClick={handleNextStep} style={buttonStyle}>
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: AVATAR */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "#888", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: 0 }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "24px" }}>Choose your profile picture</h1>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
                            
                            <label style={{
                                width: "100%", padding: "12px", background: "#1A1A1A",
                                borderRadius: "24px", textAlign: "center", cursor: "pointer",
                                fontWeight: 600, color: "#FFFFFF", fontSize: "0.95rem",
                                display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                                border: "1px solid #222"
                            }}>
                                <ImageIcon size={18} /> Choose image
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                            </label>

                            <div style={{
                                width: "160px", height: "160px", borderRadius: "50%",
                                background: avatarPreview ? `url(${avatarPreview}) center/cover` : "#1A1A1A",
                                display: "flex", justifyContent: "center", alignItems: "center",
                                border: "4px solid #222", overflow: "hidden"
                            }}>
                                {!avatarPreview && (
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#4AD2BB" }}></div>
                                        <div style={{ color: "#4AD2BB", fontSize: "2rem", fontWeight: "900", transform: "rotate(90deg)" }}>3</div>
                                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#4AD2BB" }}></div>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ 
                                width: "100%", background: "#1A1A1A", borderRadius: "8px", padding: "16px", 
                                display: "flex", alignItems: "center", gap: "12px", 
                                color: "#A0A0A0", fontSize: "0.9rem", border: "1px solid #222"
                            }}>
                                <span style={{ fontSize: "1.2rem" }}>💡</span>
                                <div style={{ width: "1px", height: "20px", background: "#333" }}></div>
                                You can change this anytime!
                            </div>

                            <button onClick={handleNextStep} style={{...buttonStyle, marginTop: "0"}}>
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: INTERESTS */}
                {step === 5 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => setStep(4)} style={{ background: "none", border: "none", color: "#888", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: 0 }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>Choose your interests</h1>
                        <p style={{ color: "#D0D0D0", fontSize: "0.95rem", marginBottom: "24px", lineHeight: "1.4" }}>
                            Pick the categories that best match {role === 'creator' ? 'what you do' : 'what you love'}. You can update them at anytime!
                        </p>
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px", maxHeight: "300px", overflowY: "auto", paddingRight: "8px" }}>
                            {INTERESTS.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "24px",
                                        border: selectedInterests.includes(interest) ? "2px solid #FFFFFF" : "1.5px solid #444",
                                        background: selectedInterests.includes(interest) ? "#FFFFFF" : "transparent",
                                        color: selectedInterests.includes(interest) ? "#000000" : "#A0A0A0",
                                        fontSize: "0.95rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>

                        <button onClick={handleNextStep} style={buttonStyle}>
                            {isLoading ? (
                                <span style={{ width: "20px", height: "20px", border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                            ) : `Create my ${role} account`}
                        </button>
                    </div>
                )}
            </div>

            {step === 1 && role && (
                <div className="animate-in fade-in duration-300" style={{ textAlign: "center", marginTop: "20px", color: "#666", fontSize: "0.85rem" }}>
                    Signing up as a <span style={{ color: role === 'creator' ? "#A78BFA" : "#60A5FA", fontWeight: 700, textTransform: "capitalize" }}>{role}</span>
                </div>
            )}

            {/* ── Privacy Policy Modal ── */}
            {showPrivacyPolicy && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.8)",
                        backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "1.5rem",
                    }}
                    onClick={() => setShowPrivacyPolicy(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: "#0A0A0A",
                            border: "1px solid #222",
                            borderRadius: "20px",
                            width: "100%",
                            maxWidth: "680px",
                            maxHeight: "85vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "20px 24px",
                            borderBottom: "1px solid #1A1A1A",
                            flexShrink: 0,
                        }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
                                Privacy Policy
                            </h2>
                            <button
                                onClick={() => setShowPrivacyPolicy(false)}
                                style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    border: "1px solid #333", background: "#111",
                                    color: "#888", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.15s",
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#FFF"; }}
                                onMouseOut={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = "#888"; }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body — scrollable */}
                        <div style={{
                            overflowY: "auto",
                            padding: "24px",
                            flex: 1,
                            lineHeight: 1.7,
                            fontSize: "0.875rem",
                            color: "#CCCCCC",
                        }}>
                            <p style={{ color: "#666", fontSize: "0.75rem", marginBottom: "20px" }}>Last updated: April 2025</p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px", marginTop: "0" }}>1. Introduction</h3>
                            <p style={{ marginBottom: "20px" }}>
                                Black Bolt Provisions LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides a Discord-integrated engagement and
                                rewards infrastructure designed to track and reward community participation. This Privacy Policy
                                explains how we collect, use, and protect information when users interact with our Discord bot,
                                platform, and related services.
                            </p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>2. Information We Collect</h3>
                            <p style={{ marginBottom: "8px" }}>To operate our services, we may collect the following categories of data:</p>
                            <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
                                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#FFF" }}>Discord Identity Data:</strong> Discord User ID, username, discriminator, and global display name to identify and associate activity with your account.</li>
                                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#FFF" }}>Engagement &amp; Activity Data:</strong> We collect interaction metadata such as message frequency, timestamps, and participation signals to calculate reward points.</li>
                                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#FFF" }}>Message Content (Limited Use):</strong> If enabled through Discord&apos;s Message Content Intent, message content may be temporarily processed only to analyze engagement context. We do not store message content long-term unless explicitly required for moderation, fraud prevention, or compliance purposes.</li>
                                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#FFF" }}>Presence Data:</strong> Online status and activity signals (if enabled) to enhance engagement tracking.</li>
                                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#FFF" }}>Transaction Data:</strong> If you redeem rewards, we may collect necessary contact or shipping information to fulfill orders.</li>
                            </ul>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>3. How We Use Your Data</h3>
                            <p style={{ marginBottom: "8px" }}>We use collected data strictly for the following purposes:</p>
                            <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Reward Processing:</strong> To calculate, assign, and manage engagement-based rewards (&ldquo;Black Bolt&rdquo; points).</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Platform Functionality:</strong> To operate, maintain, and improve our engagement infrastructure.</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Fraud Prevention &amp; Security:</strong> To detect abuse, bot activity, or manipulation of engagement systems.</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Fulfillment:</strong> To process and deliver redeemed goods or services.</li>
                            </ul>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>4. Data Sharing and Third-Party Services</h3>
                            <p style={{ marginBottom: "8px" }}>
                                We do not sell your personal data. We may share limited data only with trusted service providers necessary to operate our platform, including:
                            </p>
                            <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Infrastructure Providers:</strong> such as Vercel, Supabase (hosting, database, and backend services)</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Payment Processors:</strong> such as Stripe (for secure transaction handling)</li>
                            </ul>
                            <p style={{ marginBottom: "20px" }}>These providers process data on our behalf and are subject to their own privacy and security obligations.</p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>5. Data Retention</h3>
                            <p style={{ marginBottom: "8px" }}>We retain user data only as long as necessary to operate our services:</p>
                            <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
                                <li style={{ marginBottom: "6px" }}>Engagement and activity data is retained while you are actively using servers where our bot is installed.</li>
                                <li style={{ marginBottom: "6px" }}>Data may be deleted upon request or after a period of inactivity.</li>
                                <li style={{ marginBottom: "6px" }}>Message content, if processed, is not stored long-term unless required for security or legal reasons.</li>
                            </ul>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>6. User Rights and Control</h3>
                            <p style={{ marginBottom: "8px" }}>You have control over your data:</p>
                            <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Access &amp; Deletion:</strong> You may request access to or deletion of your data at any time.</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Opt-Out:</strong> You can stop data collection by removing the Black Bolt bot from your server or revoking its permissions.</li>
                                <li style={{ marginBottom: "6px" }}><strong style={{ color: "#FFF" }}>Post-Removal Data:</strong> Upon removal, associated data will be deleted within a reasonable timeframe unless required for security or legal obligations.</li>
                            </ul>
                            <p style={{ marginBottom: "20px" }}>To make a request, contact us using the details below.</p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>7. Children&apos;s Privacy</h3>
                            <p style={{ marginBottom: "20px" }}>
                                Our services are not intended for individuals under the age of 13 (or the minimum age required by Discord in your region). We do not knowingly collect personal data from children.
                            </p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>8. Security</h3>
                            <p style={{ marginBottom: "20px" }}>
                                We implement reasonable technical and organizational safeguards to protect your data. However, no system is completely secure, and we cannot guarantee absolute security.
                            </p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>9. Changes to This Policy</h3>
                            <p style={{ marginBottom: "20px" }}>
                                We may update this Privacy Policy from time to time. Continued use of our services after changes constitutes acceptance of the updated policy. We encourage users to review this policy periodically.
                            </p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>10. Governing Law</h3>
                            <p style={{ marginBottom: "20px" }}>
                                This Privacy Policy is governed by the laws of the State of Wyoming, United States.
                            </p>

                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>11. Contact Information</h3>
                            <p style={{ marginBottom: "4px" }}>For questions, requests, or concerns regarding this Privacy Policy, please contact:</p>
                            <div style={{
                                background: "#111", border: "1px solid #222", borderRadius: "12px",
                                padding: "16px", marginTop: "8px",
                            }}>
                                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#FFFFFF" }}>Black Bolt Provisions LLC</p>
                                <a href="mailto:srichard@blackboltprovisions.com" style={{ color: "#A78BFA", textDecoration: "none", fontSize: "0.85rem" }}>
                                    srichard@blackboltprovisions.com
                                </a>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: "16px 24px",
                            borderTop: "1px solid #1A1A1A",
                            flexShrink: 0,
                        }}>
                            <button
                                onClick={() => setShowPrivacyPolicy(false)}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "#FFFFFF",
                                    color: "#000000",
                                    fontSize: "0.9375rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                                onMouseOver={e => e.currentTarget.style.background = "#E5E5E5"}
                                onMouseOut={e => e.currentTarget.style.background = "#FFFFFF"}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
