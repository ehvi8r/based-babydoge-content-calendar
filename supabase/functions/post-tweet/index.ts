
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const API_KEY = Deno.env.get("TWITTER_API_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_API_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

function validateEnvironmentVariables() {
  if (!API_KEY) throw new Error("Missing TWITTER_API_KEY environment variable");
  if (!API_SECRET) throw new Error("Missing TWITTER_API_SECRET environment variable");
  if (!ACCESS_TOKEN) throw new Error("Missing TWITTER_ACCESS_TOKEN environment variable");
  if (!ACCESS_TOKEN_SECRET) throw new Error("Missing TWITTER_ACCESS_TOKEN_SECRET environment variable");
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, API_SECRET!, ACCESS_TOKEN_SECRET!);
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };
  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));

  return "OAuth " + entries
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

async function uploadMedia(imageUrl: string): Promise<string> {
  console.log("Uploading media:", imageUrl);
  
  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageData = new Uint8Array(imageBuffer);
  
  // Determine media type from URL or response headers
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, uploadUrl);
  
  // Create form data for media upload
  const formData = new FormData();
  const blob = new Blob([imageData], { type: contentType });
  formData.append('media', blob);
  
  console.log("Uploading to Twitter with OAuth header");
  
  const uploadResponse = await fetch(uploadUrl, {
    method: method,
    headers: {
      Authorization: oauthHeader,
    },
    body: formData,
  });

  const uploadResponseText = await uploadResponse.text();
  console.log("Media upload response:", uploadResponseText);

  if (!uploadResponse.ok) {
    throw new Error(`Media upload failed: ${uploadResponse.status}, body: ${uploadResponseText}`);
  }

  const uploadResult = JSON.parse(uploadResponseText);
  return uploadResult.media_id_string;
}

async function sendTweet(tweetText: string, mediaIds?: string[]): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  
  const params: any = { text: tweetText };
  
  if (mediaIds && mediaIds.length > 0) {
    params.media = { media_ids: mediaIds };
    console.log("Including media in tweet:", mediaIds);
  }

  const oauthHeader = generateOAuthHeader(method, url);
  console.log("Posting tweet:", tweetText);

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const responseText = await response.text();
  console.log("Twitter API Response:", responseText);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
  }

  return JSON.parse(responseText);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnvironmentVariables();
    
    const { postId, content, imageUrl } = await req.json();
    console.log("Processing post:", postId, "with image:", !!imageUrl);

    // Get the original post data to access content_hash
    const { data: originalPost } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!originalPost) {
      throw new Error("Original post not found");
    }

    // Update post status to 'publishing'
    await supabase
      .from('scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', postId);

    // Check for recent duplicates one more time before posting
    const { data: isDuplicate, error: duplicateError } = await supabase
      .rpc('check_recent_duplicate', {
        p_user_id: originalPost.user_id,
        p_content_hash: originalPost.content_hash,
        p_hours_window: 24
      });

    if (!duplicateError && isDuplicate) {
      throw new Error("Duplicate content detected - preventing duplicate post");
    }

    let mediaIds: string[] = [];
    
    // Upload media if image URL is provided
    if (imageUrl) {
      try {
        console.log("Uploading media for post:", postId);
        const mediaId = await uploadMedia(imageUrl);
        mediaIds = [mediaId];
        console.log("Media uploaded successfully:", mediaId);
      } catch (mediaError) {
        console.error("Media upload failed:", mediaError);
        console.log("Continuing with text-only tweet due to media upload failure");
      }
    }

    // Send tweet with or without media
    const tweetResult = await sendTweet(content, mediaIds.length > 0 ? mediaIds : undefined);
    const tweetId = tweetResult.data.id;
    const tweetUrl = `https://x.com/user/status/${tweetId}`;

    console.log("Tweet posted successfully:", tweetId, "with media count:", mediaIds.length);

    if (originalPost) {
      // Move to published_posts with content_hash
      await supabase
        .from('published_posts')
        .insert({
          user_id: originalPost.user_id,
          original_scheduled_post_id: postId,
          content: originalPost.content,
          hashtags: originalPost.hashtags,
          image_url: originalPost.image_url,
          content_hash: originalPost.content_hash,
          tweet_id: tweetId,
          tweet_url: tweetUrl,
        });

      // Remove from scheduled_posts
      await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      // Initialize analytics
      await supabase
        .from('post_analytics')
        .insert({
          published_post_id: tweetResult.data.id,
          tweet_id: tweetId,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tweetId, 
        tweetUrl,
        mediaCount: mediaIds.length,
        message: `Tweet posted successfully${mediaIds.length > 0 ? ' with media' : ''}` 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error("Error posting tweet:", error);

    // Update post status to 'failed' with error message
    const { postId } = await req.json().catch(() => ({}));
    if (postId) {
      await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'failed',
          error_message: error.message,
          retry_count: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', postId);
    }

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
