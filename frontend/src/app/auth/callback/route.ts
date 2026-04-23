import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error_param = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Read cookies set before OAuth redirect (these survive the redirect chain!)
    const oauthRole = request.cookies.get('oauth_role')?.value;
    const oauthFlow = request.cookies.get('oauth_flow')?.value; // 'signup' or 'login'

    // If there's an error parameter from Supabase/Google, redirect with message
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
                if (profile) {
                    // User already has a profile from a previous attempt
                    // Delete it so they can go through the full registration fresh
                    try {
                        const serviceClient = await createServiceClient();
                        await serviceClient.from('wallets').delete().eq('user_id', user.id);
                        await serviceClient.from('profiles').delete().eq('user_id', user.id);
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
                if (profile) {
                    // Existing user — update role if they selected a different one
                    if (oauthRole && ['creator', 'fan'].includes(oauthRole) && oauthRole !== profile.role) {
                        try {
                            const serviceClient = await createServiceClient();
                            await serviceClient.from('profiles').update({ role: oauthRole }).eq('user_id', user.id);
                            const response = NextResponse.redirect(`${origin}/${oauthRole === 'creator' ? 'creator' : 'fan'}`);
                            return clearCookies(response);
                        } catch (err) {
                            console.error('[auth/callback] Error updating role:', err);
                        }
                    }

                    // Redirect to their dashboard
                    const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                    const response = NextResponse.redirect(`${origin}${redirectPath}`);
                    return clearCookies(response);
                }

                // New user via login page — they need to complete registration
                const response = NextResponse.redirect(`${origin}/register?complete=true`);
                return clearCookies(response);
            }

            // ── DEFAULT FLOW (no cookies — email/password signup confirmation, etc.) ──
            if (profile) {
                const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }

            // Check user metadata for email/password signup info
            const meta = user.user_metadata;
            if (meta?.username && meta?.role) {
                try {
                    const serviceClient = await createServiceClient();
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
            return NextResponse.redirect(`${origin}/register?complete=true`);
        }

        // Code exchange failed
        console.error('[auth/callback] Code exchange failed:', error?.message, error?.status);
    } else {
        console.error('[auth/callback] No code in callback URL');
    }

    // If code exchange fails, redirect to login with error
    const response = NextResponse.redirect(`${origin}/login?error=auth_failed`);
    response.cookies.delete('oauth_role');
    response.cookies.delete('oauth_flow');
    return response;
}
