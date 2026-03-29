import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const complete = searchParams.get('complete');
    const roleParam = searchParams.get('role');
    const error_param = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    console.log('[auth/callback] Hit callback route');
    console.log('[auth/callback] URL:', request.url);
    console.log('[auth/callback] Code present:', !!code);
    console.log('[auth/callback] Complete:', complete);
    console.log('[auth/callback] Role:', roleParam);
    console.log('[auth/callback] Error param:', error_param);

    // If there's an error parameter from Supabase/Google, log and redirect
    if (error_param) {
        console.error('[auth/callback] OAuth error from provider:', error_param, error_description);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error_param)}`);
    }

    if (code) {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log('[auth/callback] exchangeCodeForSession result:', { user: user?.id, error: error?.message });

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
                console.log('[auth/callback] Existing user, redirecting to:', redirectPath);
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }

            // New OAuth user — check if we have user metadata with role info
            const meta = user.user_metadata;

            if (meta?.username && meta?.role) {
                // Auto-create profile from signup metadata (email+password flow)
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

            // New Google OAuth user — if role was passed in URL, auto-create a basic profile
            if (roleParam && ['creator', 'fan'].includes(roleParam)) {
                try {
                    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                    const serviceClient = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    // Generate username from Google name or email
                    const googleName = meta?.full_name || meta?.name || user.email?.split('@')[0] || 'user';
                    const cleanUsername = googleName.toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 10000);

                    // Create profile with role from the signup page
                    await serviceClient.from('profiles').insert({
                        user_id: user.id,
                        username: cleanUsername,
                        display_name: meta?.full_name || meta?.name || cleanUsername,
                        role: roleParam,
                        avatar_url: meta?.avatar_url || meta?.picture || null,
                    });

                    // Create wallet
                    await serviceClient.from('wallets').insert({
                        user_id: user.id,
                        token_balance: 0,
                        points_balance: 0,
                    });

                    console.log('[auth/callback] Google user profile created with role:', roleParam);
                    const redirectPath = roleParam === 'creator' ? '/creator' : '/fan';
                    return NextResponse.redirect(`${origin}${redirectPath}`);
                } catch (err) {
                    console.error('[auth/callback] Google profile creation error:', err);
                }
            }

            // No profile and no role — Google OAuth first-time user without role
            // Redirect to complete registration
            console.log('[auth/callback] New Google user, redirecting to complete profile');
            return NextResponse.redirect(`${origin}/register?complete=true`);
        }

        // Code exchange failed
        console.error('[auth/callback] Code exchange FAILED:', error?.message, error?.status);
    } else {
        console.error('[auth/callback] No code in callback URL');
    }

    // If code exchange fails, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
