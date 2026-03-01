'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [mode, setMode] = useState<'password' | 'magic'>('password');

    const supabase = createClient();

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // Get profile to determine redirect
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', data.user.id)
                .single();

            window.location.href = profile?.role === 'creator' ? '/creator' : '/fan';
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setMagicLinkSent(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
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
                    <p className="text-foreground-muted">Welcome back to the creator economy</p>
                </div>

                {/* Card */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {magicLinkSent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-success" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Check your email</h2>
                            <p className="text-foreground-muted mb-6">
                                We sent a magic link to <span className="text-foreground font-medium">{email}</span>
                            </p>
                            <button
                                onClick={() => { setMagicLinkSent(false); setMode('password'); }}
                                className="btn-secondary"
                            >
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mode toggle */}
                            <div className="flex rounded-lg bg-background p-1 mb-6">
                                <button
                                    onClick={() => setMode('password')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'password'
                                            ? 'bg-background-card text-foreground shadow-sm'
                                            : 'text-foreground-muted hover:text-foreground'
                                        }`}
                                >
                                    Password
                                </button>
                                <button
                                    onClick={() => setMode('magic')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'magic'
                                            ? 'bg-background-card text-foreground shadow-sm'
                                            : 'text-foreground-muted hover:text-foreground'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Sparkles className="w-4 h-4" /> Magic Link
                                    </span>
                                </button>
                            </div>

                            <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
                                <div className="space-y-4">
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

                                    {mode === 'password' && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-foreground-muted">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="input pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

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
                                                {mode === 'password' ? 'Signing in...' : 'Sending magic link...'}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-foreground-muted">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
