import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if profile already exists — if so, we'll update instead of insert
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        const body = await request.json();
        const { username, display_name, role, avatar_url, bio, interests } = body;

        // Validate inputs
        if (!username || username.length < 3) {
            return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
        }
        if (!role || !['fan', 'creator'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

        // Check if username is taken (but allow if it's this user's own username)
        const serviceClient = await createServiceClient();
        const { data: usernameCheck } = await serviceClient
            .from('profiles')
            .select('id, user_id')
            .eq('username', cleanUsername)
            .single();

        if (usernameCheck && usernameCheck.user_id !== user.id) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }

        const profileData = {
            user_id: user.id,
            username: cleanUsername,
            display_name: display_name || cleanUsername,
            role,
            avatar_url: avatar_url || user.user_metadata?.avatar_url || null,
            bio: bio || null,
            interests: Array.isArray(interests) ? interests : []
        };

        if (existingProfile) {
            // Update existing profile
            const { error: updateError } = await serviceClient
                .from('profiles')
                .update(profileData)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('[complete-profile] Profile update error:', updateError);
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
            }
        } else {
            // Create new profile
            const { error: profileError } = await serviceClient
                .from('profiles')
                .insert(profileData);

            if (profileError) {
                console.error('[complete-profile] Profile creation error:', profileError);
                return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
            }
        }

        // Create wallet if it doesn't exist
        const { data: existingWallet } = await serviceClient
            .from('wallets')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!existingWallet) {
            const { error: walletError } = await serviceClient
                .from('wallets')
                .insert({
                    user_id: user.id,
                    token_balance: 0,
                    points_balance: 0,
                });

            if (walletError) {
                console.error('[complete-profile] Wallet creation error:', walletError);
            }
        }

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('[complete-profile] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
