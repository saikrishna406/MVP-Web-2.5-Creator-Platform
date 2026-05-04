import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '../.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching channels to check RLS...');
    // If there is an execute_sql rpc
    const { error: sqlError } = await supabase.rpc('execute_sql', {
        query: `
            CREATE POLICY "Allow public read creator_channels" 
            ON creator_channels 
            FOR SELECT USING (true);
        `
    });
    console.log('rpc error:', sqlError);
}
run();
