import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && user) {
            // Check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                // Existing user — redirect to their dashboard
                const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }

            // New OAuth user — check if we have user metadata with role info
            // (This would be set if they came via email+password signup)
            const meta = user.user_metadata;

            if (meta?.username && meta?.role) {
                // Auto-create profile from signup metadata
                try {
                    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                    const serviceClient = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    const cleanUsername = meta.username.toLowerCase().replace(/[^a-z0-9_]/g, '');

                    // Create profile
                    await serviceClient.from('profiles').insert({
                        user_id: user.id,
                        username: cleanUsername,
                        display_name: meta.full_name || meta.name || cleanUsername,
                        role: meta.role,
                        avatar_url: meta.avatar_url || null,
                    });

                    // Create wallet
                    await serviceClient.from('wallets').insert({
                        user_id: user.id,
                        token_balance: 0,
                        points_balance: 0,
                    });

                    const redirectPath = meta.role === 'creator' ? '/creator' : '/fan';
                    return NextResponse.redirect(`${origin}${redirectPath}`);
                } catch (err) {
                    console.error('[auth/callback] Auto-profile creation error:', err);
                }
            }

            // No profile and no metadata — Google OAuth first-time user
            // Redirect to complete registration
            return NextResponse.redirect(`${origin}/register?complete=true`);
        }
    }

    // If code exchange fails, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
