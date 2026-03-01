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
                const redirectPath = profile.role === 'creator' ? '/creator' : '/fan';
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }

            // No profile yet, redirect to complete registration
            return NextResponse.redirect(`${origin}/register?complete=true`);
        }
    }

    // If code exchange fails, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
