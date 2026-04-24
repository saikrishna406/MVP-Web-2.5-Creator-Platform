"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, User, Palette, Save, Loader2, Lock, CheckCircle } from "lucide-react";
import type { Profile } from "@/types";

export default function CreatorSettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState("");

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
            if (data) {
                setProfile(data);
                setDisplayName(data.display_name || "");
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setSaved(false);
        try {
            await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', profile.user_id);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        await supabase.auth.resetPasswordForEmail(user.email);
        setPasswordMsg("Password reset email sent! Check your inbox.");
        setTimeout(() => setPasswordMsg(""), 4000);
    };

    const card: React.CSSProperties = {
        background: 'var(--dash-card)', border: '1px solid var(--dash-border)',
        borderRadius: '16px', padding: '24px', boxShadow: 'var(--dash-shadow-sm)',
        marginBottom: '20px',
    };

    const label: React.CSSProperties = {
        fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)',
        display: 'block', marginBottom: '6px',
    };

    const input: React.CSSProperties = {
        height: '40px', padding: '0 12px', borderRadius: '8px',
        border: '1px solid var(--dash-border)', background: 'var(--dash-input-bg)',
        color: 'var(--dash-text-primary)', fontSize: '14px', fontWeight: 500,
        width: '100%', outline: 'none', transition: 'border-color 0.15s',
    };

    const sectionHead = (text: string, icon: React.ReactNode) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: '20px' }}>
            {icon}{text}
        </div>
    );

    return (
        <div style={{ maxWidth: '600px' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--dash-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px' }}>
                    Settings
                </h1>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dash-text-secondary)', margin: 0 }}>
                    Manage your account preferences.
                </p>
            </div>

            {/* Account */}
            <div style={card}>
                {sectionHead('Account Settings', <User style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />)}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={label}>Username</label>
                        <input type="text" value={profile?.username || ''} disabled style={{ ...input, opacity: 0.5, cursor: 'not-allowed' }} />
                        <p style={{ fontSize: '12px', color: 'var(--dash-text-muted)', marginTop: '4px' }}>Username cannot be changed.</p>
                    </div>
                    <div>
                        <label style={label}>Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                            style={input}
                        />
                    </div>
                    <div>
                        <label style={label}>Email Address</label>
                        <input type="email" value={profile?.email || ''} disabled style={{ ...input, opacity: 0.5, cursor: 'not-allowed' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                height: '40px', padding: '0 20px', borderRadius: '10px',
                                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                background: saved ? 'var(--dash-success-bg)' : 'var(--dash-text-primary)',
                                color: saved ? 'var(--dash-success-text)' : 'var(--dash-bg)',
                                fontSize: '14px', fontWeight: 600, display: 'inline-flex',
                                alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                            }}
                        >
                            {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> :
                             saved ? <CheckCircle style={{ width: '14px', height: '14px' }} /> :
                             <Save style={{ width: '14px', height: '14px' }} />}
                            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                        </button>

                        <button
                            onClick={handlePasswordReset}
                            style={{
                                height: '40px', padding: '0 16px', borderRadius: '10px',
                                border: '1px solid var(--dash-border)', cursor: 'pointer',
                                background: 'var(--dash-bg)', color: 'var(--dash-text-primary)',
                                fontSize: '14px', fontWeight: 500, display: 'inline-flex',
                                alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                            }}
                        >
                            <Lock style={{ width: '14px', height: '14px' }} />
                            Reset Password
                        </button>
                    </div>

                    {passwordMsg && (
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-success-text)', margin: '0' }}>
                            {passwordMsg}
                        </p>
                    )}
                </div>
            </div>

            {/* Appearance */}
            <div style={card}>
                {sectionHead('Appearance', <Palette style={{ width: '18px', height: '18px', color: 'var(--dash-text-secondary)' }} />)}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--dash-border)' }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)' }}>Theme</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                            Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        style={{
                            height: '40px', padding: '0 16px', borderRadius: '10px',
                            border: '1px solid var(--dash-border)', cursor: 'pointer',
                            background: 'var(--dash-bg)', color: 'var(--dash-text-primary)',
                            fontSize: '14px', fontWeight: 500, display: 'inline-flex',
                            alignItems: 'center', gap: '8px', transition: 'all 0.15s',
                        }}
                    >
                        {theme === 'dark' ? <Moon style={{ width: '14px', height: '14px' }} /> : <Sun style={{ width: '14px', height: '14px' }} />}
                        Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </div>
            </div>
        </div>
    );
}
