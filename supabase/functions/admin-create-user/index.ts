
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Admin create user function started')
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user making the request is an admin
    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 Verifying admin token...')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('❌ Invalid token:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Token verified for user:', user.email)

    // Check if user has admin role
    console.log('🔍 Checking admin role for user:', user.id)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError) {
      console.error('❌ Error checking user role:', roleError)
      return new Response(
        JSON.stringify({ 
          error: 'Error checking user permissions',
          details: roleError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!roleData || roleData.role !== 'admin') {
      console.error('❌ User is not admin. Role:', roleData?.role || 'none')
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Admin access confirmed')

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, role = 'team_member', full_name } = requestBody

    if (!email) {
      console.error('❌ Email is required but not provided')
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Creating user account for: ${email}`)

    // Generate a temporary password
    const tempPassword = `TempPass${Math.random().toString(36).slice(2)}!`

    // Create the user using Supabase Auth Admin API
    console.log('👤 Creating user with Supabase Auth...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: full_name || ''
      }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser.user) {
      console.error('❌ No user returned from creation')
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ User created successfully: ${newUser.user.id}`)

    // Create user profile
    console.log('📝 Creating user profile...')
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: full_name || ''
      })

    if (profileError) {
      console.error('⚠️ Error creating profile (continuing):', profileError)
    } else {
      console.log('✅ User profile created')
    }

    // Assign role to the user
    console.log(`🎭 Assigning role ${role} to user...`)
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        assigned_by: user.id
      })

    if (roleAssignError) {
      console.error('❌ Error assigning role:', roleAssignError)
      return new Response(
        JSON.stringify({ 
          error: `User created but role assignment failed: ${roleAssignError.message}`,
          user: {
            id: newUser.user.id,
            email: newUser.user.email
          },
          temporaryPassword: tempPassword
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Role ${role} assigned successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          role: role
        },
        temporaryPassword: tempPassword,
        message: `User ${email} created successfully with role ${role}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
