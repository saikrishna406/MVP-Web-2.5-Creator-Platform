import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    // If Supabase env vars are not configured, just pass through
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next({ request });
    }

    // Public creator profiles at /fan/[username] — skip ALL auth
    const fanProfileMatch = /^\/fan\/[a-zA-Z0-9_]+$/.test(request.nextUrl.pathname);
    if (fanProfileMatch) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Public paths that don't need auth
    const publicPaths = ['/', '/login', '/register', '/auth/callback', '/api/stripe/webhook', '/privacy', '/api/discord/callback', '/api/discord/connect'];
    const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith('/api/stripe/webhook') || pathname.startsWith('/api/discord/') || pathname.startsWith('/p/'));

    // Public creator profile pages: /p/[username] or /[username]
    const knownPrefixes = ['/login', '/register', '/auth', '/creator', '/fan', '/api', '/demo', '/privacy', '/_next', '/favicon'];
    const isPublicProfile = pathname.startsWith('/p/') || (!knownPrefixes.some(p => pathname.startsWith(p)) && /^\/[a-zA-Z0-9_]+$/.test(pathname) && pathname !== '/');

    if (!user && !isPublicPath && !isPublicProfile) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If logged in and trying to access auth pages, redirect to appropriate dashboard
    // EXCEPTION: Allow /register?complete=true for Google OAuth profile completion
    if (user && (pathname === '/login' || pathname === '/register')) {
        const isCompletingProfile = request.nextUrl.searchParams.get('complete') === 'true';
        const isOAuthSignup = request.cookies.get('oauth_flow')?.value === 'signup';

        // Let Google OAuth users through to complete their profile
        if ((pathname === '/register') && (isCompletingProfile || isOAuthSignup)) {
            return supabaseResponse;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        // If user has no profile yet, let them register
        if (!profile) {
            if (pathname === '/register') {
                return supabaseResponse;
            }
            const url = request.nextUrl.clone();
            url.pathname = '/register';
            url.searchParams.set('complete', 'true');
            return NextResponse.redirect(url);
        }

        const url = request.nextUrl.clone();
        url.pathname = profile.role === 'creator' ? '/creator' : '/fan';
        return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (user && pathname.startsWith('/creator')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            const url = request.nextUrl.clone();
            url.pathname = '/fan';
            return NextResponse.redirect(url);
        }
    }

    if (user && pathname.startsWith('/fan')) {
        // Allow any logged-in user to view creator profiles at /fan/[username]
        // Only restrict the fan dashboard itself (/fan, /fan/feed, /fan/wallet, etc.)
        const fanProfileRegex = /^\/fan\/[^/]+$/;
        const isCreatorProfile = fanProfileRegex.test(pathname);

        if (!isCreatorProfile) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (profile?.role !== 'fan') {
                const url = request.nextUrl.clone();
                url.pathname = '/creator';
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}
