
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
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user making the request is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Invalid token:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError) {
      console.error('Error checking user role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Error checking user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (roleData?.role !== 'admin') {
      console.error('User is not admin. Role:', roleData?.role)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, role = 'team_member', full_name } = await req.json()

    if (!email) {
      console.error('Email is required but not provided')
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating user account for: ${email}`)

    // First, let's check if the app_role type exists
    console.log('Checking if app_role type exists...')
    const { data: typeCheck, error: typeError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('*')
      .limit(1)

    if (typeError) {
      console.error('Error checking database schema:', typeError)
    }

    // Check if user_roles table exists
    console.log('Checking if user_roles table exists...')
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('user_roles')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('Error accessing user_roles table:', tableError)
      return new Response(
        JSON.stringify({ error: 'Database schema not properly set up. Please ensure user_roles table exists.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a temporary password
    const tempPassword = `TempPass${Math.random().toString(36).slice(2)}!`

    console.log('Attempting to create user with Supabase Auth...')
    // Create the user using Supabase Auth Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: full_name || ''
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      console.error('Create error details:', JSON.stringify(createError, null, 2))
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created successfully: ${newUser.user?.id}`)

    // Create user profile
    console.log('Creating user profile...')
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUser.user!.id,
        email: email,
        full_name: full_name || ''
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't fail the entire operation if profile creation fails
      console.log('Continuing despite profile creation error...')
    }

    // Assign role to the user
    console.log(`Assigning role ${role} to user...`)
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user!.id,
        role: role,
        assigned_by: user.id
      })

    if (roleAssignError) {
      console.error('Error assigning role:', roleAssignError)
      console.error('Role assignment error details:', JSON.stringify(roleAssignError, null, 2))
      return new Response(
        JSON.stringify({ error: `User created but role assignment failed: ${roleAssignError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Role ${role} assigned successfully to user: ${newUser.user?.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user!.id,
          email: newUser.user!.email,
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
    console.error('Unexpected error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
