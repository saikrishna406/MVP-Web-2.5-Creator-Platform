"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Image as ImageIcon, Sparkles, Users } from "lucide-react";

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
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?complete=true&role=${role}`,
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

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            const cleanUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");
            
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
            
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
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
                                    I accept the <a href="#" style={{color:"#FFFFFF"}}>terms</a> and have read the <a href="#" style={{color:"#FFFFFF"}}>privacy policy</a>. You must be 18 or over.
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
                        <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#888", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: 0 }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>About you</h1>
                        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "24px" }}>
                            Tell us a bit about yourself
                        </p>
                        
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
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
