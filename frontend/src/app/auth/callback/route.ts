import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error_param = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Read cookies set before OAuth redirect (these survive the redirect chain!)
    const oauthRole = request.cookies.get('oauth_role')?.value;
    const oauthFlow = request.cookies.get('oauth_flow')?.value; // 'signup' or 'login'

    console.log('[auth/callback] Hit callback route');
    console.log('[auth/callback] URL:', request.url);
    console.log('[auth/callback] Code present:', !!code);
    console.log('[auth/callback] Cookie oauth_role:', oauthRole);
    console.log('[auth/callback] Cookie oauth_flow:', oauthFlow);
    console.log('[auth/callback] Error param:', error_param);

    // If there's an error parameter from Supabase/Google, log and redirect
    if (error_param) {
        console.error('[auth/callback] OAuth error from provider:', error_param, error_description);
        const response = NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error_param)}`);
        response.cookies.delete('oauth_role');
        response.cookies.delete('oauth_flow');
        return response;
    }

    if (code) {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log('[auth/callback] exchangeCodeForSession result:', { user: user?.id, error: error?.message });

        if (!error && user) {
            // Helper to clear OAuth cookies from response
            const clearCookies = (response: NextResponse) => {
                response.cookies.delete('oauth_role');
                response.cookies.delete('oauth_flow');
                return response;
            };

            // Check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            // ── SIGNUP FLOW (from /register page) ──
            // User clicked "Sign up with Google" → always go through registration steps
            if (oauthFlow === 'signup') {
                console.log('[auth/callback] Signup flow detected via cookie, role:', oauthRole);

                if (profile) {
                    // User already has a profile from a previous attempt
                    // Delete it so they can go through the full registration fresh
                    try {
                        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                        const serviceClient = createSupabaseClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.SUPABASE_SERVICE_ROLE_KEY!,
                            { auth: { autoRefreshToken: false, persistSession: false } }
                        );
                        await serviceClient.from('wallets').delete().eq('user_id', user.id);
                        await serviceClient.from('profiles').delete().eq('user_id', user.id);
                        console.log('[auth/callback] Deleted old profile for fresh signup');
                    } catch (err) {
                        console.error('[auth/callback] Error deleting old profile:', err);
                    }
                }

                // Redirect to register page with complete=true
                // The register page reads role from localStorage and shows steps 2-5
                const response = NextResponse.redirect(`${origin}/register?complete=true`);
                return clearCookies(response);
            }

            // ── LOGIN FLOW (from /login page) ──
            if (oauthFlow === 'login') {
                console.log('[auth/callback] Login flow detected via cookie, role:', oauthRole);

                if (profile) {
                    // Existing user — update role if they selected a different one
                    if (oauthRole && ['creator', 'fan'].includes(oauthRole) && oauthRole !== profile.role) {
                        try {
                            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                            const serviceClient = createSupabaseClient(
                                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                                { auth: { autoRefreshToken: false, persistSession: false } }
                            );
                            await serviceClient.from('profiles').update({ role: oauthRole }).eq('user_id', user.id);
                            console.log('[auth/callback] Updated profile role to:', oauthRole);
                            const response = NextResponse.redirect(`${origin}/${oauthRole === 'creator' ? 'creator' : 'fan'}`);
                            return clearCookies(response);
                        } catch (err) {
                            console.error('[auth/callback] Error updating role:', err);
                        }
                    }

                    // Redirect to their dashboard
                    const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                    console.log('[auth/callback] Existing user login, redirecting to:', redirectPath);
                    const response = NextResponse.redirect(`${origin}${redirectPath}`);
                    return clearCookies(response);
                }

                // New user via login page — they need to complete registration
                console.log('[auth/callback] New user via login, redirecting to register');
                const response = NextResponse.redirect(`${origin}/register?complete=true`);
                return clearCookies(response);
            }

            // ── DEFAULT FLOW (no cookies — email/password signup confirmation, etc.) ──
            if (profile) {
                const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                console.log('[auth/callback] Default flow, existing user, redirecting to:', redirectPath);
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }

            // Check user metadata for email/password signup info
            const meta = user.user_metadata;
            if (meta?.username && meta?.role) {
                try {
                    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                    const serviceClient = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    const cleanUsername = meta.username.toLowerCase().replace(/[^a-z0-9_]/g, '');

                    await serviceClient.from('profiles').insert({
                        user_id: user.id,
                        username: cleanUsername,
                        display_name: meta.full_name || meta.name || cleanUsername,
                        role: meta.role,
                        avatar_url: meta.avatar_url || null,
                    });

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

            // Fallback — redirect to complete registration
            console.log('[auth/callback] Fallback: new user, redirecting to register');
            return NextResponse.redirect(`${origin}/register?complete=true`);
        }

        // Code exchange failed
        console.error('[auth/callback] Code exchange FAILED:', error?.message, error?.status);
    } else {
        console.error('[auth/callback] No code in callback URL');
    }

    // If code exchange fails, redirect to login with error
    const response = NextResponse.redirect(`${origin}/login?error=auth_failed`);
    response.cookies.delete('oauth_role');
    response.cookies.delete('oauth_flow');
    return response;
}
