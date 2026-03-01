import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    // If Supabase env vars are not configured, just pass through
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
    const publicPaths = ['/', '/login', '/register', '/auth/callback', '/api/stripe/webhook'];
    const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith('/api/stripe/webhook'));

    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If logged in and trying to access auth pages, redirect to appropriate dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const url = request.nextUrl.clone();
        url.pathname = profile?.role === 'creator' ? '/creator' : '/fan';
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

    return supabaseResponse;
}
