
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking for posts to schedule...");
    
    // Get posts that should be published now
    const { data: postsToPublish, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', supabase.rpc('coalesce', { val: 'max_retries', default_val: 3 }));

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    console.log(`Found ${postsToPublish?.length || 0} posts to publish`);

    for (const post of postsToPublish || []) {
      try {
        console.log(`Processing post ${post.id}...`);
        
        const content = post.hashtags ? `${post.content} ${post.hashtags}` : post.content;
        
        // Call the post-tweet function
        const response = await fetch(`${supabaseUrl}/functions/v1/post-tweet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            postId: post.id,
            content: content,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to post tweet for ${post.id}:`, errorText);
        } else {
          console.log(`Successfully posted tweet for ${post.id}`);
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: postsToPublish?.length || 0 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error("Schedule processor error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
