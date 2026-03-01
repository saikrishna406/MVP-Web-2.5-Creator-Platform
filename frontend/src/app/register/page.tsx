'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap, Mail, Lock, User, ArrowRight, Palette, Heart } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'fan' | 'creator'>('fan');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            setLoading(false);
            return;
        }

        // Sign up
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    user_id: data.user.id,
                    username: username.toLowerCase(),
                    display_name: displayName || username,
                    role,
                });

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            // Create wallet
            const { error: walletError } = await supabase
                .from('wallets')
                .insert({
                    user_id: data.user.id,
                    token_balance: 0,
                    points_balance: 0,
                });

            if (walletError) {
                console.error('Wallet creation error:', walletError);
            }

            setSuccess(true);
            setLoading(false);

            // If auto-confirmed (in development), redirect immediately
            if (data.session) {
                window.location.href = role === 'creator' ? '/creator' : '/fan';
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">Rapid MVP</span>
                    </div>
                    <p className="text-foreground-muted">Join the creator economy revolution</p>
                </div>

                {/* Card */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-success" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Check your email</h2>
                            <p className="text-foreground-muted mb-6">
                                We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>
                            </p>
                            <Link href="/login" className="btn-primary">
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <h2 className="text-xl font-bold mb-6">Create your account</h2>

                            {/* Role selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-3 text-foreground-muted">I am a...</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('fan')}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${role === 'fan'
                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                                : 'border-border hover:border-border-light'
                                            }`}
                                    >
                                        <Heart className={`w-8 h-8 mx-auto mb-2 ${role === 'fan' ? 'text-primary-light' : 'text-foreground-muted'}`} />
                                        <div className="font-semibold text-sm">Fan</div>
                                        <div className="text-xs text-foreground-muted mt-1">Support creators</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('creator')}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${role === 'creator'
                                                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                                                : 'border-border hover:border-border-light'
                                            }`}
                                    >
                                        <Palette className={`w-8 h-8 mx-auto mb-2 ${role === 'creator' ? 'text-accent-light' : 'text-foreground-muted'}`} />
                                        <div className="font-semibold text-sm">Creator</div>
                                        <div className="text-xs text-foreground-muted mt-1">Monetize content</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                            placeholder="your_username"
                                            className="input pl-10"
                                            required
                                            minLength={3}
                                            maxLength={30}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your Display Name"
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="input pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className="input pl-10"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating account...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Create Account
                                            <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-foreground-muted">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
