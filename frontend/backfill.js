const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  try {
    const userId = 'ecad6b00-dcec-47e6-9c82-b6f59e7cadba';
    const creatorId = 'b760b61f-0a08-4a98-92c8-8cef908a741a';
    
    // Fetch all logs for this user
    const { data: logs, error: logsError } = await supabase
      .from('engagement_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'message');
      
    if (logsError) {
      console.error("Error fetching logs:", logsError);
      return;
    }

    console.log(`Found ${logs.length} message logs. Backfilling rewards...`);

    for (const log of logs) {
      const content = log.metadata?.content || '';
      const event_id = log.external_event_id.replace('discord:', '');
      
      if (content.length >= 5) {
        // Convert event_id to UUID
        const hex = BigInt(event_id).toString(16).padStart(16, '0');
        const referenceUuid = `00000000-0000-0000-${hex.slice(0, 4)}-${hex.slice(4)}`;
        
        console.log(`Backfilling for message: "${content}" (event: ${event_id}) -> UUID: ${referenceUuid}`);
        
        const { data: result, error: rewardError } = await supabase.rpc('award_points', {
          p_user_id: userId,
          p_action: 'discord_message',
          p_points: 1,
          p_daily_limit: 100,
          p_description: 'Discord message reward (backfill)',
          p_reference_id: referenceUuid,
        });
        
        if (rewardError) {
          console.error(`Error backfilling for ${event_id}:`, rewardError.message);
        } else {
          console.log(`Result for ${event_id}:`, result);
          
          if (result) {
            await supabase.rpc('increment_creator_points', {
              p_user_id: userId,
              p_creator_id: creatorId,
            });
            console.log("Incremented creator points.");
          }
        }
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

backfill();
