
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

async function getTweetMetrics(tweetId: string): Promise<any> {
  const url = `https://api.x.com/2/tweets/${tweetId}?tweet.fields=public_metrics`;
  const method = "GET";
  const oauthHeader = generateOAuthHeader(method, url);

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
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
    console.log("Updating analytics for published posts...");

    // Get all published posts that need analytics updates
    const { data: postsToUpdate, error: selectError } = await supabase
      .from('published_posts')
      .select('id, tweet_id')
      .not('tweet_id', 'is', null);

    if (selectError) {
      console.error("Error fetching posts:", selectError);
      throw selectError;
    }

    console.log(`Found ${postsToUpdate?.length || 0} posts to update analytics for`);

    for (const post of postsToUpdate || []) {
      try {
        console.log(`Updating analytics for tweet ${post.tweet_id}...`);
        
        // Get tweet metrics from Twitter API
        const tweetData = await getTweetMetrics(post.tweet_id);
        const metrics = tweetData.data?.public_metrics;

        if (!metrics) {
          console.log(`No metrics found for tweet ${post.tweet_id}`);
          continue;
        }

        // Upsert analytics data
        const { error: upsertError } = await supabase
          .from('post_analytics')
          .upsert({
            published_post_id: post.id,
            tweet_id: post.tweet_id,
            retweets: metrics.retweet_count || 0,
            likes: metrics.like_count || 0,
            replies: metrics.reply_count || 0,
            impressions: metrics.impression_count || 0,
            last_updated: new Date().toISOString(),
          }, { onConflict: 'tweet_id' });

        if (upsertError) {
          console.error(`Error updating analytics for ${post.tweet_id}:`, upsertError);
        } else {
          console.log(`Successfully updated analytics for tweet ${post.tweet_id}`);
        }

      } catch (error) {
        console.error(`Error processing analytics for post ${post.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: postsToUpdate?.length || 0 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error("Analytics updater error:", error);
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
