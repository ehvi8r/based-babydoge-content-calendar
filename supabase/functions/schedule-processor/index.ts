
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
    const currentTime = new Date().toISOString();
    console.log(`Checking for posts to schedule at ${currentTime} (UTC)...`);
    
    // Get posts that should be published now - only those that haven't reached max retries
    const { data: postsToPublish, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', currentTime)
      .lt('retry_count', 3); // Direct comparison with integer instead of column reference

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    console.log(`Found ${postsToPublish?.length || 0} posts to publish at ${currentTime}`);

    // Log details about posts found
    if (postsToPublish && postsToPublish.length > 0) {
      postsToPublish.forEach(post => {
        console.log(`Post ${post.id}: scheduled_for=${post.scheduled_for}, retry_count=${post.retry_count}`);
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const post of postsToPublish || []) {
      try {
        console.log(`Processing post ${post.id}...`);
        
        // Update status to 'publishing' immediately to prevent duplicate processing
        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({ status: 'publishing' })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Error updating post status for ${post.id}:`, updateError);
          continue;
        }
        
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
            imageUrl: post.image_url
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to post tweet for ${post.id}:`, errorText);
          
          // Determine if this is a retryable error or permanent failure
          const isRetryableError = !errorText.includes('credentials') && 
                                 !errorText.includes('unauthorized') &&
                                 !errorText.includes('forbidden');
          
          const newRetryCount = (post.retry_count || 0) + 1;
          const shouldRetry = isRetryableError && newRetryCount < 3;
          const newStatus = shouldRetry ? 'scheduled' : 'failed';
          
          await supabase
            .from('scheduled_posts')
            .update({ 
              retry_count: newRetryCount,
              status: newStatus,
              error_message: `Attempt ${newRetryCount}: ${errorText}`
            })
            .eq('id', post.id);

          console.log(`Post ${post.id} ${shouldRetry ? 'will be retried' : 'permanently failed'} after ${newRetryCount} attempts`);
          errorCount++;
        } else {
          console.log(`Successfully posted tweet for ${post.id}`);
          
          // Move to published_posts table
          const publishedPost = {
            user_id: post.user_id,
            content: post.content,
            hashtags: post.hashtags,
            image_url: post.image_url,
            original_scheduled_post_id: post.id,
            published_at: new Date().toISOString()
          };

          const { error: publishError } = await supabase
            .from('published_posts')
            .insert(publishedPost);

          if (publishError) {
            console.error(`Error moving post to published_posts for ${post.id}:`, publishError);
          }

          // Delete from scheduled_posts
          const { error: deleteError } = await supabase
            .from('scheduled_posts')
            .delete()
            .eq('id', post.id);

          if (deleteError) {
            console.error(`Error deleting scheduled post ${post.id}:`, deleteError);
          }

          successCount++;
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        
        // Update retry count and status on error
        const newRetryCount = (post.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'scheduled';
        
        await supabase
          .from('scheduled_posts')
          .update({ 
            retry_count: newRetryCount,
            status: newStatus,
            error_message: `Attempt ${newRetryCount}: ${error.message}`
          })
          .eq('id', post.id);

        errorCount++;
      }
    }

    const summary = `Processed ${(postsToPublish?.length || 0)} posts: ${successCount} successful, ${errorCount} failed`;
    console.log(summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: postsToPublish?.length || 0,
        successful: successCount,
        failed: errorCount,
        timestamp: currentTime,
        summary
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
        error: error.message,
        timestamp: new Date().toISOString()
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
