import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// TEMPORARY: Delete current user's profile + wallet so they can re-register
// Remove this file after testing is complete
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use service client to delete profile and wallet
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const serviceClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Delete wallet
        const { error: walletErr } = await serviceClient
            .from('wallets')
            .delete()
            .eq('user_id', user.id);
        
        console.log('[reset-profile] Wallet delete:', walletErr?.message || 'success');

        // Delete profile
        const { error: profileErr } = await serviceClient
            .from('profiles')
            .delete()
            .eq('user_id', user.id);
        
        console.log('[reset-profile] Profile delete:', profileErr?.message || 'success');

        return NextResponse.json({ 
            success: true, 
            message: 'Profile and wallet deleted. You can now re-register.',
            userId: user.id 
        });
    } catch (error: any) {
        console.error('[reset-profile] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
