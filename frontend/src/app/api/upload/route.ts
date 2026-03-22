import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'post-images';
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

export async function POST(request: NextRequest) {
    try {
        // Use the regular session-based client (no service role key needed)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify creator role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            return NextResponse.json({ error: 'Only creators can upload media' }, { status: 403 });
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: `File type "${file.type}" not allowed. Use JPG, PNG, GIF, WebP, or AVIF.`
            }, { status: 400 });
        }

        // Validate size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) {
            return NextResponse.json({
                error: `File is ${sizeMB.toFixed(1)} MB — maximum is ${MAX_SIZE_MB} MB`
            }, { status: 400 });
        }

        // Build unique storage path: userId/timestamp-random.ext
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const storagePath = `${user.id}/${safeName}`;

        const arrayBuffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[upload] Storage error:', uploadError.message, uploadError);

            if (uploadError.message?.toLowerCase().includes('bucket') ||
                uploadError.message?.toLowerCase().includes('not found')) {
                return NextResponse.json({
                    error: 'Bucket "post-images" not found. Create it in Supabase → Storage → New bucket.'
                }, { status: 500 });
            }

            // RLS / permission error
            if (uploadError.message?.toLowerCase().includes('policy') ||
                uploadError.message?.toLowerCase().includes('row') ||
                uploadError.message?.toLowerCase().includes('violates')) {
                return NextResponse.json({
                    error: 'Storage permission denied. Run the SQL policy fix in your Supabase SQL editor.'
                }, { status: 500 });
            }

            return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 });
        }

        // Get the public URL (bucket must be public)
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath);

        return NextResponse.json({ url: publicUrl }, { status: 200 });

    } catch (error) {
        console.error('[upload] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
