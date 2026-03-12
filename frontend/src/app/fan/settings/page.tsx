"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Lock, User, Palette } from "lucide-react";

export default function FanSettingsPage() {
    const { theme, toggleTheme } = useTheme();

    const cardStyle: React.CSSProperties = {
        background: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--dash-shadow-sm)',
    };

    const inputStyle: React.CSSProperties = {
        height: '40px',
        padding: '0 12px',
        borderRadius: '8px',
        border: '1px solid var(--dash-border)',
        background: 'var(--dash-input-bg)',
        color: 'var(--dash-text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.15s',
    };

    const btnStyle: React.CSSProperties = {
        height: '40px',
        padding: '0 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
    };

    const sectionTitle = (text: string, icon: React.ReactNode) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--dash-text-primary)',
            marginBottom: '12px',
        }}>
            {icon}
            {text}
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--dash-text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                }}>
                    Settings
                </h1>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dash-text-secondary)', margin: 0 }}>
                    Manage your account preferences.
                </p>
            </div>

            {/* Account Settings */}
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                {sectionTitle('Account Settings', <User style={{ width: '20px', height: '20px', color: 'var(--dash-text-secondary)' }} />)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)', display: 'block', marginBottom: '6px' }}>
                            Display Name
                        </label>
                        <input type="text" placeholder="Your display name" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text-secondary)', display: 'block', marginBottom: '6px' }}>
                            Email Address
                        </label>
                        <input type="email" placeholder="your@email.com" style={inputStyle} />
                    </div>
                    <div>
                        <button style={{ ...btnStyle, background: 'var(--dash-bg)', color: 'var(--dash-text-primary)', border: '1px solid var(--dash-border)' }}>
                            <Lock style={{ width: '14px', height: '14px' }} />
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div style={cardStyle}>
                {sectionTitle('Appearance', <Palette style={{ width: '20px', height: '20px', color: 'var(--dash-text-secondary)' }} />)}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', borderTop: '1px solid var(--dash-border)', marginTop: '8px',
                }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-primary)' }}>Theme</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dash-text-muted)', marginTop: '2px' }}>
                            Switch between Light and Dark mode
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        style={{
                            ...btnStyle,
                            background: theme === 'dark' ? 'var(--dash-accent)' : 'var(--dash-bg)',
                            color: theme === 'dark' ? '#FFFFFF' : 'var(--dash-text-primary)',
                            border: theme === 'dark' ? 'none' : '1px solid var(--dash-border)',
                        }}
                    >
                        {theme === 'dark' ? <Moon style={{ width: '14px', height: '14px' }} /> : <Sun style={{ width: '14px', height: '14px' }} />}
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                </div>
            </div>
        </div>
    );
}
